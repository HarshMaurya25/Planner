import { useState, useEffect, useRef } from 'react';
import { Plus, RotateCcw, Star, Palette, Trash2, X, Settings, Calendar, ListChecks, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import TaskCard from '../components/TaskCard';
import ConfirmModal from '../components/ConfirmModal';

function RenameModal({ initialTitle, onRename, onClose }) {
  const [title, setTitle] = useState(initialTitle);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-app-border animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-black text-app-heading mb-4">Rename Task</h3>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && title.trim() && (onRename(title.trim()), onClose())}
          className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl mb-6 focus:outline-none focus:border-accent font-medium"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-app-body hover:bg-app-bg rounded-xl transition-colors">Cancel</button>
          <button onClick={() => { onRename(title.trim()); onClose(); }} className="flex-1 py-3 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent-hover shadow-lg shadow-accent/20 transition-all active:scale-95">Save</button>
        </div>
      </div>
    </div>
  );
}

export default function SimpleTasksPage() {
  const { 
    simpleTasks, fetchSimpleTasks, addSimpleTask, updateSimpleTask, deleteSimpleTask,
    bulkResetSimpleTicks, bulkResetSimplePriorities, bulkClearSimpleColors, deleteAllSimpleTasks,
    deleteCompletedSimpleTasks, setTaskIndex,
    groupedTasks, fetchGroupedTasks, updateGroupedTask, fetchFolders, deleteGroupedTask
  } = useAppStore();
  const [taskInput, setTaskInput] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [autoSort, setAutoSort] = useState(true);
  const [sortBy, setSortBy] = useState('auto'); // 'auto' | 'date' | 'priority'
  const [showToday, setShowToday] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [renamingTask, setRenamingTask] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const dateInputRef = useRef(null);

  useEffect(() => { 
    fetchSimpleTasks(); 
    fetchFolders().then(() => fetchGroupedTasks());
  }, [fetchSimpleTasks, fetchGroupedTasks, fetchFolders]);

  const isToday = (dateString) => {
    if (!dateString) return false;
    const today = new Date().toLocaleDateString('en-CA');
    return dateString === today;
  };

  const displayTasks = showToday 
    ? [...simpleTasks, ...groupedTasks].filter(t => isToday(t.deadline))
    : simpleTasks;

  const handleAddTask = async (e) => {
    e?.preventDefault();
    if (!taskInput.trim()) return;
    const deadline = taskDeadline || (showToday ? new Date().toLocaleDateString('en-CA') : null);
    await addSimpleTask(taskInput, deadline); 
    setTaskInput(''); setTaskDeadline('');
  };

  const onDragStart = (e, id) => { setDraggedTaskId(id); e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const onDrop = async (e, targetId) => {
    e.preventDefault(); if (!draggedTaskId || draggedTaskId === targetId) return;
    const list = [...sortedTasks];
    const siblings = list.filter(t => t.id !== draggedTaskId);
    const targetIdx = siblings.findIndex(t => t.id === targetId);
    const draggedTask = list.find(t => t.id === draggedTaskId);
    await setTaskIndex(draggedTaskId, targetIdx, draggedTask?.folder_id);
    setDraggedTaskId(null);
    fetchSimpleTasks();
    if (showToday) fetchGroupedTasks();
  };

  const handleMoveTask = async (taskId, direction) => {
    const list = [...sortedTasks];
    const idx = list.findIndex(t => t.id === taskId);
    if (idx === -1) return;
    const task = list[idx];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    await setTaskIndex(taskId, targetIdx, task.folder_id);
    fetchSimpleTasks();
    if (showToday) fetchGroupedTasks();
  };

  const handleUpdateTask = async (taskId, updates) => {
    const task = [...simpleTasks, ...groupedTasks].find(t => t.id === taskId);
    if (!task) return;
    if (task.folder_id) {
      await updateGroupedTask(taskId, updates);
    } else {
      await updateSimpleTask(taskId, updates);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const task = [...simpleTasks, ...groupedTasks].find(t => t.id === taskId);
    if (!task) return;
    if (task.folder_id) {
      await deleteGroupedTask(taskId);
    } else {
      await deleteSimpleTask(taskId);
    }
  };

  const sortedTasks = [...displayTasks].sort((a, b) => {
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
    <div className="max-w-2xl mx-auto w-full py-8 px-4 md:px-6 mb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-app-heading tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <ListChecks size={24} strokeWidth={2.5} />
            </div>
            Tasks
          </h1>
          <p className="text-xs font-bold text-app-muted mt-1 uppercase tracking-widest ml-14">Daily WorkFlow</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative group/menu">
            <button className="p-2.5 bg-white border border-app-border rounded-xl text-app-muted hover:text-app-body hover:border-accent transition-all shadow-sm">
              <Settings size={20} />
            </button>
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-app-border rounded-2xl shadow-xl py-2 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-50">
              <div className="px-4 py-2 border-b border-app-border mb-1">
                <p className="text-[10px] font-black text-app-muted uppercase tracking-widest">Management</p>
              </div>
              <button onClick={() => setAutoSort(!autoSort)} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-app-body hover:bg-app-bg transition-colors">
                <div className={`w-4 h-4 rounded border-2 transition-colors flex items-center justify-center ${autoSort ? 'bg-accent border-accent' : 'border-app-border'}`}>
                  {autoSort && <Check size={10} className="text-white" strokeWidth={4} />}
                </div>
                Auto-sort tasks
              </button>
              <button onClick={() => setSortBy(sortBy === 'date' ? 'auto' : 'date')} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-app-body hover:bg-app-bg transition-colors">
                <div className={`w-4 h-4 rounded border-2 transition-colors flex items-center justify-center ${sortBy === 'date' ? 'bg-accent border-accent' : 'border-app-border'}`}>
                  {sortBy === 'date' && <Check size={10} className="text-white" strokeWidth={4} />}
                </div>
                Sort by Date
              </button>
              <button onClick={bulkResetSimpleTicks} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-app-body hover:bg-app-bg transition-colors">
                <RotateCcw size={16} className="text-app-muted" /> Reset all ticks
              </button>
              <button onClick={bulkResetSimplePriorities} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-app-body hover:bg-app-bg transition-colors">
                <Star size={16} className="text-app-muted" /> Clear priorities
              </button>
              <button onClick={bulkClearSimpleColors} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-app-body hover:bg-app-bg transition-colors">
                <Palette size={16} className="text-app-muted" /> Clear colors
              </button>
              <div className="h-px bg-app-border my-1 mx-2" />
              <button 
                onClick={() => setConfirmDelete({ open: true, title: 'Clear Completed', message: 'Delete only completed tasks?', onConfirm: deleteCompletedSimpleTasks })}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} /> Delete completed tasks
              </button>
              <button 
                onClick={() => setConfirmDelete({ open: true, title: 'Clear All Tasks', message: 'Delete all tasks in this list?', onConfirm: deleteAllSimpleTasks })}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold text-red-500/50 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} /> Delete all tasks
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex justify-start mb-6">
        <div className="relative flex bg-app-bg/50 backdrop-blur-md border border-app-border rounded-full p-1 w-48 h-10 shadow-inner">
          {/* Sliding Background */}
          <div 
            className="absolute left-1 top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${showToday ? '100%' : '0%'})` }}
          />
          
          <button
            onClick={() => setShowToday(false)}
            className={`relative flex-1 flex items-center justify-center gap-1.5 text-[10px] font-black tracking-widest transition-colors duration-300 ${!showToday ? 'text-accent' : 'text-app-muted hover:text-app-body'}`}
          >
            <ListChecks size={12} strokeWidth={3} />
            ALL
          </button>
          
          <button
            onClick={() => setShowToday(true)}
            className={`relative flex-1 flex items-center justify-center gap-1.5 text-[10px] font-black tracking-widest transition-colors duration-300 ${showToday ? 'text-accent' : 'text-app-muted hover:text-app-body'}`}
          >
            <Calendar size={12} strokeWidth={3} />
            TODAY
          </button>
        </div>
      </div>

      {/* Input Section */}
      <form onSubmit={handleAddTask} className="mb-8 space-y-3">
        <div className="relative group">
          <input
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full pl-6 pr-32 py-5 bg-white border-2 border-app-border rounded-3xl text-sm font-bold placeholder:text-app-muted/50 focus:outline-none focus:border-accent shadow-sm transition-all group-hover:border-accent/30"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => dateInputRef.current?.showPicker()}
              className={`p-2.5 rounded-xl transition-all ${taskDeadline ? 'bg-accent/10 text-accent border border-accent/20' : 'text-app-muted hover:bg-app-bg border border-transparent'}`}
              title={taskDeadline ? `Due: ${taskDeadline}` : 'Add deadline'}
            >
              <Calendar size={18} />
              <input
                ref={dateInputRef}
                type="date"
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
                className="w-0 h-0 opacity-0 absolute"
              />
            </button>
            <button
              type="submit"
              disabled={!taskInput.trim()}
              className="bg-accent text-white p-2.5 rounded-xl shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      </form>

      {/* Tasks List */}
      <div className="space-y-3">
        {sortedTasks.map((task, index) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            index={index}
            onUpdate={handleUpdateTask} 
            onDelete={(id) => setConfirmDelete({ open: true, title: 'Delete Task', message: 'Are you sure you want to delete this task?', onConfirm: () => handleDeleteTask(id) })} 
            onRename={setRenamingTask}
            onSetIndex={(id, newIdx) => setTaskIndex(id, newIdx, task.folder_id).then(() => { fetchSimpleTasks(); if (showToday) fetchGroupedTasks(); })}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            isDragging={draggedTaskId === task.id}
            onMoveDirection={handleMoveTask}
          />
        ))}
        {sortedTasks.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-white border-2 border-dashed border-app-border rounded-3xl flex items-center justify-center text-app-muted/30 mb-4 animate-pulse">
              {showToday ? <Calendar size={32} /> : <Plus size={32} />}
            </div>
            <p className="text-sm font-bold text-app-muted">
              {showToday ? "No tasks scheduled for today." : "No tasks yet. Start by adding one above!"}
            </p>
          </div>
        )}
      </div>

      {renamingTask && (
        <RenameModal 
          initialTitle={renamingTask.title} 
          onRename={(title) => handleUpdateTask(renamingTask.id, { title }).then(() => { fetchSimpleTasks(); if (showToday) fetchGroupedTasks(); })} 
          onClose={() => setRenamingTask(null)} 
        />
      )}

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
