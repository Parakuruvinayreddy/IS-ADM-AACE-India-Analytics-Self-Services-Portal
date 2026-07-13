export default function Sidebar({ page, onNav, pendingCount, pendingTickets }) {
  const navItems = [
    { key: 'dashboard',   icon: '⊞', label: 'Dashboard' },
    { key: 'tickets',     icon: '◱', label: 'Tickets',           badge: pendingTickets },
    { key: 'submissions', icon: '⊡', label: 'Submissions',       badge: pendingCount },
    { key: 'published',   icon: '◎', label: 'Published Projects' },
    { key: 'feedback',    icon: '✉', label: 'Feedback' },
    { key: 'teams',       icon: '👥', label: 'Teams' },
    { key: 'settings',    icon: '⚙', label: 'Settings' },
  ];

  return (
    <div className="sidebar">
      <div className="sb-top">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" style={{ width: 38, height: 38, objectFit: 'contain' }} />
        <div>
          <div className="sb-name">Admin Portal</div>
          <div className="sb-role">Validation Dashboard</div>
        </div>
      </div>
      <div className="sb-section">Navigation</div>
      {navItems.map(n => (
        <button
          key={n.key}
          id={`nav-${n.key}`}
          className={`nav-btn${page === n.key ? ' active' : ''}`}
          onClick={() => onNav(n.key)}
        >
          <span className="nav-icon">{n.icon}</span>
          {n.label}
          {n.badge > 0 && <span className="badge">{n.badge}</span>}
        </button>
      ))}
    </div>
  );
}
