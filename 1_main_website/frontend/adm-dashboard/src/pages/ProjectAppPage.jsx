import { useParams, useNavigate } from 'react-router-dom';
import { BU_DATA, PROJECT_LIST } from '../data/constants';
import Navbar from '../components/Navbar';
import { useAuthFetch } from '../hooks/useAuthFetch';
import FeedbackModal, { StarRating } from '../components/FeedbackModal';
import { useState, useEffect } from 'react';
import { fetchPublishedProjects } from '../utils/fetchWithRetry';
import { formatProjectName } from '../utils/formatProjectName';

// Small copy-to-clipboard button for emails
function CopyEmailButton({ email }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(email); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            title="Copy email"
            style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '3px 9px', borderRadius: '6px', border: '1px solid #e2e8f0',
                background: copied ? '#f0fdf4' : '#f8fafc', color: copied ? '#166534' : '#64748b',
                fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                flexShrink: 0,
            }}
        >
            {copied ? '✓ Copied' : '📋 Copy'}
        </button>
    );
}

function slugify(name) {
    if (!name) return '';
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function RequiredChangesModal({ proj, onClose }) {
    const authFetch = useAuthFetch();
    // Auto-detect logged-in user
    const savedUser = (() => { try { return JSON.parse(localStorage.getItem('adm_user') || 'null'); } catch { return null; } })();
    const [name, setName] = useState(savedUser?.name || '');
    const [email, setEmail] = useState(savedUser?.email || '');
    const [type, setType] = useState('Fix Issue');
    const [desc, setDesc] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await authFetch(`/admin/api/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_id: proj.project_id,
                    project_title: proj.name,
                    team_name: proj.team_name || proj.owner || 'Unknown',
                    user_name: name,
                    user_email: email,
                    type: 'required_changes',
                    issue_title: type,
                    change_type: type,
                    comment: desc
                })
            });
        } catch (err) {
            console.error('Failed to submit required changes', err);
        }
        setIsSubmitting(false);
        onClose();
    };

    const inp = {
        width: '100%', padding: '10px 13px', borderRadius: '9px',
        border: '1.5px solid #e2e8f0', fontSize: '13px', fontFamily: 'inherit',
        outline: 'none', background: '#fafafa', boxSizing: 'border-box',
        color: '#334155', transition: 'border-color 0.15s, box-shadow 0.15s',
    };

    const lbl = {
        display: 'block', fontSize: '12px', fontWeight: 700,
        color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '7px',
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', animation: '_fbBg 0.18s ease both' }} onClick={onClose}>
            <div style={{ width: '100%', maxWidth: '520px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.35)', animation: '_fbCard 0.24s cubic-bezier(0.25,0.46,0.45,0.94) both', background: '#fff' }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg,#15263C,#1b3550)', padding: '22px 28px 18px', position: 'relative' }}>
                    <button
                        onClick={onClose}
                        style={{ position: 'absolute', top: '16px', right: '16px', width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    >×</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🛠️</div>
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0 }}>Report an Issue / New Improvements</p>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: '2px 0 0', lineHeight: 1.2 }}>{formatProjectName(proj.name)}</h3>
                        </div>
                    </div>
                </div>
                {/* Orange bar */}
                <div style={{ height: '3px', background: 'linear-gradient(90deg,#f97316,#fb923c,transparent)' }} />

                <form onSubmit={handleSubmit} style={{ padding: '28px 32px 32px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                        <label style={lbl}>Your Name</label>
                        <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Smith" style={inp} onFocus={e => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
                    </div>
                    <div>
                        <label style={lbl}>Your Email</label>
                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@te.com" style={inp} onFocus={e => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
                    </div>
                    <div>
                        <label style={lbl}>Request Type</label>
                        <select required value={type} onChange={e => setType(e.target.value)} style={{...inp, cursor: 'pointer', appearance: 'none', background: '#fafafa url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E") no-repeat right 12px center', paddingRight: '36px'}} onFocus={e => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}>
                            <option value="Fix Issue">⚠️ Fix Issue</option>
                            <option value="Continuous Improvement">💡 Continuous Improvement</option>
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Description</label>
                        <textarea required value={desc} onChange={e => setDesc(e.target.value)} placeholder="Please describe the issue or improvement..." rows={4} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} onFocus={e => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{ width: '100%', padding: '14px', borderRadius: '11px', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', fontWeight: 800, fontSize: '14px', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(249,115,22,0.35)', transition: 'all 0.18s', letterSpacing: '0.02em', marginTop: '6px', opacity: isSubmitting ? 0.7 : 1 }}
                        onMouseEnter={e => { if(!isSubmitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(249,115,22,0.45)'; } }}
                        onMouseLeave={e => { if(!isSubmitting) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(249,115,22,0.35)'; } }}
                    >
                        {isSubmitting ? 'Sending...' : 'Send Request'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function MvpTimelineCard({ mvps }) {
    return (
        <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #e9edf3', padding: '28px', boxShadow: '0 2px 16px rgba(15,28,46,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
                <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8', margin: 0 }}>Project Versions / MVPs</p>
            </div>

            {mvps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>
                    No MVP history available.
                </div>
            ) : (
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px', paddingLeft: '8px' }}>
                    {/* Vertical timeline line */}
                    {mvps.length > 1 && (
                        <div style={{
                            position: 'absolute',
                            left: '17px',
                            top: '10px',
                            bottom: '10px',
                            width: '2px',
                            background: 'linear-gradient(to bottom, #f97316, #e2e8f0)',
                            zIndex: 1
                        }} />
                    )}

                    {mvps.map((m, idx) => (
                        <div key={m.id} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 2 }}>
                            {/* Dot */}
                            <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: idx === mvps.length - 1 ? '#f97316' : '#fff',
                                border: `3px solid ${idx === mvps.length - 1 ? '#ffedd5' : '#f97316'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: idx === mvps.length - 1 ? '0 0 8px rgba(249,115,22,0.4)' : 'none'
                            }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: idx === mvps.length - 1 ? '#fff' : '#f97316' }} />
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>{m.title}</span>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>{m.date}</span>
                                </div>
                                <p style={{ fontSize: '12.5px', color: '#475569', margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>
                                    {m.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const ALL_PROJECTS = Object.values(BU_DATA).flatMap(bu =>
    bu.projects.map(p => ({ ...p, buLabel: bu.label }))
);

function findStaticProject(slug) {
    return ALL_PROJECTS.find(p => slugify(p.name) === slug) || null;
}

// Progress milestones derived from overall %
const MILESTONES = [
    { label: 'Requirements & Scoping',   threshold: 15 },
    { label: 'Data Source Integration',  threshold: 35 },
    { label: 'Dashboard Development',    threshold: 60 },
    { label: 'Validation & QA',          threshold: 80 },
    { label: 'Stakeholder Sign-off',     threshold: 90 },
    { label: 'Production Deployment',    threshold: 100 },
];

const STATUS_META = {
    'Live':         { color: '#22c55e', bg: '#f0fdf4', dot: '#22c55e', label: 'Live' },
    'In Progress':  { color: '#3b82f6', bg: '#eff6ff', dot: '#3b82f6', label: 'In Progress' },
    'On Hold':      { color: '#f59e0b', bg: '#fffbeb', dot: '#f59e0b', label: 'On Hold' },
    'Planned':      { color: '#a855f7', bg: '#faf5ff', dot: '#a855f7', label: 'Planned' },
};

function ProjectProgressCard({ projectName, overrideProgress, overrideStatus, overrideUpdate, startDate, endDate, customMilestones, teamLead, contactEmail }) {
    const info = PROJECT_LIST.find(p => p.name === projectName);
    const progress = overrideProgress !== undefined ? overrideProgress : (info?.progress ?? 50);
    const status   = overrideStatus   ?? info?.status   ?? 'Planned';
    const update   = overrideUpdate   ?? info?.latestUpdate ?? 'No updates available.';
    const statusNormalized = (status === 'Planning' || status === 'planned' || status === 'planning') ? 'Planned' : status;
    const meta     = STATUS_META[statusNormalized] || STATUS_META['Planned'];

    const hasMilestones = (customMilestones && customMilestones.length > 0);
    const milestonesToRender = hasMilestones
        ? customMilestones.map((m, i) => ({ 
            label: m.name || m.label, 
            targetDate: m.targetDate, 
            done: progress >= ((i + 1) / customMilestones.length) * 100 
          }))
        : [];

    return (
        <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #e9edf3', padding: '28px', boxShadow: '0 2px 16px rgba(15,28,46,0.06)' }}>

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8', margin: 0 }}>Project Progress</p>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: meta.bg, color: meta.color, border: `1px solid ${meta.color}33`, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: meta.dot, display: 'inline-block' }} />
                    {meta.label}
                </span>
            </div>

            {/* Dates (if available) */}
            {(startDate || endDate) && (
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e9edf3' }}>
                    {startDate && (
                        <div>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>Start Date</span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{startDate}</span>
                        </div>
                    )}
                    {endDate && (
                        <div>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>Expected End Date</span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{endDate}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Progress bar */}
            <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Completion</span>
                    <span style={{ fontSize: '26px', fontWeight: 900, color: meta.color, lineHeight: 1 }}>{progress}<span style={{ fontSize: '14px', fontWeight: 700 }}>%</span></span>
                </div>
                <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', borderRadius: '8px',
                        width: `${progress}%`,
                        background: progress >= 100
                            ? 'linear-gradient(90deg,#22c55e,#16a34a)'
                            : `linear-gradient(90deg,${meta.color},${meta.color}bb)`,
                        boxShadow: `0 0 10px ${meta.color}44`,
                        transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                </div>
            </div>

            {/* Latest update */}
            <div style={{ background: '#f8fafc', border: '1px solid #e9edf3', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px' }}>
                <p style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Latest Update</p>
                <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.55, margin: 0, fontWeight: 500 }}>{update}</p>
            </div>

            {/* Milestone checklist */}
            {hasMilestones && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 2px' }}>Milestones</p>
                    {milestonesToRender.map(({ label, done, current, targetDate }) => {
                        return (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                                    background: done ? meta.color : current ? `${meta.color}22` : '#f1f5f9',
                                    border: `2px solid ${done ? meta.color : current ? meta.color : '#e2e8f0'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.3s',
                                }}>
                                    {done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                    {current && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: meta.color }} />}
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: done ? 600 : 500, color: done ? '#1e293b' : current ? '#475569' : '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                                    {label}
                                    {targetDate && <span style={{ fontSize: '10px', marginLeft: '8px', color: '#94a3b8' }}>({targetDate})</span>}
                                    {current && <span style={{ fontSize: '10px', marginLeft: '6px', color: meta.color, fontWeight: 700 }}>← In Progress</span>}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Planned or On Hold contact updates box */}
            {(status?.toLowerCase() === 'planned' || status?.toLowerCase() === 'planning' || status?.toLowerCase() === 'on hold' || status?.toLowerCase() === 'onhold') && (teamLead || contactEmail) && (
                <div style={{ 
                    marginTop: '20px', 
                    padding: '14px 16px', 
                    background: meta.bg, 
                    border: `1.5px dashed ${meta.color}88`, 
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    <p style={{ fontSize: '10px', fontWeight: 800, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                        📢 Project Updates Contact
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {teamLead && (
                            <p style={{ fontSize: '13px', color: '#334155', margin: 0, fontWeight: 600 }}>
                                <span style={{ color: meta.color, fontWeight: 700 }}>Team Lead:</span> {teamLead}
                            </p>
                        )}
                        {contactEmail && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <p style={{ fontSize: '13px', color: '#334155', margin: 0, fontWeight: 600 }}>
                                    <span style={{ color: meta.color, fontWeight: 700 }}>Team Lead Email:</span> {contactEmail}
                                </p>
                                <CopyEmailButton email={contactEmail} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function DashboardImageCarousel({ images }) {
    const [current, setCurrent] = useState(0);
    const hasMult = images.length > 1;
    return (
        <div style={{ position: 'relative', background: '#f1f5f9' }}>
            <img
                src={images[current]}
                alt={`Dashboard view ${current + 1}`}
                style={{ width: '100%', display: 'block', maxHeight: '520px', objectFit: 'contain', background: '#fff' }}
            />
            {hasMult && (
                <>
                    <button onClick={() => setCurrent(i => (i - 1 + images.length) % images.length)}
                        style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', color: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                    <button onClick={() => setCurrent(i => (i + 1) % images.length)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', color: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                    <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
                        {images.map((_, i) => (
                            <div key={i} onClick={() => setCurrent(i)} style={{ width: '7px', height: '7px', borderRadius: '50%', background: i === current ? '#f97316' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'background 0.2s' }} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function FeedbackSummary({ projectName, onOpenFeedback }) {
    const [fb, setFb] = useState(null);

    useEffect(() => {
        const raw = localStorage.getItem(`adm_feedback_${projectName}`);
        if (raw) {
            try { setFb(JSON.parse(raw)); } catch (e) { setFb(null); }
        } else {
            setFb(null);
        }
    }, [projectName]);

    if (!fb) {
        return (
            <button
                onClick={onOpenFeedback}
                style={{ width: '100%', padding: '14px 20px', borderRadius: '12px', background: 'linear-gradient(135deg,rgba(249,115,22,0.07),rgba(249,115,22,0.03))', border: '1.5px dashed rgba(249,115,22,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.1)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg,rgba(249,115,22,0.07),rgba(249,115,22,0.03))'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'; }}
            >
                <span style={{ fontSize: '22px' }}>💬</span>
                <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#f97316', margin: 0 }}>Leave Feedback</p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, marginTop: '2px' }}>Rate this dashboard and share suggestions</p>
                </div>
                <svg style={{ marginLeft: 'auto', color: '#f97316' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
        );
    }

    return (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e9edf3', padding: '20px', boxShadow: '0 2px 8px rgba(15,28,46,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', margin: 0 }}>Your Feedback</p>
                <button
                    onClick={onOpenFeedback}
                    style={{ fontSize: '11px', fontWeight: 700, color: '#f97316', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 0' }}
                >Edit →</button>
            </div>
            <StarRating value={fb.rating} readonly size={20} />
            {fb.comment && <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginTop: '10px', fontStyle: 'italic', background: '#fafafa', padding: '10px 12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>"{fb.comment}"</p>}
            <p style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '8px', margin: '10px 0 0' }}>Submitted by <strong style={{ color: '#94a3b8' }}>{fb.userName}</strong> · {new Date(fb.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
    );
}

export default function ProjectAppPage() {
    const { slug } = useParams();
    const navigate = useNavigate();

    // Try to find in static data first; if not found, fetch from API
    const staticMatch = findStaticProject(slug || '');
    const [proj, setProj] = useState(staticMatch || null);
    const [isLive, setIsLive] = useState(!!staticMatch);
    const [isLoading, setIsLoading] = useState(!staticMatch);
    const [notFound, setNotFound] = useState(false);

    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackKey, setFeedbackKey] = useState(0);
    const [showReqChanges, setShowReqChanges] = useState(false);
    const [mvps, setMvps] = useState([]);

    useEffect(() => {
        if (!proj) return;
        const generated = [];

        // 1. Initial Kick-off / Start MVP
        if (proj.startDate) {
            let desc = 'Project initiated and development phase started.';
            if (proj.dashboardDeveloper) {
                desc += ` Led by Dashboard Developer: ${proj.dashboardDeveloper}.`;
            }
            generated.push({
                id: 'mvp-start',
                title: 'MVP 1 (Kick-off)',
                date: proj.startDate,
                description: desc
            });
        }

        // 2. Custom Milestones (auto-generated based on the milestones defined in the intake form / edit)
        const milestones = proj.milestones || [];
        if (milestones.length > 0) {
            milestones.forEach((m, index) => {
                let desc = m.name || m.label || `Milestone ${index + 1} successfully completed.`;
                if (proj.dashboardDeveloper && !desc.includes(proj.dashboardDeveloper)) {
                    desc += ` (Development by ${proj.dashboardDeveloper})`;
                }
                generated.push({
                    id: `mvp-milestone-${index + 1}`,
                    title: `MVP ${generated.length + 1} (${m.name || m.label || 'Development Milestone'})`,
                    date: m.targetDate || proj.startDate || proj.date || new Date().toISOString().split('T')[0],
                    description: desc
                });
            });
        }

        // 3. Final Release / Live MVP (calculated from overall project status, validated date, and screenshot)
        const hasLiveStatus = proj.dashboardStatus === 'Live' || proj.dashboardStatus === 'Completed' || proj.dashboardStatus === 'live' || proj.dashboardStatus === 'completed';
        const hasPreview = proj.dashboardImage || (proj.dashboardImages && proj.dashboardImages.length > 0);
        
        if (hasLiveStatus || proj.lastValidateDate || hasPreview || proj.dashboardUrl || proj.dashboardOwner) {
            const liveDate = proj.lastValidateDate || proj.endDate || proj.date || new Date().toISOString().split('T')[0];
            let desc = 'Final dashboard version released to production.';
            if (hasPreview) {
                desc += ' Dashboard preview images successfully uploaded and validated.';
            }
            if (proj.lastValidateDeveloper) {
                desc += ` Data validated by ${proj.lastValidateDeveloper}.`;
            }
            if (proj.dashboardOwner) {
                desc += ` Managed by Dashboard Owner: ${proj.dashboardOwner}.`;
            }
            if (proj.dashboardUrl) {
                desc += ` Access link: ${proj.dashboardUrl}.`;
            }
            
            generated.push({
                id: 'mvp-final',
                title: `MVP ${generated.length + 1} (Live & Validated)`,
                date: liveDate,
                description: desc
            });
        }

        // Fallback in case no milestone information, start date, or live status is available
        if (generated.length === 0) {
            let desc = 'Initial project planning and scoping phase.';
            if (proj.dashboardDeveloper) {
                desc += ` Dashboard Developer: ${proj.dashboardDeveloper}.`;
            }
            generated.push({
                id: 'mvp-default-1',
                title: 'MVP 1 (Planning)',
                date: proj.date || new Date().toISOString().split('T')[0],
                description: desc
            });
        }

        setMvps(generated);
    }, [proj]);


    useEffect(() => {
        if (staticMatch) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;
        const loadProjectData = (showLoading = false) => {
            if (showLoading) {
                setIsLoading(true);
                setNotFound(false);
            }
            fetchPublishedProjects()
                .then(projects => {
                    if (!isMounted) return;
                    const match = projects.find(pub => slugify(pub.title) === slug || slugify(formatProjectName(pub.title)) === slug);
                    if (!match) {
                        if (showLoading) {
                            setIsLoading(false);
                            setNotFound(true);
                        }
                        return;
                    }

                    // Build image URLs for the carousel
                    const imageUrls = (match.images || []).map(
                        f => `/admin/uploads/images/${f.file_path}`
                    );
                    if (!imageUrls.length && match.image_path) {
                        imageUrls.push(`/admin/uploads/images/${match.image_path}`);
                    }

                    // Build document list for Documentation section
                    const docFiles = (match.documents || []).map(f => ({
                        label:    f.file_name,
                        href:     `/admin/uploads/documents/${f.file_path}`,
                        live:     true,
                    }));

                    setProj({
                        project_id:            match.project_id,
                        name:                  match.title,
                        buLabel:               match.function,
                        description:           match.description,
                        shortDesc:             match.description,
                        team_name:             match.team_name,
                        whyWeUseIt:            match.why_we_use_it || '',
                        whoManagesIt:          match.who_manages_it || '',
                        owner:                 match.data_owner || '',
                        teamLead:              match.team_lead || match.contact_person || match.team_name,
                        contactEmail:          match.contact_email || '',
                        altContact:            match.alt_contact || '',
                        dashboardOwner:        match.dashboard_owner || '',
                        dashboardDeveloper:    match.dashboard_developer || '',
                        dataDeveloper:         match.data_developer || '',
                        lastValidateDeveloper: match.data_validated_by || '',
                        lastValidateDate:      match.last_validated || '',
                        source:                match.data_source || '',
                        escalation1Name:       match.escalation1_name || '',
                        escalation1Email:      match.escalation1_email || '',
                        escalation2Name:       match.escalation2_name || '',
                        escalation2Email:      match.escalation2_email || '',
                        date:                  match.published_at,
                        dashboardStatus:       match.project_status || 'Live',
                        type:                  match.category || 'Analytics',
                        progress:              (() => {
                            const statusLower = (match.project_status || '').toLowerCase();
                            if (statusLower === 'in progress') {
                                const msCount = match.milestones ? JSON.parse(match.milestones).length : 0;
                                if (msCount > 0 && msCount <= 2) return 40;
                                if (msCount >= 4 && msCount <= 5) return 75;
                                if (msCount >= 7) return 90;
                                if (msCount === 3) return 60;
                                if (msCount === 6) return 85;
                                return 20; // default for 0
                            }
                            if (statusLower === 'planned' || statusLower === 'planning') return 0;
                            if (statusLower === 'on hold' || statusLower === 'onhold') return 50;
                            return 100; // Live or Completed
                        })(),
                        dashboardUrl:          match.dashboard_link || '',
                        drillDown:             match.drill_down || '',
                        startDate:             match.start_date || '',
                        endDate:               match.end_date || '',
                        milestones:            match.milestones ? JSON.parse(match.milestones) : [],
                        dashboardImages:       imageUrls.length ? imageUrls : null,
                        dashboardImage:        imageUrls[0] || null,
                        uploadedDocs:          docFiles,
                        fieldsSelected:        match.fields_selected || '',
                    });
                    setIsLive(true);
                    setIsLoading(false);
                    setNotFound(false);
                })
                .catch(() => {
                    if (isMounted && showLoading) {
                        setIsLoading(false);
                        setNotFound(true);
                    }
                });
        };

        loadProjectData(true);

        const interval = setInterval(() => {
            loadProjectData(false);
        }, 60000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', flexDirection: 'column', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTop: '3px solid #f97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Loading project details...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (notFound || !proj) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', flexDirection: 'column', gap: '24px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fff7ed', border: '2px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>🔍</div>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Project Not Found</h2>
                    <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 500, margin: 0 }}>The project you're looking for doesn't exist or the backend service is not running.</p>
                </div>
                <button
                    onClick={() => navigate('/')}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#f97316,#ea580c)', border: 'none', cursor: 'pointer', padding: '12px 28px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(249,115,22,0.3)', transition: 'all 0.2s', letterSpacing: '0.01em' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(249,115,22,0.42)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(249,115,22,0.3)'; }}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                    Back to Home
                </button>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const title = formatProjectName(proj.name);

    function handleFeedbackClose() {
        setShowFeedback(false);
        setFeedbackKey(k => k + 1);
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
            <Navbar />

            {/* ── Top header bar with back button ── */}
            <div style={{ background: 'linear-gradient(135deg,#15263C,#1b3550)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '58px', boxShadow: '0 2px 12px rgba(15,28,46,0.18)' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', padding: '9px 18px', borderRadius: '8px', transition: 'all 0.18s', letterSpacing: '0.01em' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.25)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.45)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Back to Home
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{proj.buLabel} · {title}</span>
                    <button
                        onClick={() => setShowFeedback(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#f97316', background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', cursor: 'pointer', padding: '7px 14px', borderRadius: '8px', transition: 'all 0.18s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.22)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.12)'; }}
                    >
                        💬 Feedback
                    </button>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div style={{ padding: '0 20px 80px' }}>

                {/* ── Back to Home button ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 0 18px', borderBottom: '1px solid #e9edf3', marginBottom: '28px' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', background: '#f97316', border: 'none', cursor: 'pointer', padding: '10px 20px', borderRadius: '9px', transition: 'all 0.18s', boxShadow: '0 3px 12px rgba(249,115,22,0.3)', letterSpacing: '0.01em' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#ea580c'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(249,115,22,0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f97316'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 12px rgba(249,115,22,0.3)'; }}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                        Back to Home
                    </button>
                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>{proj.buLabel} &rsaquo; {title}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '24px', alignItems: 'start' }}>

                    {/* ════════════════════════════════
                        LEFT COLUMN
                        ════════════════════════════════ */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                        {/* ── Dashboard Image ── */}
                        <div style={{ borderRadius: '18px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(15,28,46,0.14)', border: '1px solid #e2e8f0', position: 'relative' }}>
                            {/* ESCALATION MATRIX ICON */}
                            <div className="absolute top-3 right-4 z-50 group/esc flex items-center cursor-help">
                                <svg className="w-5 h-5 text-slate-400 hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01"/></svg>
                                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-800 text-white p-4 rounded-xl opacity-0 invisible group-hover/esc:opacity-100 group-hover/esc:visible transition-all z-50 text-xs shadow-2xl pointer-events-none border border-slate-700">
                                    <h4 className="text-orange-400 font-bold mb-3 uppercase tracking-widest text-[10px]">Escalation Matrix</h4>
                                    <div className="mb-3">
                                        <p className="font-bold border-b border-slate-700 pb-1 mb-1.5 uppercase tracking-wider text-[10px]">Level 1 — First Point</p>
                                        <p className="text-slate-200 font-semibold">{proj.escalation1Name || 'Not Provided'}</p>
                                        <p className="text-slate-400">{proj.escalation1Email || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="font-bold border-b border-slate-700 pb-1 mb-1.5 uppercase tracking-wider text-[10px]">Level 2 — Second Point</p>
                                        <p className="text-slate-200 font-semibold">{proj.escalation2Name || 'Not Provided'}</p>
                                        <p className="text-slate-400">{proj.escalation2Email || '—'}</p>
                                    </div>
                                </div>
                            </div>
                            {/* Browser bar */}
                            <div style={{ background: '#1e293b', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {['#ef4444','#f59e0b','#22c55e'].map(c => (
                                        <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />
                                    ))}
                                </div>
                                <div style={{ flex: 1, background: '#0f172a', borderRadius: '5px', height: '22px', display: 'flex', alignItems: 'center', paddingLeft: '10px' }}>
                                    <span style={{ fontSize: '10px', color: '#475569', fontFamily: 'monospace' }}>insights.connect.te.com · ADM Dashboard</span>
                                </div>
                            </div>

                            {/* Real dashboard screenshot with optional carousel */}
                            {(() => {
                                const imgs = proj.dashboardImages || (proj.dashboardImage ? [proj.dashboardImage] : null);
                                if (imgs && imgs.length > 0) {
                                    return <DashboardImageCarousel images={imgs} />;
                                }
                                return (
                                    <div style={{ background: 'linear-gradient(150deg,#0c1829,#0f2035,#14294a)', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px', minHeight: '440px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>No preview available</div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* ── Project Progress Card ── */}
                        <ProjectProgressCard
                            projectName={proj.name}
                            overrideProgress={proj.progress !== undefined ? proj.progress : undefined}
                            overrideStatus={proj.dashboardStatus}
                            overrideUpdate={(() => {
                                if (proj.dashboardStatus === 'Live' || proj.dashboardStatus === 'Completed') {
                                    return 'Published via ADM Platform.';
                                }
                                const progress = proj.progress ?? 50;
                                const milestones = proj.milestones || [];
                                if (milestones.length > 0) {
                                    const milestonesToRender = milestones.map((m, i) => ({ 
                                        label: m.name || m.label, 
                                        targetDate: m.targetDate, 
                                        done: progress >= ((i + 1) / milestones.length) * 100 
                                    }));
                                    const current = milestonesToRender.find(m => !m.done);
                                    if (current) {
                                        return `Working on: ${current.label}${current.targetDate ? ` (Target: ${current.targetDate})` : ''}`;
                                    }
                                    const lastDone = [...milestonesToRender].reverse().find(m => m.done);
                                    if (lastDone) {
                                        return `Completed milestone: ${lastDone.label}`;
                                    }
                                }
                                if (proj.dashboardStatus === 'In Progress') {
                                    return 'Development and integration phase in progress.';
                                }
                                if (proj.dashboardStatus === 'On Hold') {
                                    return 'Project temporarily on hold.';
                                }
                                if (proj.dashboardStatus === 'Planned' || proj.dashboardStatus === 'Planning') {
                                    return 'Project in planning and scoping phase.';
                                }
                                return 'No updates available.';
                            })()}
                            startDate={proj.startDate}
                            endDate={proj.endDate}
                            customMilestones={proj.milestones}
                            teamLead={proj.teamLead}
                            contactEmail={proj.contactEmail}
                        />

                        {/* ── Dashboard info below image ── */}
                        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e9edf3', padding: '32px' }}>
                            <p style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ea580c', marginBottom: '16px' }}>About this Dashboard</p>
    
                            <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.6, marginBottom: '32px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                {proj.description || (
                                    <>This is the <strong style={{ color: '#1e293b' }}>{title}</strong> dashboard — a <strong style={{ color: '#1e293b' }}>{proj.type}</strong> solution designed for the <strong style={{ color: '#1e293b' }}>{proj.buLabel}</strong> business unit. It consolidates critical KPIs, monitors pipeline health, and surfaces validated insights from <strong style={{ color: '#1e293b' }}>{proj.source}</strong> to support data-driven decisions across the organisation.</>
                                )}
                            </p>

                            <p style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '16px' }}>Documentation</p>

                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {/* If uploaded docs exist, show them. Otherwise show static coming-soon list */}
                                {(proj.uploadedDocs && proj.uploadedDocs.length > 0)
                                    ? proj.uploadedDocs.map(({ label, href }, index) => {
                                        const ext = label.includes('.') ? label.split('.').pop() : 'pdf';
                                        const safeTitle = title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '_') : 'project';
                                        const baseName = `${safeTitle}_document`;
                                        const displayName = proj.uploadedDocs.length > 1 ? `${baseName}_${index + 1}.${ext}` : `${baseName}.${ext}`;
                                        return (
                                        <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
                                            <a href={href} target="_blank" rel="noopener noreferrer"
                                                style={{ fontSize: '14px', fontWeight: 600, color: '#3b82f6', cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '16px' }}>📄</span> {displayName}
                                            </a>
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#22c55e', background: '#f0fdf4', padding: '3px 10px', borderRadius: '20px', border: '1px solid #bbf7d0' }}>Download</span>
                                        </div>
                                    )})
                                    : [
                                        { label: 'User Guide & Overview', href: proj.docPath || '#', live: !!proj.docPath },
                                        { label: 'Data Dictionary', href: '#', live: false },
                                        { label: 'KPI & Business Logic Definitions', href: '#', live: false },
                                        { label: 'Data Source Mapping', href: '#', live: false },
                                        { label: 'Release Notes', href: '#', live: false },
                                    ].map(({ label, href, live }) => (
                                        <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid transparent' }}>
                                            <a href={live ? href : '#'} target={live ? '_blank' : undefined} rel="noopener noreferrer" style={{ fontSize: '14px', fontWeight: live ? 600 : 500, color: live ? '#3b82f6' : '#94a3b8', cursor: live ? 'pointer' : 'default', textDecoration: 'none' }}>{label}</a>
                                            <span style={{ fontSize: '12px', fontWeight: 500, color: '#cbd5e1' }}>{live ? 'Available' : 'Coming soon'}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>

                    {/* ════════════════════════════════
                        RIGHT COLUMN
                        ════════════════════════════════ */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '80px' }}>

                        {/* ── What / Why section ── */}
                        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e9edf3', padding: '28px', boxShadow: '0 2px 12px rgba(15,28,46,0.05)' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: '#fff7ed', color: '#c2410c', border: '1px solid rgba(249,115,22,0.2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{proj.type}</span>
                                <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: '#f0fdf4', color: '#166534', border: '1px solid rgba(22,163,74,0.2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{proj.buLabel}</span>
                                {(() => {
                                    const st = proj.dashboardStatus || 'Planned';
                                    let badge = { bg: 'rgba(168,85,247,0.08)', color: '#a855f7', border: 'rgba(168,85,247,0.18)', text: '● Planned' };
                                    if (st === 'Live' || st === 'Completed') {
                                        badge = { bg: 'rgba(34,197,94,0.08)', color: '#16a34a', border: 'rgba(34,197,94,0.18)', text: '● Live' };
                                    } else if (st === 'In Progress') {
                                        badge = { bg: 'rgba(59,130,246,0.08)', color: '#3b82f6', border: 'rgba(59,130,246,0.18)', text: '● In Progress' };
                                    } else if (st === 'On Hold') {
                                        badge = { bg: 'rgba(245,158,11,0.08)', color: '#d97706', border: 'rgba(245,158,11,0.18)', text: '● On Hold' };
                                    }
                                    return (
                                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                            {badge.text}
                                        </span>
                                    );
                                })()}
                            </div>

                            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '20px' }}>{title}</h1>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ padding: '14px', background: '#fafafa', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                    <p style={{ fontSize: '10px', fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '5px' }}>What is it?</p>
                                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.65, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                        {proj.description
                                            ? proj.description
                                            : <><strong style={{ color: '#1e293b' }}>{proj.type}</strong> dashboard that centralises and visualises key performance indicators for the <strong style={{ color: '#1e293b' }}>{proj.buLabel}</strong> function.</>
                                        }
                                    </p>
                                </div>

                            </div>
                        </div>

                        {/* ── Feedback Widget and Required Changes ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <FeedbackSummary
                                key={feedbackKey}
                                projectName={proj.name}
                                onOpenFeedback={() => setShowFeedback(true)}
                            />
                            
                            {/* Required Changes Button */}
                            <button
                                onClick={() => setShowReqChanges(true)}
                                style={{ padding: '14px 20px', borderRadius: '12px', background: '#fff', border: '1.5px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.18s', textAlign: 'left' }}
                                className="hover:border-blue-400 hover:shadow-sm hover:text-blue-600 transition-colors group/req"
                            >
                                <span style={{ fontSize: '22px' }}>🛠️</span>
                                <div>
                                    <p style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: '#334155' }} className="group-hover/req:text-blue-600 transition-colors">Report an Issue / New Improvements</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, marginTop: '2px' }}>Log issues & ideas</p>
                                </div>
                                <svg style={{ marginLeft: 'auto', color: '#94a3b8' }} className="group-hover/req:text-blue-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                            </button>
                        </div>

                        {/* ── Two buttons side by side ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <a href={proj.dashboardUrl || '#'} target={proj.dashboardUrl?'_blank':'_self'} rel="noopener noreferrer"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#f97316,#ea580c)', textDecoration: 'none', boxShadow: '0 4px 16px rgba(249,115,22,0.3)', transition: 'all 0.2s', textAlign: 'center' }}
                                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(249,115,22,0.42)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(249,115,22,0.3)'; }}
                            >
                                Open Dashboard
                            </a>
                            <button onClick={() => navigate(`/iam-access?project=${encodeURIComponent(proj.name)}`)}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, color: '#334155', background: '#fff', border: '1.5px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor='#f97316'; e.currentTarget.style.color='#ea580c'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#334155'; }}>
                                Request Access
                            </button>
                        </div>

                        {/* ── Remaining info ── */}
                        {(() => {
                            const details = [
                                { label: 'Data Source',          value: proj.source },
                                { label: 'Data Owner',           value: proj.owner },
                                { label: 'Data Developer',       value: proj.dataDeveloper },
                                { label: 'Data Validated By',    value: proj.lastValidateDeveloper },
                                { label: 'Dashboard Developer',  value: proj.dashboardDeveloper },
                                { label: 'Dashboard Owner',      value: proj.dashboardOwner },
                                { label: 'Last Validated',       value: (() => {
                                    if (!proj.lastValidateDate) return '';
                                    const d = new Date(proj.lastValidateDate);
                                    const dateStr = isNaN(d.getTime()) ? proj.lastValidateDate : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                    if (proj.drillDown) {
                                        return `${dateStr} (${proj.drillDown} Validated)`;
                                    }
                                    return dateStr;
                                })() },
                            ];

                            const filteredDetails = details.filter(item => !!item.value);

                            if (filteredDetails.length === 0) return null;

                            return (
                                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e9edf3', padding: '12px 0' }}>
                                    {filteredDetails.map(({ label, value }, i, arr) => (
                                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: i < arr.length - 1 ? '1px solid #f8fafc' : 'none', position: 'relative' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                                            <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', maxWidth: '55%', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* ── MVP Timeline Card ── */}
                        <MvpTimelineCard
                            mvps={mvps}
                        />
                    </div>
                </div>
            </div>

            {/* ── Feedback Modal ── */}
            {showFeedback && (
                <FeedbackModal
                    projectName={proj.name}
                    teamName={proj.team_name || proj.owner || 'Unknown'}
                    contactEmail={proj.contactEmail || ''}
                    onClose={handleFeedbackClose}
                    existingFeedback={(() => {
                        try { return JSON.parse(localStorage.getItem(`adm_feedback_${proj.name}`) || 'null'); } catch { return null; }
                    })()}
                />
            )}

            {/* ── Required Changes Modal ── */}
            {showReqChanges && (
                <RequiredChangesModal
                    proj={proj}
                    onClose={() => setShowReqChanges(false)}
                />
            )}


        </div>
    );
}
