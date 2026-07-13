import { useState } from 'react';

const API = '/admin';

function TypeBadge({ type }) {
  const config = {
    website_feedback: { label: '🌐 Website', bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
    feedback:         { label: '📊 Project', bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  };
  const c = config[type] || { label: '💬 General', bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      textTransform: 'uppercase', letterSpacing: '0.04em', display: 'inline-block', marginTop: 4,
    }}>{c.label}</span>
  );
}

export default function Feedback({ feedback = [] }) {
  const [search, setSearch] = useState('');

  const filtered = feedback.filter(f => {
    return !search ||
      (f.project_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.comment || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <>
      <div className="pg-title" style={{ display: 'block' }}>Feedback</div>
      <div className="pg-sub">View feedback and suggestions from users on the main website</div>
      
      <div className="filter-row">
        <input
          value={search}
          placeholder="Search by name, comment or area..."
          onChange={e => setSearch(e.target.value)}
        />
        <span className="count-txt">Showing {filtered.length} of {feedback.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>
            No feedback entries found. Feedback submitted through the portal will appear here.
          </div>
        </div>
      ) : (
        <div>
          {filtered.map(f => (
            <div className="sub-card" key={f.feedback_id}>
              <div className="sub-left">
                <div className="sub-token">#{f.feedback_id}</div>
                <TypeBadge type={f.type} />
                <div className="sub-team" style={{ marginTop: 4 }}>{f.user_name || 'Anonymous'}</div>
                <div className="sub-date" style={{ marginTop: 2 }}>{f.user_email}</div>
              </div>
              <div className="sub-center">
                <div className="sub-proj">{f.project_name || f.project_title || '(No Project)'}</div>
                {f.team_name && f.team_name !== 'Main Website' && (
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Team: <strong>{f.team_name}</strong></div>
                )}
                <div className="sub-desc" style={{ fontStyle: 'italic', marginTop: 6 }}>"{f.comment}"</div>
                <div className="sub-date" style={{ marginTop: 6 }}>
                  {new Date(f.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="sub-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                {f.rating ? (
                  <>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(star => (
                        <span key={star} style={{ fontSize: 18, color: star <= f.rating ? '#f97316' : '#cbd5e1' }}>★</span>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginTop: 4 }}>
                      {f.rating} / 5
                    </div>
                  </>
                ) : (
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>No rating</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
