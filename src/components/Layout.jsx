import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileBottomBar from './MobileBottomBar';
import { useAuthStore } from '../store/useAuthStore';
import ConfirmModal from './ConfirmModal';
import PasswordResetModal from './PasswordResetModal';

export default function Layout() {
  const { signOut, user } = useAuthStore();
  const { subscribeToChanges, unsubscribe } = useAppStore();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  useEffect(() => {
    if (user) {
      subscribeToChanges();
    }
    return () => unsubscribe();
  }, [user, subscribeToChanges, unsubscribe]);

  const handleLogout = () => {
    unsubscribe();
    signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-app-bg">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar onLogoutRequest={() => setShowLogoutConfirm(true)} onPasswordResetRequest={() => setShowPasswordReset(true)} />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header REMOVED as requested */}
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Bar */}
      <MobileBottomBar 
        onLogoutRequest={() => setShowLogoutConfirm(true)} 
        onPasswordResetRequest={() => setShowPasswordReset(true)} 
      />

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure you want to log out of your account?"
        confirmText="Logout"
        type="primary"
      />

      {showPasswordReset && (
        <PasswordResetModal onClose={() => setShowPasswordReset(false)} />
      )}
    </div>
  );
}
