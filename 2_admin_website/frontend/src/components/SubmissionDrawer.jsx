import { useState, useEffect } from 'react';
import { DEPT_COLORS } from '../data/mockData';
import StatusBadge from './StatusBadge';
import { useToast } from '../context/ToastContext';

const API = '/admin';

const CHECKS = [
  'Team identity verified',
  'Project details complete and accurate',
  'All required files uploaded and valid',
  'No duplicate submission from this team',
  'Content approved for internal publication',
];

export default function SubmissionDrawer({ sub, onClose, onPublish, onReject, onRequestChanges }) {
  const [tab, setTab] = useState(0);
  const [checks, setChecks] = useState([false, false, false, false, false]);
  const [rejectModal, setRejectModal] = useState(false);
  const [changesModal, setChangesModal] = useState(false);
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const toast = useToast();

  const toggleCheck = (i) => setChecks(prev => prev.map((v, idx) => idx === i ? !v : v));
  const allChecked = checks.every(Boolean);
  const canPublish = allChecked && sub.status === 'Pending';
  const col = DEPT_COLORS[sub.dept] || '#3B82F6';

  // Fetch project files when Files tab is opened
  useEffect(() => {
    if (tab === 1 && sub._projectId) {
      setLoadingFiles(true);
      fetch(`${API}/api/projects/${sub._projectId}`)
        .then(r => r.json())
        .then(data => setFiles(data.files || []))
        .catch(() => setFiles([]))
        .finally(() => setLoadingFiles(false));
    }
  }, [tab, sub._projectId]);

  const handlePublish = () => {
    onPublish(sub.id);
    onClose();
  };

  const handleReject = () => {
    onReject(sub.id, reason);
    setRejectModal(false);
    onClose();
  };

  const handleChanges = () => {
    onRequestChanges(sub.id, reason);
    setChangesModal(false);
    onClose();
  };

  const isDashboard = !sub.category || sub.category === 'Dashboard';
  const linkLabel = isDashboard ? 'Dashboard Link' : 'Application Link';
  const developerLabel = isDashboard ? 'Dash Developer' : 'Application Developer';
  const ownerLabel = isDashboard ? 'Dash Owner' : 'Application Owner';
  const validatedByLabel = isDashboard ? 'Validated By' : 'Application Validated';

  const fields = [
    ['Team',               sub.team],
    ['Team Lead',          sub.lead],
    ['Function',           sub.dept],
    ['Contact Email',      sub.email],
    ['Alt Contact Email',  sub.altContact],
    ['Project Code',       sub.code],
    ['Project Status',     sub.cat],
    ['Start Date',         sub.start],
    ['End Date',           sub.end],
    [linkLabel,            sub.dashboardLink],
    ['Data Source',        sub.dataSource],
    ['Data Owner',         sub.dataOwner],
    [validatedByLabel,     sub.dataValidatedBy],
    [developerLabel,       sub.dashboardDeveloper],
    [ownerLabel,           sub.dashboardOwner],
    ['Last Validated',     sub.lastValidated],
    ['Data Developer',     sub.dataDeveloper],
    ['Business Case',      sub.businessCase],
    ['Tech Stack',         sub.techStack],
    ['Esc L1 Name',        sub.escalation1Name],
    ['Esc L1 Email',       sub.escalation1Email],
    ['Esc L2 Name',        sub.escalation2Name],
    ['Esc L2 Email',       sub.escalation2Email],
  ];

  const tabsList = sub.status === 'Pending' ? ['Project Info', 'Files', 'Validation'] : ['Project Info', 'Files'];

  return (
    <>
      <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="drawer">
          <div className="drawer-top">
            <div>
              <div className="drawer-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {sub.proj}
                {sub.category && (
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: '#fff7ed', color: '#c2410c', border: '1px solid rgba(249,115,22,0.2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {sub.category}
                    </span>
                )}
              </div>
              <div className="drawer-id">{sub.id} &bull; {sub.team}</div>
            </div>
            <button className="close-x" onClick={onClose}>✕</button>
          </div>

          <div className="tab-row">
            {tabsList.map((t, i) => (
              <button
                key={t}
                className={`tab-btn${tab === i ? ' active' : ''}`}
                onClick={() => setTab(i)}
              >{t}</button>
            ))}
          </div>

          <div className="drawer-body">
            {tab === 0 && (
              <>
                <div className="field-grid">
                  {fields.map(([label, val]) => (
                    <div key={label}>
                      <div className="f-label">{label}</div>
                      <div className="f-val">{val || '—'}</div>
                    </div>
                  ))}
                </div>
                <div className="f-label" style={{ marginBottom: 6, marginTop: 14 }}>What is it? (Description)</div>
                <div className="desc-area">{sub.desc || '—'}</div>

                {sub.tech?.length > 0 && (
                  <>
                    <div className="f-label" style={{ margin: '14px 0 8px' }}>Fields / Tech</div>
                    <div className="tag-wrap">
                      {sub.tech.map(t => <span key={t} className="tech-tag">{t}</span>)}
                    </div>
                  </>
                )}
              </>
            )}

            {tab === 1 && (
              <>
                {loadingFiles ? (
                  <div style={{ padding: '24px 0', color: '#94a3b8', fontSize: 13 }}>
                    Loading files...
                  </div>
                ) : files.length === 0 ? (
                  <div style={{ padding: '24px 0', color: '#94a3b8', fontSize: 13 }}>
                    No files uploaded for this project.
                  </div>
                ) : (
                  <>
                    {/* Images — stored in storage/images/<team>/<title>/<file> */}
                    {files.filter(f => f.file_type === 'image').map(f => (
                      <div key={f.file_id}>
                        <div className="f-label" style={{ marginBottom: 8 }}>Project Image</div>
                        <div className="banner-box" style={{ background: col + '22', color: col, overflow: 'hidden', padding: 0 }}>
                          <img
                            src={`${API}/uploads/images/${f.file_path}`}
                            alt={f.file_name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Documents — stored in storage/documents/<team>/<title>/<file> */}
                    {files.filter(f => f.file_type === 'document').length > 0 && (
                      <>
                        <div className="f-label" style={{ margin: '14px 0 8px' }}>Documents</div>
                        {files.filter(f => f.file_type === 'document').map(f => (
                          <div className="file-row" key={f.file_id}>
                            <span>📄 {f.file_name}</span>
                            <a
                              href={`${API}/uploads/documents/${f.file_path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="dl-btn"
                            >Download ↓</a>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {tab === 2 && sub.status === 'Pending' && (
              <>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>
                  Complete all checks before publishing.
                </div>
                {CHECKS.map((lbl, i) => (
                  <div
                    key={lbl}
                    className={`check-row${checks[i] ? ' on' : ''}`}
                    onClick={() => toggleCheck(i)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer', transition: 'all 0.2s', borderColor: checks[i] ? '#FF6B2B' : '#e2e8f0' }}
                  >
                    <div className={`chk${checks[i] ? ' on' : ''}`} style={{ width: '18px', height: '18px', borderRadius: '4px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: checks[i] ? '#FF6B2B' : '#fff', borderColor: checks[i] ? '#FF6B2B' : '#cbd5e1' }}>
                      {checks[i] && <span style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>✓</span>}
                    </div>
                    <span className={`chk-txt${checks[i] ? ' on' : ''}`} style={{ fontSize: '14px', color: '#475569', fontWeight: checks[i] ? '600' : '500' }}>{lbl}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="drawer-footer">
            {sub.status === 'Pending' ? (
              <>
                <button
                  className="btn-publish"
                  style={{
                    background: canPublish ? '#22C55E' : 'rgba(34,197,94,0.25)',
                    cursor: canPublish ? 'pointer' : 'not-allowed',
                  }}
                  disabled={!canPublish}
                  onClick={handlePublish}
                >PUBLISH</button>
                <button className="btn-reject" onClick={() => { setReason(''); setRejectModal(true); }}>REJECT</button>
                <button className="btn-req"    onClick={() => { setReason(''); setChangesModal(true); }}>CHANGES</button>
              </>
            ) : (
              <button 
                className="btn-publish" 
                style={{ background: '#475569', cursor: 'pointer', width: '100%', textAlign: 'center' }} 
                onClick={onClose}
              >CLOSE DETAILS</button>
            )}
          </div>
        </div>
      </div>

      {rejectModal && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setRejectModal(false)}>
          <div className="modal">
            <div className="modal-title">Reject Submission</div>
            <div className="modal-sub">Provide a reason for rejection:</div>
            <textarea rows={4} placeholder="Enter rejection reason..." value={reason} onChange={e => setReason(e.target.value)} />
            <div className="modal-row">
              <button className="btn-orange" style={{ borderRadius: 8 }} onClick={handleReject}>Confirm Reject</button>
              <button className="btn-ghost"  style={{ borderRadius: 8 }} onClick={() => setRejectModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {changesModal && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setChangesModal(false)}>
          <div className="modal">
            <div className="modal-title">Request Changes</div>
            <div className="modal-sub">Describe what changes are needed:</div>
            <textarea rows={4} placeholder="What needs to be changed..." value={reason} onChange={e => setReason(e.target.value)} />
            <div className="modal-row">
              <button className="btn-orange" style={{ borderRadius: 8 }} onClick={handleChanges}>Send Request</button>
              <button className="btn-ghost"  style={{ borderRadius: 8 }} onClick={() => setChangesModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
