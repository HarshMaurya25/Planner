import { useState, useEffect, useRef } from 'react';
import { X, Send, Users, UserPlus, Copy, Trash2, Crown, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';

export default function ShareModal({ folder, onClose }) {
  const [tab, setTab] = useState('choose'); // 'choose' | 'copy' | 'team'
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message }
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const { sendFolderCopy, enableTeamShare, disableTeamShare, addTeamMember, removeTeamMember, fetchFolderMembers, folderMembers } = useAppStore();
  const { user } = useAuthStore();
  const members = folderMembers[folder.id] || [];
  const isOwner = folder.created_by === user?.id;

  useEffect(() => {
    if (folder.is_shared) {
      fetchFolderMembers(folder.id);
    }
  }, [folder.id, folder.is_shared, fetchFolderMembers]);

  const handleSendCopy = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setStatus(null);
    const result = await sendFolderCopy(folder.id, username);
    setLoading(false);
    if (result?.error) {
      setStatus({ type: 'error', message: result.error.message || 'Failed to send' });
    } else {
      setStatus({ type: 'success', message: `Copy sent to "${username}"!` });
      setUsername('');
    }
  };

  const handleEnableTeam = async () => {
    setLoading(true);
    await enableTeamShare(folder.id);
    await fetchFolderMembers(folder.id);
    setLoading(false);
    setTab('team');
  };

  const handleAddMember = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setStatus(null);
    const result = await addTeamMember(folder.id, username);
    setLoading(false);
    if (result?.error) {
      setStatus({ type: 'error', message: result.error.message || 'Failed to add' });
    } else {
      setStatus({ type: 'success', message: `"${username}" added to team!` });
      setUsername('');
    }
  };

  const handleRemoveMember = async (userId) => {
    await removeTeamMember(folder.id, userId);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-app-border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-app-border">
          <div>
            <h3 className="text-base font-black text-app-heading">Share "{folder.title}"</h3>
            <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest mt-0.5">
              {folder.is_shared ? 'Team Shared' : 'Choose sharing mode'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-app-bg rounded-xl text-app-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Mode Chooser */}
        {tab === 'choose' && (
          <div className="p-6 space-y-3">
            <button
              onClick={() => setTab('copy')}
              className="w-full flex items-center gap-4 p-4 border border-app-border rounded-2xl hover:border-accent hover:bg-accent/5 transition-all group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                <Copy size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-app-heading">Send Copy</p>
                <p className="text-[11px] text-app-muted mt-0.5">Send a separate copy. No sync after sharing.</p>
              </div>
            </button>
            <button
              onClick={() => folder.is_shared ? setTab('team') : handleEnableTeam()}
              disabled={loading}
              className="w-full flex items-center gap-4 p-4 border border-app-border rounded-2xl hover:border-accent hover:bg-accent/5 transition-all group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0 group-hover:bg-purple-100 transition-colors">
                <Users size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-app-heading">{folder.is_shared ? 'Manage Team' : 'Team Share'}</p>
                <p className="text-[11px] text-app-muted mt-0.5">{folder.is_shared ? 'View and manage team members.' : 'Real-time sync. Everyone sees the same data.'}</p>
              </div>
            </button>
          </div>
        )}

        {/* Send Copy Tab */}
        {tab === 'copy' && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setTab('choose')} className="text-xs font-bold text-accent hover:underline">← Back</button>
              <span className="text-xs font-bold text-app-muted">Send Copy</span>
            </div>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username..."
                className="flex-1 px-4 py-3 bg-app-bg border border-app-border rounded-xl text-sm focus:outline-none focus:border-accent"
                autoFocus
              />
              <button
                onClick={handleSendCopy}
                disabled={!username.trim() || loading}
                className="px-5 py-3 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent-hover shadow-lg shadow-accent/20 transition-all active:scale-95 disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>
            {status && (
              <p className={`text-xs font-bold mt-3 px-1 ${status.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                {status.message}
              </p>
            )}
            <p className="text-[10px] text-app-muted mt-4 leading-relaxed">
              This sends a <strong>separate copy</strong> to the user. Changes you make won't sync with their copy.
            </p>
          </div>
        )}

        {/* Team Share Tab */}
        {(tab === 'team' || folder.is_shared) && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setTab('choose')} className="text-xs font-bold text-accent hover:underline">← Mode Selection</button>
                <div className="w-1 h-1 rounded-full bg-app-border" />
                <button onClick={() => setTab('copy')} className="text-xs font-bold text-accent hover:underline flex items-center gap-1"><Copy size={10} /> Send Copy</button>
              </div>
              {isOwner && (
                <button 
                  onClick={async () => {
                    if (window.confirm("Stop team sharing? This will remove all members and make this folder private.")) {
                      setLoading(true);
                      await disableTeamShare(folder.id);
                      setLoading(false);
                      onClose();
                    }
                  }}
                  disabled={loading}
                  className="text-[10px] font-black text-red-500 hover:underline uppercase tracking-widest disabled:opacity-50"
                >
                  Stop Sharing
                </button>
              )}
            </div>

            {/* Add Member Input */}
            {isOwner && (
              <div className="flex gap-2 mb-5">
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Add member by username..."
                  className="flex-1 px-4 py-3 bg-app-bg border border-app-border rounded-xl text-sm focus:outline-none focus:border-accent"
                  onKeyDown={e => e.key === 'Enter' && handleAddMember()}
                />
                <button
                  onClick={handleAddMember}
                  disabled={!username.trim() || loading}
                  className="px-4 py-3 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent-hover shadow-lg shadow-accent/20 transition-all active:scale-95 disabled:opacity-40"
                >
                  <UserPlus size={16} />
                </button>
              </div>
            )}

            {status && (
              <p className={`text-xs font-bold mb-3 px-1 ${status.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                {status.message}
              </p>
            )}

            {/* Members List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <p className="text-[10px] font-black text-app-muted uppercase tracking-widest mb-2">
                Members ({members.length})
              </p>
              {members.map(m => (
                <div key={m.user_id} className="flex items-center justify-between px-3 py-2.5 bg-app-bg rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${m.role === 'owner' ? 'bg-amber-100 text-amber-700' : 'bg-accent/10 text-accent'}`}>
                      {m.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-app-heading">{m.username}</p>
                      <p className="text-[10px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-1">
                        {m.role === 'owner' ? <><Crown size={9} /> Owner</> : <><User size={9} /> Member</>}
                      </p>
                    </div>
                  </div>
                  {isOwner && m.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(m.user_id)}
                      className="p-2 text-app-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-xs text-app-muted text-center py-4">No members yet. Add someone above!</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
