import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ListChecks, FolderOpen, Calendar, User, LogOut, Lock } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const NAV_ITEMS = [
  { icon: ListChecks, label: 'Tasks',    path: '/tasks',    exact: true },
  { icon: FolderOpen,  label: 'Groups',   path: '/groups',   exact: false },
  { icon: User,        label: 'My Tasks', path: '/my-tasks', exact: true },
  { icon: Calendar,    label: 'Calendar', path: '/calendar', exact: true },
];

export default function MobileBottomBar({ onLogoutRequest, onPasswordResetRequest }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
            onClick={() => { navigate(item.path); setShowProfileMenu(false); }}
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
      <div className="relative">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-all active:scale-90 ${showProfileMenu ? 'text-accent bg-accent/5' : 'text-app-muted'}`}
        >
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border transition-colors ${showProfileMenu ? 'bg-accent text-white border-accent' : 'bg-accent/15 text-accent border-accent/10'}`}>
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider opacity-60">Me</span>
        </button>

        {showProfileMenu && (
          <div className="absolute bottom-full right-0 mb-4 w-48 bg-white border border-app-border rounded-2xl shadow-2xl py-2 animate-in slide-in-from-bottom-2 duration-200">
            <button 
              onClick={() => { onPasswordResetRequest(); setShowProfileMenu(false); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-xs font-bold text-app-body hover:bg-app-bg transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-app-bg flex items-center justify-center text-app-muted">
                <Lock size={14} />
              </div>
              Reset Password
            </button>
            <div className="h-px bg-app-border my-1 mx-2" />
            <button 
              onClick={() => { onLogoutRequest(); setShowProfileMenu(false); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                <LogOut size={14} />
              </div>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
