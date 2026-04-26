import { useState, useEffect, useRef } from 'react';
import { Plus, RotateCcw, Star, Palette, Trash2, X, Settings, Calendar, ListChecks, Hash, Check } from 'lucide-react';
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
    setTaskIndex
  } = useAppStore();
  const [taskInput, setTaskInput] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [autoSort, setAutoSort] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [renamingTask, setRenamingTask] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const dateInputRef = useRef(null);

  useEffect(() => { fetchSimpleTasks(); }, [fetchSimpleTasks]);

  const handleAddTask = async (e) => {
    e?.preventDefault();
    if (!taskInput.trim()) return;
    await addSimpleTask(taskInput, taskDeadline || null); 
    setTaskInput(''); setTaskDeadline('');
  };

  const onDragStart = (e, id) => { setDraggedTaskId(id); e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const onDrop = async (e, targetId) => {
    e.preventDefault(); if (!draggedTaskId || draggedTaskId === targetId) return;
    const siblings = sortedTasks.filter(t => t.id !== draggedTaskId);
    const targetIdx = siblings.findIndex(t => t.id === targetId);
    let newPos;
    if (targetIdx === 0) newPos = (siblings[0].position || 0) - 1;
    else if (targetIdx === siblings.length - 1) newPos = (siblings[siblings.length - 1].position || 0) + 1;
    else newPos = ((siblings[targetIdx].position || 0) + (siblings[targetIdx - 1].position || 0)) / 2;
    await setTaskIndex(draggedTaskId, targetIdx); setDraggedTaskId(null);
    fetchSimpleTasks();
  };

  const handleMoveTask = async (taskId, direction) => {
    const list = [...sortedTasks];
    const idx = list.findIndex(t => t.id === taskId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    await setTaskIndex(taskId, targetIdx);
    fetchSimpleTasks();
  };

  const sortedTasks = autoSort 
    ? [...simpleTasks].sort((a, b) => {
        if (a.status !== b.status) return a.status === 'completed' ? 1 : -1;
        const pOrder = { high: 0, medium: 1, low: 2 };
        const pa = pOrder[a.priority] ?? 3;
        const pb = pOrder[b.priority] ?? 3;
        if (pa !== pb) return pa - pb;
        return (a.position || 0) - (b.position || 0);
      })
    : [...simpleTasks].sort((a, b) => (a.position || 0) - (b.position || 0));

  return (
    <div className="max-w-2xl mx-auto w-full py-8 px-4 md:px-6 mb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-app-heading tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <ListChecks size={24} strokeWidth={2.5} />
            </div>
            Tasks
          </h1>
          <p className="text-xs font-bold text-app-muted mt-1 uppercase tracking-widest ml-14">Daily Planner</p>
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
                onClick={() => setConfirmDelete({ open: true, title: 'Clear All Tasks', message: 'Delete all tasks in this list?', onConfirm: deleteAllSimpleTasks })}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} /> Delete all tasks
              </button>
            </div>
          </div>
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
            onUpdate={updateSimpleTask} 
            onDelete={(id) => setConfirmDelete({ open: true, title: 'Delete Task', message: 'Are you sure you want to delete this task?', onConfirm: () => deleteSimpleTask(id) })} 
            onRename={setRenamingTask}
            onSetIndex={(id, newIdx) => setTaskIndex(id, newIdx).then(() => fetchSimpleTasks())}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            isDragging={draggedTaskId === task.id}
            onMoveDirection={handleMoveTask}
          />
        ))}
        {simpleTasks.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-white border-2 border-dashed border-app-border rounded-3xl flex items-center justify-center text-app-muted/30 mb-4 animate-pulse">
              <Plus size={32} />
            </div>
            <p className="text-sm font-bold text-app-muted">No tasks yet. Start by adding one above!</p>
          </div>
        )}
      </div>

      {renamingTask && (
        <RenameModal 
          initialTitle={renamingTask.title} 
          onRename={(title) => updateSimpleTask(renamingTask.id, { title }).then(() => fetchSimpleTasks())} 
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
