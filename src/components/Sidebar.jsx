import { useAuthStore } from '../store/useAuthStore';
import { CheckSquare, FolderOpen, Calendar, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { icon: CheckSquare, label: 'Tasks',    path: '/tasks',    exact: true },
  { icon: FolderOpen,  label: 'Groups',   path: '/groups',   exact: false },
  { icon: User,        label: 'My Tasks', path: '/my-tasks', exact: true },
  { icon: Calendar,    label: 'Calendar', path: '/calendar', exact: true },
];

export default function Sidebar() {
  const { signOut, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path || (item.path === '/tasks' && location.pathname === '/');
    return location.pathname.startsWith(item.path);
  };

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <aside className="bg-white border-r border-app-border flex flex-col h-full w-56 shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-app-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center shrink-0">
            <CheckSquare size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-app-heading tracking-tight">Planner</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                ${active ? 'bg-accent/10 text-accent' : 'text-app-body hover:bg-app-bg'}
              `}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-app-border shrink-0">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 w-full px-2 py-2 mb-1 rounded-xl hover:bg-app-bg transition-all active:scale-95 text-left group"
          title="Logout"
        >
          <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center text-accent text-xs font-bold shrink-0 border border-accent/10 group-hover:bg-accent group-hover:text-white transition-colors">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-app-heading font-bold truncate">{user?.username || 'User'}</p>
            <p className="text-[10px] text-app-muted">Sign out</p>
          </div>
        </button>
      </div>
    </aside>
  );
}
