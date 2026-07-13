import { useState, useEffect } from 'react';
import { nowIST } from '../utils/istTime';
import { useAuthFetch } from '../hooks/useAuthFetch';

const ANIM = `
@keyframes _sgBg      { from{opacity:0}                              to{opacity:1} }
@keyframes _sgSlideIn { from{opacity:0;transform:translateX(60px)}  to{opacity:1;transform:translateX(0)} }
`;

const AREAS = [
    'Dashboard UX', 'Data Coverage', 'Performance', 'New Feature',
    'Process Improvement', 'Data Integration', 'Data Preparation',
    'Visualization', 'Data Science', 'Self Service', 'Other',
];

let savedSuggestFormState = null;

export default function SuggestModal({ onClose }) {
    const authFetch = useAuthFetch();
    // Auto-detect logged-in user
    const savedUser = (() => { try { return JSON.parse(localStorage.getItem('adm_user') || 'null'); } catch { return null; } })();
    const [form, setForm] = useState(() => {
        return savedSuggestFormState || { name: savedUser?.name || '', email: savedUser?.email || '', area: '', comments: '' };
    });
    const [step, setStep] = useState('form');
    const [touched, setTouched] = useState(false);

    useEffect(() => {
        const fn = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, [onClose]);

    const update = (k, v) => setForm(f => {
        const next = { ...f, [k]: v };
        savedSuggestFormState = next;
        return next;
    });

    async function handleSubmit() {
        setTouched(true);
        if (!form.area) return;

        // Local storage fallback / log
        const log = JSON.parse(localStorage.getItem('adm_suggestions') || '[]');
        log.unshift({ ...form, date: nowIST(), id: Date.now() });
        localStorage.setItem('adm_suggestions', JSON.stringify(log));

        // POST to admin backend
        const payload = {
            team_name:      'Main Website',
            contact_person: form.name || 'Anonymous',
            contact_email:  form.email || '',
            type:           'suggestion',
            title:          `Suggestion: ${form.area}`,
            description:    form.comments || '(No comments provided)',
        };

        try {
            const res = await authFetch(`/admin/api/tickets`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload),
            });
            if (!res.ok) console.warn('[SuggestModal] API responded with', res.status);
        } catch (err) {
            console.warn('[SuggestModal] Backend unreachable, stored locally:', err.message);
        }

        savedSuggestFormState = null;
        setStep('success');
    }

    const inp = {
        width: '100%', padding: '10px 13px', borderRadius: '9px',
        border: '1.5px solid #e2e8f0', fontSize: '13px', fontFamily: 'inherit',
        outline: 'none', background: '#fafafa', boxSizing: 'border-box',
        color: '#334155', transition: 'border-color 0.15s, box-shadow 0.15s',
    };

    const lbl = {
        display: 'block', fontSize: '11px', fontWeight: 700,
        color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px',
    };

    return (
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingTop: '64px', paddingRight: '16px', background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(6px)', animation: '_sgBg 0.18s ease both' }}
        >
            <style>{ANIM}</style>
            <div
                style={{ width: '100%', maxWidth: '480px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.28)', animation: '_sgSlideIn 0.22s cubic-bezier(0.25,0.46,0.45,0.94) both', background: '#fff', maxHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg,#15263C,#1b3550)', padding: '22px 28px 18px', position: 'relative', flexShrink: 0 }}>
                    <button onClick={onClose}
                        style={{ position: 'absolute', top: '16px', right: '16px', width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    >×</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(249,115,22,0.18)', border: '1px solid rgba(249,115,22,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>💡</div>
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0 }}>ADM Analytics</p>
                            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: '2px 0 0' }}>Submit a Suggestion</h3>
                        </div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '8px', lineHeight: 1.5, marginBottom: 0 }}>
                        Have an idea to improve ADM Analytics? We review every suggestion.
                    </p>
                </div>
                <div style={{ height: '3px', background: 'linear-gradient(90deg,#f97316,#fb923c,transparent)', flexShrink: 0 }} />

                {step === 'success' ? (
                    <div style={{ padding: '52px 32px', textAlign: 'center', flex: 1 }}>
                        <div style={{ fontSize: '52px', marginBottom: '16px' }}>🚀</div>
                        <h4 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Suggestion Received!</h4>
                        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 8px', lineHeight: 1.6 }}>
                            Thanks, <strong>{form.name || 'there'}</strong>! We love hearing ideas from our users.
                        </p>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 24px' }}>Your suggestion has been logged for the ADM Analytics team to review.</p>
                        <button onClick={onClose}
                            style={{ padding: '12px 36px', borderRadius: '10px', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(249,115,22,0.35)' }}
                        >Done</button>
                    </div>
                ) : (
                    <div style={{ padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>

                        {/* Your Name */}
                        <div>
                            <label style={lbl}>Your Name</label>
                            <input type="text" placeholder="e.g. Jane Doe" value={form.name} onChange={e => update('name', e.target.value)}
                                style={inp}
                                onFocus={e => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }}
                                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
                        </div>

                        {/* Email */}
                        <div>
                            <label style={lbl}>Email</label>
                            <input type="email" placeholder="you@te.com" value={form.email} onChange={e => update('email', e.target.value)}
                                style={inp}
                                onFocus={e => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }}
                                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
                        </div>

                        {/* Area */}
                        <div>
                            <label style={lbl}>
                                Area <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                                {AREAS.map(a => (
                                    <button key={a} type="button" onClick={() => update('area', form.area === a ? '' : a)}
                                        style={{
                                            padding: '5px 13px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                                            border: `1.5px solid ${form.area === a ? '#f97316' : '#e2e8f0'}`,
                                            background: form.area === a ? '#fff7ed' : '#fafafa',
                                            color: form.area === a ? '#ea580c' : '#64748b',
                                            cursor: 'pointer', transition: 'all 0.15s',
                                            boxShadow: form.area === a ? '0 2px 8px rgba(249,115,22,0.18)' : 'none',
                                        }}
                                    >{a}</button>
                                ))}
                            </div>
                            {touched && !form.area && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '5px' }}>Please select an area</p>}
                        </div>

                        {/* Comments */}
                        <div>
                            <label style={lbl}>Comments?</label>
                            <textarea
                                rows={4}
                                placeholder="Describe your suggestion or idea..."
                                value={form.comments}
                                onChange={e => update('comments', e.target.value)}
                                style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
                                onFocus={e => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }}
                                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>

                        {/* Submit */}
                        <button onClick={handleSubmit}
                            style={{ width: '100%', padding: '14px', borderRadius: '11px', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', fontWeight: 800, fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(249,115,22,0.35)', transition: 'all 0.18s', letterSpacing: '0.02em' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(249,115,22,0.45)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(249,115,22,0.35)'; }}
                        >
                            Submit Suggestion
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
