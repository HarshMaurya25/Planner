import { useState } from 'react';
import { X, Lock, Check, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function PasswordResetModal({ onClose }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message }
  const [loading, setLoading] = useState(false);
  const { updatePassword } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setStatus({ type: 'error', message: 'Password must be at least 4 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      await updatePassword(newPassword);
      setStatus({ type: 'success', message: 'Password updated successfully!' });
      setTimeout(onClose, 1500);
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-app-border w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-app-border">
          <h3 className="text-lg font-black text-app-heading">Reset Password</h3>
          <button onClick={onClose} className="p-2 hover:bg-app-bg rounded-xl text-app-muted transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-black text-app-muted uppercase tracking-widest mb-2 ml-1">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted" size={18} />
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3.5 bg-app-bg border border-app-border rounded-2xl text-sm focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all font-medium"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-app-muted uppercase tracking-widest mb-2 ml-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted" size={18} />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3.5 bg-app-bg border border-app-border rounded-2xl text-sm focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all font-medium"
              />
            </div>
          </div>

          {status && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold animate-in slide-in-from-top-2 ${
              status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
            }`}>
              {status.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
              {status.message}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 text-sm font-bold text-app-body hover:bg-app-bg rounded-2xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="flex-1 py-4 bg-accent text-white rounded-2xl text-sm font-bold hover:bg-accent-hover shadow-lg shadow-accent/20 transition-all active:scale-95 disabled:opacity-40"
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
