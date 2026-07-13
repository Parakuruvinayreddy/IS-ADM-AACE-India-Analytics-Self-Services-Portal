import { useState, useMemo } from 'react';
import StatusBadge from '../components/StatusBadge';
import SubmissionDrawer from '../components/SubmissionDrawer';

const base = import.meta.env.BASE_URL;
const DEPT_INFO = {
  "Executive":          { icon: `${base}icons/trending.png`,            emoji: "📊", subtitle: "Strategic overview & C-suite KPIs",    color: "text-blue-500" },
  "Customer Service":   { icon: `${base}icons/Customer_Service.png`,    emoji: "🎧", subtitle: "Support, satisfaction & CX metrics",   color: "text-blue-500" },
  "Finance":            { icon: `${base}icons/Finance.png`,             emoji: "💰", subtitle: "Budget, P&L & cost analysis",          color: "text-green-500" },
  "Engineering":        { icon: `${base}icons/Engineering.png`,         emoji: "⚙️", subtitle: "Delivery, quality & tech metrics",     color: "text-indigo-500" },
  "Human Resources":    { icon: `${base}icons/Human_Resources.png`,     emoji: "👥", subtitle: "Headcount, talent & engagement",       color: "text-purple-500" },
  "Marine, Oil & Gas":  { icon: `${base}icons/Marine_Oil_Gas.png`,      emoji: "🛢️", subtitle: "Offshore, energy & marine ops",        color: "text-blue-500" },
  "Operations":         { icon: `${base}icons/Plants.png`,              emoji: "🔧", subtitle: "Efficiency, logistics & capacity",     color: "text-orange-500" },
  "Pricing":            { icon: `${base}icons/Pricing.png`,             emoji: "💲", subtitle: "Margin, costing & price strategy",     color: "text-blue-500" },
  "Product Management": { icon: `${base}icons/Product_Management.png`,  emoji: "📋", subtitle: "Roadmap, lifecycle & portfolio",       color: "text-blue-500" },
  "Sales Commercial":   { icon: `${base}icons/Sales_Commercial.png`,    emoji: "🤝", subtitle: "Revenue, pipeline & forecasting",     color: "text-blue-500" },
  "Plants":             { icon: `${base}icons/Factory.png`,             emoji: "🏭", subtitle: "Production, facilities & maintenance", color: "text-slate-600" },
};

export default function Dashboard({ submissions, onPublish, onReject, onRequestChanges }) {
  const [drawerSub, setDrawerSub] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [listModal, setListModal] = useState(null);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(s => {
      if (categoryFilter) {
        const cat = categoryFilter.toLowerCase();
        const matchesCat = 
          s.cat?.toLowerCase() === cat || 
          s.proj?.toLowerCase().includes(cat) || 
          s.desc?.toLowerCase().includes(cat) || 
          (s.tech && s.tech.some(t => t.toLowerCase().includes(cat)));
        if (!matchesCat) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!s.proj.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [submissions, searchQuery, categoryFilter]);

  const pending = filteredSubmissions.filter(s => s.status === 'Pending').length;
  const published = filteredSubmissions.filter(s => s.status === 'Published').length;
  const rejected = filteredSubmissions.filter(s => s.status === 'Rejected').length;

  const depts = {};
  filteredSubmissions.forEach(s => { depts[s.dept] = (depts[s.dept] || 0) + 1; });
  const dNames = Object.keys(DEPT_INFO);

  return (
    <>
      <div className="pg-title">Dashboard</div>
      <div className="pg-sub">Overview of all project submissions across departments</div>

      {/* Stat Cards */}
      <div className="stat-row">
        <div className="stat-card" style={{ borderLeft: '4px solid #3B82F6' }}>
          <div>
            <div className="stat-icon-box" style={{ background: '#eff6ff', color: '#3B82F6', fontSize: '24px' }}>📋</div>
            <div className="stat-num" style={{ color: '#3B82F6' }}>{filteredSubmissions.length}</div>
            <div className="stat-lbl">Total Submissions</div>
          </div>
          <button 
            onClick={() => setListModal({ title: 'Total Submissions', list: filteredSubmissions })}
            style={{
              position: 'absolute',
              right: '16px',
              bottom: '16px',
              background: '#f1f5f9',
              border: 'none',
              color: '#475569',
              fontSize: '11px',
              fontWeight: '700',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: '"DM Sans", sans-serif',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FF6B2B'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
          >
            View
          </button>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #F97316' }}>
          <div>
            <div className="stat-icon-box" style={{ background: '#fff7ed', color: '#F97316', fontSize: '24px' }}>⏳</div>
            <div className="stat-num" style={{ color: '#F97316' }}>{pending}</div>
            <div className="stat-lbl">Pending Review</div>
          </div>
          <button 
            onClick={() => setListModal({ title: 'Pending Review', list: filteredSubmissions.filter(s => s.status === 'Pending') })}
            style={{
              position: 'absolute',
              right: '16px',
              bottom: '16px',
              background: '#f1f5f9',
              border: 'none',
              color: '#475569',
              fontSize: '11px',
              fontWeight: '700',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: '"DM Sans", sans-serif',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FF6B2B'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
          >
            View
          </button>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #22C55E' }}>
          <div>
            <div className="stat-icon-box" style={{ background: '#f0fdf4', color: '#22C55E', fontSize: '24px' }}>✅</div>
            <div className="stat-num" style={{ color: '#22C55E' }}>{published}</div>
            <div className="stat-lbl">Published</div>
          </div>
          <button 
            onClick={() => setListModal({ title: 'Published Projects', list: filteredSubmissions.filter(s => s.status === 'Published') })}
            style={{
              position: 'absolute',
              right: '16px',
              bottom: '16px',
              background: '#f1f5f9',
              border: 'none',
              color: '#475569',
              fontSize: '11px',
              fontWeight: '700',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: '"DM Sans", sans-serif',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FF6B2B'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
          >
            View
          </button>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #EF4444' }}>
          <div>
            <div className="stat-icon-box" style={{ background: '#fef2f2', color: '#EF4444', fontSize: '24px' }}>❌</div>
            <div className="stat-num" style={{ color: '#EF4444' }}>{rejected}</div>
            <div className="stat-lbl">Rejected</div>
          </div>
          <button 
            onClick={() => setListModal({ title: 'Rejected Submissions', list: filteredSubmissions.filter(s => s.status === 'Rejected') })}
            style={{
              position: 'absolute',
              right: '16px',
              bottom: '16px',
              background: '#f1f5f9',
              border: 'none',
              color: '#475569',
              fontSize: '11px',
              fontWeight: '700',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: '"DM Sans", sans-serif',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FF6B2B'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
          >
            View
          </button>
        </div>
      </div>

      {/* Departments */}
      <div className="dept-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          Solve Architecture by Function
          <span className="dept-title-sub">Click a card to view project breakdown</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontWeight: '500' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#94a3b8' }}>🔍</span>
            <input 
              placeholder="Search projects..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: '8px 12px 8px 32px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', maxWidth: '200px', fontFamily: '"DM Sans", sans-serif' }}
            />
          </div>
          <select 
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', background: '#fff', cursor: 'pointer', fontFamily: '"DM Sans", sans-serif' }}
          >
            <option value="">All Categories</option>
            <option value="ai solution">AI Solution</option>
            <option value="data product">Data Product</option>
            <option value="dashboard">Dashboard</option>
          </select>
        </div>
      </div>
      <div className="dept-grid">
        {dNames.map(d => {
          const info = DEPT_INFO[d] || { icon: "📁", subtitle: "Department statistics", color: "text-blue-500" };
          // For the count number color: we want to map colors loosely
          let countColor = '#3B82F6';
          if (info.color.includes('green')) countColor = '#22C55E';
          if (info.color.includes('purple')) countColor = '#A855F7';
          if (info.color.includes('orange')) countColor = '#F97316';
          if (info.color.includes('indigo')) countColor = '#6366F1';
          
          return (
            <div className="dept-card" key={d} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setExpandedCard(expandedCard === d ? null : d)}
              >
                <div className="dept-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="dept-icon-box" style={{ background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', borderRadius: '10px', fontSize: '22px' }}>
                    {info.icon ? (
                      <img 
                        src={info.icon} 
                        alt={d} 
                        style={{ 
                          width: '26px', height: '26px', objectFit: 'contain',
                          filter: 'brightness(0.3) contrast(2.5) saturate(1.2)',
                        }} 
                        onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'block'; }} 
                      />
                    ) : null}
                    <span style={{ display: info.icon ? 'none' : 'block' }}>{info.emoji || "📁"}</span>
                  </div>
                  <div className="dept-info">
                    <div className="dept-name" style={{ fontWeight: 'bold', color: '#1e293b' }}>{d}</div>
                    <div className="dept-desc" style={{ fontSize: '12px', color: '#64748b' }}>{info.subtitle}</div>
                  </div>
                </div>
                <div className="dept-right">
                  <div className="dept-count" style={{ color: countColor }}>{depts[d] || 0}</div>
                  <button className="dept-view" style={{ transform: expandedCard === d ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</button>
                </div>
              </div>
              
              {expandedCard === d && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '.1em', color: '#94a3b8', marginBottom: '12px', textTransform: 'uppercase' }}>Project Breakdown</div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {[
                      { label: 'TOTAL', key: 'Total', count: filteredSubmissions.filter(s => s.dept === d).length, color: '#3B82F6', filterFn: s => s.dept === d, align: 'left' },
                      { label: 'PUBLISHED', key: 'Published', count: filteredSubmissions.filter(s => s.dept === d && s.status === 'Published').length, color: '#22C55E', filterFn: s => s.dept === d && s.status === 'Published', align: 'center' },
                      { label: 'PENDING', key: 'Pending', count: filteredSubmissions.filter(s => s.dept === d && s.status === 'Pending').length, color: '#F97316', filterFn: s => s.dept === d && s.status === 'Pending', align: 'center' },
                      { label: 'REJECTED', key: 'Rejected', count: filteredSubmissions.filter(s => s.dept === d && s.status === 'Rejected').length, color: '#EF4444', filterFn: s => s.dept === d && s.status === 'Rejected', align: 'right' },
                    ].map(stat => {
                      const getTooltipStyle = (align) => {
                        const baseStyle = {
                          position: 'absolute', 
                          top: '100%', 
                          marginTop: '8px',
                          background: '#fff', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '10px', 
                          padding: '12px', 
                          boxShadow: '0 10px 25px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.03)', 
                          width: '300px',
                          zIndex: 50,
                          textAlign: 'left'
                        };
                        
                        if (align === 'left') {
                          return { ...baseStyle, left: '0px' };
                        }
                        if (align === 'right') {
                          return { ...baseStyle, right: '0px', left: 'auto' };
                        }
                        return { ...baseStyle, left: '50%', transform: 'translateX(-50%)' };
                      };

                      return (
                        <div 
                          key={stat.key}
                          onMouseEnter={() => setHoveredStat({ dept: d, stat: stat.key })}
                          onMouseLeave={() => setHoveredStat(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setListModal({ title: `${d} - ${stat.label} Projects`, list: filteredSubmissions.filter(stat.filterFn) });
                          }}
                          style={{ 
                            flex: 1, 
                            padding: '12px', 
                            borderRadius: '10px', 
                            border: '1px solid #f1f5f9', 
                            textAlign: 'center',
                            position: 'relative',
                            cursor: 'pointer',
                            background: '#fff'
                          }}
                        >
                          <div style={{ fontSize: '18px', fontWeight: '800', color: stat.color, marginBottom: '2px', fontFamily: '"Sora", sans-serif' }}>{stat.count}</div>
                          <div style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.05em' }}>{stat.label}</div>
                          
                          {hoveredStat?.dept === d && hoveredStat?.stat === stat.key && (
                            <div style={getTooltipStyle(stat.align)}>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f1c2e', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>{stat.label} Projects</div>
                              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {filteredSubmissions.filter(stat.filterFn).length > 0 ? (
                                  filteredSubmissions.filter(stat.filterFn).map(p => (
                                    <div 
                                      key={p.id} 
                                      onClick={(e) => { e.stopPropagation(); setDrawerSub(p); }}
                                      style={{ 
                                        display: 'flex', 
                                        gap: '8px', 
                                        alignItems: 'flex-start',
                                        cursor: 'pointer',
                                        padding: '6px 8px',
                                        borderRadius: '6px',
                                        transition: 'background 0.15s ease'
                                      }}
                                      onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
                                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                      title="Click to view details"
                                    >
                                      <span style={{ color: p.status === 'Published' ? '#22C55E' : p.status === 'Pending' ? '#F97316' : p.status === 'Rejected' ? '#EF4444' : '#94a3b8', fontSize: '10px', marginTop: '4px' }}>●</span>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '12px', color: '#1e293b', fontWeight: '700', lineHeight: '1.4', wordBreak: 'break-all' }}>{p.proj}</div>
                                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', fontWeight: '500' }}>
                                          {p.team} &bull; {p.code || `PRJ-${p.id}`}
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div style={{ fontSize: '12px', color: '#94a3b8', padding: '6px 8px' }}>No projects found</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Submissions Table */}
      <div className="card">
        <div className="card-head" style={{ marginBottom: '24px' }}>
          <div>
            <div className="card-title" style={{ fontSize: '18px' }}>Recent Submissions</div>
            <div className="card-sub" style={{ fontSize: '13px' }}>Last 5 project submissions received</div>
          </div>
          <button className="text-link" onClick={() => {}}>View all →</button>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Token</th>
                <th>Team</th>
                <th>Project</th>
                <th>Department</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.slice(0, 5).map(s => (
                <tr key={s.id}>
                  <td><span className="token-lbl">{s.id}</span></td>
                  <td style={{ fontWeight: 800, color: '#0f1c2e' }}>{s.team}</td>
                  <td style={{ color: '#475569', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.proj}</td>
                  <td>
                    <span style={{ 
                        fontSize: '11px', fontWeight: '700', 
                        // Map colors to departments similarly
                        color: s.dept.includes('Finance') ? '#22C55E' : 
                               s.dept.includes('Sales') ? '#84CC16' : 
                               s.dept.includes('Eng') ? '#6366F1' : 
                               s.dept.includes('Op') ? '#F97316' : 
                               s.dept.includes('Plant') ? '#475569' :
                               '#3B82F6',
                        background: s.dept.includes('Finance') ? '#f0fdf4' : 
                                    s.dept.includes('Sales') ? '#f7fee7' : 
                                    s.dept.includes('Eng') ? '#eef2ff' : 
                                    s.dept.includes('Op') ? '#fff7ed' : 
                                    s.dept.includes('Plant') ? '#f1f5f9' :
                                    '#eff6ff',
                        padding: '4px 10px', borderRadius: '6px'
                      }}>
                      {s.dept}
                    </span>
                  </td>
                  <td style={{ color: '#64748b', fontSize: '12px' }}>{s.date}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td>
                    <button className="review-link" onClick={() => setDrawerSub(s)}>Review →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {listModal && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setListModal(null)}>
          <div className="modal" style={{ width: '500px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div className="modal-title" style={{ margin: 0 }}>{listModal.title}</div>
              <button 
                onClick={() => setListModal(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  color: '#94a3b8',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#94a3b8'; }}
              >
                ✕
              </button>
            </div>
            <div className="modal-sub" style={{ marginBottom: '16px' }}>
              Showing {listModal.list.length} projects in this category
            </div>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {listModal.list.length > 0 ? (
                listModal.list.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setListModal(null); // Close this modal
                      setDrawerSub(p);    // Open detailed drawer
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#FF6B2B';
                      e.currentTarget.style.background = '#fff';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.background = '#f8fafc';
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1, paddingRight: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', lineHeight: '1.4', wordBreak: 'break-all' }}>{p.proj}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                        {p.team} &bull; {p.dept}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <StatusBadge status={p.status} />
                      <span style={{ color: '#cbd5e1', fontSize: '14px' }}>➔</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px' }}>
                  No projects found in this category.
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button 
                className="btn-ghost" 
                style={{ padding: '8px 20px', borderRadius: '8px' }} 
                onClick={() => setListModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
