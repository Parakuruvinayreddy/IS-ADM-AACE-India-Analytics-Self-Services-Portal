import { useToast } from '../context/ToastContext';

export default function Topbar({ page }) {
  const toast = useToast();
  
  const pageTitle = page === 'dashboard' ? 'Dashboard' 
                  : page === 'submissions' ? 'Submissions' 
                  : page === 'published' ? 'Published Projects' 
                  : page === 'tickets' ? 'Support Tickets'
                  : page === 'settings' ? 'Settings' : 'Dashboard';

  return (
    <div className="topbar">
      <div className="topbar-left">{pageTitle}</div>
      <div className="topbar-right">
        <button className="bell" onClick={() => toast('No new notifications', 'i')}>
          🔔<span className="bell-dot" />
        </button>
        <div className="user-right">
          <div className="user-sub">Welcome</div>
          <div className="user-name">Admin</div>
        </div>
        <div className="topbar-av">AD</div>
      </div>
    </div>
  );
}
