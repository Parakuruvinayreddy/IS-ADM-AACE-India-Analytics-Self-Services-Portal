import { useState, useEffect } from 'react';
import { nowIST } from '../utils/istTime';
import { useAuthFetch } from '../hooks/useAuthFetch';

const ANIM = `
@keyframes _wfBg      { from{opacity:0}                              to{opacity:1} }
@keyframes _wfSlideIn { from{opacity:0;transform:translateX(60px)}  to{opacity:1;transform:translateX(0)} }
@keyframes _wfSlide   { from{opacity:0;transform:translateY(20px)}  to{opacity:1;transform:translateY(0)} }
`;

const ASPECTS = [
    { id: 'navigation', label: '🧭 Navigation', q: 'Was it easy to find what you needed?' },
    { id: 'visuals',    label: '🎨 Design & Visuals', q: 'How did you find the look and feel?' },
    { id: 'speed',      label: '⚡ Performance', q: 'How was the loading speed?' },
    { id: 'content',    label: '📄 Content Quality', q: 'Was the information clear and useful?' },
];

const AREAS = [
    'Dashboard UX', 'Data Coverage', 'Performance', 'New Feature',
    'Process Improvement', 'Data Integration', 'Data Preparation',
    'Visualization', 'Data Science', 'Self Service', 'Other',
];

const STAR_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

function StarRow({ value, onChange, size = 22 }) {
    const [hovered, setHovered] = useState(0);
    const display = hovered || value;
    return (
        <div
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onMouseLeave={() => setHovered(0)}
        >
            {[1, 2, 3, 4, 5].map(star => (
                <svg key={star} width={size} height={size} viewBox="0 0 24 24"
                    fill={star <= display ? '#f97316' : 'none'}
                    stroke={star <= display ? '#f97316' : '#cbd5e1'}
                    strokeWidth="2" strokeLinejoin="round"
                    style={{
                        cursor: 'pointer',
                        filter: star <= display ? 'drop-shadow(0 0 4px rgba(249,115,22,0.4))' : 'none',
                        transition: 'fill 0.15s ease, stroke 0.15s ease',
                        willChange: 'fill, stroke',
                        pointerEvents: 'auto',
                    }}
                    onMouseEnter={() => setHovered(star)}
                    onClick={(e) => { e.stopPropagation(); onChange(star); }}
                >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            ))}
            <span style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: '#f97316', 
                marginLeft: '4px',
                width: '70px',
                display: 'inline-block',
                opacity: (hovered || value) > 0 ? 1 : 0,
                transition: 'opacity 0.15s ease',
                pointerEvents: 'none',
            }}>
                {STAR_LABELS[hovered || value] || '\u00A0'}
            </span>
        </div>
    );
}

/**
 * WebsiteFeedbackModal
 * trigger: 'timed' | 'exit' | 'logout'
 */
let savedFeedbackFormState = null;

export default function WebsiteFeedbackModal({ trigger = 'timed', onClose }) {
    const authFetch = useAuthFetch();
    // Auto-detect logged-in user
    const savedUser = (() => { try { return JSON.parse(localStorage.getItem('adm_user') || 'null'); } catch { return null; } })();

    const [step, setStep] = useState(() => savedFeedbackFormState?.step || 'form');
    const [ratings, setRatings] = useState(() => savedFeedbackFormState?.ratings || { navigation: 0, visuals: 0, speed: 0, content: 0 });
    const [overall, setOverall] = useState(() => savedFeedbackFormState?.overall || 0);
    const [comment, setComment] = useState(() => savedFeedbackFormState?.comment || '');
    const [name, setName] = useState(() => savedFeedbackFormState?.name !== undefined ? savedFeedbackFormState.name : (savedUser?.name || ''));
    const [email, setEmail] = useState(() => savedFeedbackFormState?.email !== undefined ? savedFeedbackFormState.email : (savedUser?.email || ''));
    const [area, setArea] = useState(() => savedFeedbackFormState?.area || '');
    const [touched, setTouched] = useState(() => savedFeedbackFormState?.touched || false);

    useEffect(() => {
        const fn = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, [onClose]);

    useEffect(() => {
        if (step === 'success') {
            savedFeedbackFormState = null;
        } else {
            savedFeedbackFormState = { step, ratings, overall, comment, name, email, area, touched };
        }
    }, [step, ratings, overall, comment, name, email, area, touched]);

    const TRIGGER_LABELS = {
        timed:  { emoji: '⏱️', label: "You've been exploring for a while!", sub: 'Mind sharing a quick rating?' },
        exit:   { emoji: '👋', label: 'Before you go...', sub: 'Help us improve with 30 seconds of feedback.' },
        logout: { emoji: '🔒', label: 'Thanks for using ADM Analytics!', sub: 'Rate your experience before logging out.' },
    };
    const { emoji, label, sub } = TRIGGER_LABELS[trigger] || TRIGGER_LABELS.timed;

    async function handleSubmit() {
        setTouched(true);
        if (!overall) return;

        const entry = {
            type: 'website', trigger, overall, ratings,
            comment: comment.trim(),
            userName: name.trim() || 'Anonymous',
            userEmail: email.trim(),
            area,
            date: nowIST(),
        };

        const key = 'adm_website_feedback';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.unshift(entry);
        localStorage.setItem(key, JSON.stringify(existing));
        localStorage.setItem('adm_website_feedback_shown', Date.now().toString());

        // POST to admin backend (tickets — for Tickets page)
        const descParts = [
            `Overall Rating: ${overall} Stars`,
            `Navigation: ${ratings.navigation || 0} | Visuals: ${ratings.visuals || 0} | Speed: ${ratings.speed || 0} | Content: ${ratings.content || 0}`,
            `Trigger: ${trigger}`,
            comment ? `\nComments:\n${comment.trim()}` : ''
        ];

        const ticketPayload = {
            team_name:      'Main Website',
            title:          area ? `Feedback: ${area}` : 'General Feedback',
            contact_person: name.trim() || 'Anonymous',
            contact_email:  email.trim(),
            type:           'feedback',
            description:    descParts.join(' | '),
        };

        try {
            const res = await authFetch(`/admin/api/tickets`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(ticketPayload),
            });
            if (!res.ok) console.warn('[WebsiteFeedbackModal] Tickets API responded with', res.status);
        } catch (err) {
            console.warn('[WebsiteFeedbackModal] Tickets backend unreachable:', err.message);
        }

        // POST to admin backend (feedback — for Feedback page)
        try {
            await authFetch(`/admin/api/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_name: 'ADM Analytics Website',
                    team_name: 'Main Website',
                    user_name: name.trim() || 'Anonymous',
                    user_email: email.trim(),
                    user_role: '',
                    rating: overall,
                    comment: (area ? `[${area}] ` : '') + (comment.trim() || `Overall: ${overall}/5`) +
                        ` | Nav: ${ratings.navigation}/5, Design: ${ratings.visuals}/5, Speed: ${ratings.speed}/5, Content: ${ratings.content}/5`,
                    type: 'website_feedback',
                }),
            });
        } catch (err) {
            console.warn('[WebsiteFeedbackModal] Feedback API unreachable:', err.message);
        }

        setStep('success');
    }

    const inp = {
        width: '100%', padding: '9px 12px', borderRadius: '8px',
        border: '1.5px solid #e2e8f0', fontSize: '12px', fontFamily: 'inherit',
        background: '#fafafa', outline: 'none', boxSizing: 'border-box',
        color: '#334155', transition: 'border-color 0.15s, box-shadow 0.15s',
    };

    const lbl = {
        display: 'block', fontSize: '10px', fontWeight: 800,
        color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '5px',
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingTop: '64px', paddingRight: '16px', pointerEvents: 'none', animation: '_wfBg 0.2s ease both' }}>
            <style>{ANIM}</style>

            {/* Backdrop */}
            <div
                style={{ position: 'fixed', inset: 0, background: 'rgba(15,28,46,0.45)', backdropFilter: 'blur(6px)', pointerEvents: 'auto' }}
            />

            {/* Card */}
            <div
                style={{ position: 'relative', width: '100%', maxWidth: '440px', maxHeight: 'calc(100vh - 80px)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.28)', animation: '_wfSlideIn 0.22s cubic-bezier(0.25,0.46,0.45,0.94) both', zIndex: 1, pointerEvents: 'auto' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg,#15263C,#1b3550)', padding: '22px 24px 16px', position: 'relative' }}>
                    <button
                        onClick={onClose}
                        style={{ position: 'absolute', top: '14px', right: '14px', width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    >×</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '24px' }}>{emoji}</span>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.2 }}>{label}</p>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: '3px 0 0' }}>{sub}</p>
                        </div>
                    </div>
                </div>
                <div style={{ height: '3px', background: 'linear-gradient(90deg,#f97316,#fb923c,transparent)' }} />

                {step === 'success' ? (
                    <div style={{ background: '#fff', padding: '36px 28px', textAlign: 'center', animation: '_wfSlide 0.2s ease both' }}>
                        <div style={{ fontSize: '44px', marginBottom: '12px' }}>🙏</div>
                        <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>Thank you!</h4>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px' }}>Your feedback helps us improve ADM Analytics.</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '20px' }}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <svg key={s} width="20" height="20" viewBox="0 0 24 24"
                                    fill={s <= overall ? '#f97316' : '#e2e8f0'}
                                    stroke={s <= overall ? '#f97316' : '#e2e8f0'}
                                    strokeWidth="2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                            ))}
                        </div>
                        <button
                            onClick={onClose}
                            style={{ padding: '10px 28px', borderRadius: '9px', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}
                        >Close</button>
                    </div>
                ) : (
                    <div style={{ background: '#fff', padding: '20px 24px 24px', overflowY: 'auto', flex: 1 }}>

                        {/* ① Your Name */}
                        <div style={{ marginBottom: '14px' }}>
                            <label style={lbl}>Your Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)}
                                placeholder="e.g. Jane Doe" style={inp}
                                onFocus={e => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }}
                                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>

                        {/* ② Email */}
                        <div style={{ marginBottom: '14px' }}>
                            <label style={lbl}>Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="you@te.com" style={inp}
                                onFocus={e => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }}
                                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>

                        {/* ③ Area */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={lbl}>Area</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {AREAS.map(a => (
                                    <button
                                        key={a} type="button"
                                        onClick={() => setArea(area === a ? '' : a)}
                                        style={{
                                            padding: '4px 11px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
                                            cursor: 'pointer', transition: 'all 0.15s',
                                            border: `1.5px solid ${area === a ? '#f97316' : '#e2e8f0'}`,
                                            background: area === a ? '#fff7ed' : '#fafafa',
                                            color: area === a ? '#ea580c' : '#64748b',
                                            boxShadow: area === a ? '0 2px 8px rgba(249,115,22,0.18)' : 'none',
                                        }}
                                    >{a}</button>
                                ))}
                            </div>
                        </div>


                        {/* Divider */}
                        <div style={{ height: '1px', background: '#f1f5f9', marginBottom: '16px' }} />

                        {/* ⑤ Overall Experience */}
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ ...lbl, color: '#64748b', fontSize: '11px' }}>
                                Overall Experience <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <StarRow value={overall} onChange={setOverall} size={26} />
                            {touched && !overall && (
                                <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '5px' }}>Please give an overall rating</p>
                            )}
                        </div>

                        {/* ⑥ Detailed Ratings */}
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ ...lbl, color: '#64748b', fontSize: '11px' }}>Detailed Ratings</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {ASPECTS.map(({ id, label: lbl2, q }) => (
                                    <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', background: '#fafafa', borderRadius: '9px', border: '1px solid #f1f5f9', contain: 'layout', isolation: 'isolate' }}>
                                        <div style={{ pointerEvents: 'none', userSelect: 'none' }}>
                                            <p style={{ fontSize: '11px', fontWeight: 700, color: '#334155', margin: 0 }}>{lbl2}</p>
                                            <p style={{ fontSize: '10px', color: '#94a3b8', margin: '1px 0 0' }}>{q}</p>
                                        </div>
                                        <StarRow value={ratings[id]} onChange={v => setRatings(r => ({ ...r, [id]: v }))} size={16} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ⑦ Any Comments */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={lbl}>Any comments?</label>
                            <textarea
                                value={comment} onChange={e => setComment(e.target.value)}
                                placeholder="What can we improve on the ADM Analytics platform?"
                                rows={2}
                                style={{ ...inp, resize: 'none', lineHeight: 1.5, padding: '10px 12px', fontSize: '12px' }}
                                onFocus={e => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }}
                                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>

                        {/* Submit */}
                        <button
                            onClick={handleSubmit}
                            style={{ width: '100%', padding: '13px', borderRadius: '10px', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', fontWeight: 800, fontSize: '13px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(249,115,22,0.35)', transition: 'all 0.18s' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 7px 22px rgba(249,115,22,0.45)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(249,115,22,0.35)'; }}
                        >
                            Submit Feedback
                        </button>

                        <button
                            onClick={onClose}
                            style={{ width: '100%', marginTop: '10px', padding: '9px', borderRadius: '8px', background: 'transparent', color: '#94a3b8', fontWeight: 600, fontSize: '12px', border: 'none', cursor: 'pointer' }}
                        >
                            Skip for now
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Utility: Check if the website-level feedback modal should be shown.
 * Returns false if it was shown within the last 24h.
 */
export function shouldShowWebsiteFeedback() {
    const last = localStorage.getItem('adm_website_feedback_shown');
    if (!last) return true;
    const elapsed = Date.now() - parseInt(last, 10);
    return elapsed > 24 * 60 * 60 * 1000; // 24 hours
}
