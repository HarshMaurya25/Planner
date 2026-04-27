import { useAuthStore } from '../store/useAuthStore';
import { CheckSquare, FolderOpen, Calendar, User, Folder, ListChecks, Lock, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { icon: ListChecks, label: 'Tasks',    path: '/tasks',    exact: true },
  { icon: FolderOpen,  label: 'Groups',   path: '/groups',   exact: false },
  { icon: User,        label: 'My Tasks', path: '/my-tasks', exact: true },
  { icon: Calendar,    label: 'Calendar', path: '/calendar', exact: true },
];

export default function Sidebar({ onLogoutRequest, onPasswordResetRequest }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path || (item.path === '/tasks' && location.pathname === '/');
    return location.pathname.startsWith(item.path);
  };

  return (
    <aside className="bg-white border-r border-app-border flex flex-col h-full w-56 shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-app-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center shrink-0">
            <Folder size={14} className="text-white" fill="currentColor" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-app-heading tracking-tight">WorkFlow</span>
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
      <div className="p-3 border-t border-app-border shrink-0 relative group/profile">
        <button
          className="flex items-center gap-2.5 w-full px-2 py-2 rounded-xl hover:bg-app-bg transition-all text-left"
        >
          <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center text-accent text-xs font-bold shrink-0 border border-accent/10 group-hover/profile:bg-accent group-hover/profile:text-white transition-colors">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-app-heading font-bold truncate">{user?.username || 'User'}</p>
            <p className="text-[10px] text-app-muted">Account settings</p>
          </div>
        </button>

        {/* Profile Dropup Menu */}
        <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-app-border rounded-2xl shadow-2xl py-2 opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-200 z-50">
          <button 
            onClick={onPasswordResetRequest}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-app-body hover:bg-app-bg transition-colors"
          >
            <Lock size={14} className="text-app-muted" /> Reset Password
          </button>
          <div className="h-px bg-app-border my-1 mx-2" />
          <button 
            onClick={onLogoutRequest}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
