import { useNavigate, useLocation } from 'react-router-dom';
import { CheckSquare, FolderOpen, Calendar, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const NAV_ITEMS = [
  { icon: CheckSquare, label: 'Tasks',    path: '/tasks',    exact: true },
  { icon: FolderOpen,  label: 'Groups',   path: '/groups',   exact: false },
  { icon: User,        label: 'My Tasks', path: '/my-tasks', exact: true },
  { icon: Calendar,    label: 'Calendar', path: '/calendar', exact: true },
];

export default function MobileBottomBar({ onLogoutRequest }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path || (item.path === '/tasks' && location.pathname === '/');
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-t border-app-border flex items-center justify-around px-2 z-40 shadow-2xl">
      {NAV_ITEMS.map(item => {
        const Icon = item.icon;
        const active = isActive(item);
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`
              flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-all duration-300
              ${active ? 'text-accent bg-accent/5' : 'text-app-muted hover:text-app-body'}
            `}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span className={`text-[9px] font-black uppercase tracking-wider ${active ? 'opacity-100' : 'opacity-60'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
      
      {/* Logout / Profile Button */}
      <button
        onClick={onLogoutRequest}
        className="flex flex-col items-center gap-1.5 px-3 py-2 text-app-muted rounded-2xl transition-all active:scale-90"
      >
        <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center text-accent text-[9px] font-black border border-accent/10">
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <span className="text-[9px] font-black uppercase tracking-wider opacity-60">Logout</span>
      </button>
    </div>
  );
}
