import { useState, useEffect } from 'react';
import { nowIST } from '../utils/istTime';
import { useAuthFetch } from '../hooks/useAuthFetch';

const ANIM = `
@keyframes _fbBg   { from{opacity:0}                                            to{opacity:1} }
@keyframes _fbCard { from{opacity:0;transform:scale(0.94) translateY(18px)}    to{opacity:1;transform:scale(1) translateY(0)} }
`;

function StarRating({ value, onChange, readonly = false, size = 28 }) {
    const [hovered, setHovered] = useState(0);
    const display = hovered || value;
    return (
        <div style={{ display: 'flex', gap: '4px', cursor: readonly ? 'default' : 'pointer' }}>
            {[1, 2, 3, 4, 5].map(star => (
                <svg
                    key={star}
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill={star <= display ? '#f97316' : 'none'}
                    stroke={star <= display ? '#f97316' : '#cbd5e1'}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    style={{
                        transition: 'all 0.15s',
                        transform: star === value && !readonly ? 'scale(1.1)' : 'scale(1)',
                        filter: star <= display && !readonly ? 'drop-shadow(0 0 6px rgba(249,115,22,0.5))' : 'none',
                        cursor: readonly ? 'default' : 'pointer',
                    }}
                    onMouseEnter={() => !readonly && setHovered(star)}
                    onMouseLeave={() => !readonly && setHovered(0)}
                    onClick={() => !readonly && onChange && onChange(star)}
                >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            ))}
        </div>
    );
}

const LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

export { StarRating };

export default function FeedbackModal({ projectName, teamName, contactEmail, onClose, existingFeedback }) {
    const authFetch = useAuthFetch();
    const [step, setStep] = useState('form'); // 'form' | 'success'
    // Auto-detect logged-in user from localStorage
    const savedUser = (() => { try { return JSON.parse(localStorage.getItem('adm_user') || 'null'); } catch { return null; } })();
    const [rating, setRating] = useState(existingFeedback?.rating || 0);
    const [comment, setComment] = useState(existingFeedback?.comment || '');
    const [name, setName] = useState(existingFeedback?.userName || savedUser?.name || '');
    const [role, setRole] = useState(existingFeedback?.userRole || savedUser?.org || '');
    const [email, setEmail] = useState(existingFeedback?.userEmail || savedUser?.email || '');
    const [touched, setTouched] = useState(false);

    useEffect(() => {
        const fn = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, [onClose]);

    const title = projectName.split('_').slice(-3).join(' ');

    async function handleSubmit() {
        setTouched(true);
        if (!rating) return;

        const feedbackKey = `adm_feedback_${projectName}`;
        const allKey = 'adm_all_feedback';

        const entry = {
            projectName,
            rating,
            comment: comment.trim(),
            userName: name.trim() || 'Anonymous',
            userRole: role.trim(),
            userEmail: email.trim(),
            date: nowIST(),
        };

        // Save locally first (instant, works offline)
        localStorage.setItem(feedbackKey, JSON.stringify(entry));
        const existing = JSON.parse(localStorage.getItem(allKey) || '[]');
        const filtered = existing.filter(f => f.projectName !== projectName);
        filtered.unshift(entry);
        localStorage.setItem(allKey, JSON.stringify(filtered));

        // POST to admin backend
        try {
            const res = await authFetch(`/admin/api/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_name: title,  // human-readable title
                    team_name:    teamName || 'Unknown',
                    user_name:    name.trim() || 'Anonymous',
                    user_email:   email.trim(),
                    user_role:    role.trim(),
                    rating,
                    comment:      comment.trim(),
                    contact_email: contactEmail || '',
                }),
            });
            if (!res.ok) console.warn('[FeedbackModal] API responded with', res.status);
        } catch (err) {
            console.warn('[FeedbackModal] Backend unreachable, stored locally:', err.message);
        }

        setStep('success');
    }

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
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', animation: '_fbBg 0.18s ease both' }}
            onClick={onClose}
        >
            <style>{ANIM}</style>
            <div
                style={{ width: '100%', maxWidth: '520px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.35)', animation: '_fbCard 0.24s cubic-bezier(0.25,0.46,0.45,0.94) both', background: '#fff' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg,#15263C,#1b3550)', padding: '22px 28px 18px', position: 'relative' }}>
                    <button
                        onClick={onClose}
                        style={{ position: 'absolute', top: '16px', right: '16px', width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    >×</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>💬</div>
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0 }}>Project Feedback</p>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: '2px 0 0', lineHeight: 1.2 }}>{title}</h3>
                        </div>
                    </div>
                </div>
                {/* Orange bar */}
                <div style={{ height: '3px', background: 'linear-gradient(90deg,#f97316,#fb923c,transparent)' }} />

                {step === 'success' ? (
                    <div style={{ padding: '48px 32px', textAlign: 'center' }}>
                        <div style={{ fontSize: '52px', marginBottom: '16px' }}>🎉</div>
                        <h4 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Thank you!</h4>
                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Your feedback has been recorded for <strong>{title}</strong>.</p>
                        <StarRating value={rating} readonly size={26} />
                        <button
                            onClick={onClose}
                            style={{ marginTop: '24px', padding: '12px 32px', borderRadius: '10px', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(249,115,22,0.35)' }}
                        >Close</button>
                    </div>
                ) : (
                    <div style={{ padding: '28px 32px 32px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

                        {/* ① Your Name */}
                        <div>
                            <label style={lbl}>Your Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. John Smith"
                                style={inp}
                                onFocus={e => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }}
                                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>

                        {/* ② Role / Team */}
                        <div>
                            <label style={lbl}>Role / Team</label>
                            <input
                                type="text"
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                placeholder="e.g. Sales Analytics"
                                style={inp}
                                onFocus={e => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }}
                                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>

                        {/* ③ Email */}
                        <div>
                            <label style={lbl}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@te.com"
                                style={inp}
                                onFocus={e => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }}
                                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>

                        {/* ④ Overall Rating */}
                        <div>
                            <label style={lbl}>
                                Overall Rating <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <StarRating value={rating} onChange={setRating} size={32} />
                                {rating > 0 && (
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#f97316' }}>{LABELS[rating]}</span>
                                )}
                            </div>
                            {touched && !rating && (
                                <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>Please select a rating</p>
                            )}
                        </div>

                        {/* ⑤ Comments & Suggestions */}
                        <div>
                            <label style={lbl}>Comments &amp; Suggestions</label>
                            <textarea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                placeholder="Share your thoughts about this dashboard — what works well, what could be improved..."
                                rows={4}
                                style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
                                onFocus={e => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }}
                                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>

                        {/* Submit */}
                        <button
                            onClick={handleSubmit}
                            style={{ width: '100%', padding: '14px', borderRadius: '11px', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', fontWeight: 800, fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(249,115,22,0.35)', transition: 'all 0.18s', letterSpacing: '0.02em' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(249,115,22,0.45)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(249,115,22,0.35)'; }}
                        >
                            Submit Feedback
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
