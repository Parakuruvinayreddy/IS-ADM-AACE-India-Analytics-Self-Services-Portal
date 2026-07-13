import { useState, useEffect } from 'react';
import { nowIST } from '../utils/istTime';
import { fetchPublishedProjects } from '../utils/fetchWithRetry';
import { useAuthFetch } from '../hooks/useAuthFetch';

const ANIM = `
@keyframes _sqBg   { from{opacity:0} to{opacity:1} }
@keyframes _sqCard { from{opacity:0;transform:scale(0.95) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
`;

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
};

const IMPACTS = [
    { label: 'Low',      color: '#22c55e', bg: '#f0fdf4', border: '#86efac' },
    { label: 'Medium',   color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
    { label: 'High',     color: '#f97316', bg: '#fff7ed', border: '#fdba74' },
    { label: 'Critical', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
];

const EMPTY = {
    name: '', email: '', title: '',
    category: '', subCategory: '', impact: '', description: '',
    project: '', changesRequested: [],
};

let savedQueryFormState = null;


const lbl = {
    display: 'block', fontSize: '10px', fontWeight: 700, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '7px',
};

const req = { color: '#ef4444', marginLeft: '2px' };

function Field({ label, required, children, error }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={lbl}>
                {label}{required && <span style={req}>*</span>}
            </label>
            {children}
            {error && (
                <p style={{ fontSize: '10px', color: '#ef4444', marginTop: '4px', fontWeight: 600 }}>
                    {error}
                </p>
            )}
        </div>
    );
}

export default function SubmitQueryModal({ onClose }) {
    const authFetch = useAuthFetch();
    // Auto-detect logged-in user
    const savedUser = (() => { try { return JSON.parse(localStorage.getItem('adm_user') || 'null'); } catch { return null; } })();
    const [form, setForm]     = useState(() => {
        return savedQueryFormState || { ...EMPTY, name: savedUser?.name || '', email: savedUser?.email || '' };
    });
    const [step, setStep]     = useState('form'); // 'form' | 'success'
    const [touched, setTouched] = useState(false);
    
    // Remote projects state
    const [fetchedProjects, setFetchedProjects] = useState([]);
    const [projCategory, setProjCategory] = useState('All');

    useEffect(() => {
        const fn = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', fn);
        document.body.style.overflow = 'hidden';

        fetchPublishedProjects()
            .then(projects => {
                setFetchedProjects(projects);
            })
            .catch(() => {});

        return () => {
            document.removeEventListener('keydown', fn);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    const set = (k, v) => setForm(f => {
        const next = { ...f, [k]: v };
        savedQueryFormState = next;
        return next;
    });

    const handleCategoryChange = (catName) => {
        setForm(f => {
            const next = {
                ...f,
                category: catName,
                subCategory: '',
                project: '',
            };
            savedQueryFormState = next;
            return next;
        });
    };

    const handleSubCategoryChange = (subCatName) => {
        setForm(f => {
            const next = {
                ...f,
                subCategory: subCatName,
                project: '',
            };
            savedQueryFormState = next;
            return next;
        });
    };

    // When user picks a project, auto-fill description if empty or fallback
    const handleProjectPick = (title) => {
        setForm(f => {
            const next = {
                ...f,
                project: title
            };
            savedQueryFormState = next;
            return next;
        });
    };

    const hasSubOptions = !!SUB_OPTIONS[form.category];
    const isSubCategoryValid = hasSubOptions ? !!form.subCategory : true;
    
    const needsProject = 
        form.category === 'Data Issue' || 
        form.category === 'Access Request' || 
        (form.category === 'Project/Product Request' && form.subCategory === 'Change or Update the Existing Project');
    const isProjectValid = needsProject ? !!form.project : true;

    const isChangesRequestedValid = (form.category === 'Project/Product Request' && form.subCategory === 'Change or Update the Existing Project')
        ? (form.changesRequested && form.changesRequested.length > 0)
        : true;

    const isValid =
        form.name.trim() && form.email.trim() &&
        form.title.trim() && form.category &&
        isSubCategoryValid && isProjectValid && isChangesRequestedValid &&
        form.description.trim().length > 5;

    async function handleSubmit() {
        setTouched(true);
        if (!isValid) return;

        // Save to localStorage as immediate fallback / local cache
        const log = JSON.parse(localStorage.getItem('adm_queries') || '[]');
        log.unshift({ ...form, date: nowIST(), id: Date.now() });
        localStorage.setItem('adm_queries', JSON.stringify(log));

        // POST to admin backend
        const selectedProject = fetchedProjects.find(p => p.title === form.project);
        const resolvedTeamName = selectedProject?.team_name || 'Main Website';

        const subCatPart = form.subCategory ? ` | Sub-category: ${form.subCategory}` : '';
        const impactPart = form.impact ? ` | Impact: ${form.impact}` : '';
        const projectPart = form.project ? ` | Project: ${form.project}` : '';
        const changesPart = (form.changesRequested && form.changesRequested.length > 0) 
            ? ` | Changes Requested: ${form.changesRequested.join(', ')}` 
            : '';

        const payload = {
            team_name:       resolvedTeamName,
            contact_person:  form.name,
            contact_email:   form.email,
            type:            'query',
            title:           form.title,
            related_project: form.project || '',
            description: `[Category: ${form.category}${subCatPart}${impactPart}${projectPart}${changesPart}] ${form.description}`,
        };

        try {
            const res = await authFetch(`/admin/api/tickets`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload),
            });
            if (!res.ok) console.warn('[SubmitQuery] API responded with', res.status);
        } catch (err) {
            // Backend offline — graceful degradation (localStorage already saved)
            console.warn('[SubmitQuery] Backend unreachable, stored locally:', err.message);
        }

        savedQueryFormState = null;
        setStep('success');
    }

    /* ─── shared input base ─── */
    const inp = {
        width: '100%', padding: '10px 13px', borderRadius: '9px',
        border: '1.5px solid #e2e8f0', fontSize: '13px', fontFamily: 'inherit',
        outline: 'none', background: '#fafafa', boxSizing: 'border-box',
        color: '#0f172a', transition: 'border-color 0.15s, box-shadow 0.15s',
    };
    const focus = (e) => {
        e.target.style.borderColor = '#f97316';
        e.target.style.boxShadow   = '0 0 0 3px rgba(249,115,22,0.12)';
    };
    const blur  = (e) => {
        e.target.style.borderColor = '#e2e8f0';
        e.target.style.boxShadow   = 'none';
    };

    /* ─── chip renderer ─── */
    const Chips = ({ options, value, onChange, colorMap }) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            {options.map(opt => {
                const label  = typeof opt === 'string' ? opt : opt.label;
                const active = value === label;
                const cm     = colorMap?.find(c => c.label === label);
                return (
                    <button
                        key={label}
                        type="button"
                        onClick={() => onChange(active ? '' : label)}
                        style={{
                            padding: '5px 12px', borderRadius: '20px', fontSize: '11px',
                            fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                            border: `1.5px solid ${active ? (cm?.border || '#f97316') : '#e2e8f0'}`,
                            background: active ? (cm?.bg || '#fff7ed') : '#fafafa',
                            color: active ? (cm?.color || '#ea580c') : '#64748b',
                            boxShadow: active ? `0 2px 8px ${cm ? cm.border + '80' : 'rgba(249,115,22,0.18)'}` : 'none',
                        }}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '16px', background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(10px)', animation: '_sqBg 0.2s ease both',
            }}
        >
            <style>{ANIM}</style>

            <div
                style={{
                    width: '100%', maxWidth: '600px', maxHeight: '90vh',
                    borderRadius: '22px', overflow: 'hidden',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.45)',
                    animation: '_sqCard 0.26s cubic-bezier(0.25,0.46,0.45,0.94) both',
                    background: '#fff', display: 'flex', flexDirection: 'column',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div style={{
                    background: 'linear-gradient(135deg,#15263C 0%,#1b3550 100%)',
                    padding: '22px 28px 16px', position: 'relative', flexShrink: 0,
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: '14px', right: '14px',
                            width: '32px', height: '32px', borderRadius: '50%',
                            border: 'none', background: 'rgba(255,255,255,0.1)',
                            color: '#fff', cursor: 'pointer', fontSize: '18px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    >×</button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                        <div style={{
                            width: '42px', height: '42px', borderRadius: '11px',
                            background: 'rgba(249,115,22,0.18)',
                            border: '1px solid rgba(249,115,22,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                        }}>📨</div>
                        <div>
                            <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.16em', textTransform: 'uppercase', margin: 0 }}>ADM Analytics</p>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '2px 0 0', letterSpacing: '-0.01em' }}>Submit Query</h3>
                        </div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.42)', marginTop: '8px', lineHeight: 1.55, marginBottom: 0 }}>
                        Have a question, issue, or improvement idea? Fill in the form below.
                    </p>
                </div>

                {/* Orange accent bar */}
                <div style={{ height: '3px', background: 'linear-gradient(90deg,#f97316,#fb923c,transparent)', flexShrink: 0 }} />

                {/* ── Body ── */}
                {step === 'success' ? (
                    <div style={{ padding: '56px 32px', textAlign: 'center' }}>
                        <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
                        <h4 style={{ fontSize: '21px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>Query Submitted!</h4>
                        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 28px', lineHeight: 1.65 }}>
                            Thank you, <strong>{form.name || 'there'}</strong>! Your query has been received.<br />
                            The ADM Analytics team will respond to <strong>{form.email}</strong> shortly.
                        </p>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '13px 40px', borderRadius: '11px',
                                background: 'linear-gradient(135deg,#f97316,#ea580c)',
                                color: '#fff', fontWeight: 800, fontSize: '14px',
                                border: 'none', cursor: 'pointer',
                                boxShadow: '0 4px 16px rgba(249,115,22,0.38)',
                            }}
                        >Done</button>
                    </div>
                ) : (
                    <div style={{
                        padding: '24px 28px 28px', display: 'flex', flexDirection: 'column',
                        gap: '18px', overflowY: 'auto',
                    }}>

                        {/* ── Row 1: Name + Email ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <Field label="Your Name" required error={touched && !form.name.trim() ? 'Required' : ''}>
                                <input
                                    type="text" placeholder="e.g. John Smith"
                                    value={form.name} onChange={e => set('name', e.target.value)}
                                    style={inp} onFocus={focus} onBlur={blur}
                                />
                            </Field>
                            <Field label="Email Address" required error={touched && !form.email.trim() ? 'Required' : ''}>
                                <input
                                    type="email" placeholder="you@te.com"
                                    value={form.email} onChange={e => set('email', e.target.value)}
                                    style={inp} onFocus={focus} onBlur={blur}
                                />
                            </Field>
                        </div>

                        {/* ── Category ── */}
                        <Field label="Category" required error={touched && !form.category ? 'Please select a category' : ''}>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={form.category}
                                    onChange={e => handleCategoryChange(e.target.value)}
                                    style={{
                                        ...inp,
                                        appearance: 'none', paddingRight: '36px',
                                        color: form.category ? '#0f172a' : '#94a3b8',
                                        cursor: 'pointer',
                                    }}
                                    onFocus={focus} onBlur={blur}
                                >
                                    <option value="">— Select a category —</option>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <svg
                                    width="12" height="8" viewBox="0 0 12 8" fill="none"
                                    style={{
                                        position: 'absolute', right: '13px', top: '50%',
                                        transform: 'translateY(-50%)', pointerEvents: 'none',
                                    }}
                                >
                                    <path d="M1 1l5 5 5-5" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </Field>

                        {/* ── Sub-category ── */}
                        {SUB_OPTIONS[form.category] && (
                            <Field label="Sub-category" required error={touched && !form.subCategory ? 'Please select a sub-option' : ''}>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        value={form.subCategory}
                                        onChange={e => handleSubCategoryChange(e.target.value)}
                                        style={{
                                            ...inp,
                                            appearance: 'none', paddingRight: '36px',
                                            color: form.subCategory ? '#0f172a' : '#94a3b8',
                                            cursor: 'pointer',
                                        }}
                                        onFocus={focus} onBlur={blur}
                                    >
                                        <option value="">— Select a sub-option —</option>
                                        {SUB_OPTIONS[form.category].map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                    <svg
                                        width="12" height="8" viewBox="0 0 12 8" fill="none"
                                        style={{
                                            position: 'absolute', right: '13px', top: '50%',
                                            transform: 'translateY(-50%)', pointerEvents: 'none',
                                        }}
                                    >
                                        <path d="M1 1l5 5 5-5" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </Field>
                        )}

                        {/* ── Related Project ── */}
                        {needsProject && (
                            <Field label="Related Project" required error={touched && !form.project ? 'Please select a project' : ''}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {/* Category Filters */}
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        {['All', 'AI Solution', 'Data Product', 'Dashboard'].map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setProjCategory(cat)}
                                                style={{
                                                    padding: '4px 10px', borderRadius: '16px', fontSize: '10px',
                                                    fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                                                    border: `1.5px solid ${projCategory === cat ? '#f97316' : '#e2e8f0'}`,
                                                    background: projCategory === cat ? '#fff7ed' : '#fafafa',
                                                    color: projCategory === cat ? '#ea580c' : '#64748b',
                                                }}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            value={form.project}
                                            onChange={e => handleProjectPick(e.target.value)}
                                            style={{
                                                ...inp,
                                                appearance: 'none', paddingRight: '36px',
                                                color: form.project ? '#0f172a' : '#94a3b8',
                                                cursor: 'pointer',
                                            }}
                                            onFocus={focus} onBlur={blur}
                                        >
                                            <option value="">
                                                {fetchedProjects.length === 0 ? "No projects available" : "— Select a project —"}
                                            </option>
                                            {fetchedProjects
                                                .filter(p => {
                                                    if (projCategory === 'All') return true;
                                                    return p.category === projCategory;
                                                })
                                                .map(p => (
                                                <option key={p.project_id || p.title} value={p.title}>{p.title}</option>
                                            ))}
                                        </select>
                                        {/* Dropdown chevron */}
                                        <svg
                                            width="12" height="8" viewBox="0 0 12 8" fill="none"
                                            style={{
                                                position: 'absolute', right: '13px', top: '50%',
                                                transform: 'translateY(-50%)', pointerEvents: 'none',
                                            }}
                                        >
                                            <path d="M1 1l5 5 5-5" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </Field>
                        )}

                        {/* ── What to Change Checkboxes ── */}
                        {form.category === 'Project/Product Request' && form.subCategory === 'Change or Update the Existing Project' && (
                            <Field label="What do you want to change?" required error={touched && (!form.changesRequested || form.changesRequested.length === 0) ? 'Please select at least one item to change' : ''}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                                    {[
                                        { key: 'teamName', label: 'Team Name' },
                                        { key: 'teamLead', label: 'Team Lead' },
                                        { key: 'escalationNames', label: 'Escalation Names' },
                                        { key: 'projectPageUpdate', label: 'Project Page Update' },
                                        { key: 'image', label: 'Image' },
                                        { key: 'document', label: 'Document' },
                                        { key: 'complete', label: 'Complete' },
                                        { key: 'other', label: 'Other' },
                                    ].map(item => {
                                        const isChecked = (form.changesRequested || []).includes(item.label);
                                        return (
                                            <label
                                                key={item.key}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    color: isChecked ? '#ea580c' : '#334155',
                                                    cursor: 'pointer',
                                                    padding: '8px 12px',
                                                    borderRadius: '8px',
                                                    background: isChecked ? '#fff7ed' : '#fafafa',
                                                    border: `1.5px solid ${isChecked ? '#f97316' : '#e2e8f0'}`,
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => {
                                                        const current = form.changesRequested || [];
                                                        const next = current.includes(item.label)
                                                            ? current.filter(x => x !== item.label)
                                                            : [...current, item.label];
                                                        set('changesRequested', next);
                                                    }}
                                                    style={{
                                                        accentColor: '#f97316',
                                                        cursor: 'pointer',
                                                        width: '16px',
                                                        height: '16px',
                                                    }}
                                                />
                                                {item.label}
                                            </label>
                                        );
                                    })}
                                </div>
                            </Field>
                        )}

                        {/* ── Subject of Area ── */}
                        <Field label="Subject of Area" required error={touched && !form.title.trim() ? 'Required' : ''}>
                            <input
                                type="text" placeholder="e.g. Data mismatch in sales report"
                                value={form.title} onChange={e => set('title', e.target.value)}
                                style={inp} onFocus={focus} onBlur={blur}
                            />
                        </Field>

                        {/* ── Expected Impact ── */}
                        {form.category && form.category !== 'Other' && (
                            <Field label="Expected Impact">
                                <Chips
                                    options={IMPACTS.map(i => i.label)}
                                    value={form.impact}
                                    onChange={v => set('impact', v)}
                                    colorMap={IMPACTS}
                                />
                            </Field>
                        )}

                        {/* ── Description ── */}
                        <Field label="Description" required error={touched && form.description.trim().length <= 5 ? 'Please describe your query in more detail' : ''}>
                            <textarea
                                rows={4}
                                placeholder="Describe your question, issue, or idea in detail..."
                                value={form.description}
                                onChange={e => set('description', e.target.value)}
                                style={{ ...inp, resize: 'vertical', lineHeight: 1.65 }}
                                onFocus={focus} onBlur={blur}
                            />
                        </Field>

                        {/* ── Submit ── */}
                        <button
                            onClick={handleSubmit}
                            style={{
                                width: '100%', padding: '14px', borderRadius: '11px',
                                background: 'linear-gradient(135deg,#f97316,#ea580c)',
                                color: '#fff', fontWeight: 800, fontSize: '14px',
                                border: 'none', cursor: 'pointer',
                                boxShadow: '0 4px 18px rgba(249,115,22,0.38)',
                                transition: 'all 0.18s', letterSpacing: '0.03em',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 28px rgba(249,115,22,0.48)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 18px rgba(249,115,22,0.38)';
                            }}
                        >
                            Submit Query →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
