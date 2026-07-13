import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const API = '/admin';

const STATUS_COLORS = {
  pending:     { bg: 'rgba(255, 107, 43, 0.1)', color: '#FF6B2B', border: 'rgba(255, 107, 43, 0.3)' },
  in_progress: { bg: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8', border: 'rgba(56, 189, 248, 0.3)' },
  done:        { bg: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', border: 'rgba(34, 197, 94, 0.3)' },
  resolved:    { bg: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', border: 'rgba(139, 92, 246, 0.3)' },
  deleted:     { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span style={{
      padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {status.replace('_', ' ')}
    </span>
  );
}

function GrantAccessModal({ ticket, projects = [], onClose, onGranted }) {
  const [duration, setDuration] = useState(15);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [detectedTeam, setDetectedTeam] = useState('');
  const toast = useToast();

  // Detect if this ticket is an edit request by parsing the description
  const parsedDesc = parseTicketDescription(ticket.description || '');
  const detectedProjectName = parsedDesc.project || '';
  const isEditRequest = !!detectedProjectName;

  const isProjectProductRequest = getTicketCategory(ticket) === 'Project/Product Request';

  const [allowedEdits, setAllowedEdits] = useState(() => {
    const parsed = parseTicketDescription(ticket.description || '');
    if (parsed.changesRequested && parsed.changesRequested.length > 0) {
      const initial = [];
      parsed.changesRequested.forEach(c => {
        const lower = c.toLowerCase();
        if (lower === 'complete') initial.push('Complete (Unlock all fields)');
        else if (lower === 'team name') initial.push('Team Name');
        else if (lower === 'team lead') initial.push('Team Lead');
        else if (lower === 'escalation names') initial.push('Escalation Names');
        else if (lower === 'project page update') initial.push('Project Page Update');
        else if (lower === 'image') initial.push('Image');
        else if (lower === 'document') initial.push('Document');
      });
      return initial.length > 0 ? initial : ['Complete (Unlock all fields)'];
    }
    return ['Complete (Unlock all fields)'];
  });

  const handleToggleOption = (opt) => {
    setAllowedEdits(prev => {
      if (opt === 'Complete (Unlock all fields)') {
        return ['Complete (Unlock all fields)'];
      } else {
        const filtered = prev.filter(x => x !== 'Complete (Unlock all fields)');
        if (filtered.includes(opt)) {
          const next = filtered.filter(x => x !== opt);
          return next.length === 0 ? ['Complete (Unlock all fields)'] : next;
        } else {
          return [...filtered, opt];
        }
      }
    });
  };

  // Auto-select the project matching the ticket description
  useEffect(() => {
    if (projects && projects.length > 0 && detectedProjectName) {
      const findBestProject = (projList) => {
        const normalize = (str) => {
          if (!str) return '';
          return str
            .toLowerCase()
            .replace(/^(te_ts_adm_sale_|te_is_adm_sale_|te_ts_adm_|te_is_adm_|te_ts_|te_is)/, '')
            .replace(/[^a-z0-9]/g, '');
        };

        const targetNorm = normalize(detectedProjectName);

        // 1. Try exact matches
        let matches = projList.filter(p => p.proj === detectedProjectName);
        
        // 2. Try case-insensitive matches
        if (matches.length === 0) {
          const lower = detectedProjectName.toLowerCase();
          matches = projList.filter(p => (p.proj || '').toLowerCase() === lower);
        }

        // 3. Try normalized matches
        if (matches.length === 0) {
          matches = projList.filter(p => normalize(p.proj) === targetNorm);
        }

        // 4. Try partial includes on normalized titles
        if (matches.length === 0) {
          matches = projList.filter(p => {
            const pNorm = normalize(p.proj);
            return pNorm && targetNorm && (pNorm.includes(targetNorm) || targetNorm.includes(pNorm));
          });
        }

        // 5. Try fuzzy Levenshtein match on normalized titles
        if (matches.length === 0) {
          const getLevenshtein = (a, b) => {
            const matrix = [];
            for (let i = 0; i <= b.length; i++) matrix[i] = [i];
            for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
            for (let i = 1; i <= b.length; i++) {
              for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                  matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                  matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                  );
                }
              }
            }
            return matrix[b.length][a.length];
          };

          let bestMatches = [];
          let minDistance = Infinity;
          projList.forEach(p => {
            const pNorm = normalize(p.proj);
            if (pNorm && targetNorm) {
              const dist = getLevenshtein(pNorm, targetNorm);
              if (dist < minDistance) {
                minDistance = dist;
                bestMatches = [p];
              } else if (dist === minDistance) {
                bestMatches.push(p);
              }
            }
          });

          const maxAllowedDist = Math.max(3, Math.floor(targetNorm.length * 0.25));
          if (minDistance <= maxAllowedDist) {
            matches = bestMatches;
          }
        }

        if (matches.length > 0) {
          // Prioritize 'published' status first, then 'submitted', then others
          const publishedMatch = matches.find(p => p._status === 'published');
          if (publishedMatch) return publishedMatch;
          const submittedMatch = matches.find(p => p._status === 'submitted');
          if (submittedMatch) return submittedMatch;
          return matches[0];
        }
        return null;
      };

      const match = findBestProject(projects);
      if (match) {
        setSelectedProjectId(String(match.id));
        setDetectedTeam(match.team || '');
      }
    }
  }, [projects, detectedProjectName]);

  const handleGrant = async () => {
    setLoading(true);
    try {
      const body = {
        ticket_id:    ticket.ticket_id,
        team_name:    detectedTeam || ticket.team_name,  // Use project's real team when edit request
        user_email:   ticket.contact_email || 'unknown@email.com',
        duration_days: parseInt(duration),
      };
      // If a project is selected, include project_id so the intake opens in edit mode
      if (selectedProjectId && isEditRequest) {
        body.project_id = parseInt(selectedProjectId);
      }
      if (isProjectProductRequest && isEditRequest) {
        body.allowed_edits = allowedEdits.map(x => x.replace(' (Unlock all fields)', '')).join(', ');
      }
      const res = await fetch(`${API}/api/access/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
      onGranted();
    } catch (err) {
      toast('Failed to grant access: ' + err.message, 'e');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => toast('Copied!', 's'));
  };

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 480, maxWidth: '90vw' }}>
        <div className="modal-title">Grant Access</div>
        <div className="modal-sub">
          Team: <strong>{detectedTeam || ticket.team_name}</strong> · {ticket.contact_email}
        </div>

        {isEditRequest && (
          <div style={{ margin: '12px 0 0', padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '12px', color: '#1e40af', fontWeight: 600 }}>
            ✏️ This is an <strong>Edit Request</strong> for project: <strong>{detectedProjectName}</strong>
            {selectedProjectId && <span style={{ display: 'block', marginTop: 4, fontSize: '11px', color: '#166534' }}>✓ Auto-linked to project ID #{selectedProjectId}</span>}
            {!selectedProjectId && <span style={{ display: 'block', marginTop: 4, fontSize: '11px', color: '#ef4444' }}>⚠ Could not auto-detect project — please select manually below</span>}
          </div>
        )}

        {!result ? (
          <>
            {isEditRequest && (
              <>
                {/* Project selector — auto-populated for edit requests */}
                <label className="f-label" style={{ display: 'block', marginTop: 16 }}>
                  Link to Project (auto-detected)
                </label>
                <select
                  value={selectedProjectId}
                  onChange={e => {
                    setSelectedProjectId(e.target.value);
                    const matchedProj = projects.find(p => String(p.id) === e.target.value);
                    setDetectedTeam(matchedProj ? matchedProj.team : '');
                  }}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13,
                    border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box',
                    background: '#f8fafc',
                    color: '#0f1c2e', marginBottom: 12,
                    cursor: 'pointer',
                  }}
                >
                  <option value="">— No project (new submission) —</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.proj} ({p.team})</option>
                  ))}
                </select>

                {isProjectProductRequest && (
                  <div style={{ marginTop: 16, marginBottom: 16 }}>
                    <label className="f-label" style={{ display: 'block', marginBottom: 8 }}>
                      Allowed Uploads / Edits
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      {[
                        'Complete (Unlock all fields)',
                        'Team Name',
                        'Team Lead',
                        'Escalation Names',
                        'Project Page Update',
                        'Image',
                        'Document'
                      ].map(opt => {
                        const isChecked = allowedEdits.includes(opt);
                        return (
                          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155', cursor: 'pointer', gridColumn: opt.startsWith('Complete') ? 'span 2' : 'auto' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleOption(opt)}
                              style={{ cursor: 'pointer', accentColor: '#FF6B2B' }}
                            />
                            <span style={{ fontWeight: isChecked ? 700 : 500 }}>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            <label className="f-label" style={{ display: 'block' }}>
              Access Duration (days)
            </label>
            <input
              type="number"
              min={1}
              max={15}
              value={duration}
              onChange={e => setDuration(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13,
                border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box',
                background: '#f8fafc', color: '#0f1c2e', marginBottom: 20,
              }}
            />
            <div className="modal-row">
              <button
                className="btn-orange"
                onClick={handleGrant}
                disabled={loading}
                style={{ padding: '10px', fontSize: 12, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Granting...' : (selectedProjectId ? 'Grant Edit Access' : 'Grant Access')}
              </button>
              <button className="btn-ghost" onClick={onClose} style={{ padding: '10px', fontSize: 12 }}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: '#22C55E', fontSize: 13, textShadow: '0 0 10px rgba(34,197,94,0.4)', marginBottom: 8 }}>
                ✓ Access Granted! Expires in {result.duration_days} days.
                {selectedProjectId && <span style={{ display: 'block', marginTop: 4, fontSize: 11, color: '#166534' }}>The user will be able to edit the linked project.</span>}
              </div>
            </div>

            <label className="f-label" style={{ display: 'block' }}>
              Intake Page URL (copy and send to team)
            </label>
            <div style={{
              display: 'flex', gap: 8, alignItems: 'center',
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px',
              marginBottom: 12,
            }}>
              <span style={{ flex: 1, fontSize: 12, color: '#334155', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {result.intake_url}
              </span>
              <button
                onClick={() => copyToClipboard(result.intake_url)}
                className="btn-ghost"
                style={{ padding: '4px 10px', flex: 'none', fontSize: 10, alignSelf: 'flex-start' }}
              >
                Copy
              </button>
            </div>

            <button className="btn-ghost" onClick={onClose} style={{ width: '100%', padding: '10px', fontSize: 12 }}>
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function TransferTicketModal({ ticket, onClose, onTransferred }) {
  const parsed = parseTicketDescription(ticket.description || '');
  const [selectedCat, setSelectedCat] = useState(parsed.category || 'Website & Report Changes');
  const [selectedSub, setSelectedSub] = useState(parsed.subCategory || '');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const subOptions = SUB_OPTIONS[selectedCat] || [];

  useEffect(() => {
    const opts = SUB_OPTIONS[selectedCat] || [];
    if (opts.length > 0) {
      if (!opts.includes(selectedSub)) {
        setSelectedSub(opts[0]);
      }
    } else {
      setSelectedSub('');
    }
  }, [selectedCat]);

  const handleTransfer = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/tickets/${ticket.ticket_id}/transfer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCat,
          subCategory: selectedSub
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast('Ticket transferred successfully!', 's');
      onTransferred();
    } catch (err) {
      toast('Failed to transfer ticket: ' + err.message, 'e');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 400, maxWidth: '90vw' }}>
        <div className="modal-title">Transfer Ticket Category</div>
        <div className="modal-sub">
          Ticket: #{ticket.ticket_id} · Current: <strong>{parsed.category || 'Other'}</strong>
        </div>

        <label className="f-label" style={{ display: 'block', marginTop: 16 }}>
          Select New Category
        </label>
        <select
          value={selectedCat}
          onChange={e => setSelectedCat(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13,
            border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box',
            background: '#f8fafc', color: '#0f1c2e', marginBottom: 16,
            cursor: 'pointer',
          }}
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {subOptions.length > 0 && (
          <>
            <label className="f-label" style={{ display: 'block' }}>
              Select Sub-Category
            </label>
            <select
              value={selectedSub}
              onChange={e => setSelectedSub(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13,
                border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box',
                background: '#f8fafc', color: '#0f1c2e', marginBottom: 20,
                cursor: 'pointer',
              }}
            >
              {subOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </>
        )}

        <div className="modal-row" style={{ marginTop: 12 }}>
          <button
            className="btn-orange"
            onClick={handleTransfer}
            disabled={loading}
            style={{ padding: '10px', fontSize: 12, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Transferring...' : 'Transfer Ticket'}
          </button>
          <button className="btn-ghost" onClick={onClose} style={{ padding: '10px', fontSize: 12 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewLinkModal({ target, onClose }) {
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchLink = async () => {
      try {
        const param = target.feedback_id ? `feedback_id=${target.feedback_id}` : `ticket_id=${target.ticket_id}`;
        const res = await fetch(`${API}/api/access/link?${param}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setLink(data.intake_url);
      } catch (err) {
        setError(err.message || 'Failed to fetch link');
        toast('Failed to fetch link: ' + err.message, 'e');
      } finally {
        setLoading(false);
      }
    };
    fetchLink();
  }, [target]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast('Copied!', 's');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 440, maxWidth: '90vw' }}>
        <div className="modal-title">Active Intake Link</div>
        <div className="modal-sub">
          Team: <strong>{target.team_name}</strong> {target.project_name ? `· Project: ${target.project_name}` : ''}
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13, color: '#64748b' }}>Fetching link...</div>}
        {error && <div style={{ color: '#ef4444', fontSize: 12, padding: '10px 0' }}>Error: {error}</div>}

        {!loading && !error && (
          <div style={{ marginTop: 16 }}>
            <label className="f-label" style={{ display: 'block', marginBottom: 6 }}>
              Secure Access Link
            </label>
            <div style={{
              display: 'flex', gap: 8, alignItems: 'center',
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px',
              marginBottom: 20,
            }}>
              <span style={{ flex: 1, fontSize: 12, color: '#334155', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {link}
              </span>
              <button
                onClick={copyToClipboard}
                className="btn-ghost"
                style={{ padding: '4px 10px', flex: 'none', fontSize: 10, alignSelf: 'flex-start' }}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        <button className="btn-ghost" onClick={onClose} style={{ width: '100%', padding: '10px', fontSize: 12 }}>
          Close
        </button>
      </div>
    </div>
  );
}

const CATEGORIES = [
  'Website & Report Changes',
  'New Feature Request',
  'Data Issue',
  'Access Request',
  'Project/Product Request',
  'Other'
];

const SUB_OPTIONS = {
  'Website & Report Changes': ['Layout / UI Changes', 'Update Project UI'],
  'New Feature Request': ['New Functionality', 'Process Improvements'],
  'Data Issue': ['Incorrect Data of the Project', 'Missing Data Information'],
  'Access Request': ['New Request'],
  'Project/Product Request': ['New Project Upload Request', 'Change or Update the Existing Project'],
  'Other': []
};

function getTicketCategory(t) {
  const desc = t.description || '';
  const match = desc.match(/\[Category:\s*([^|\]]+)/);
  if (match) {
    const cat = match[1].trim();
    if (cat.startsWith('Website')) return 'Website & Report Changes';
    if (cat.startsWith('New Feature')) return 'New Feature Request';
    if (cat.startsWith('Data Issue')) return 'Data Issue';
    if (cat.startsWith('Access')) return 'Access Request';
    if (cat.startsWith('Project/Product')) return 'Project/Product Request';
    if (cat.startsWith('Other')) return 'Other';
    return cat;
  }
  const isEdit = desc.includes('| Project:');
  if (isEdit) return 'Project/Product Request';
  return 'Other';
}

function getEditTicketCategory(f) {
  return 'Project/Product Request';
}

function parseTicketDescription(desc) {
  const result = {
    cleanDescription: desc || '',
    category: '',
    subCategory: '',
    impact: '',
    project: '',
    changesRequested: []
  };

  if (!desc) return result;

  const bracketMatch = desc.match(/^\[(Category:[^\]]+)\]\s*(.*)$/);
  if (bracketMatch) {
    const metaString = bracketMatch[1];
    result.cleanDescription = bracketMatch[2];

    const parts = metaString.split('|');
    parts.forEach(part => {
      const colonIndex = part.indexOf(':');
      if (colonIndex !== -1) {
        const key = part.substring(0, colonIndex).trim().toLowerCase();
        const val = part.substring(colonIndex + 1).trim();

        if (key === 'category') {
          result.category = val;
        } else if (key === 'sub-category') {
          result.subCategory = val;
        } else if (key === 'impact') {
          result.impact = val;
        } else if (key === 'project') {
          result.project = val;
        } else if (key === 'changes requested') {
          result.changesRequested = val.split(',').map(x => x.trim()).filter(Boolean);
        }
      }
    });
  }

  return result;
}

export default function Tickets({ tickets, editTickets = [], projects = [], refetchTickets }) {
  const [selectedCategory, setSelectedCategory] = useState('Website & Report Changes');
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');
  const [grantModal, setGrantModal] = useState(null);
  const [transferModal, setTransferModal] = useState(null);
  const [viewLinkModal, setViewLinkModal] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [approvingId, setApprovingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [editAllowedEdits, setEditAllowedEdits] = useState(['Complete (Unlock all fields)']);
  const toast = useToast();

  const allFiltered = tickets.filter(t => {
    const matchStatus = filterStatus === 'All' ? t.status !== 'deleted' : 
      (filterStatus === 'complete' ? (t.status === 'done' || t.status === 'resolved') : t.status === filterStatus);
    const matchSearch = !search ||
      (t.team_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.contact_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.title || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });
  const filteredTickets = allFiltered.filter(t => t.status !== 'resolved');
  const resolvedTickets = allFiltered.filter(t => t.status === 'resolved');

  const filteredEditTickets = editTickets.filter(f => {
    const associatedProj = projects.find(p => String(p._projectId) === String(f.project_id) || String(p.id) === String(f.project_id));
    const isProjPublished = associatedProj && (associatedProj._status === 'published' || associatedProj.status?.toLowerCase() === 'published');

    const st = (f.status || 'pending').toLowerCase();
    let mappedStatus = st;
    if (isProjPublished) {
      mappedStatus = 'complete';
    } else if (st === 'unread' || st === 'pending') {
      mappedStatus = 'pending';
    } else if (st === 'approved' || st === 'link_sent' || st === 'resubmitted') {
      mappedStatus = 'in_progress';
    } else if (st === 'deleted') {
      mappedStatus = 'deleted';
    }

    const matchStatus = filterStatus === 'All' ? st !== 'deleted' : 
      (filterStatus === 'complete' ? (mappedStatus === 'complete' || st === 'done' || st === 'resolved') : (mappedStatus === filterStatus || st === filterStatus));
    
    const matchSearch = !search ||
      (f.team_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.user_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.project_name || f.project_title || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.issue_title || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Category counts based on total active (unresolved) tickets
  const categoryCounts = {};
  CATEGORIES.forEach(cat => { categoryCounts[cat] = 0; });

  tickets.forEach(t => {
    if (t.status === 'resolved' || t.status === 'deleted') return;
    const cat = getTicketCategory(t);
    if (categoryCounts[cat] !== undefined) categoryCounts[cat]++;
    else categoryCounts['Other']++;
  });

  editTickets.forEach(f => {
    if ((f.status || '').toLowerCase() === 'deleted') return;
    const associatedProj = projects.find(p => String(p._projectId) === String(f.project_id) || String(p.id) === String(f.project_id));
    const isProjPublished = associatedProj && (associatedProj._status === 'published' || associatedProj.status?.toLowerCase() === 'published');
    if (isProjPublished) return; // Exclude completed ones from active category counts

    const cat = getEditTicketCategory(f);
    if (categoryCounts[cat] !== undefined) categoryCounts[cat]++;
    else categoryCounts['Other']++;
  });

  // Filter display lists based on selected category
  const displayTickets = filteredTickets.filter(t => getTicketCategory(t) === selectedCategory);
  const displayEditTickets = filteredEditTickets.filter(f => getEditTicketCategory(f) === selectedCategory);
  const displayResolvedTickets = resolvedTickets.filter(t => getTicketCategory(t) === selectedCategory);

  // Get active sub-categories for the selected category
  const activeSubOptions = SUB_OPTIONS[selectedCategory] || [];
  
  // Helper lists for sub-category counts, independent of the active filterStatus
  const displayTicketsNoStatusFilter = tickets.filter(t => {
    if (t.status === 'resolved' || t.status === 'deleted') return false;
    if (getTicketCategory(t) !== selectedCategory) return false;
    const matchSearch = !search ||
      (t.team_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.contact_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.title || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const displayEditTicketsNoStatusFilter = editTickets.filter(f => {
    if (getEditTicketCategory(f) !== selectedCategory) return false;
    if ((f.status || '').toLowerCase() === 'deleted') return false;
    
    // Exclude completed/published edit tickets from active sub-option list/counts
    const associatedProj = projects.find(p => String(p._projectId) === String(f.project_id) || String(p.id) === String(f.project_id));
    const isProjPublished = associatedProj && (associatedProj._status === 'published' || associatedProj.status?.toLowerCase() === 'published');
    if (isProjPublished) return false;

    const matchSearch = !search ||
      (f.team_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.user_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.project_name || f.project_title || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.issue_title || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const displayResolvedTicketsNoStatusFilter = tickets.filter(t => {
    if (t.status !== 'resolved') return false;
    if (getTicketCategory(t) !== selectedCategory) return false;
    const matchSearch = !search ||
      (t.team_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.contact_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.title || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // Counts for each sub-category
  const subCategoryCounts = { 'All': 0 };
  activeSubOptions.forEach(sub => {
    subCategoryCounts[sub] = 0;
  });
  if (selectedCategory === 'Other') {
    subCategoryCounts['Other'] = 0;
  }

  displayTicketsNoStatusFilter.forEach(t => {
    const parsed = parseTicketDescription(t.description);
    const sub = parsed.subCategory || 'Other';
    
    subCategoryCounts['All']++;
    if (subCategoryCounts[sub] !== undefined) {
      subCategoryCounts[sub]++;
    } else {
      if (selectedCategory === 'Other') {
        subCategoryCounts['Other']++;
      }
    }
  });

  displayEditTicketsNoStatusFilter.forEach(f => {
    // All edit requests belong to 'Change or Update the Existing Project'
    subCategoryCounts['All']++;
    const sub = 'Change or Update the Existing Project';
    if (subCategoryCounts[sub] !== undefined) {
      subCategoryCounts[sub]++;
    }
  });

  // Filter final display lists based on selectedSubCategory
  const finalTickets = displayTickets.filter(t => {
    if (selectedSubCategory === 'All') return true;
    const parsed = parseTicketDescription(t.description);
    return (parsed.subCategory || 'Other') === selectedSubCategory;
  });

  const finalEditTickets = displayEditTickets.filter(f => {
    if (selectedSubCategory === 'All') return true;
    const sub = 'Change or Update the Existing Project';
    return sub === selectedSubCategory;
  });

  const finalResolvedTickets = selectedSubCategory === 'All' ? displayResolvedTickets : [];

  // Calculate status counts for the selected category (independent of filterStatus and selectedSubCategory)
  let pendingCount = 0;
  let inProgressCount = 0;
  let completeCount = 0;
  let deletedCount = 0;
  let totalCount = 0;

  // Filter regular tickets by category & search
  tickets.forEach(t => {
    // Category check
    if (getTicketCategory(t) !== selectedCategory) return;
    // Search check
    const matchSearch = !search ||
      (t.team_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.contact_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.title || '').toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return;

    if (t.status === 'deleted') {
      deletedCount++;
    } else {
      totalCount++;
      if (t.status === 'pending') {
        pendingCount++;
      } else if (t.status === 'in_progress') {
        inProgressCount++;
      } else if (t.status === 'done' || t.status === 'resolved') {
        completeCount++;
      }
    }
  });

  // Filter edit tickets by category & search
  editTickets.forEach(f => {
    // Category check
    if (getEditTicketCategory(f) !== selectedCategory) return;
    // Search check
    const matchSearch = !search ||
      (f.team_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.user_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.project_name || f.project_title || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.issue_title || '').toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return;

    const st = (f.status || 'pending').toLowerCase();
    if (st === 'deleted') {
      deletedCount++;
    } else {
      totalCount++;
      
      const associatedProj = projects.find(p => String(p._projectId) === String(f.project_id) || String(p.id) === String(f.project_id));
      const isProjPublished = associatedProj && (associatedProj._status === 'published' || associatedProj.status?.toLowerCase() === 'published');

      if (isProjPublished || st === 'done' || st === 'resolved') {
        completeCount++;
      } else if (st === 'pending' || st === 'unread') {
        pendingCount++;
      } else if (st === 'approved' || st === 'link_sent' || st === 'resubmitted' || st === 'in_progress') {
        inProgressCount++;
      }
    }
  });

  const finalDisplayCount = finalTickets.length + finalEditTickets.length + finalResolvedTickets.length;

  const handleSendEditLink = (feedback) => {
    setEditData(feedback);
    setGeneratedUrl('');
    setCopiedUrl(false);
    setShowEditModal(true);
    
    // Determine default editAllowedEdits based on change_type
    const initial = [];
    const changeType = feedback.change_type || feedback.issue_title || '';
    if (changeType) {
      const parts = changeType.split(',').map(s => s.trim().toLowerCase());
      parts.forEach(p => {
        if (p.includes('complete')) initial.push('Complete (Unlock all fields)');
        else if (p.includes('team name') || p.includes('teamname')) initial.push('Team Name');
        else if (p.includes('team lead') || p.includes('teamlead')) initial.push('Team Lead');
        else if (p.includes('escalation')) initial.push('Escalation Names');
        else if (p.includes('project page') || p.includes('project') || p.includes('update')) initial.push('Project Page Update');
        else if (p.includes('image')) initial.push('Image');
        else if (p.includes('doc')) initial.push('Document');
      });
    }
    setEditAllowedEdits(initial.length > 0 ? initial : ['Complete (Unlock all fields)']);
  };

  const handleConfirmEditLink = async (duration, note) => {
    try {
      const res = await fetch(`${API}/api/access/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: editData.project_id,
          team_name: editData.team_name,
          user_email: editData.user_email,
          duration_days: duration,
          feedback_id: editData.feedback_id,
          source: 'required_changes',
          allowed_edits: editAllowedEdits.map(x => x.replace(' (Unlock all fields)', '')).join(', '),
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGeneratedUrl(data.intake_url);
      toast('Edit link generated successfully', 's');
      refetchTickets(); // to update status to link_sent
    } catch (err) {
      toast(err.message, 'e');
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    try {
      const res = await fetch(`${API}/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'deleted' }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast('Ticket deleted successfully', 's');
      refetchTickets();
    } catch (err) {
      toast('Failed to delete ticket: ' + err.message, 'e');
    }
  };

  const handleDeleteEditTicket = async (feedbackId) => {
    try {
      const res = await fetch(`${API}/api/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'deleted' }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast('Edit request deleted successfully', 's');
      refetchTickets();
    } catch (err) {
      toast('Failed to delete edit request: ' + err.message, 'e');
    }
  };

  return (
    <>
      <div className="pg-title">Support Tickets</div>
      <div className="pg-sub">Incoming queries and edit requests from the main website</div>

      {/* Category Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
        marginTop: '8px'
      }}>
        {CATEGORIES.map(cat => {
          const isActive = selectedCategory === cat;
          const count = categoryCounts[cat] || 0;
          
          return (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setSelectedSubCategory('All'); }}
              style={{
                background: '#fff',
                border: isActive ? '2px solid #FF6B2B' : '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '20px 18px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '110px',
                boxShadow: isActive 
                  ? '0 10px 20px rgba(255,107,43,0.12)' 
                  : '0 4px 6px rgba(15,28,46,0.02)',
                position: 'relative',
                overflow: 'hidden',
                outline: 'none',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#FF6B2B80';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(15,28,46,0.04)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(15,28,46,0.02)';
                }
              }}
            >
              {/* Active Indicator Top Accent Bar */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: '#FF6B2B'
                }} />
              )}
              
              {/* Count Indicator */}
              <div style={{
                fontSize: '24px',
                fontWeight: '800',
                fontFamily: "'Sora', sans-serif",
                color: isActive ? '#FF6B2B' : '#94a3b8',
                lineHeight: '1',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%'
              }}>
                <span>{count}</span>
                {isActive && <span style={{ fontSize: '16px' }}>🎯</span>}
              </div>

              {/* Category Label */}
              <div style={{
                fontSize: '13px',
                fontWeight: isActive ? '800' : '600',
                fontFamily: "'Sora', sans-serif",
                color: isActive ? '#15263C' : '#64748b',
                lineHeight: '1.35',
                wordBreak: 'break-word',
              }}>
                {cat}
              </div>
            </button>
          );
        })}
      </div>

      <div className="filter-row">
        <input
          value={search}
          placeholder="Search by team, email or title..."
          onChange={e => setSearch(e.target.value)}
        />
        <select value={filterStatus} onChange={e => {
          const val = e.target.value;
          setFilterStatus(val);
          if (val !== 'All') {
            setSelectedSubCategory('All');
          }
        }}>
          <option value="All">All</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="complete">Complete</option>
        </select>
        <span className="count-txt">Showing {finalDisplayCount} of {tickets.length + editTickets.length}</span>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch', marginTop: '16px' }}>
        {/* Left Sidebar Column */}
        <div style={{
          width: '260px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          flexShrink: 0,
          alignSelf: 'flex-start'
        }}>
          {/* Sub-Category Vertical Sidebar */}
          <div style={{
            background: '#e2e8f0',
            borderRadius: '14px',
            padding: '20px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: '1px solid #cbd5e1',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', paddingLeft: '8px', marginBottom: '4px' }}>
              Sub-Options
            </div>
            
            {/* Render 'All' item */}
            <button
              onClick={() => setSelectedSubCategory('All')}
              style={{
                background: (selectedSubCategory === 'All' && filterStatus === 'All') ? '#fff' : 'transparent',
                border: (selectedSubCategory === 'All' && filterStatus === 'All') ? '1px solid #cbd5e1' : '1px solid transparent',
                textAlign: 'left',
                fontFamily: "'Sora', sans-serif",
                fontSize: '13px',
                fontWeight: (selectedSubCategory === 'All' && filterStatus === 'All') ? '800' : '600',
                color: (selectedSubCategory === 'All' && filterStatus === 'All') ? '#15263C' : '#475569',
                cursor: 'pointer',
                padding: '10px 12px',
                borderRadius: '8px',
                transition: 'all 0.15s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                boxShadow: (selectedSubCategory === 'All' && filterStatus === 'All') ? '0 2px 8px rgba(15,28,46,0.04)' : 'none'
              }}
              onMouseEnter={e => { if (!(selectedSubCategory === 'All' && filterStatus === 'All')) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'; }}
              onMouseLeave={e => { if (!(selectedSubCategory === 'All' && filterStatus === 'All')) e.currentTarget.style.background = 'transparent'; }}
            >
              <span>All Requests</span>
              <span style={{
                background: (selectedSubCategory === 'All' && filterStatus === 'All') ? '#FF6B2B' : '#94a3b8',
                color: '#fff',
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '8px'
              }}>
                {subCategoryCounts['All'] || 0}
              </span>
            </button>

            {/* Render active sub-options list */}
            {activeSubOptions.map(sub => {
              const label = sub;
              const count = subCategoryCounts[label] || 0;
              const isSubActive = selectedSubCategory === label && filterStatus === 'All';

              return (
                <button
                  key={label}
                  onClick={() => {
                    setSelectedSubCategory(label);
                    setFilterStatus('All');
                  }}
                  style={{
                    background: isSubActive ? '#fff' : 'transparent',
                    border: isSubActive ? '1px solid #cbd5e1' : '1px solid transparent',
                    textAlign: 'left',
                    fontFamily: "'Sora', sans-serif",
                    fontSize: '13px',
                    fontWeight: isSubActive ? '800' : '600',
                    color: isSubActive ? '#15263C' : '#475569',
                    cursor: 'pointer',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    transition: 'all 0.15s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    lineHeight: '1.3',
                    boxShadow: isSubActive ? '0 2px 8px rgba(15,28,46,0.04)' : 'none'
                  }}
                  onMouseEnter={e => { if (!isSubActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'; }}
                  onMouseLeave={e => { if (!isSubActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span>{label}</span>
                  <span style={{
                    background: isSubActive ? '#FF6B2B' : '#94a3b8',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '2px 6px',
                    borderRadius: '8px'
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
            
            {/* Fallback for 'Other' category */}
            {selectedCategory === 'Other' && (
              <button
                onClick={() => {
                  setFilterStatus('All');
                  setSelectedSubCategory('Other');
                }}
                style={{
                  background: (selectedSubCategory === 'Other' && filterStatus === 'All') ? '#fff' : 'transparent',
                  border: (selectedSubCategory === 'Other' && filterStatus === 'All') ? '1px solid #cbd5e1' : '1px solid transparent',
                  textAlign: 'left',
                  fontFamily: "'Sora', sans-serif",
                  fontSize: '13px',
                  fontWeight: (selectedSubCategory === 'Other' && filterStatus === 'All') ? '800' : '600',
                  color: (selectedSubCategory === 'Other' && filterStatus === 'All') ? '#15263C' : '#475569',
                  cursor: 'pointer',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  transition: 'all 0.15s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  boxShadow: (selectedSubCategory === 'Other' && filterStatus === 'All') ? '0 2px 8px rgba(15,28,46,0.04)' : 'none'
                }}
                onMouseEnter={e => { if (!(selectedSubCategory === 'Other' && filterStatus === 'All')) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'; }}
                onMouseLeave={e => { if (!(selectedSubCategory === 'Other' && filterStatus === 'All')) e.currentTarget.style.background = 'transparent'; }}
              >
                <span>Other Queries</span>
                <span style={{
                  background: (selectedSubCategory === 'Other' && filterStatus === 'All') ? '#FF6B2B' : '#94a3b8',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 6px',
                  borderRadius: '8px'
                }}>
                  {subCategoryCounts['Other'] || 0}
                </span>
              </button>
            )}
          </div>

          {/* Ticket Status Sidebar */}
          <div style={{
            background: '#e2e8f0',
            borderRadius: '14px',
            padding: '20px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: '1px solid #cbd5e1',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', paddingLeft: '8px', marginBottom: '4px' }}>
              Ticket Status
            </div>

            {/* All Tickets Option */}
            <button
              onClick={() => setFilterStatus('All')}
              style={{
                background: (filterStatus === 'All' && selectedSubCategory === 'All') ? '#fff' : 'transparent',
                border: (filterStatus === 'All' && selectedSubCategory === 'All') ? '1px solid #cbd5e1' : '1px solid transparent',
                textAlign: 'left',
                fontFamily: "'Sora', sans-serif",
                fontSize: '13px',
                fontWeight: (filterStatus === 'All' && selectedSubCategory === 'All') ? '800' : '600',
                color: (filterStatus === 'All' && selectedSubCategory === 'All') ? '#15263C' : '#475569',
                cursor: 'pointer',
                padding: '10px 12px',
                borderRadius: '8px',
                transition: 'all 0.15s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                boxShadow: (filterStatus === 'All' && selectedSubCategory === 'All') ? '0 2px 8px rgba(15,28,46,0.04)' : 'none'
              }}
              onMouseEnter={e => { if (!(filterStatus === 'All' && selectedSubCategory === 'All')) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'; }}
              onMouseLeave={e => { if (!(filterStatus === 'All' && selectedSubCategory === 'All')) e.currentTarget.style.background = 'transparent'; }}
            >
              <span>All Tickets</span>
              <span style={{
                background: (filterStatus === 'All' && selectedSubCategory === 'All') ? '#FF6B2B' : '#94a3b8',
                color: '#fff',
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '8px'
              }}>
                {totalCount}
              </span>
            </button>

            {selectedCategory === 'Project/Product Request' && (
              <>
                {/* Complete Tickets Option */}
                <button
                  onClick={() => {
                    setFilterStatus('complete');
                    setSelectedSubCategory('All');
                  }}
                  style={{
                    background: (filterStatus === 'complete' && selectedSubCategory === 'All') ? '#fff' : 'transparent',
                    border: (filterStatus === 'complete' && selectedSubCategory === 'All') ? '1px solid #cbd5e1' : '1px solid transparent',
                    textAlign: 'left',
                    fontFamily: "'Sora', sans-serif",
                    fontSize: '13px',
                    fontWeight: (filterStatus === 'complete' && selectedSubCategory === 'All') ? '800' : '600',
                    color: (filterStatus === 'complete' && selectedSubCategory === 'All') ? '#15263C' : '#475569',
                    cursor: 'pointer',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    transition: 'all 0.15s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    boxShadow: (filterStatus === 'complete' && selectedSubCategory === 'All') ? '0 2px 8px rgba(15,28,46,0.04)' : 'none'
                  }}
                  onMouseEnter={e => { if (!(filterStatus === 'complete' && selectedSubCategory === 'All')) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'; }}
                  onMouseLeave={e => { if (!(filterStatus === 'complete' && selectedSubCategory === 'All')) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span>Complete Tickets</span>
                  <span style={{
                    background: (filterStatus === 'complete' && selectedSubCategory === 'All') ? '#FF6B2B' : '#94a3b8',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '2px 6px',
                    borderRadius: '8px'
                  }}>
                    {completeCount}
                  </span>
                </button>
              </>
            )}

            {/* Deleted Tickets Option */}
            <button
              onClick={() => {
                setFilterStatus('deleted');
                setSelectedSubCategory('All');
              }}
              style={{
                background: (filterStatus === 'deleted' && selectedSubCategory === 'All') ? '#fff' : 'transparent',
                border: (filterStatus === 'deleted' && selectedSubCategory === 'All') ? '1px solid #cbd5e1' : '1px solid transparent',
                textAlign: 'left',
                fontFamily: "'Sora', sans-serif",
                fontSize: '13px',
                fontWeight: (filterStatus === 'deleted' && selectedSubCategory === 'All') ? '800' : '600',
                color: (filterStatus === 'deleted' && selectedSubCategory === 'All') ? '#15263C' : '#475569',
                cursor: 'pointer',
                padding: '10px 12px',
                borderRadius: '8px',
                transition: 'all 0.15s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                boxShadow: (filterStatus === 'deleted' && selectedSubCategory === 'All') ? '0 2px 8px rgba(15,28,46,0.04)' : 'none'
              }}
              onMouseEnter={e => { if (!(filterStatus === 'deleted' && selectedSubCategory === 'All')) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'; }}
              onMouseLeave={e => { if (!(filterStatus === 'deleted' && selectedSubCategory === 'All')) e.currentTarget.style.background = 'transparent'; }}
            >
              <span>Deleted Tickets</span>
              <span style={{
                background: (filterStatus === 'deleted' && selectedSubCategory === 'All') ? '#ef4444' : '#94a3b8',
                color: '#fff',
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '8px'
              }}>
                {deletedCount}
              </span>
            </button>
          </div>
        </div>

        {/* Tickets List Column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {finalTickets.length === 0 && finalEditTickets.length === 0 && finalResolvedTickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>
              No tickets found in this category/sub-category.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* General Tickets */}
              {finalTickets.length > 0 && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>General Queries</div>
                  {finalTickets.map(t => {
                    const parsed = parseTicketDescription(t.description);
                    const isEdit = !!parsed.project;
                    const projName = parsed.project;
                    return (
                    <div className="sub-card" key={`t-${t.ticket_id}`}>
                      <div className="sub-left">
                        <div className="sub-token">#{t.ticket_id}</div>
                        <span className="dept-tag" style={{ marginTop: '6px', display: 'inline-block' }}>{t.status?.replace('_', ' ')}</span>
                        {isEdit && (
                          <span style={{ marginTop: '6px', display: 'inline-block', fontSize: '9px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', textTransform: 'uppercase', letterSpacing: '0.04em' }}>✏️ Edit Request</span>
                        )}
                        <div className="sub-team" style={{ marginTop: '4px' }}>{t.team_name}</div>
                      </div>
                      <div className="sub-center">
                        <div className="sub-proj">{t.title || '(No title)'}</div>
                        
                        {/* Metadata tags */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px', marginBottom: '8px' }}>
                          {parsed.subCategory && (
                            <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                              📁 {parsed.subCategory}
                            </span>
                          )}
                          {parsed.impact && (() => {
                            const impacts = {
                              low:      { color: '#22c55e', bg: '#f0fdf4', border: '#86efac' },
                              medium:   { color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
                              high:     { color: '#f97316', bg: '#fff7ed', border: '#fdba74' },
                              critical: { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' }
                            };
                            const key = parsed.impact.toLowerCase();
                            const style = impacts[key] || { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
                            return (
                              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                                ⚡ {parsed.impact} Impact
                              </span>
                            );
                          })()}
                          {isEdit && (
                            <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                              📋 Project: {projName}
                            </span>
                          )}
                        </div>

                        {/* Checkboxes list of changes */}
                        {parsed.changesRequested.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Changes:</span>
                            {parsed.changesRequested.map(item => (
                              <span key={item} style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }}>
                                {item}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="sub-desc" style={{ marginTop: '4px' }}>
                          {parsed.cleanDescription.slice(0, 120)}{parsed.cleanDescription.length > 120 ? '...' : ''}
                        </div>
                        <div className="sub-date" style={{ marginTop: '8px' }}>
                          {t.contact_person && <span>{t.contact_person} · </span>}
                          {t.contact_email}
                        </div>
                        <div className="sub-date" style={{ marginTop: 2 }}>
                          Submitted: {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <div className="sub-right" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        <StatusBadge status={t.status || 'pending'} />
                        {selectedCategory === 'Project/Product Request' && t.status !== 'done' && t.status !== 'resolved' && t.status !== 'deleted' && (
                          <>
                            {t.has_active_token ? (
                              <button
                                onClick={() => setViewLinkModal({ ticket_id: t.ticket_id, team_name: t.team_name })}
                                style={{ padding: '7px 14px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1e40af', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', width: '100%', boxSizing: 'border-box', textAlign: 'center', marginTop: '4px' }}
                              >
                                🔗 View Link
                              </button>
                            ) : (
                              <button
                                className="btn-req"
                                style={{ padding: '7px 14px', fontSize: 11, width: '100%' }}
                                onClick={() => setGrantModal(t)}
                              >
                                {t.status === 'in_progress' ? 'Grant New Access' : 'Grant Access'}
                              </button>
                            )}
                          </>
                        )}
                        {t.status !== 'deleted' ? (
                          <>
                            <button
                              onClick={() => setTransferModal(t)}
                              style={{ padding: '6px 12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f1c2e', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'block', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
                            >
                              🔄 Transfer
                            </button>
                            <button
                              onClick={() => handleDeleteTicket(t.ticket_id)}
                              style={{ padding: '6px 12px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'block', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#ef4444', padding: '4px 8px', borderRadius: '4px', background: '#fef2f2', border: '1px solid #fca5a5', display: 'inline-block' }}>
                            🗑 Deleted
                          </span>
                        )}
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}

              {/* Project Edit Tickets */}
              {finalEditTickets.length > 0 && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Project Edit Requests</div>
                  {finalEditTickets.map(f => {
                    const st = (f.status || 'pending').toLowerCase();
                    
                    const associatedProj = projects.find(p => String(p._projectId) === String(f.project_id) || String(p.id) === String(f.project_id));
                    const isProjPublished = associatedProj && (associatedProj._status === 'published' || associatedProj.status?.toLowerCase() === 'published');

                    const statusBadgeStyle = (s) => {
                      if (isProjPublished) return { bg: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', border: 'rgba(34, 197, 94, 0.3)' }; // Complete
                      if (s === 'approved') return { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' };
                      if (s === 'link_sent') return { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' };
                      if (s === 'resubmitted') return { bg: '#faf5ff', color: '#6b21a8', border: '#e9d5ff' };
                      return { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' }; // pending
                    };
                    const sb = statusBadgeStyle(st);
                    
                    return (
                      <div className="sub-card" key={`f-${f.feedback_id}`} style={{ alignItems: 'center' }}>
                        <div className="sub-left" style={{ minWidth: '140px' }}>
                          <div className="sub-token">#{f.feedback_id}</div>
                          <span style={{ marginTop: '6px', display: 'inline-block', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: sb.bg, color: sb.color, border: `1px solid ${sb.border}`, textTransform: 'capitalize' }}>
                            {isProjPublished ? 'complete' : st.replace('_', ' ')}
                          </span>
                          <div className="sub-team" style={{ marginTop: '8px', fontSize: '12px' }}>{f.team_name}</div>
                        </div>
                        
                        <div className="sub-center">
                          <div className="sub-proj" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {f.issue_title}
                            {f.change_type && <span style={{ fontSize: '10px', padding: '2px 6px', background: '#f1f5f9', color: '#475569', borderRadius: '4px' }}>{f.change_type}</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Project: <strong style={{ color: '#0f1c2e' }}>{f.project_name || f.project_title}</strong></div>
                          <div className="sub-desc" style={{ marginTop: '6px', fontStyle: 'italic' }}>"{f.comment}"</div>
                          <div className="sub-date" style={{ marginTop: '8px' }}>
                            {f.user_name && <span>{f.user_name} · </span>}
                            {f.user_email}
                          </div>
                          <div className="sub-date" style={{ marginTop: 2 }}>
                            Submitted: {new Date(f.submitted_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="sub-right" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', minWidth: '120px' }}>
                          {isProjPublished ? (
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#22C55E', padding: '8px 12px', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
                              ✅ Complete
                            </span>
                          ) : (
                            <>
                              {st === 'deleted' ? (
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444', padding: '8px 12px', borderRadius: '6px', background: '#fef2f2', border: '1px solid #fca5a5', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
                                  🗑 Deleted
                                </span>
                              ) : (
                                <>
                                  {st === 'pending' && (
                                    <button
                                      disabled={approvingId === f.feedback_id}
                                      onClick={async () => {
                                        setApprovingId(f.feedback_id);
                                        try {
                                          const r = await fetch(`${API}/api/feedback/${f.feedback_id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: 'approved' }),
                                          });
                                          if (!r.ok) throw new Error('Failed');
                                          toast('Marked as approved', 's');
                                          refetchTickets();
                                        } catch { toast('Approval failed', 'e'); }
                                        setApprovingId(null);
                                      }}
                                      style={{ padding: '8px 16px', borderRadius: '6px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', width: '100%' }}
                                    >
                                      {approvingId === f.feedback_id ? 'Approving…' : '✓ Approve'}
                                    </button>
                                  )}
                                  {st === 'approved' && (
                                    <button
                                      onClick={() => handleSendEditLink(f)}
                                      style={{ padding: '8px 16px', borderRadius: '6px', background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', width: '100%' }}
                                    >
                                      🔗 Send Link
                                    </button>
                                  )}
                                  {(st === 'link_sent' || st === 'resubmitted') && (
                                    <>
                                      <span style={{ fontSize: '12px', fontWeight: 600, color: st === 'resubmitted' ? '#6b21a8' : '#1e40af', padding: '8px 12px', borderRadius: '6px', background: st === 'resubmitted' ? '#faf5ff' : '#eff6ff', border: `1px solid ${st === 'resubmitted' ? '#e9d5ff' : '#bfdbfe'}`, textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
                                        {st === 'resubmitted' ? '✅ Resubmitted' : '📨 Link Sent'}
                                      </span>
                                      {f.has_active_token ? (
                                        <button
                                          onClick={() => setViewLinkModal({ feedback_id: f.feedback_id, team_name: f.team_name, project_name: f.project_name || f.project_title })}
                                          style={{ padding: '6px 12px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1e40af', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', width: '100%', boxSizing: 'border-box', textAlign: 'center', marginTop: '4px' }}
                                        >
                                          🔗 View Link
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleSendEditLink(f)}
                                          style={{ padding: '6px 12px', border: '1px solid #fed7aa', background: '#fff7ed', color: '#ea580c', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', width: '100%', boxSizing: 'border-box', textAlign: 'center', marginTop: '4px' }}
                                        >
                                          🔗 Send New Link
                                        </button>
                                      )}
                                    </>
                                  )}
                                  {(st === 'pending' || st === 'unread') && (
                                    <button
                                      onClick={() => handleDeleteEditTicket(f.feedback_id)}
                                      style={{ padding: '6px 12px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', width: '100%', boxSizing: 'border-box', textAlign: 'center', marginTop: '4px' }}
                                    >
                                      Delete
                                    </button>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Resolved Tickets */}
              {finalResolvedTickets.length > 0 && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', marginTop: '8px' }}>
                    ✓ Resolved ({finalResolvedTickets.length})
                  </div>
                  {finalResolvedTickets.map(t => {
                    const parsed = parseTicketDescription(t.description);
                    const isEdit = !!parsed.project;
                    const projName = parsed.project;
                    return (
                      <div className="sub-card" key={`r-${t.ticket_id}`} style={{ opacity: 0.75 }}>
                        <div className="sub-left">
                          <div className="sub-token">#{t.ticket_id}</div>
                          <span className="dept-tag" style={{ marginTop: '6px', display: 'inline-block' }}>resolved</span>
                          {isEdit && (
                            <span style={{ marginTop: '6px', display: 'inline-block', fontSize: '9px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', textTransform: 'uppercase', letterSpacing: '0.04em' }}>✏️ Edit Request</span>
                          )}
                          <div className="sub-team" style={{ marginTop: '4px' }}>{t.team_name}</div>
                        </div>
                        <div className="sub-center">
                          <div className="sub-proj">{t.title || '(No title)'}</div>
                          
                          {/* Metadata tags */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px', marginBottom: '8px' }}>
                            {parsed.subCategory && (
                              <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                                📁 {parsed.subCategory}
                              </span>
                            )}
                            {parsed.impact && (() => {
                              const impacts = {
                                low:      { color: '#22c55e', bg: '#f0fdf4', border: '#86efac' },
                                medium:   { color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
                                high:     { color: '#f97316', bg: '#fff7ed', border: '#fdba74' },
                                critical: { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' }
                              };
                              const key = parsed.impact.toLowerCase();
                              const style = impacts[key] || { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
                              return (
                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                                  ⚡ {parsed.impact} Impact
                                </span>
                              );
                            })()}
                            {isEdit && (
                              <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                                📋 Project: {projName}
                              </span>
                            )}
                          </div>

                          {/* Checkboxes list of changes */}
                          {parsed.changesRequested.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Changes:</span>
                              {parsed.changesRequested.map(item => (
                                <span key={item} style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }}>
                                  {item}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="sub-desc" style={{ marginTop: '4px' }}>
                            {parsed.cleanDescription.slice(0, 120)}{parsed.cleanDescription.length > 120 ? '...' : ''}
                          </div>
                          <div className="sub-date" style={{ marginTop: '8px' }}>
                            {t.contact_person && <span>{t.contact_person} · </span>}
                            {t.contact_email}
                          </div>
                          <div className="sub-date" style={{ marginTop: 2 }}>
                            Submitted: {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                        <div className="sub-right">
                          <StatusBadge status="resolved" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {grantModal && (
        <GrantAccessModal
          ticket={grantModal}
          projects={projects}
          onClose={() => setGrantModal(null)}
          onGranted={() => { refetchTickets(); }}
        />
      )}

      {transferModal && (
        <TransferTicketModal
          ticket={transferModal}
          onClose={() => setTransferModal(null)}
          onTransferred={() => { refetchTickets(); setTransferModal(null); }}
        />
      )}

      {viewLinkModal && (
        <ViewLinkModal
          target={viewLinkModal}
          onClose={() => setViewLinkModal(null)}
        />
      )}

      {/* SEND EDIT LINK MODAL FOR EDIT TICKETS */}
      {showEditModal && editData && (() => {
        // inline component logic since we can't easily extract it to the top level without breaking imports
        let d = 15;
        let n = '';
        return (
          <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && !generatedUrl && setShowEditModal(false)}>
            <div className="modal" style={{ width: '480px' }}>
              <div className="modal-title">Send Edit Link</div>
              <div className="modal-sub">Generate a secure edit link for <strong>{editData.project_name || editData.project_title}</strong></div>
              
              {!generatedUrl ? (
                <>
                  <div style={{ marginBottom: '15px', marginTop: '20px' }}>
                    <label className="f-label" style={{ display: 'block', marginBottom: '5px' }}>Team</label>
                    <div style={{ fontWeight: 600, color: '#0f1c2e', fontSize: '14px' }}>{editData.team_name}</div>
                  </div>

                  {!editData.project_id && (() => {
                    // Try to auto-detect the project using the same helper function
                    const detectProject = () => {
                      const nameToMatch = editData.project_name || editData.project_title || '';
                      if (!nameToMatch) return '';
                      
                      const normalize = (str) => {
                        if (!str) return '';
                        return str
                          .toLowerCase()
                          .replace(/^(te_ts_adm_sale_|te_is_adm_sale_|te_ts_adm_|te_is_adm_|te_ts_|te_is_)/, '')
                          .replace(/[^a-z0-9]/g, '');
                      };
                      
                      const targetNorm = normalize(nameToMatch);
                      
                      // 1. Try exact matches
                      let matches = projects.filter(p => p.title === nameToMatch);
                      
                      // 2. Try case-insensitive matches
                      if (matches.length === 0) {
                        const lower = nameToMatch.toLowerCase();
                        matches = projects.filter(p => (p.title || '').toLowerCase() === lower);
                      }
                      
                      // 3. Try normalized matches
                      if (matches.length === 0) {
                        matches = projects.filter(p => normalize(p.title) === targetNorm);
                      }
                      
                      // 4. Try partial includes on normalized titles
                      if (matches.length === 0) {
                        matches = projects.filter(p => {
                          const pNorm = normalize(p.title);
                          return pNorm && targetNorm && (pNorm.includes(targetNorm) || targetNorm.includes(pNorm));
                        });
                      }
                      
                      // 5. Try fuzzy Levenshtein match on normalized titles
                      if (matches.length === 0) {
                        const getLevenshtein = (a, b) => {
                          const matrix = [];
                          for (let i = 0; i <= b.length; i++) matrix[i] = [i];
                          for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
                          for (let i = 1; i <= b.length; i++) {
                            for (let j = 1; j <= a.length; j++) {
                              if (b.charAt(i - 1) === a.charAt(j - 1)) {
                                matrix[i][j] = matrix[i - 1][j - 1];
                              } else {
                                matrix[i][j] = Math.min(
                                  matrix[i - 1][j - 1] + 1,
                                  matrix[i][j - 1] + 1,
                                  matrix[i - 1][j] + 1
                                );
                              }
                            }
                          }
                          return matrix[b.length][a.length];
                        };

                        let bestMatches = [];
                        let minDistance = Infinity;
                        projects.forEach(p => {
                          const pNorm = normalize(p.title);
                          if (pNorm && targetNorm) {
                            const dist = getLevenshtein(pNorm, targetNorm);
                            if (dist < minDistance) {
                              minDistance = dist;
                              bestMatches = [p];
                            } else if (dist === minDistance) {
                              bestMatches.push(p);
                            }
                          }
                        });

                        const maxAllowedDist = Math.max(3, Math.floor(targetNorm.length * 0.25));
                        if (minDistance <= maxAllowedDist) {
                          matches = bestMatches;
                        }
                      }

                      if (matches.length > 0) {
                        // Prioritize 'published' status first, then 'submitted', then others
                        const publishedMatch = matches.find(p => p.status === 'published');
                        if (publishedMatch) return String(publishedMatch.project_id);
                        const submittedMatch = matches.find(p => p.status === 'submitted');
                        if (submittedMatch) return String(submittedMatch.project_id);
                        return String(matches[0].project_id);
                      }
                      
                      return '';
                    };

                    const detectedId = detectProject();

                    return (
                      <div style={{ marginBottom: '15px' }}>
                        <label className="f-label" style={{ display: 'block', marginBottom: '5px', color: detectedId ? '#166534' : '#ef4444' }}>
                          {detectedId ? '✓ Auto-detected project linked below:' : '⚠️ No project linked. Please select one:'}
                        </label>
                        <select
                          id="edit-project-select"
                          defaultValue={detectedId}
                          style={{
                            width: '100%', padding: '10px 12px', borderRadius: '8px',
                            border: detectedId ? '1px solid #166534' : '1px solid #ef4444',
                            fontSize: '13px', outline: 'none'
                          }}
                        >
                          <option value="">— Select a project —</option>
                          {projects && projects.map(p => (
                            <option key={p.project_id} value={p.project_id}>{p.title} ({p.team_name})</option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}

                  <div style={{ marginBottom: '15px' }}>
                    <label className="f-label" style={{ display: 'block', marginBottom: '5px' }}>Send Link To (Email)</label>
                    <input type="email" readOnly value={editData.user_email} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', background: '#f8fafc', color: '#64748b' }} />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label className="f-label" style={{ display: 'block', marginBottom: '8px' }}>Allowed Uploads / Edits</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      {[
                        'Complete (Unlock all fields)',
                        'Team Name',
                        'Team Lead',
                        'Escalation Names',
                        'Project Page Update',
                        'Image',
                        'Document'
                      ].map(opt => {
                        const isChecked = editAllowedEdits.includes(opt);
                        return (
                          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155', cursor: 'pointer', gridColumn: opt.startsWith('Complete') ? 'span 2' : 'auto' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setEditAllowedEdits(prev => {
                                  if (opt === 'Complete (Unlock all fields)') {
                                    return ['Complete (Unlock all fields)'];
                                  } else {
                                    const filtered = prev.filter(x => x !== 'Complete (Unlock all fields)');
                                    if (filtered.includes(opt)) {
                                      const next = filtered.filter(x => x !== opt);
                                      return next.length === 0 ? ['Complete (Unlock all fields)'] : next;
                                    } else {
                                      return [...filtered, opt];
                                    }
                                  }
                                });
                              }}
                              style={{ cursor: 'pointer', accentColor: '#FF6B2B' }}
                            />
                            <span style={{ fontWeight: isChecked ? 700 : 500 }}>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ marginBottom: '25px' }}>
                    <label className="f-label" style={{ display: 'block', marginBottom: '5px' }}>Duration (Days)</label>
                    <input type="number" min="1" max="15" defaultValue={15} id="edit-duration-input" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }} />
                  </div>

                  <div className="modal-row" style={{ marginTop: '10px' }}>
                    <button onClick={() => {
                       const dur = document.getElementById('edit-duration-input').value;
                       const projSelect = document.getElementById('edit-project-select');
                       let selectedProjId = editData.project_id;
                       if (!selectedProjId && projSelect) {
                           selectedProjId = projSelect.value;
                       }
                       if (!selectedProjId) {
                           toast('Please select a project to grant edit access', 'e');
                           return;
                       }
                       editData.project_id = selectedProjId; // update the ref
                       handleConfirmEditLink(parseInt(dur), '');
                    }} className="btn-orange" style={{ borderRadius: '8px', padding: '10px' }}>Generate Link</button>
                    <button onClick={() => setShowEditModal(false)} className="btn-ghost" style={{ borderRadius: '8px', padding: '10px' }}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '25px', marginTop: '20px', padding: '16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px' }}>
                    <div style={{ color: '#166534', fontWeight: 700, marginBottom: '8px', fontSize: '13px' }}>✓ Edit link generated! Share this with the team:</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ flex: 1, background: '#fff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #bbf7d0', wordBreak: 'break-all', fontSize: '12px', color: '#15803d', fontFamily: 'monospace' }}>
                        {generatedUrl}
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText(generatedUrl); setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }}
                        style={{ padding: '10px 14px', borderRadius: '6px', background: copiedUrl ? '#166534' : '#0f1c2e', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}
                      >
                        {copiedUrl ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => setShowEditModal(false)} className="btn-ghost" style={{ borderRadius: '8px', padding: '10px', width: '100%' }}>Done</button>
                </>
              )}
            </div>
          </div>
        );
      })()}

    </>
  );
}
