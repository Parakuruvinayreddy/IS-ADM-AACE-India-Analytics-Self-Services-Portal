import { useState } from 'react';
import { DEPT_COLORS } from '../data/mockData';
import { useToast } from '../context/ToastContext';
import SubmissionDrawer from '../components/SubmissionDrawer';

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const getCategoryIcon = (category, color) => {
  const cat = (category || '').toLowerCase();
  
  if (cat.includes('dashboard')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
        <path d="M3 12l6-4 6 8 6-10"></path>
      </svg>
    );
  }
  
  if (cat.includes('ai') || cat.includes('solution') || cat.includes('r&d')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
        <rect x="9" y="9" width="6" height="6"></rect>
        <line x1="9" y1="1" x2="9" y2="4"></line>
        <line x1="15" y1="1" x2="15" y2="4"></line>
        <line x1="9" y1="20" x2="9" y2="23"></line>
        <line x1="15" y1="20" x2="15" y2="23"></line>
        <line x1="20" y1="9" x2="23" y2="9"></line>
        <line x1="20" y1="15" x2="23" y2="15"></line>
        <line x1="1" y1="9" x2="4" y2="9"></line>
        <line x1="1" y1="15" x2="4" y2="15"></line>
      </svg>
    );
  }
  
  if (cat.includes('data') || cat.includes('product')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
        <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path>
      </svg>
    );
  }
  
  if (cat.includes('plant') || cat.includes('factory')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V12M12 12a5 5 0 0 0-5-5H3M12 12a5 5 0 0 1 5-5h4M12 8a3 3 0 0 0-3-3H6M12 8a3 3 0 0 1 3-3h3" />
      </svg>
    );
  }
  
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  );
};

const getDeptGradient = (dept) => {
  const color = DEPT_COLORS[dept] || '#3B82F6';
  const gradients = {
    'Executive': 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    'Sales Commercial': 'linear-gradient(135deg, #84CC16 0%, #65A30D 100%)',
    'Finance': 'linear-gradient(135deg, #22C55E 0%, #15803D 100%)',
    'Operations': 'linear-gradient(135deg, #F97316 0%, #C2410C 100%)',
    'Human Resources': 'linear-gradient(135deg, #A855F7 0%, #7E22CE 100%)',
    'Engineering': 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
  };
  return gradients[dept] || `linear-gradient(135deg, ${color} 0%, #1e293b 100%)`;
};

export default function Published({ submissions, onUnpublish, onPublish, onReject, onRequestChanges }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('active'); // 'active' or 'unpublished'
  const [drawerSub, setDrawerSub] = useState(null);
  const toast = useToast();

  const activeList = submissions.filter(s => s.status === 'Published');
  const unpublishedList = submissions.filter(s => s.status !== 'Published');

  const filteredActive = activeList.filter(s => !search || s.proj.toLowerCase().includes(search.toLowerCase()) || s.team.toLowerCase().includes(search.toLowerCase()));
  const filteredUnpublished = unpublishedList.filter(s => !search || s.proj.toLowerCase().includes(search.toLowerCase()) || s.team.toLowerCase().includes(search.toLowerCase()));

  const displayList = tab === 'active' ? filteredActive : filteredUnpublished;

  const handleViewLive = (projectName) => {
    const slug = slugify(projectName);
    const port = window.location.port;
    let url;
    if (port === '3002') {
      url = `${window.location.protocol}//${window.location.hostname}:8081/project/${slug}`;
    } else if (port === '5714' || port === '5174' || port === '') {
      url = `/project/${slug}`;
    } else {
      url = `${window.location.protocol}//${window.location.hostname}:8081/project/${slug}`;
    }
    window.open(url, '_blank');
  };

  return (
    <>
      <style>{`
        .premium-pub-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
          margin-top: 8px;
        }
        .premium-pub-card {
          background: linear-gradient(180deg, #ffffff 0%, #fcfdfe 100%);
          border: 1px solid #e2e8f0;
          border-left: 4px solid var(--dept-color, #3b82f6);
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.02), 0 2px 4px -1px rgba(15, 23, 42, 0.01);
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          display: flex;
          flex-direction: column;
          min-height: 300px;
        }
        .premium-pub-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -4px rgba(15, 23, 42, 0.08), 0 4px 8px -2px rgba(15, 23, 42, 0.03);
          border-color: #cbd5e1;
        }
        .pub-icon-container {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: var(--dept-color-light, rgba(59, 130, 246, 0.1));
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--dept-color, #3b82f6);
          flex-shrink: 0;
        }
        .pub-badge-text {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .pub-code-text {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 700;
        }
        .pub-dept-text {
          font-size: 11px;
          color: #64748b;
          margin-top: 1px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .pub-title-premium {
          font-family: 'Sora', sans-serif;
          font-size: 15px;
          font-weight: 800;
          color: #15263C;
          line-height: 1.4;
          margin-top: 12px;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          min-height: 42px;
          word-break: break-all;
        }
        .pub-desc-premium {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
          margin-bottom: 14px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          height: 39px;
          word-break: break-all;
        }
        .pub-meta-premium {
          font-size: 12px;
          color: #64748b;
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
          border-top: 1px dashed #e2e8f0;
          padding-top: 12px;
          margin-top: auto;
        }
        .pub-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .pub-meta-label {
          color: #94a3b8;
          font-weight: 700;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .pub-meta-val {
          font-weight: 700;
          color: #334155;
        }
        .btn-orange-premium {
          flex: 1;
          background: #FF6B2B;
          color: #ffffff;
          border: 1px solid transparent;
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s ease;
          text-align: center;
          box-shadow: 0 2px 4px rgba(255, 107, 43, 0.12);
        }
        .btn-orange-premium:hover {
          background: #e0561a;
          box-shadow: 0 4px 8px rgba(255, 107, 43, 0.22);
        }
        .btn-ghost-premium {
          flex: 1;
          background: #ffffff;
          color: #475569;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s ease;
          text-align: center;
        }
        .btn-ghost-premium:hover {
          background: #f8fafc;
          color: #1e293b;
          border-color: #94a3b8;
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div className="pg-title" style={{ display: 'block', marginBottom: '6px' }}>Published Projects</div>
          <div className="pg-sub" style={{ marginBottom: 0 }}>
            {activeList.length} active published projects, {unpublishedList.length} unpublished
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#94a3b8' }}>🔍</span>
          <input 
            placeholder="Search projects..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '10px 12px 10px 32px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', width: '250px', fontFamily: '"DM Sans", sans-serif' }}
          />
        </div>
      </div>

      {/* Tabs Layout */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px' }}>
        <button
          onClick={() => setTab('active')}
          style={{
            background: tab === 'active' ? '#FF6B2B' : 'transparent',
            color: tab === 'active' ? '#fff' : '#475569',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            fontFamily: '"DM Sans", sans-serif',
            transition: 'all 0.18s'
          }}
          onMouseEnter={e => { if (tab !== 'active') e.currentTarget.style.background = '#e2e8f0'; }}
          onMouseLeave={e => { if (tab !== 'active') e.currentTarget.style.background = 'transparent'; }}
        >
          Active Projects ({activeList.length})
        </button>
        <button
          onClick={() => setTab('unpublished')}
          style={{
            background: tab === 'unpublished' ? '#FF6B2B' : 'transparent',
            color: tab === 'unpublished' ? '#fff' : '#475569',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            fontFamily: '"DM Sans", sans-serif',
            transition: 'all 0.18s'
          }}
          onMouseEnter={e => { if (tab !== 'unpublished') e.currentTarget.style.background = '#e2e8f0'; }}
          onMouseLeave={e => { if (tab !== 'unpublished') e.currentTarget.style.background = 'transparent'; }}
        >
          Unpublished Projects ({unpublishedList.length})
        </button>
      </div>

      {displayList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#94a3b8', fontSize: '14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 4px 6px rgba(15,28,46,0.02)' }}>
          No {tab === 'active' ? 'active' : 'unpublished'} projects found.
        </div>
      ) : (
        <div className="premium-pub-grid">
          {displayList.map(s => {
            const col = DEPT_COLORS[s.dept] || '#3B82F6';
            const displayCategory = s.category || s.cat || 'Project';
            return (
              <div 
                className="premium-pub-card" 
                style={{ '--dept-color': col, '--dept-color-light': col + '15', cursor: 'pointer' }} 
                key={s.id}
                onClick={(e) => {
                  if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                  setDrawerSub(s);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="pub-icon-container">
                    {getCategoryIcon(displayCategory, col)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="pub-badge-text" style={{ color: col }}>
                        {displayCategory}
                      </span>
                      <span style={{ fontSize: '10px', color: '#cbd5e1' }}>&bull;</span>
                      <span className="pub-code-text">
                        {s.code || `PRJ-${s.id}`}
                      </span>
                    </div>
                    <div className="pub-dept-text">
                      {s.dept}
                    </div>
                  </div>
                </div>

                <div className="pub-title-premium" title={s.proj}>{s.proj}</div>
                <p className="pub-desc-premium" title={s.desc}>
                  {s.desc || 'No description provided.'}
                </p>
                
                <div className="pub-meta-premium">
                  <div className="pub-meta-row">
                    <span className="pub-meta-label">Team</span>
                    <span className="pub-meta-val">{s.team}</span>
                  </div>
                  <div className="pub-meta-row">
                    <span className="pub-meta-label">{tab === 'active' ? 'Published' : 'Status'}</span>
                    <span className="pub-meta-val">{tab === 'active' ? s.date : s.status}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  {tab === 'active' ? (
                    <>
                      <button className="btn-orange-premium" onClick={() => handleViewLive(s.proj)}>View Live</button>
                      <button className="btn-ghost-premium" onClick={() => onUnpublish(s.id)}>Unpublish</button>
                    </>
                  ) : (
                    <>
                      <button className="btn-orange-premium" onClick={() => onPublish(s.id)}>Publish</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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


