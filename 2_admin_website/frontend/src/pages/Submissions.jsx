import { useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import SubmissionDrawer from '../components/SubmissionDrawer';

export default function Submissions({ submissions, onPublish, onReject, onRequestChanges, loading }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('Newest');
  const [drawerSub, setDrawerSub] = useState(null);

  if (loading) {
    return (
      <>
        <div className="pg-title">Submissions</div>
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>
          Loading submissions from backend...
        </div>
      </>
    );
  }

  const isNewSubmission = (s) => {
    if (s._status !== 'submitted') return false;
    if (!s._submittedAt) return true;
    const ageInMs = new Date() - new Date(s._submittedAt);
    const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
    return ageInDays <= 3;
  };

  const filtered = submissions
    .filter(s => {
      let mf = false;
      if (filter === 'All') {
        mf = true;
      } else if (filter === 'New Request') {
        mf = isNewSubmission(s);
      } else if (filter === 'Pending') {
        mf = (s._status === 'submitted' && !isNewSubmission(s)) ||
             s._status === 'under_review' || 
             s._status === 'changes_requested' || 
             s._status === 'approved';
      } else {
        mf = s.status === filter; // 'Published', 'Rejected'
      }
      const ms = !search ||
        s.team.toLowerCase().includes(search.toLowerCase()) ||
        s.proj.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase());
      return mf && ms;
    })
    .sort((a, b) => {
      const aTime = a._submittedAt ? new Date(a._submittedAt).getTime() : 0;
      const bTime = b._submittedAt ? new Date(b._submittedAt).getTime() : 0;
      if (aTime !== bTime) {
        return sort === 'Newest' ? bTime - aTime : aTime - bTime;
      }
      const aId = parseInt(a.id, 10) || 0;
      const bId = parseInt(b.id, 10) || 0;
      return sort === 'Newest' ? bId - aId : aId - bId;
    });

  return (
    <>
      <div className="pg-title">Submissions</div>
      <div className="pg-sub" style={{ marginTop: '0px', marginBottom: '24px' }}>Review and approve new project submissions from teams across the organization</div>

      <div className="filter-row">
        <input
          value={search}
          placeholder="Search by team name, project title or ID..."
          onChange={e => setSearch(e.target.value)}
        />
        <select
          value={sort === 'Newest' ? 'Newest First' : 'Oldest First'}
          onChange={e => setSort(e.target.value === 'Newest First' ? 'Newest' : 'Oldest')}
        >
          <option>Newest First</option>
          <option>Oldest First</option>
        </select>
        <span className="count-txt">Showing {filtered.length} of {submissions.length}</span>
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
              Submission Status
            </div>

            {/* All Submissions */}
            <button
              onClick={() => setFilter('All')}
              style={{
                background: filter === 'All' ? '#fff' : 'transparent',
                border: filter === 'All' ? '1px solid #cbd5e1' : '1px solid transparent',
                textAlign: 'left',
                fontFamily: "'Sora', sans-serif",
                fontSize: '13px',
                fontWeight: filter === 'All' ? '800' : '600',
                color: filter === 'All' ? '#15263C' : '#475569',
                cursor: 'pointer',
                padding: '10px 12px',
                borderRadius: '8px',
                transition: 'all 0.15s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                boxShadow: filter === 'All' ? '0 2px 8px rgba(15,28,46,0.04)' : 'none'
              }}
              onMouseEnter={e => { if (filter !== 'All') e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'; }}
              onMouseLeave={e => { if (filter !== 'All') e.currentTarget.style.background = 'transparent'; }}
            >
              <span>All Submissions</span>
              <span style={{
                background: filter === 'All' ? '#FF6B2B' : '#94a3b8',
                color: '#fff',
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '8px'
              }}>
                {submissions.length}
              </span>
            </button>

            {/* New Requests */}
            <button
              onClick={() => setFilter('New Request')}
              style={{
                background: filter === 'New Request' ? '#fff' : 'transparent',
                border: filter === 'New Request' ? '1px solid #cbd5e1' : '1px solid transparent',
                textAlign: 'left',
                fontFamily: "'Sora', sans-serif",
                fontSize: '13px',
                fontWeight: filter === 'New Request' ? '800' : '600',
                color: filter === 'New Request' ? '#15263C' : '#475569',
                cursor: 'pointer',
                padding: '10px 12px',
                borderRadius: '8px',
                transition: 'all 0.15s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                boxShadow: filter === 'New Request' ? '0 2px 8px rgba(15,28,46,0.04)' : 'none'
              }}
              onMouseEnter={e => { if (filter !== 'New Request') e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'; }}
              onMouseLeave={e => { if (filter !== 'New Request') e.currentTarget.style.background = 'transparent'; }}
            >
              <span>New Requests</span>
              <span style={{
                background: filter === 'New Request' ? '#FF6B2B' : '#94a3b8',
                color: '#fff',
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '8px'
              }}>
                {submissions.filter(s => isNewSubmission(s)).length}
              </span>
            </button>

            {/* Pending Submissions */}
            <button
              onClick={() => setFilter('Pending')}
              style={{
                background: filter === 'Pending' ? '#fff' : 'transparent',
                border: filter === 'Pending' ? '1px solid #cbd5e1' : '1px solid transparent',
                textAlign: 'left',
                fontFamily: "'Sora', sans-serif",
                fontSize: '13px',
                fontWeight: filter === 'Pending' ? '800' : '600',
                color: filter === 'Pending' ? '#15263C' : '#475569',
                cursor: 'pointer',
                padding: '10px 12px',
                borderRadius: '8px',
                transition: 'all 0.15s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                boxShadow: filter === 'Pending' ? '0 2px 8px rgba(15,28,46,0.04)' : 'none'
              }}
              onMouseEnter={e => { if (filter !== 'Pending') e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'; }}
              onMouseLeave={e => { if (filter !== 'Pending') e.currentTarget.style.background = 'transparent'; }}
            >
              <span>Pending Submissions</span>
              <span style={{
                background: filter === 'Pending' ? '#FF6B2B' : '#94a3b8',
                color: '#fff',
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '8px'
              }}>
                {submissions.filter(s => (s._status === 'submitted' && !isNewSubmission(s)) || s._status === 'under_review' || s._status === 'changes_requested' || s._status === 'approved').length}
              </span>
            </button>

            {/* Complete Submissions */}
            <button
              onClick={() => setFilter('Published')}
              style={{
                background: filter === 'Published' ? '#fff' : 'transparent',
                border: filter === 'Published' ? '1px solid #cbd5e1' : '1px solid transparent',
                textAlign: 'left',
                fontFamily: "'Sora', sans-serif",
                fontSize: '13px',
                fontWeight: filter === 'Published' ? '800' : '600',
                color: filter === 'Published' ? '#15263C' : '#475569',
                cursor: 'pointer',
                padding: '10px 12px',
                borderRadius: '8px',
                transition: 'all 0.15s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                boxShadow: filter === 'Published' ? '0 2px 8px rgba(15,28,46,0.04)' : 'none'
              }}
              onMouseEnter={e => { if (filter !== 'Published') e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'; }}
              onMouseLeave={e => { if (filter !== 'Published') e.currentTarget.style.background = 'transparent'; }}
            >
              <span>Complete Submissions</span>
              <span style={{
                background: filter === 'Published' ? '#22c55e' : '#94a3b8',
                color: '#fff',
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '8px'
              }}>
                {submissions.filter(s => s.status === 'Published').length}
              </span>
            </button>

            {/* Rejected Submissions */}
            <button
              onClick={() => setFilter('Rejected')}
              style={{
                background: filter === 'Rejected' ? '#fff' : 'transparent',
                border: filter === 'Rejected' ? '1px solid #cbd5e1' : '1px solid transparent',
                textAlign: 'left',
                fontFamily: "'Sora', sans-serif",
                fontSize: '13px',
                fontWeight: filter === 'Rejected' ? '800' : '600',
                color: filter === 'Rejected' ? '#15263C' : '#475569',
                cursor: 'pointer',
                padding: '10px 12px',
                borderRadius: '8px',
                transition: 'all 0.15s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                boxShadow: filter === 'Rejected' ? '0 2px 8px rgba(15,28,46,0.04)' : 'none'
              }}
              onMouseEnter={e => { if (filter !== 'Rejected') e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'; }}
              onMouseLeave={e => { if (filter !== 'Rejected') e.currentTarget.style.background = 'transparent'; }}
            >
              <span>Rejected Submissions</span>
              <span style={{
                background: filter === 'Rejected' ? '#ef4444' : '#94a3b8',
                color: '#fff',
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '8px'
              }}>
                {submissions.filter(s => s.status === 'Rejected').length}
              </span>
            </button>
          </div>
        </div>

        {/* Content Column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {filtered.length === 0 ? (
            <div style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '60px 24px',
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '14px',
              boxShadow: '0 4px 6px rgba(15,28,46,0.02)'
            }}>
              No submissions found. Projects appear here after teams submit via the intake page.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filtered.map(s => (
                <div
                  className="sub-card"
                  key={s.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '22px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                    boxShadow: '0 4px 6px rgba(15,28,46,0.02)',
                    transition: 'all 0.2s ease',
                    cursor: 'default'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(15,28,46,0.06)';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(15,28,46,0.02)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <div className="sub-left" style={{ minWidth: '140px' }}>
                    <div className="sub-token" style={{ fontSize: '12px', fontWeight: '800', color: '#FF6B2B', marginBottom: '8px' }}>
                      {s.code || `PRJ-${s.id}`}
                    </div>
                    <span className="dept-tag" style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      background: '#f1f5f9',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      color: '#475569',
                      border: '1px solid #e2e8f0',
                      display: 'inline-block'
                    }}>
                      📁 {s.dept}
                    </span>
                    <div className="sub-team" style={{
                      fontFamily: "'Sora', sans-serif",
                      fontWeight: '800',
                      fontSize: '14px',
                      marginTop: '10px',
                      color: '#15263C',
                      lineHeight: '1.3'
                    }}>
                      {s.team}
                    </div>
                  </div>

                  <div className="sub-center" style={{ flex: 1, minWidth: 0 }}>
                    <div className="sub-proj" style={{
                      fontFamily: "'Sora', sans-serif",
                      fontWeight: '800',
                      fontSize: '16px',
                      marginBottom: '6px',
                      color: '#15263C',
                      lineHeight: '1.4'
                    }}>
                      {s.proj}
                    </div>
                    <div className="sub-desc" style={{
                      fontSize: '13px',
                      color: '#64748b',
                      marginBottom: '10px',
                      fontWeight: '500',
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: '2',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      whiteSpace: 'normal',
                      textOverflow: 'ellipsis'
                    }}>
                      {s.desc}
                    </div>
                    <div className="sub-date" style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      📅 Submitted: {s.date} at {s.time}
                    </div>
                  </div>

                  <div className="sub-right" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '12px',
                    minWidth: '130px'
                  }}>
                    <StatusBadge status={s.status} />
                    <button
                      className="btn-req"
                      style={{
                        padding: '8px 20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        width: '100%',
                        textAlign: 'center',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setDrawerSub(s)}
                    >
                      Review Project
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {drawerSub && (
        <SubmissionDrawer
          sub={drawerSub}
          onClose={() => setDrawerSub(null)}
          onPublish={onPublish}
          onReject={onReject}
          onRequestChanges={onRequestChanges}
        />
      )}
    </>
  );
}
