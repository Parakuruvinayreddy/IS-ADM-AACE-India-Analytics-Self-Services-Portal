import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { StarRating } from '../components/FeedbackModal';
import { BU_DATA } from '../data/constants';
import { formatProjectName } from '../utils/formatProjectName';

const ALL_PROJECTS = Object.entries(BU_DATA).flatMap(([, bu]) =>
    bu.projects.map(p => ({ name: p.name, bu: bu.label }))
);

function slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#14b8a6'];

function StatCard({ icon, label, value, sub, color }) {
    return (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e9edf3', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 2px 12px rgba(15,28,46,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{icon}</div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
            </div>
            <span style={{ fontSize: '36px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{value}</span>
            {sub && <span style={{ fontSize: '12px', color: '#94a3b8' }}>{sub}</span>}
        </div>
    );
}

function RatingBar({ rating, count, total }) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', width: '14px', textAlign: 'right' }}>{rating}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#f97316" stroke="#f97316" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#f97316,#fb923c)', borderRadius: '4px', transition: 'width 0.6s ease' }} />
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8', width: '24px' }}>{count}</span>
        </div>
    );
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [feedbacks, setFeedbacks] = useState([]);
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const raw = JSON.parse(localStorage.getItem('adm_all_feedback') || '[]');
        setFeedbacks(raw);
    }, []);

    // Derived stats
    const total = feedbacks.length;
    const avgRating = total > 0 ? (feedbacks.reduce((s, f) => s + f.rating, 0) / total).toFixed(1) : '–';
    const projectsRated = new Set(feedbacks.map(f => f.projectName)).size;
    const ratingCounts = [5, 4, 3, 2, 1].map(r => ({ rating: r, count: feedbacks.filter(f => f.rating === r).length }));

    // Filter + search + sort
    let displayed = feedbacks.filter(f => {
        if (filter !== 'all' && String(f.rating) !== filter) return false;
        if (search && !f.projectName.toLowerCase().includes(search.toLowerCase()) && !f.userName?.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });
    if (sortBy === 'rating-desc') displayed = [...displayed].sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'rating-asc') displayed = [...displayed].sort((a, b) => a.rating - b.rating);
    else displayed = [...displayed].sort((a, b) => new Date(b.date) - new Date(a.date));

    function clearFeedback(projectName) {
        const updated = feedbacks.filter(f => f.projectName !== projectName);
        setFeedbacks(updated);
        localStorage.setItem('adm_all_feedback', JSON.stringify(updated));
        localStorage.removeItem(`adm_feedback_${projectName}`);
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
            <Navbar />

            {/* Header bar */}
            <div style={{ background: 'linear-gradient(135deg,#15263C,#1b3550)', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '58px', boxShadow: '0 2px 12px rgba(15,28,46,0.18)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', transition: 'all 0.18s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.25)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.45)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                        Home
                    </button>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>Admin Dashboard · Feedback Overview</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f97316', background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)', padding: '4px 12px', borderRadius: '20px' }}>ADMIN VIEW</span>
            </div>

            <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '32px 24px 80px' }}>

                {/* Page title */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Feedback Dashboard</h1>
                    <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>Manage and review all user feedback across ADM projects.</p>
                </div>

                {/* Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '20px', marginBottom: '32px' }}>
                    <StatCard icon="💬" label="Total Feedback" value={total} sub={total === 1 ? '1 submission' : `${total} submissions`} color="#3b82f6" />
                    <StatCard
                        icon="⭐"
                        label="Average Rating"
                        value={avgRating}
                        sub={total > 0 ? 'out of 5.0' : 'No ratings yet'}
                        color="#f97316"
                    />
                    <StatCard icon="📊" label="Projects Rated" value={projectsRated} sub={`of ${ALL_PROJECTS.length} total`} color="#22c55e" />
                    <StatCard icon="🏆" label="Top Score" value={total > 0 ? feedbacks.reduce((m, f) => f.rating > m ? f.rating : m, 0) : '–'} sub={total > 0 ? `${feedbacks.filter(f => f.rating === 5).length} five-star reviews` : ''} color="#a855f7" />
                </div>

                {/* Distribution + Controls row */}
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', marginBottom: '28px' }}>
                    {/* Rating distribution */}
                    <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e9edf3', padding: '22px', boxShadow: '0 2px 8px rgba(15,28,46,0.04)' }}>
                        <p style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Rating Distribution</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {ratingCounts.map(({ rating, count }) => (
                                <RatingBar key={rating} rating={rating} count={count} total={total} />
                            ))}
                        </div>
                    </div>

                    {/* Empty projects */}
                    <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e9edf3', padding: '22px', boxShadow: '0 2px 8px rgba(15,28,46,0.04)', overflow: 'hidden' }}>
                        <p style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Projects Awaiting Feedback</p>
                        {(() => {
                            const ratedNames = new Set(feedbacks.map(f => f.projectName));
                            const unrated = ALL_PROJECTS.filter(p => !ratedNames.has(p.name));
                            if (unrated.length === 0) return <p style={{ fontSize: '13px', color: '#22c55e', fontWeight: 600 }}>✅ All projects have been rated!</p>;
                            return (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {unrated.map(p => (
                                        <span key={p.name}
                                            onClick={() => navigate(`/project/${slugify(p.name)}`)}
                                            style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer', transition: 'all 0.15s' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#fff7ed'; e.currentTarget.style.borderColor = '#fed7aa'; e.currentTarget.style.color = '#ea580c'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
                                        >
                                            {formatProjectName(p.name)}
                                        </span>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Feedback list */}
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e9edf3', boxShadow: '0 2px 12px rgba(15,28,46,0.05)' }}>
                    {/* Toolbar */}
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <p style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0, flex: 1 }}>All Feedback <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>({displayed.length})</span></p>

                        {/* Search */}
                        <div style={{ position: 'relative' }}>
                            <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" /></svg>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ paddingLeft: '32px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '12px', outline: 'none', width: '180px', fontFamily: 'inherit', background: '#f8fafc' }}
                                onFocus={e => e.target.style.borderColor = '#f97316'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>

                        {/* Filter by rating */}
                        <select value={filter} onChange={e => setFilter(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '12px', fontFamily: 'inherit', background: '#f8fafc', cursor: 'pointer', outline: 'none', color: '#334155' }}>
                            <option value="all">All Ratings</option>
                            <option value="5">⭐⭐⭐⭐⭐ 5</option>
                            <option value="4">⭐⭐⭐⭐ 4</option>
                            <option value="3">⭐⭐⭐ 3</option>
                            <option value="2">⭐⭐ 2</option>
                            <option value="1">⭐ 1</option>
                        </select>

                        {/* Sort */}
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '12px', fontFamily: 'inherit', background: '#f8fafc', cursor: 'pointer', outline: 'none', color: '#334155' }}>
                            <option value="date">Newest First</option>
                            <option value="rating-desc">Highest Rating</option>
                            <option value="rating-asc">Lowest Rating</option>
                        </select>
                    </div>

                    {/* Table */}
                    {displayed.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
                            <p style={{ fontSize: '15px', fontWeight: 600, color: '#64748b' }}>{total === 0 ? 'No feedback submitted yet' : 'No feedback matches your filters'}</p>
                            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                                {total === 0 ? 'Feedback submitted by users will appear here.' : 'Try adjusting your search or filter.'}
                            </p>
                        </div>
                    ) : (
                        <div>
                            {displayed.map((fb, i) => {
                                const title = formatProjectName(fb.projectName);
                                const bInfo = ALL_PROJECTS.find(p => p.name === fb.projectName);
                                const colorIdx = i % AVATAR_COLORS.length;
                                return (
                                    <div key={i} style={{ padding: '20px 24px', borderBottom: i < displayed.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', alignItems: 'flex-start', gap: '16px', transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {/* Avatar */}
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: AVATAR_COLORS[colorIdx], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>
                                            {getInitials(fb.userName || 'Anonymous')}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{fb.userName || 'Anonymous'}</span>
                                                {fb.userRole && <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>· {fb.userRole}</span>}
                                                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', marginLeft: 'auto' }}>{bInfo?.bu || ''}</span>
                                            </div>
                                            <p style={{ fontSize: '12px', fontWeight: 700, color: '#f97316', margin: '0 0 6px', letterSpacing: '0.02em' }} title={fb.projectName}>{title}</p>
                                            <StarRating value={fb.rating} readonly size={16} />
                                            {fb.comment && <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginTop: '8px', fontStyle: 'italic' }}>"{fb.comment}"</p>}
                                            <p style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '8px' }}>{new Date(fb.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
                                            <button
                                                onClick={() => navigate(`/project/${slugify(fb.projectName)}`)}
                                                style={{ fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: '7px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#334155', cursor: 'pointer', transition: 'all 0.15s' }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.color = '#ea580c'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
                                            >View Project →</button>
                                            <button
                                                onClick={() => { if (window.confirm('Remove this feedback?')) clearFeedback(fb.projectName); }}
                                                style={{ fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: '7px', border: '1.5px solid #fecaca', background: '#fff', color: '#ef4444', cursor: 'pointer', transition: 'all 0.15s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#fff5f5'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                                            >Delete</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
