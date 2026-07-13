import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({ page, onNav, pendingCount, pendingTickets, children }) {
  return (
    <div className="app">
      <Sidebar page={page} onNav={onNav} pendingCount={pendingCount} pendingTickets={pendingTickets} />
      <div className="main">
        <Topbar page={page} />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
