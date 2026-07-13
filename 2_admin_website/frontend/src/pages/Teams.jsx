import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const API = '/admin';

export default function Teams({ projects, tickets, teams = [], onRefetchProjects, onRefetchTeams }) {
  const [activeTeam, setActiveTeam] = useState(null);
  const [activeTab, setActiveTab] = useState('projects');
  const [teamProjects, setTeamProjects] = useState([]);
  const [teamFeedback, setTeamFeedback] = useState([]);
  const [teamRequiredChanges, setTeamRequiredChanges] = useState([]);
  const [teamTickets, setTeamTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [teamActiveTokens, setTeamActiveTokens] = useState([]);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [editFeedbackId, setEditFeedbackId] = useState(null);
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editDlEmail, setEditDlEmail] = useState('');
  const [editDuration, setEditDuration] = useState(15);
  const [editNote, setEditNote] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const toast = useToast();

  const handleDeleteTeam = async (teamName) => {
    if (!window.confirm(`Are you sure you want to delete the team "${teamName}"? This will permanently delete all projects and associated data for this team. This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${API}/api/teams/${encodeURIComponent(teamName)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete team');

      toast(`Team "${teamName}" and all its projects deleted successfully.`, 's');
      setActiveTeam(null);
      if (onRefetchProjects) onRefetchProjects();
      if (onRefetchTeams) onRefetchTeams();
    } catch (err) {
      console.error(err);
      toast(err.message, 'e');
    }
  };

  useEffect(() => {
    if (!activeTeam) return;

    fetchTeamData(activeTeam.team_name);
    const interval = setInterval(() => {
      fetchTeamData(activeTeam.team_name);
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTeam]);

  useEffect(() => {
    if (!activeTeam) {
      setTeamTickets([]);
      return;
    }
    const teamName = activeTeam.team_name;
    const teamProjectTitles = teamProjects.map(p => (p.title || '').toLowerCase());
    const matchedTickets = (Array.isArray(tickets) ? tickets : []).filter(t => {
      // Direct team_name match
      if ((t.team_name || '').toLowerCase() === teamName.toLowerCase()) return true;
      // Check if the ticket references one of this team's projects
      const desc = (t.description || '').toLowerCase();
      return teamProjectTitles.some(title => title && desc.includes(title));
    });
    setTeamTickets(matchedTickets);
  }, [tickets, teamProjects, activeTeam]);

  const fetchTeamData = async (teamName) => {
    try {
      // Fetch team projects
      const projRes = await fetch(`${API}/api/teams/${encodeURIComponent(teamName)}/projects`);
      const projData = await projRes.json();
      setTeamProjects(projData);

      // Fetch feedback & required changes
      const feedRes = await fetch(`${API}/api/feedback?team_name=${encodeURIComponent(teamName)}`);
      const feedData = await feedRes.json();

      setTeamFeedback(feedData.filter(f => f.type !== 'required_changes'));
      setTeamRequiredChanges(feedData.filter(f => f.type === 'required_changes'));

      // Fetch active tokens
      const tokenRes = await fetch(`${API}/api/teams/${encodeURIComponent(teamName)}/active-tokens`);
      const tokenData = await tokenRes.json();
      setTeamActiveTokens(Array.isArray(tokenData) ? tokenData : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendEditLink = (project, feedbackId, contactEmail) => {
    setEditProject(project);
    setEditFeedbackId(feedbackId || null);
    setEditContactEmail(contactEmail || activeTeam?.contact_email || '');
    setEditDlEmail('');
    setEditDuration(15);
    setEditNote('');
    setGeneratedUrl('');
    setCopiedUrl(false);
    setShowEditModal(true);
  };

  const handleConfirmEditLink = async () => {
    try {
      const res = await fetch(`${API}/api/access/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: editProject.project_id,
          team_name: activeTeam.team_name,
          user_email: editContactEmail || activeTeam.contact_email || 'admin@admin.com',
          dl_email: editDlEmail,
          duration_days: editDuration,
          feedback_id: editFeedbackId,
          source: editFeedbackId ? 'required_changes' : 'admin',
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGeneratedUrl(data.intake_url);
      // Optimistically update row status in UI
      if (editFeedbackId) {
        setTeamRequiredChanges(prev => prev.map(f =>
          f.feedback_id === editFeedbackId ? { ...f, status: 'link_sent' } : f
        ));
      }
      toast('Edit link generated successfully', 's');
    } catch (err) {
      toast(err.message, 'e');
    }
  };

  const statusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'in_progress':
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'on hold': return 'bg-orange-100 text-orange-800';
      case 'planned': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'submitted': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const filteredTeams = (teams || []).filter(t => {
    const term = search.toLowerCase();
    return (t.team_name || '').toLowerCase().includes(term) ||
           (t.contact_email || '').toLowerCase().includes(term) ||
           (t.contact_person || '').toLowerCase().includes(term);
  });

  return (
    <>
      {!activeTeam ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div className="pg-title" style={{ display: 'block', margin: 0 }}>Teams Directory</div>
              <div className="pg-sub" style={{ margin: '4px 0 0' }}>Manage teams, track project submissions, active support tickets, and team feedback</div>
            </div>
            
            <div style={{ position: 'relative', width: '320px', marginLeft: 'auto' }}>
              <input
                type="text"
                placeholder="Search teams by name, lead, or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 40px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                  fontWeight: '500',
                  outline: 'none',
                  background: '#fff',
                  boxShadow: '0 2px 8px rgba(15,28,46,0.02)',
                  transition: 'all 0.15s'
                }}
              />
              <span style={{ position: 'absolute', left: '14px', top: '12px', color: '#94a3b8', fontSize: '15px' }}>🔍</span>
            </div>
          </div>

          {filteredTeams.length === 0 ? (
            <div className="card" style={{ padding: '60px 24px', textAlign: 'center', borderRadius: '16px' }}>
              <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>
                {search ? 'No teams match your search criteria.' : 'No teams found. Teams will appear here once they register.'}
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
              marginTop: '8px'
            }}>
              {filteredTeams.map((t, index) => {
                const initials = t.team_name ? t.team_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'TM';
                let hash = 0;
                for (let i = 0; i < (t.team_name || '').length; i++) {
                  hash = (t.team_name || '').charCodeAt(i) + ((hash << 5) - hash);
                }
                const hue = Math.abs(hash % 360);
                const avatarBg = `linear-gradient(135deg, hsl(${hue}, 80%, 60%) 0%, hsl(${(hue + 45) % 360}, 85%, 45%) 100%)`;

                return (
                  <div
                    key={`${t.team_name}-${index}`}
                    style={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 6px rgba(15,28,46,0.02)',
                      minHeight: '260px'
                    }}
                    onClick={() => setActiveTeam(t)}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(15,28,46,0.06)';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(15,28,46,0.02)';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: avatarBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: "'Sora', sans-serif",
                          fontWeight: 800,
                          fontSize: '16px',
                          color: '#fff',
                          boxShadow: '0 4px 12px rgba(15,28,46,0.05)'
                        }}>
                          {initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontFamily: "'Sora', sans-serif",
                            fontWeight: 800,
                            fontSize: '16px',
                            color: '#15263C',
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {t.team_name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            👤 Lead: {t.contact_person || 'Unspecified'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', fontSize: '13px', color: '#64748b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px' }}>✉️</span>
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: '500' }} title={t.contact_email}>
                            {t.contact_email || 'No email registered'}
                          </span>
                        </div>
                        {t.last_submitted && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                            <span style={{ fontSize: '12px' }}>📅</span>
                            <span>Last Active: {new Date(t.last_submitted).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Published Projects</div>
                          <div style={{ fontSize: '16px', fontWeight: '800', color: '#15263C', marginTop: '3px' }}>
                            {t.published_projects || 0} <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>/ {t.total_projects || 0} Total</span>
                          </div>
                        </div>
                        <span style={{
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          color: '#166534',
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          textTransform: 'uppercase'
                        }}>
                          Active
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-ghost"
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            transition: 'all 0.15s ease'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTeam(t);
                          }}
                        >
                          Manage Team <span>→</span>
                        </button>
                        <button
                          style={{
                            background: '#fef2f2',
                            color: '#ef4444',
                            border: '1px solid #fee2e2',
                            padding: '10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTeam(t.team_name);
                          }}
                          title="Delete Team"
                          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                onClick={() => setActiveTeam(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  color: '#64748b',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e293b'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b'; }}
              >
                ←
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: `linear-gradient(135deg, #FF6B2B 0%, #ff8b57 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 800,
                  fontSize: '15px',
                  color: '#fff',
                  boxShadow: '0 4px 10px rgba(255,107,43,0.15)'
                }}>
                  {activeTeam.team_name ? activeTeam.team_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'TM'}
                </div>
                <div>
                  <div className="pg-title" style={{ display: 'block', margin: 0, fontSize: '20px' }}>{activeTeam.team_name}</div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>✉️ {activeTeam.contact_email || 'No email'}</span>
                    {activeTeam.contact_person && <span style={{ fontSize: '12px', color: '#94a3b8' }}>&bull;</span>}
                    {activeTeam.contact_person && <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>👤 Lead: {activeTeam.contact_person}</span>}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDeleteTeam(activeTeam.team_name)}
              className="btn-red"
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(239,68,68,0.15)'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ef4444'; }}
            >
              🗑️ Delete Team
            </button>
          </div>
          
          <div className="card" style={{ padding: '24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(15,28,46,0.02)' }}>
            <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
              {[
                { id: 'projects', label: `Projects (${teamProjects.length})` },
                { id: 'tickets', label: `Tickets & Requests (${teamTickets.length + teamRequiredChanges.length})` },
                { id: 'feedback', label: `User Feedback (${teamFeedback.length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '12px 4px',
                    borderBottom: activeTab === tab.id ? '3px solid #FF6B2B' : '3px solid transparent',
                    color: activeTab === tab.id ? '#FF6B2B' : '#64748b',
                    fontWeight: activeTab === tab.id ? 800 : 600,
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontFamily: "'Sora', sans-serif",
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = '#15263C'; }}
                  onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = '#64748b'; }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div>
              {activeTab === 'projects' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {teamProjects.map(p => {
                    const isPublished = p.status?.toLowerCase() === 'published' || p.project_status?.toLowerCase() === 'published' || p.project_status?.toLowerCase() === 'live' || p.project_status?.toLowerCase() === 'in progress' || p.project_status?.toLowerCase() === 'in_progress';
                    return (
                      <div className="sub-card" key={p.project_id} style={{ padding: '22px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff' }}>
                        <div className="sub-left" style={{ minWidth: '160px' }}>
                          <div className="sub-token" style={{ color: '#FF6B2B' }}>{p.code || `PRJ-${p.project_id}`}</div>
                          <span className="dept-tag" style={{ background: '#f1f5f9', color: '#475569', marginTop: '8px', display: 'inline-block', fontWeight: 700 }}>{p.function}</span>
                          <div style={{ marginTop: '10px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.category || 'AI Solution'}</div>
                        </div>
                        <div className="sub-center" style={{ flex: 1, minWidth: 0 }}>
                          <div className="sub-proj" style={{ fontSize: '16px', fontWeight: 800, color: '#15263C', marginBottom: '8px' }}>{p.title}</div>
                          
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
                            <span style={{
                              background: isPublished ? '#ecfdf5' : '#fef3c7',
                              color: isPublished ? '#047857' : '#d97706',
                              border: `1px solid ${isPublished ? '#a7f3d0' : '#fde68a'}`,
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '4px 10px',
                              borderRadius: '20px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em'
                            }}>
                              Status: {p.project_status || 'Live'}
                            </span>
                            
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              color: '#475569',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em'
                            }}>
                              Submission: {p.status}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px', background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                            {p.data_developer && (
                              <div style={{ fontSize: '12px', color: '#475569' }}>
                                <span style={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontSize: '9px', display: 'block', letterSpacing: '0.04em', marginBottom: '2px' }}>Developer</span>
                                <strong>{p.data_developer}</strong>
                              </div>
                            )}
                            {p.tech_stack && (
                              <div style={{ fontSize: '12px', color: '#475569' }}>
                                <span style={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontSize: '9px', display: 'block', letterSpacing: '0.04em', marginBottom: '2px' }}>Tech Stack</span>
                                <strong>{p.tech_stack}</strong>
                              </div>
                            )}
                            {p.business_case && (
                              <div style={{ fontSize: '12px', color: '#475569', gridColumn: 'span 2', marginTop: '4px' }}>
                                <span style={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontSize: '9px', display: 'block', letterSpacing: '0.04em', marginBottom: '2px' }}>Business Case</span>
                                <span style={{ fontWeight: 500, lineHeight: 1.4 }}>{p.business_case}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="sub-date" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8' }}>
                            <span>📅</span> Submitted: {new Date(p.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(p.submitted_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          
                          {p.review_link && (
                            <div style={{
                              marginTop: '12px',
                              padding: '12px 16px',
                              background: 'rgba(255,107,43,0.04)',
                              border: '1px solid rgba(255,107,43,0.15)',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              justifyContent: 'space-between'
                            }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: '10px', color: '#ff6b2b', fontWeight: '800', textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em', marginBottom: '2px' }}>
                                  {p.status === 'pending_team_lead' ? '⚠️ Team Lead Approval Link (Active Session)' : '🔗 Project Edit Link (Active Session)'}
                                </span>
                                <div style={{
                                  fontSize: '12px',
                                  color: '#ff6b2b',
                                  fontFamily: 'monospace',
                                  wordBreak: 'break-all',
                                  background: '#fff',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(255,107,43,0.08)'
                                }}>
                                  {p.review_link}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(p.review_link);
                                  toast('Link copied to clipboard', 's');
                                }}
                                className="btn-ghost"
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  whiteSpace: 'nowrap',
                                  background: '#fff',
                                  borderColor: '#fed7aa',
                                  color: '#ea580c',
                                  flexShrink: 0
                                }}
                              >
                                Copy Link
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="sub-right" style={{ minWidth: '140px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => { if(!isPublished) handleSendEditLink(p); }} 
                            disabled={isPublished}
                            title={isPublished ? "Published projects require a ticket for edits." : "Generate secure intake link to let team edit draft details"}
                            style={{
                              background: isPublished ? '#f8fafc' : '#fff7ed', 
                              color: isPublished ? '#94a3b8' : '#ea580c', 
                              border: `1px solid ${isPublished ? '#e2e8f0' : '#fed7aa'}`, 
                              padding: '10px 16px',
                              borderRadius: '8px', 
                              cursor: isPublished ? 'not-allowed' : 'pointer', 
                              fontSize: '12px',
                              fontWeight: 700,
                              transition: 'all 0.2s',
                              width: '100%',
                              boxShadow: isPublished ? 'none' : '0 2px 6px rgba(234,88,12,0.08)'
                            }}>
                            Send Edit Link
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {teamProjects.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 24px', color: '#94a3b8', fontSize: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      No projects have been created by this team yet.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tickets' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Active New Project Intake Sessions */}
                  {teamActiveTokens.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', paddingLeft: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>⚡</span> Active New Submission Links ({teamActiveTokens.length})
                      </div>
                      {teamActiveTokens.map(tok => (
                        <div key={tok.access_id} style={{
                          padding: '16px 20px',
                          borderRadius: '12px',
                          border: '1px solid #bfdbfe',
                          background: '#eff6ff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 800, background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                                Access ID #{tok.access_id}
                              </span>
                              {tok.ticket_id && (
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#1e40af' }}>
                                  Ref Ticket: #{tok.ticket_id}
                                </span>
                              )}
                              <span style={{ fontSize: '11px', color: '#64748b' }}>
                                Expires: {new Date(tok.expires_at).toLocaleString()}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: 600, marginBottom: '6px' }}>
                              User Email: <strong style={{ color: '#0f1c2e' }}>{tok.user_email}</strong>
                            </div>
                            <div style={{
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              wordBreak: 'break-all',
                              background: '#fff',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #bfdbfe',
                              color: '#1e40af'
                            }}>
                              {tok.intake_url}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(tok.intake_url);
                              toast('Link copied to clipboard', 's');
                            }}
                            className="btn-ghost"
                            style={{
                              padding: '8px 14px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              whiteSpace: 'nowrap',
                              background: '#fff',
                              borderColor: '#bfdbfe',
                              color: '#1e40af',
                              flexShrink: 0
                            }}
                          >
                            Copy Link
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {teamTickets.length > 0 && (
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px', paddingLeft: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🎫</span> General Queries ({teamTickets.length})
                    </div>
                  )}
                  {teamTickets.map(t => {
                    const descText = t.description || '';
                    const projMatch = descText.match(/\| Project:\s*(.+?)$/);
                    const isEditReq = !!projMatch;
                    const projName = projMatch ? projMatch[1].trim() : '';
                    return (
                      <div className="sub-card" key={`t-${t.ticket_id}`} style={{ padding: '20px 24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div className="sub-left" style={{ minWidth: '120px' }}>
                          <div className="sub-token">#{t.ticket_id}</div>
                          <span style={{
                            background: t.status === 'in_progress' ? '#eff6ff' : t.status === 'resolved' || t.status === 'done' ? '#f0fdf4' : '#fafafa',
                            color: t.status === 'in_progress' ? '#1e40af' : t.status === 'resolved' || t.status === 'done' ? '#166534' : '#64748b',
                            border: `1px solid ${t.status === 'in_progress' ? '#bfdbfe' : t.status === 'resolved' || t.status === 'done' ? '#bbf7d0' : '#e2e8f0'}`,
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '12px',
                            textTransform: 'uppercase',
                            display: 'inline-block',
                            marginTop: '6px'
                          }}>
                            {t.status?.replace('_', ' ')}
                          </span>
                          {isEditReq && (
                            <span style={{ marginTop: '6px', display: 'inline-block', fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px', background: '#fff1f2', color: '#9f1239', border: '1px solid #fecdd3', textTransform: 'uppercase', letterSpacing: '0.04em' }}>✏️ Project Edit</span>
                          )}
                        </div>
                        <div className="sub-center" style={{ flex: 1, minWidth: 0 }}>
                          <div className="sub-proj" style={{ fontSize: '15px', fontWeight: 800, color: '#15263C', marginBottom: '6px' }}>{t.title || '(No Title)'}</div>
                          {isEditReq && (
                            <div style={{ fontSize: '12px', color: '#1e40af', marginTop: '4px', marginBottom: '8px', fontWeight: 600 }}>
                              📋 Targets Project: <strong style={{ color: '#0f1c2e' }}>{projName}</strong>
                            </div>
                          )}
                          <div className="desc-area" style={{ padding: '12px 14px', margin: '4px 0 10px', fontSize: '13px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>{t.description}</div>
                          <div className="sub-date" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            📅 Submitted: {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {teamRequiredChanges.length > 0 && (
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '16px', paddingLeft: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>✏️</span> Project Edit Requests ({teamRequiredChanges.length})
                    </div>
                  )}
                  {teamRequiredChanges.map(f => {
                    const st = (f.status || 'pending').toLowerCase();
                    const statusBadgeStyle = (s) => {
                      if (s === 'approved') return { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' };
                      if (s === 'link_sent') return { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' };
                      if (s === 'resubmitted') return { bg: '#faf5ff', color: '#6b21a8', border: '#e9d5ff' };
                      return { bg: '#fafafa', color: '#64748b', border: '#e2e8f0' }; // pending
                    };
                    const sb = statusBadgeStyle(st);
                    const changeTypeBadge = (ct) => {
                      if (!ct) return null;
                      const map = {
                        'Fix Issue': { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
                        'Continuous Improvement': { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
                        'New Feature': { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
                      };
                      const m = map[ct] || { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
                      return <span style={{ fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px', background: m.bg, color: m.color, border: `1px solid ${m.border}`, textTransform: 'uppercase' }}>{ct}</span>;
                    };
                    return (
                      <div className="sub-card" key={`f-${f.feedback_id}`} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '14px', padding: '22px 24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                              <div className="sub-token" style={{ margin: 0 }}>#{f.feedback_id}</div>
                              <span style={{ fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px', background: sb.bg, color: sb.color, border: `1px solid ${sb.border}`, textTransform: 'uppercase' }}>{st.replace('_', ' ')}</span>
                              {changeTypeBadge(f.change_type || f.issue_title)}
                            </div>
                            <div className="sub-proj" style={{ fontSize: '15px', fontWeight: 800, color: '#15263C', marginBottom: '4px' }}>{f.issue_title}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Targets Project: <strong style={{ color: '#0f1c2e' }}>{f.project_name || f.project_title}</strong></div>
                            <div className="desc-area" style={{ padding: '12px 14px', margin: '4px 0 10px', fontSize: '13px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>{f.comment}</div>
                            <div className="sub-date">📅 Submitted: {new Date(f.submitted_at).toLocaleDateString()}</div>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, minWidth: '130px' }}>
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
                                    setTeamRequiredChanges(prev => prev.map(rc =>
                                      rc.feedback_id === f.feedback_id ? { ...rc, status: 'approved' } : rc
                                    ));
                                    toast('Marked request as approved', 's');
                                  } catch { toast('Approval failed', 'e'); }
                                  setApprovingId(null);
                                }}
                                style={{ padding: '9px 14px', borderRadius: '8px', background: '#22c55e', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(34,197,94,0.2)' }}
                              >
                                {approvingId === f.feedback_id ? 'Approving…' : 'Approve Request'}
                              </button>
                            )}
                            {st === 'approved' && (
                              <button
                                onClick={() => handleSendEditLink(
                                  { project_id: f.project_id, title: f.project_name || f.project_title },
                                  f.feedback_id,
                                  f.user_email
                                )}
                                style={{ padding: '9px 14px', borderRadius: '8px', background: '#FF6B2B', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(255,107,43,0.2)' }}
                              >
                                🔗 Send Edit Link
                              </button>
                            )}
                            {(st === 'link_sent' || st === 'resubmitted') && (
                              <span style={{ fontSize: '11px', fontWeight: 800, color: st === 'resubmitted' ? '#6b21a8' : '#1e40af', padding: '8px 12px', borderRadius: '8px', background: st === 'resubmitted' ? '#faf5ff' : '#eff6ff', border: `1px solid ${st === 'resubmitted' ? '#e9d5ff' : '#bfdbfe'}`, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {st === 'resubmitted' ? '✅ Resubmitted' : '📨 Link Sent'}
                              </span>
                            )}
                          </div>
                        </div>
                        {st === 'resubmitted' && f.latest_changes && (
                          <div style={{ marginTop: '6px', padding: '12px 14px', background: '#faf5ff', borderRadius: '8px', border: '1px solid #f3e8ff', fontSize: '13px', color: '#5b21b6' }}>
                            <strong style={{ color: '#4c1d95', display: 'block', marginBottom: '4px' }}>Latest Resubmission Change Logs:</strong>
                            {f.latest_changes.split('Changes: ')[1] || 'Changes submitted by user.'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {teamTickets.length === 0 && teamRequiredChanges.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 24px', color: '#94a3b8', fontSize: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      No support tickets or project edit requests found for this team.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'feedback' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {teamFeedback.map(f => (
                    <div className="sub-card" key={f.feedback_id} style={{ padding: '20px 24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div className="sub-left" style={{ minWidth: '120px' }}>
                        <div className="sub-token">#{f.feedback_id}</div>
                        <div className="sub-date" style={{ marginTop: '8px' }}>📅 {new Date(f.submitted_at).toLocaleDateString()}</div>
                      </div>
                      <div className="sub-center" style={{ flex: 1, minWidth: 0 }}>
                        <div className="sub-proj" style={{ fontSize: '15px', fontWeight: 800, color: '#15263C', marginBottom: '6px' }}>{f.project_name || f.project_title}</div>
                        <div className="desc-area" style={{ fontStyle: 'italic', padding: '12px 14px', margin: '4px 0 0', fontSize: '13px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9', color: '#475569' }}>
                          "{f.comment}"
                        </div>
                      </div>
                      <div className="sub-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', minWidth: '120px' }}>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[1,2,3,4,5].map(star => (
                            <span key={star} style={{ fontSize: 18, color: star <= f.rating ? '#f59e0b' : '#cbd5e1' }}>★</span>
                          ))}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginTop: 4 }}>
                          Rating: {f.rating} / 5
                        </div>
                      </div>
                    </div>
                  ))}
                  {teamFeedback.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 24px', color: '#94a3b8', fontSize: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      No user feedback submitted for this team's projects.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* SEND EDIT LINK MODAL */}
      {showEditModal && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && !generatedUrl && setShowEditModal(false)}>
          <div className="modal" style={{ width: '500px' }}>
            <div className="modal-title">Send Edit Link</div>
            <div className="modal-sub">Generate a secure edit link for <strong>{editProject?.title}</strong></div>
            
            <div style={{ marginBottom: '15px', marginTop: '20px' }}>
              <label className="f-label" style={{ display: 'block', marginBottom: '5px' }}>Team</label>
              <div style={{ fontWeight: 600, color: '#0f1c2e', fontSize: '14px' }}>{activeTeam?.team_name}</div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label className="f-label" style={{ display: 'block', marginBottom: '5px' }}>Send Link To (Email)</label>
              <input
                type="email"
                value={editContactEmail}
                onChange={e => setEditContactEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label className="f-label" style={{ display: 'block', marginBottom: '5px' }}>Team DL Email (Optional)</label>
              <input type="email" value={editDlEmail} onChange={e => setEditDlEmail(e.target.value)} placeholder="e.g. team-dl@company.com" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label className="f-label" style={{ display: 'block', marginBottom: '5px' }}>Duration (Days)</label>
              <input type="number" min="1" max="15" value={editDuration} onChange={e => setEditDuration(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label className="f-label" style={{ display: 'block', marginBottom: '5px' }}>Note (Optional)</label>
              <textarea rows="2" value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="Add a short message..." style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', resize: 'vertical', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}></textarea>
            </div>

            {generatedUrl && (
              <div style={{ marginBottom: '25px', padding: '16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px' }}>
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
            )}

            <div className="modal-row" style={{ marginTop: '10px' }}>
              {!generatedUrl ? (
                <>
                  <button onClick={handleConfirmEditLink} className="btn-orange" style={{ borderRadius: '8px', padding: '10px' }}>Generate Link</button>
                  <button onClick={() => setShowEditModal(false)} className="btn-ghost" style={{ borderRadius: '8px', padding: '10px' }}>Cancel</button>
                </>
              ) : (
                <button onClick={() => setShowEditModal(false)} className="btn-ghost" style={{ borderRadius: '8px', padding: '10px', width: '100%' }}>Done</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
