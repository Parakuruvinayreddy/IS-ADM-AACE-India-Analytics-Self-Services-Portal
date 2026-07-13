import { Bell, Menu, Search } from 'lucide-react';

const pageTitles = {
  dashboard:   { title: 'Dashboard',          subtitle: 'Welcome back, here\'s what\'s happening' },
  tickets:     { title: 'Tickets',             subtitle: 'Incoming queries from the main website' },
  submissions: { title: 'Submissions',         subtitle: 'Review and manage project submissions' },
  published:   { title: 'Published Projects',  subtitle: 'Live projects visible to the organization' },
  settings:    { title: 'Settings',            subtitle: 'Manage your account and preferences' },
};

export default function Navbar({ page, onMobileMenuOpen }) {
  const info = pageTitles[page] || pageTitles['dashboard'];

  return (
    <header className="sticky top-0 z-20 h-[68px] flex items-center px-6 lg:px-8 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 shrink-0">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Page title */}
        <div className="min-w-0 hidden sm:block">
          <h1 className="text-[17px] font-bold text-slate-900 truncate" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {info.title}
          </h1>
          <p className="text-[12px] text-slate-500 truncate">{info.subtitle}</p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search bar */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-[13px] cursor-pointer hover:border-indigo-300 hover:bg-white transition-all w-44">
          <Search size={14} />
          <span>Quick search...</span>
        </div>

        {/* Notification */}
        <button className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white" />
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200 mx-1" />

        {/* User */}
        <div className="flex items-center gap-3 pl-1">
          <div className="hidden sm:block text-right">
            <p className="text-[13px] font-semibold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>System Admin</p>
            <p className="text-[11px] text-slate-500">Super Administrator</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-200 cursor-pointer hover:shadow-indigo-300 transition-shadow">
            <span className="text-white font-bold text-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>SA</span>
          </div>
        </div>
      </div>
    </header>
  );
}
