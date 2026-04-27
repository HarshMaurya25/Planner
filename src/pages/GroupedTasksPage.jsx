import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Plus, Folder, ChevronRight, RotateCcw, Star, Palette, Trash2, 
  X, ArrowLeft, MoreVertical, Move, GripVertical, Copy, Settings, Edit2, Calendar, Share2, Users, ChevronUp, ChevronDown, Check, LogOut, FileText, Zap, Archive
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import TaskCard from '../components/TaskCard';
import ConfirmModal from '../components/ConfirmModal';
import ShareModal from '../components/ShareModal';
import NoteRenderer from '../components/NoteRenderer';

const FOLDER_COLORS = {
  blue:   { bg: '#BFDBFE', border: '#93C5FD', dot: '#3B82F6' },
  green:  { bg: '#BBF7D0', border: '#86EFAC', dot: '#22C55E' },
  yellow: { bg: '#FEF3C7', border: '#FDE68A', dot: '#F59E0B' },
  red:    { bg: '#FECACA', border: '#FCA5A5', dot: '#EF4444' },
  purple: { bg: '#E9D5FF', border: '#D8B4FE', dot: '#A855F7' },
};

function RenameModal({ initialTitle, onClose, onRename }) {
  const [title, setTitle] = useState(initialTitle);
  const inputRef = useRef(null);
  useEffect(() => inputRef.current?.focus(), []);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-app-border w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-app-heading mb-4">Rename</h3>
        <input 
          ref={inputRef} 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl text-sm focus:outline-none focus:border-accent mb-6"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-app-body hover:bg-app-bg rounded-xl transition-colors">Cancel</button>
          <button onClick={() => { onRename(title.trim()); onClose(); }} className="flex-1 py-3 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent-hover shadow-lg shadow-accent/20 transition-all active:scale-95">Save</button>
        </div>
      </div>
    </div>
  );
}

function MoveFolderModal({ folder, folders, onClose, onMove }) {
  const [selectedId, setSelectedId] = useState(folder.parent_id);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const toggleExpand = (e, id) => {
    e.stopPropagation();
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  };

  const descendants = new Set();
  const findDescendants = (id) => {
    folders.filter(f => f.parent_id === id).forEach(child => {
      descendants.add(child.id);
      findDescendants(child.id);
    });
  };
  findDescendants(folder.id);

  const renderFolderTree = (parentId, depth = 0) => {
    const children = folders.filter(f => f.parent_id === parentId && f.id !== folder.id && !descendants.has(f.id));
    if (children.length === 0) return null;

    return children.map(f => {
      const hasChildren = folders.some(child => child.parent_id === f.id && child.id !== folder.id && !descendants.has(child.id));
      const isExpanded = expandedIds.has(f.id);

      return (
        <div key={f.id} className="flex flex-col w-full">
          <div 
            onClick={() => setSelectedId(f.id)} 
            className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer border-b border-app-border/50 ${selectedId === f.id ? 'bg-accent/10 text-accent font-bold' : 'hover:bg-white text-app-body'}`}
            style={{ paddingLeft: `${(depth * 16) + 12}px` }}
          >
            {hasChildren ? (
              <button onClick={(e) => toggleExpand(e, f.id)} className="p-0.5 rounded hover:bg-black/10 text-app-muted">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-4 h-4 shrink-0" />
            )}
            <Folder size={16} className={selectedId === f.id ? 'text-accent' : 'text-app-muted'} fill={selectedId === f.id ? 'currentColor' : 'none'} />
            <span className="truncate">{f.title}</span>
          </div>
          {isExpanded && renderFolderTree(f.id, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-app-border w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-app-heading">Move Folder</h3>
          <button onClick={onClose} className="p-1 hover:bg-app-bg rounded-lg text-app-muted transition-colors"><X size={20} /></button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto border border-app-border rounded-xl mb-6 bg-app-bg/30 no-scrollbar">
          <button onClick={() => setSelectedId(null)} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium border-b border-app-border transition-colors ${selectedId === null ? 'bg-accent text-white' : 'hover:bg-white text-app-body'}`}>
            <Folder size={16} fill={selectedId === null ? 'white' : 'currentColor'} /> Root (Main Groups)
          </button>
          {renderFolderTree(null)}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-app-body hover:bg-app-bg rounded-xl transition-colors">Cancel</button>
          <button onClick={() => { onMove(folder.id, selectedId); onClose(); }} className="flex-1 py-3 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent-hover shadow-lg shadow-accent/20 transition-all active:scale-95">Move Here</button>
        </div>
      </div>
    </div>
  );
}

function AddFolderModal({ parentId, onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(null);
  const [type, setType] = useState('complete');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const handleSubmit = async (e) => {
    e.preventDefault(); if (!title.trim()) return;
    setLoading(true); await onAdd(title.trim(), parentId, color, type);
    setLoading(false); onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-app-border w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-app-heading mb-6">{parentId ? 'New Subfolder' : 'New Folder'}</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input ref={inputRef} value={title} onChange={e => setTitle(e.target.value)} placeholder="Folder title..." className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl text-sm focus:outline-none focus:border-accent font-bold" />
          <div className="flex justify-between items-center px-1">
            <div className="flex gap-2">
              {Object.keys(FOLDER_COLORS).map(c => (
                <button key={c} type="button" onClick={() => setColor(c === color ? null : c)} className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-accent scale-110' : 'border-transparent'}`} style={{ backgroundColor: FOLDER_COLORS[c].dot }} />
              ))}
            </div>
          </div>
          <div className="flex bg-app-bg p-1 rounded-xl">
            {['complete', 'remember'].map(t => (
              <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === t ? 'bg-white text-accent shadow-sm' : 'text-app-muted hover:text-app-body'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-semibold text-app-body hover:bg-app-bg rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={!title.trim() || loading} className="flex-1 py-3 bg-accent text-white rounded-xl text-sm font-bold shadow-lg shadow-accent/20 transition-all active:scale-95">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FolderActionsMenu({ folder, onBulk, onDelete, onMove, onDuplicate, onUpdate, onRename, onShare, autoSort, setAutoSort, sortBy, setSortBy, onDeleteAllTasks, onDeleteCompletedTasks, onLeave, isOwner, onEditNote }) {
  const [open, setOpen] = useState(false);
  const [upwards, setUpwards] = useState(false);
  const ref = useRef(null);

  if (!folder) return null;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggleOpen = (e) => {
    e.stopPropagation();
    if (!open) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // The menu is about 450px tall, so we need more threshold
      setUpwards(spaceBelow < 450 && spaceAbove > spaceBelow);
    }
    setOpen(!open);
  };

  const Item = ({ icon: Icon, label, onClick, danger, bold }) => (
    <button onClick={(e) => { e.stopPropagation(); onClick(); setOpen(false); }} className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors ${danger ? 'text-red-500 hover:bg-red-50' : 'text-app-body hover:bg-app-bg'} ${bold ? 'font-bold' : 'font-medium'}`}>
      <Icon size={14} className={danger ? 'text-red-500' : 'text-app-muted'} /> {label}
    </button>
  );

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggleOpen} className="p-2 hover:bg-black/5 rounded-lg text-app-muted transition-colors">
        <MoreVertical size={18} />
      </button>
      {open && (
        <div className={`absolute right-0 ${upwards ? 'bottom-full mb-2' : 'top-full mt-2'} w-56 bg-white border border-app-border rounded-2xl shadow-xl py-2 z-50 animate-in zoom-in-95 duration-100 overflow-y-auto max-h-[60vh] no-scrollbar`}>
          <div className="px-4 py-2 border-b border-app-border mb-1">
            <p className="text-[10px] font-black text-app-muted uppercase tracking-widest">Folder Options</p>
          </div>
          <Item icon={Edit2} label="Rename" onClick={() => onRename(folder)} bold />
          <Item icon={FileText} label={folder.description ? "Edit Note" : "Add Note"} onClick={() => onEditNote()} />
          <Item icon={Copy} label="Duplicate" onClick={() => onDuplicate(folder.id)} />
          <Item icon={Move} label="Move Folder" onClick={() => onMove(folder)} />
          <Item 
            icon={folder.type === 'remember' ? Zap : Archive} 
            label="Switch" 
            onClick={() => onUpdate(folder.id, { type: folder.type === 'remember' ? 'complete' : 'remember' })} 
          />
          
          <div className="h-px bg-app-border my-1 mx-2" />
          <button onClick={(e) => { e.stopPropagation(); setAutoSort(!autoSort); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-app-body hover:bg-app-bg transition-colors">
            <div className={`w-4 h-4 rounded border-2 transition-colors flex items-center justify-center ${autoSort ? 'bg-accent border-accent' : 'border-app-border'}`}>
              {autoSort && <Check size={10} className="text-white" strokeWidth={4} />}
            </div>
            Auto-sort tasks
          </button>
          <button onClick={(e) => { e.stopPropagation(); setSortBy(sortBy === 'date' ? 'auto' : 'date'); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-app-body hover:bg-app-bg transition-colors">
            <div className={`w-4 h-4 rounded border-2 transition-colors flex items-center justify-center ${sortBy === 'date' ? 'bg-accent border-accent' : 'border-app-border'}`}>
              {sortBy === 'date' && <Check size={10} className="text-white" strokeWidth={4} />}
            </div>
            Sort by Date
          </button>
          <Item icon={Share2} label={folder.is_shared ? "Manage Team" : "Share with Team"} onClick={() => onShare(folder)} />

          <div className="h-px bg-app-border my-1 mx-2" />
          <Item icon={RotateCcw} label="Reset all ticks" onClick={() => onBulk.ticks(folder.id)} />
          <Item icon={Star} label="Clear priorities" onClick={() => onBulk.priorities(folder.id)} />
          <Item icon={Palette} label="Clear colors" onClick={() => onBulk.colors(folder.id)} />
          
          <div className="h-px bg-app-border my-1 mx-2" />
          {isOwner ? (
            <>
              <Item icon={Trash2} label="Clear completed tasks" onClick={() => onDeleteCompletedTasks(folder.id)} danger />
              <Item icon={Trash2} label="Clear all tasks" onClick={() => onDeleteAllTasks(folder.id)} danger />
              <Item icon={Trash2} label="Delete Folder" onClick={() => onDelete(folder.id)} danger bold />
            </>
          ) : (
            <Item icon={LogOut} label="Exit Team" onClick={() => onLeave(folder.id)} danger bold />
          )}
        </div>
      )}
    </div>
  );
}

export default function GroupedTasksPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    folders, groupedTasks, fetchFolders, fetchGroupedTasks,
    addFolder, deleteFolder, moveFolder, updateFolderPosition,
    duplicateFolder, updateFolder, addGroupedTask, updateGroupedTask, deleteGroupedTask,
    bulkResetFolderTicks, bulkResetFolderPriorities, bulkClearFolderColors, deleteAllFolderTasks, deleteCompletedFolderTasks,
    folderMembers, fetchFolderMembers, assignTask, setTaskIndex, setFolderIndex, leaveFolder
  } = useAppStore();

  const [addingFolder, setAddingFolder] = useState(false);
  const [movingFolder, setMovingFolder] = useState(null);
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [renamingTask, setRenamingTask] = useState(null);
  const [sharingFolder, setSharingFolder] = useState(null);
  const [addingTask, setAddingTask] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [autoSort, setAutoSort] = useState(true);
  const [sortBy, setSortBy] = useState('auto'); // 'auto' | 'date'
  const taskInputRef = useRef(null);
  const dateInputRef = useRef(null);
  const [fabOpen, setFabOpen] = useState(false);
  const fabRef = useRef(null);
  const [draggedId, setDraggedId] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const currentFolder = folderId ? folders.find(f => f.id === folderId) : null;
  const subFolders = folders.filter(f => {
    if (folderId) return f.parent_id === folderId;
    return f.parent_id === null || !folders.some(parent => parent.id === f.parent_id);
  }).sort((a, b) => (a.position || 0) - (b.position || 0));
  const folderTasks = groupedTasks.filter(t => t.folder_id === folderId);
  const isOwner = !currentFolder || currentFolder.created_by === user?.id;

  const [isEditingFolderNote, setIsEditingFolderNote] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [folderNoteText, setFolderNoteText] = useState('');
  const folderNoteInputRef = useRef(null);

  useEffect(() => {
    if (currentFolder) {
      setFolderNoteText(currentFolder.description || '');
    }
  }, [currentFolder]);

  const handleFolderNoteSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!currentFolder) return;
    setIsSavingNote(true);
    await updateFolder(currentFolder.id, { description: folderNoteText.trim() });
    setIsSavingNote(false);
    setIsEditingFolderNote(false);
  };
  const [editingFolderIndex, setEditingFolderIndex] = useState(null);
  const [newFolderIndex, setNewFolderIndex] = useState('');
  
  const [confirmDelete, setConfirmDelete] = useState({ open: false, title: '', message: '', onConfirm: null });

  useEffect(() => { fetchFolders().then(() => fetchGroupedTasks(folderId)); }, [fetchFolders, fetchGroupedTasks, folderId]);
  useEffect(() => {
    if (!folderId || !folders.length) return;
    const cf = folders.find(f => f.id === folderId);
    if (cf?.is_shared) fetchFolderMembers(folderId);
  }, [folderId, folders]);
  useEffect(() => {
    const handler = (e) => { if (fabRef.current && !fabRef.current.contains(e.target)) setFabOpen(false); };
    document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAddTask = async (e) => {
    e?.preventDefault(); if (!taskInput.trim()) return;
    await addGroupedTask(taskInput, folderId, taskDeadline || null);
    setTaskInput(''); setTaskDeadline(''); setAddingTask(false);
    fetchGroupedTasks(folderId);
  };

  const handleMoveFolder = async (id, parentId) => {
    await moveFolder(id, parentId);
    fetchFolders();
  };

  const handleMoveTask = async (taskId, direction) => {
    const list = [...sortedTasks];
    const idx = list.findIndex(t => t.id === taskId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    await setTaskIndex(taskId, targetIdx, folderId);
    fetchGroupedTasks(folderId);
  };

  const handleMoveFolderAction = async (folderId, direction) => {
    const list = [...subFolders];
    const idx = list.findIndex(f => f.id === folderId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    await setFolderIndex(folderId, targetIdx);
    fetchFolders();
  };

  const handleFolderIndexSubmit = async (e, fId) => {
    e?.preventDefault();
    const idx = parseInt(newFolderIndex) - 1;
    if (!isNaN(idx)) {
      await setFolderIndex(fId, idx);
      fetchFolders();
    }
    setEditingFolderIndex(null);
  };

  const onTaskDragStart = (e, id) => { if (!isOwner) return; setDraggedTaskId(id); e.dataTransfer.effectAllowed = 'move'; };
  const onTaskDragOver = (e) => { if (!isOwner) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const onTaskDrop = async (e, targetId) => {
    if (!isOwner) return;
    e.preventDefault(); if (!draggedTaskId || draggedTaskId === targetId) return;
    const siblings = sortedTasks.filter(t => t.id !== draggedTaskId);
    const targetIdx = siblings.findIndex(t => t.id === targetId);
    await setTaskIndex(draggedTaskId, targetIdx, folderId); setDraggedTaskId(null);
    fetchGroupedTasks(folderId);
  };

  const getBreadcrumbs = () => {
    const crumbs = []; let curr = currentFolder;
    while (curr) { crumbs.unshift(curr); curr = folders.find(f => f.id === curr.parent_id); }
    return crumbs;
  };
  const breadcrumbs = getBreadcrumbs();

  const sortedTasks = [...folderTasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'completed' ? 1 : -1;
    
    if (sortBy === 'date') {
      if (!a.deadline && !b.deadline) return (a.position || 0) - (b.position || 0);
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    }
    
    if (sortBy === 'priority' || autoSort) {
      const pOrder = { high: 0, medium: 1, low: 2 };
      const pa = pOrder[a.priority] ?? 3;
      const pb = pOrder[b.priority] ?? 3;
      if (pa !== pb) return pa - pb;
    }
    
    return (a.position || 0) - (b.position || 0);
  });

  return (
    <div className="max-w-3xl mx-auto w-full py-8 px-4 md:px-6 pb-40">
      {/* Header & Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-black text-app-muted uppercase tracking-widest mb-4 overflow-x-auto no-scrollbar">
        <Link to="/groups" className="flex items-center gap-1 hover:text-accent transition-colors shrink-0">
          <Folder size={10} fill="currentColor" />
          Groups
        </Link>
        {breadcrumbs.map((crumb) => (
          <div key={crumb.id} className="flex items-center gap-2 shrink-0">
            <ChevronRight size={10} className="opacity-40" />
            <Link to={`/groups/${crumb.id}`} className="hover:text-accent transition-colors max-w-[100px] truncate">{crumb.title}</Link>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-app-border rounded-xl text-app-muted hover:text-accent transition-all shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-app-heading tracking-tight flex items-center gap-3">
              {currentFolder ? currentFolder.title : 'Main Groups'}
              {currentFolder?.is_shared && <Users size={20} className="text-purple-500" />}
            </h1>
            <p className="text-[10px] font-bold text-app-muted mt-0.5 uppercase tracking-widest">{currentFolder?.type === 'remember' ? 'Vault' : 'Active List'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentFolder && (
            <FolderActionsMenu 
              folder={currentFolder} onBulk={{ ticks: bulkResetFolderTicks, priorities: bulkResetFolderPriorities, colors: bulkClearFolderColors }} 
              onDelete={(id) => setConfirmDelete({ open: true, title: 'Delete Folder', message: 'Delete this folder?', onConfirm: () => { deleteFolder(id); navigate(-1); } })} 
              onMove={setMovingFolder} onDuplicate={duplicateFolder} onUpdate={updateFolder} onRename={setRenamingFolder}
              onShare={setSharingFolder}
              onDeleteAllTasks={(id) => setConfirmDelete({ open: true, title: 'Clear Folder', message: 'Delete all tasks in this folder?', onConfirm: () => deleteAllFolderTasks(id) })}
              onDeleteCompletedTasks={(id) => setConfirmDelete({ open: true, title: 'Clear Completed', message: 'Delete only completed tasks?', onConfirm: () => deleteCompletedFolderTasks(id) })}
              autoSort={autoSort} setAutoSort={setAutoSort}
              sortBy={sortBy} setSortBy={setSortBy}
              onLeave={(id) => setConfirmDelete({ open: true, title: 'Exit Team', message: 'Leave this team folder?', onConfirm: () => { leaveFolder(id); navigate('/groups'); } })}
              isOwner={isOwner}
              onEditNote={() => setIsEditingFolderNote(true)}
            />
          )}
        </div>
      </div>

      {/* Folder Note Section */}
      {currentFolder && (isEditingFolderNote || currentFolder.description) && (
        <div className="mb-10 animate-in fade-in slide-in-from-top-2 duration-300">
          {isEditingFolderNote ? (
            <div className="bg-white border border-app-border rounded-2xl p-4 shadow-xl mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-accent uppercase tracking-widest">Update Description</span>
                <button onClick={() => setIsEditingFolderNote(false)} className="text-app-muted hover:text-red-500 transition-colors"><X size={14} /></button>
              </div>
              <textarea
                ref={folderNoteInputRef}
                value={folderNoteText}
                onChange={e => setFolderNoteText(e.target.value)}
                placeholder="Add guidelines, links, or context for this folder..."
                className="w-full bg-app-bg border border-app-border rounded-xl p-4 text-xs font-medium focus:outline-none focus:border-accent min-h-[140px] custom-scrollbar"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setIsEditingFolderNote(false)} className="px-4 py-2 text-xs font-bold text-app-muted hover:bg-app-bg rounded-lg transition-colors">Cancel</button>
                <button 
                  onClick={handleFolderNoteSubmit} 
                  disabled={isSavingNote}
                  className="px-5 py-2 bg-accent text-white rounded-lg text-xs font-bold hover:bg-accent-hover shadow-lg shadow-accent/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSavingNote ? 'Saving...' : 'Save Description'}
                </button>
              </div>
            </div>
          ) : (
            <div className="group relative -mt-6 mb-6">
              <div className="pr-10">
                <NoteRenderer text={currentFolder.description} className="!gap-1.5" textSize="text-sm" />
              </div>
              <button 
                onClick={() => setIsEditingFolderNote(true)}
                className="absolute top-0 right-0 p-2 hover:bg-black/5 rounded-lg opacity-40 hover:opacity-100 transition-all"
                title="Edit Description"
              >
                <Edit2 size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Folders Section */}
      {subFolders.length > 0 && (
        <div className="flex flex-col gap-3 mb-8">
          {subFolders.map((folder, index) => {
            const color = folder.color ? FOLDER_COLORS[folder.color] : null;
            const fTasks = groupedTasks.filter(t => t.folder_id === folder.id);
            const fSubfolders = folders.filter(f => f.parent_id === folder.id);
            const isShared = folder.is_shared || currentFolder?.is_shared;
            const subIsOwner = folder.created_by === user?.id;
            let progress = null;
            if (folder.type !== 'remember') {
              const total = fTasks.length;
              const completed = fTasks.filter(t => t.status === 'completed').length;
              progress = total > 0 ? Math.round((completed / total) * 100) : 0;
            }

            return (
              <div key={folder.id} onClick={() => navigate(`/groups/${folder.id}`)}
                className="group flex items-center bg-white border border-app-border rounded-2xl p-4 cursor-pointer hover:border-accent hover:shadow-card-hover transition-all duration-200">
                <div 
                  onClick={(e) => { e.stopPropagation(); setEditingFolderIndex(folder.id); setNewFolderIndex(index + 1); }}
                  className="text-[10px] font-black text-app-muted bg-black/5 hover:bg-black/10 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mr-3 transition-colors"
                >
                  {editingFolderIndex === folder.id ? (
                    <form onSubmit={(e) => handleFolderIndexSubmit(e, folder.id)} className="contents">
                      <input
                        autoFocus
                        type="number"
                        value={newFolderIndex}
                        onChange={e => setNewFolderIndex(e.target.value)}
                        onBlur={(e) => handleFolderIndexSubmit(e, folder.id)}
                        className="w-full h-full bg-transparent text-center focus:outline-none"
                        onClick={e => e.stopPropagation()}
                      />
                    </form>
                  ) : (
                    (index + 1).toString().padStart(2, '0')
                  )}
                </div>
                <div 
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mr-3 transition-colors ${!color ? 'bg-accent/10 text-accent' : ''}`} 
                  style={color ? { backgroundColor: color.bg, color: color.dot } : {}}
                >
                  <Folder size={20} fill="currentColor" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-app-heading truncate group-hover:text-accent transition-colors">{folder.title}</h3>
                    {isShared && <Users size={12} className="text-purple-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] font-medium text-app-muted truncate">{fSubfolders.length > 0 ? `${fSubfolders.length} folders · ` : ''}{fTasks.length} tasks</p>
                    {progress !== null && (
                      <div className="flex items-center gap-1.5 ml-2 border-l border-app-border pl-2">
                        <div className="w-12 h-1.5 bg-app-bg rounded-full overflow-hidden"><div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} /></div>
                        <span className="text-[9px] font-bold text-app-muted">{progress}%</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="hidden group-hover:flex flex-col gap-0.5 ml-auto mr-2" onClick={e => e.stopPropagation()}>
                  <button onClick={(e) => { e.stopPropagation(); handleMoveFolderAction(folder.id, 'up'); }} className="p-1 hover:bg-black/5 rounded text-app-muted transition-colors">
                    <ChevronUp size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleMoveFolderAction(folder.id, 'down'); }} className="p-1 hover:bg-black/5 rounded text-app-muted transition-colors">
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                  <FolderActionsMenu 
                    folder={folder} onBulk={{ ticks: bulkResetFolderTicks, priorities: bulkResetFolderPriorities, colors: bulkClearFolderColors }} 
                    onDelete={(id) => setConfirmDelete({ open: true, title: 'Delete Folder', message: 'Delete this folder?', onConfirm: () => deleteFolder(id) })} 
                    onMove={setMovingFolder} onDuplicate={duplicateFolder} onUpdate={updateFolder} onRename={setRenamingFolder}
                    onShare={setSharingFolder}
                    onDeleteAllTasks={(id) => setConfirmDelete({ open: true, title: 'Clear Folder', message: 'Delete all tasks in this folder?', onConfirm: () => deleteAllFolderTasks(id) })}
                    onDeleteCompletedTasks={(id) => setConfirmDelete({ open: true, title: 'Clear Completed', message: 'Delete only completed tasks?', onConfirm: () => deleteCompletedFolderTasks(id) })}
                    autoSort={autoSort} setAutoSort={setAutoSort}
                    onLeave={(id) => setConfirmDelete({ open: true, title: 'Exit Team', message: 'Leave this team folder?', onConfirm: () => leaveFolder(id) })}
                    isOwner={subIsOwner}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tasks Section */}
      {folderId && (
        <div className="space-y-4">
          <div className="space-y-3">
            {(sortedTasks || []).map((task, index) => (
              task && (
                <TaskCard 
                key={task.id} 
                task={task} 
                index={index} 
                onUpdate={updateGroupedTask} 
                onDelete={(id) => setConfirmDelete({ open: true, title: 'Delete Task', message: 'Delete this task?', onConfirm: () => deleteGroupedTask(id) })} 
                onRename={setRenamingTask} 
                onSetIndex={(id, newIdx) => setTaskIndex(id, newIdx, folderId).then(() => fetchGroupedTasks(folderId))}
                isSharedFolder={currentFolder?.is_shared || breadcrumbs.some(b => b.is_shared)} 
                members={folderMembers[folderId] || folderMembers[breadcrumbs.find(b => b.is_shared)?.id] || []} 
                onAssign={assignTask} 
                onDragStart={onTaskDragStart}
                onDragOver={onTaskDragOver}
                onDrop={onTaskDrop}
                isDragging={draggedTaskId === task.id}
                onMoveDirection={handleMoveTask}
                isOwner={isOwner}
              />
            )
          ))}
            {addingTask && (
              <form onSubmit={handleAddTask} className="mt-4 animate-in slide-in-from-top-2 duration-200">
                <div className="bg-white border-2 border-accent rounded-2xl overflow-hidden shadow-xl shadow-accent/5">
                  <div className="flex items-center px-4">
                    <input 
                      ref={taskInputRef} 
                      value={taskInput} 
                      onChange={e => setTaskInput(e.target.value)} 
                      placeholder="Task name..." 
                      className="flex-1 py-4 text-sm font-bold focus:outline-none" 
                      autoFocus 
                    />
                    <div className="flex items-center gap-2 border-l border-app-border pl-3 ml-3">
                      <div className="relative group/date">
                        <button type="button" onClick={() => dateInputRef.current?.showPicker()} className={`p-2 rounded-lg transition-colors ${taskDeadline ? 'text-accent bg-accent/5' : 'text-app-muted hover:bg-app-bg'}`}>
                          <Calendar size={18} strokeWidth={3} />
                        </button>
                        <input ref={dateInputRef} type="date" value={taskDeadline} onChange={e => setTaskDeadline(e.target.value)} className="w-0 h-0 absolute opacity-0" />
                      </div>
                      <button type="submit" disabled={!taskInput.trim()} className="p-2 bg-accent text-white rounded-lg shadow-lg shadow-accent/20 transition-all active:scale-95 disabled:opacity-50">
                        <Plus size={20} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
            {!addingTask && folderId && folderTasks.length > 0 && (
              <button onClick={() => { setAddingTask(true); setTimeout(() => taskInputRef.current?.focus(), 100); }} className="w-full py-4 border-2 border-dashed border-app-border rounded-2xl text-app-muted font-bold hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2 group">
                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> New Task
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-28 md:bottom-8 right-8 z-40" ref={fabRef}>
        {fabOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col gap-3 animate-in slide-in-from-bottom-4 duration-200">
            <button onClick={() => { setAddingFolder(true); setFabOpen(false); }} className="flex items-center gap-3 bg-white border border-app-border px-5 py-3 rounded-2xl shadow-xl hover:border-accent transition-all group whitespace-nowrap">
              <Folder size={18} className="text-app-muted group-hover:text-accent" />
              <span className="text-sm font-bold text-app-heading">{folderId ? 'New Subfolder' : 'New Folder'}</span>
            </button>
            {folderId && (
              <button onClick={() => { setAddingTask(true); setFabOpen(false); setTimeout(() => taskInputRef.current?.focus(), 100); }} className="flex items-center gap-3 bg-white border border-app-border px-5 py-3 rounded-2xl shadow-xl hover:border-accent transition-all group whitespace-nowrap">
                <FileText size={18} className="text-app-muted group-hover:text-accent" />
                <span className="text-sm font-bold text-app-heading">New Task</span>
              </button>
            )}
          </div>
        )}
        <button onClick={() => setFabOpen(!fabOpen)} className="w-14 h-14 bg-accent text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-accent/30">
          <Plus size={28} strokeWidth={3} className={`transition-transform duration-300 ${fabOpen ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {/* Modals */}
      {addingFolder && <AddFolderModal parentId={folderId} onClose={() => setAddingFolder(false)} onAdd={addFolder} />}
      {movingFolder && <MoveFolderModal folder={movingFolder} folders={folders} onClose={() => setMovingFolder(null)} onMove={handleMoveFolder} />}
      {renamingFolder && <RenameModal initialTitle={renamingFolder.title} onClose={() => setRenamingFolder(null)} onRename={(title) => updateFolder(renamingFolder.id, { title })} />}
      {renamingTask && <RenameModal initialTitle={renamingTask.title} onClose={() => setRenamingTask(null)} onRename={(title) => updateGroupedTask(renamingTask.id, { title }).then(() => fetchGroupedTasks(folderId))} />}
      {sharingFolder && <ShareModal folder={sharingFolder} onClose={() => setSharingFolder(null)} />}
      
      <ConfirmModal 
        isOpen={confirmDelete.open} 
        title={confirmDelete.title} 
        message={confirmDelete.message} 
        onConfirm={() => { confirmDelete.onConfirm(); setConfirmDelete({ ...confirmDelete, open: false }); }} 
        onCancel={() => setConfirmDelete({ ...confirmDelete, open: false })} 
      />
    </div>
  );
}
