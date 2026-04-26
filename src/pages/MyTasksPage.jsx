import { useState, useEffect, useMemo, useRef } from 'react';
import { User, Calendar, Folder, Filter, ArrowUpDown, Check, LayoutGrid, MoreHorizontal, Edit2, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const TASK_COLORS = {
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300' },
  green:  { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  red:    { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function RenameModal({ initialTitle, onClose, onRename }) {
  const [title, setTitle] = useState(initialTitle);
  const inputRef = useRef(null);
  useEffect(() => inputRef.current?.focus(), []);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-app-border w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-app-heading mb-4">Rename Task</h3>
        <input 
          ref={inputRef} 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl text-sm focus:outline-none focus:border-accent mb-6 font-medium"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-app-body hover:bg-app-bg rounded-xl transition-colors">Cancel</button>
          <button onClick={() => { onRename(title.trim()); onClose(); }} className="flex-1 py-3 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent-hover shadow-lg shadow-accent/20 transition-all active:scale-95">Save</button>
        </div>
      </div>
    </div>
  );
}

function TaskItem({ task, onToggle, onRename, folderPath }) {
  const [showMenu, setShowMenu] = useState(false);
  const colorStyle = task.color ? TASK_COLORS[task.color] : { bg: 'bg-white', text: 'text-app-body', border: 'border-app-border' };
  const isDone = task.status === 'completed';
  const folderName = folderPath || 'Personal Tasks';
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  return (
    <div className={`relative flex items-start gap-4 p-4 rounded-2xl border transition-all ${colorStyle.bg} ${colorStyle.border} ${isDone ? 'opacity-50' : 'shadow-card hover:shadow-card-hover'}`}>
      <button
        onClick={() => onToggle(task)}
        className={`w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all mt-0.5 ${isDone ? 'bg-accent border-accent text-white' : 'border-app-border bg-white hover:border-accent'}`}
      >
        {isDone && <Check size={14} strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${colorStyle.text} ${isDone ? 'line-through' : ''}`}>
          {task.title}
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
          <span className="flex items-center gap-1 text-[10px] font-bold text-app-muted">
            <Folder size={10} /> {folderName}
          </span>
          {task.deadline && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-app-muted">
              <Calendar size={10} /> {new Date(task.deadline).toLocaleDateString()}
            </span>
          )}
          {task.priority && (
            <span className={`text-[10px] font-black uppercase tracking-widest ${
              task.priority === 'high' ? 'text-red-500' : task.priority === 'medium' ? 'text-amber-500' : 'text-blue-500'
            }`}>
              {task.priority}
            </span>
          )}
        </div>
      </div>

      <div className="relative shrink-0" ref={menuRef}>
        <button 
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="p-1.5 hover:bg-black/5 rounded-lg text-app-muted transition-colors"
        >
          <MoreHorizontal size={16} />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-app-border rounded-xl shadow-xl py-1 z-10 animate-in zoom-in-95 duration-100">
            <button 
              onClick={(e) => { e.stopPropagation(); onRename(task); setShowMenu(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-app-body hover:bg-app-bg transition-colors"
            >
              <Edit2 size={12} className="text-app-muted" /> Rename
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyTasksPage() {
  const { myTasks, fetchMyTasks, updateGroupedTask, folders } = useAppStore();
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('deadline');
  const [groupByFolder, setGroupByFolder] = useState(true);
  const [renamingTask, setRenamingTask] = useState(null);
  const [folderFilterId, setFolderFilterId] = useState(null);
  const [showFolderFilter, setShowFolderFilter] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => { fetchMyTasks(); }, [fetchMyTasks]);

  useEffect(() => {
    if (!showFolderFilter) return;
    const handler = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setShowFolderFilter(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFolderFilter]);

  const isChildOf = (childId, parentId) => {
    if (!childId || !parentId) return false;
    if (childId === parentId) return true;
    let current = folders.find(f => f.id === childId);
    while (current && current.parent_id) {
      if (current.parent_id === parentId) return true;
      current = folders.find(f => f.id === current.parent_id);
    }
    return false;
  };

  const getFolderPath = (folderId) => {
    if (!folderId || !folders.length) return 'Personal Tasks';
    const path = [];
    let current = folders.find(f => f.id === folderId);
    while (current) {
      path.unshift(current.title);
      current = folders.find(f => f.id === current.parent_id);
    }
    return path.join(' / ');
  };

  const filteredTasks = myTasks.filter(t => {
    const matchesStatus = filter === 'all' || (filter === 'completed' ? t.status === 'completed' : t.status !== 'completed');
    const matchesFolder = !folderFilterId || isChildOf(t.folder_id, folderFilterId);
    return matchesStatus && matchesFolder;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sort === 'priority') {
      const pa = PRIORITY_ORDER[a.priority] ?? 3;
      const pb = PRIORITY_ORDER[b.priority] ?? 3;
      return pa - pb;
    }
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline) - new Date(b.deadline);
  });

  const groupedByFolderData = useMemo(() => {
    const groups = {};
    sortedTasks.forEach(task => {
      const folderId = task.folder_id || 'no-folder';
      if (!groups[folderId]) {
        groups[folderId] = { 
          title: getFolderPath(task.folder_id), 
          tasks: [] 
        };
      }
      groups[folderId].tasks.push(task);
    });
    return Object.values(groups);
  }, [sortedTasks, folders]);

  const handleToggle = async (task) => {
    await updateGroupedTask(task.id, { status: task.status === 'completed' ? 'not_done' : 'completed' });
    fetchMyTasks();
  };

  const handleRename = async (title) => {
    if (!renamingTask) return;
    await updateGroupedTask(renamingTask.id, { title });
    fetchMyTasks();
  };

  const counts = {
    all: myTasks.length,
    pending: myTasks.filter(t => t.status !== 'completed').length,
    completed: myTasks.filter(t => t.status === 'completed').length,
  };

  return (
    <div className="max-w-2xl mx-auto w-full py-8 px-4 md:px-6 mb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-app-heading tracking-tight flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <User size={20} strokeWidth={2.5} />
            </div>
            My Tasks
          </h1>
          <p className="text-xs font-bold text-app-muted mt-1 uppercase tracking-widest ml-12">
            {counts.pending} pending · {counts.completed} done
          </p>
        </div>
        <button
          onClick={() => setGroupByFolder(!groupByFolder)}
          className={`p-2.5 rounded-xl border transition-all ${groupByFolder ? 'bg-accent/10 border-accent text-accent' : 'bg-white border-app-border text-app-muted hover:bg-app-bg'}`}
          title={groupByFolder ? "Grouping by Folder" : "Group by Folder"}
        >
          <LayoutGrid size={20} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex bg-white border border-app-border rounded-xl p-0.5 shadow-sm">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'completed', label: 'Done' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filter === f.key ? 'bg-accent text-white shadow-sm' : 'text-app-muted hover:text-app-body'}`}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>
        
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFolderFilter(!showFolderFilter)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${folderFilterId ? 'bg-accent/10 border-accent text-accent' : 'bg-white border-app-border text-app-body hover:bg-app-bg'}`}
          >
            <Filter size={14} className={folderFilterId ? 'text-accent' : 'text-app-muted'} />
            {folderFilterId ? folders.find(f => f.id === folderFilterId)?.title : 'All Folders'}
          </button>
          
          {showFolderFilter && (
            <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-app-border rounded-2xl shadow-xl py-2 z-[60] max-h-80 overflow-y-auto animate-in zoom-in-95 duration-100 no-scrollbar">
              <button
                onClick={() => { setFolderFilterId(null); setShowFolderFilter(false); }}
                className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium transition-colors border-b border-app-border ${!folderFilterId ? 'bg-accent/5 text-accent font-bold' : 'text-app-body hover:bg-app-bg'}`}
              >
                All Folders
              </button>
              {folders.sort((a,b) => a.title.localeCompare(b.title)).map(f => (
                <button
                  key={f.id}
                  onClick={() => { setFolderFilterId(f.id); setShowFolderFilter(false); }}
                  className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium transition-colors ${folderFilterId === f.id ? 'bg-accent/5 text-accent font-bold' : 'text-app-body hover:bg-app-bg'}`}
                >
                  <Folder size={14} className="opacity-40" />
                  <span className="truncate">{getFolderPath(f.id)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setSort(sort === 'deadline' ? 'priority' : 'deadline')}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-app-border rounded-xl text-xs font-bold text-app-body shadow-sm hover:bg-app-bg transition-colors"
        >
          <ArrowUpDown size={14} className="text-app-muted" />
          {sort === 'deadline' ? 'By Deadline' : 'By Priority'}
        </button>
      </div>

      <div className="space-y-6">
        {groupByFolder ? (
          groupedByFolderData.map(group => (
            <div key={group.title} className="space-y-3">
              <h3 className="text-[10px] font-black text-app-muted uppercase tracking-widest flex items-center gap-2 px-2">
                <Folder size={12} className="text-accent" /> {group.title}
                <span className="ml-auto opacity-50">{group.tasks.length}</span>
              </h3>
              <div className="space-y-3">
                {group.tasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onToggle={handleToggle} 
                    onRename={setRenamingTask} 
                    folderPath={group.title}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-3">
            {sortedTasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onToggle={handleToggle} 
                onRename={setRenamingTask} 
                folderPath={getFolderPath(task.folder_id)}
              />
            ))}
          </div>
        )}

        {sortedTasks.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-white border-2 border-dashed border-app-border rounded-3xl flex items-center justify-center text-app-muted/30 mb-4">
              <User size={32} />
            </div>
            <p className="text-sm font-bold text-app-muted">
              {filter === 'all' ? 'No tasks assigned to you yet.' : `No ${filter} tasks.`}
            </p>
          </div>
        )}
      </div>

      {renamingTask && (
        <RenameModal 
          initialTitle={renamingTask.title} 
          onClose={() => setRenamingTask(null)} 
          onRename={handleRename} 
        />
      )}
    </div>
  );
}
