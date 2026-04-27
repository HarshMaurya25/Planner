import { useState, useRef, useEffect } from 'react';
import { Check, Star, Palette, Trash2, MoreHorizontal, Edit2, UserPlus, X, ChevronUp, ChevronDown, ExternalLink, FileText, Link as LinkIcon, LogOut, Calendar } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import NoteRenderer from './NoteRenderer';
import NoteModal from './NoteModal';

const TASK_COLORS = {
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300' },
  green:  { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300' },
  yellow: { bg: 'bg-yellow-100', text: 'text-amber-800', border: 'border-amber-300' },
  red:    { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
};

const PRIORITY_STYLES = {
  high:   'text-red-600',
  medium: 'text-amber-600',
  low:    'text-blue-600',
};

const isUrl = (str) => {
  if (!str) return false;
  const trimmed = str.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('www.');
};

const formatLink = (str) => {
  if (!str) return '';
  if (str.startsWith('www.')) return 'https://' + str;
  return str;
};

export default function TaskCard({ 
  task, index, onUpdate, onDelete, onRename, onSetIndex,
  isSharedFolder, members = [], onAssign,
  onDragStart, onDragOver, onDrop, isDragging,
  onMoveDirection,
  isOwner = true // Default to true for non-shared tasks
}) {
  const { showCreatedDates } = useAppStore();
  const [showControls, setShowControls] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAssignPicker, setShowAssignPicker] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const cardRef = useRef(null);
  const colorRef = useRef(null);
  const assignRef = useRef(null);
  const dateInputRef = useRef(null);

  const isCompleted = task.status === 'completed';
  const colorStyle = (task.color && TASK_COLORS[task.color]) ? TASK_COLORS[task.color] : { bg: 'bg-white', text: 'text-app-body', border: 'border-app-border' };
  const assignedMember = members.find(m => m.user_id === task.assigned_to);
  const titleIsUrl = isUrl(task.title);
  const noteIsUrl = isUrl(task.description);

  // Close controls on outside click
  useEffect(() => {
    if (!showControls) return;
    const handler = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setShowControls(false);
        setShowColorPicker(false);
        setShowAssignPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showControls]);



  const handleToggleTick = (e) => {
    e.stopPropagation();
    onUpdate?.(task.id, { status: isCompleted ? 'not_done' : 'completed' });
  };

  const handleTogglePriority = (e) => {
    e.stopPropagation();
    const cycle = [null, 'low', 'medium', 'high'];
    const idx = cycle.indexOf(task.priority ?? null);
    onUpdate?.(task.id, { priority: cycle[(idx + 1) % cycle.length] });
  };

  const handleColorSelect = (color) => {
    onUpdate?.(task.id, { color: color === task.color ? null : color });
    setShowColorPicker(false);
  };

  const handleAssign = (userId) => {
    onAssign?.(task.id, userId === task.assigned_to ? null : userId);
    setShowAssignPicker(false);
  };



  const [showIndexModal, setShowIndexModal] = useState(false);
  const [newIndexValue, setNewIndexValue] = useState((index + 1).toString());

  const handleIndexClick = (e) => {
    e.stopPropagation();
    setNewIndexValue((index + 1).toString());
    setShowIndexModal(true);
  };

  const handleIndexSubmit = (e) => {
    e?.preventDefault();
    const idx = parseInt(newIndexValue) - 1;
    if (!isNaN(idx) && idx !== index) {
      onSetIndex?.(task.id, idx);
    }
    setShowIndexModal(false);
  };

  return (
    <div
      ref={cardRef}
      draggable={true}
      onDragStart={(e) => onDragStart?.(e, task.id)}
      onDragOver={(e) => onDragOver?.(e)}
      onDrop={(e) => onDrop?.(e, task.id)}
      onClick={() => setIsExpanded(!isExpanded)}
      className={`
        group relative flex flex-col gap-1 p-4 rounded-2xl border transition-all duration-200 cursor-pointer w-full
        ${colorStyle.bg} ${colorStyle.border} 
        ${isExpanded ? 'ring-2 ring-accent/10 shadow-lg' : ''}
        ${isCompleted ? 'opacity-50 grayscale-[0.5]' : 'shadow-card hover:shadow-card-hover'}
        ${isDragging ? 'opacity-40 border-dashed bg-app-bg' : ''}
      `}
    >
      <div className="flex items-center gap-4">
        {/* Index Badge (Handle) */}
        <div 
          onClick={handleIndexClick}
          className={`text-[10px] font-black text-app-muted bg-black/5 hover:bg-accent/10 hover:text-accent w-8 h-8 rounded-lg flex flex-col items-center justify-center shrink-0 transition-all select-none cursor-grab active:cursor-grabbing`}
          title="Drag to reorder or tap to move"
        >
          {(index + 1).toString().padStart(2, '0')}
        </div>

        {/* Tick Button */}
        <button
          onClick={handleToggleTick}
          className={`
            w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all
            ${isCompleted ? 'bg-accent border-accent text-white' : 'border-app-border bg-white group-hover:border-accent'}
          `}
        >
          {isCompleted && <Check size={14} strokeWidth={3} />}
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {titleIsUrl ? (
              <a 
                href={formatLink(task.title)} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={e => e.stopPropagation()}
                className={`text-sm font-bold flex items-center gap-1 hover:underline break-words ${colorStyle.text} ${isCompleted ? 'line-through opacity-60' : ''} ${isExpanded ? '' : 'truncate'}`}
              >
                {task.title}
                <ExternalLink size={12} className="shrink-0" />
                {task.description && <FileText size={10} className="text-app-muted shrink-0 mt-0.5" />}
              </a>
            ) : (
              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                <p className={`text-sm font-bold break-words ${colorStyle.text} ${isCompleted ? 'line-through opacity-60' : ''} ${isExpanded ? '' : 'truncate'}`}>
                  {task.title}
                </p>
                {task.description && <FileText size={10} className="text-app-muted shrink-0 mt-0.5" />}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {task.deadline && (
              <p className="text-[10px] font-bold text-app-muted uppercase tracking-wider">
                Due {new Date(task.deadline).toLocaleDateString('en-GB')}
              </p>
            )}
            {showCreatedDates && (
              <p className="text-[10px] font-bold text-app-muted uppercase tracking-wider">
                Created {new Date(task.created_at).toLocaleDateString('en-GB')}
              </p>
            )}
            {assignedMember && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md">
                <span className="w-3.5 h-3.5 rounded-full bg-purple-200 text-purple-700 text-[8px] font-black flex items-center justify-center">
                  {assignedMember.username.charAt(0).toUpperCase()}
                </span>
                {assignedMember.username}
              </span>
            )}
          </div>
        </div>

        {/* Status Icons / Controls Trigger */}
        <div className="flex items-center gap-2">
          {task.priority && (
            <Star size={14} className={PRIORITY_STYLES[task.priority] || 'text-app-muted'} fill="currentColor" />
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); setShowControls(!showControls); }}
            className={`p-1.5 rounded-lg transition-all ${showControls ? 'bg-accent text-white shadow-md scale-110' : 'bg-black/5 text-app-muted hover:bg-black/10'}`}
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Note / Description (Visible only when expanded) */}
      {task.description && isExpanded && (
        <div className="ml-12 mt-2 overflow-hidden animate-in slide-in-from-top-1 duration-200" onClick={e => { e.stopPropagation(); setShowNoteModal(true); }}>
          <NoteRenderer text={task.description} />
        </div>
      )}

      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white/95 backdrop-blur-sm p-1 rounded-xl shadow-lg border border-app-border animate-in fade-in slide-in-from-right-2 duration-150 z-10" onClick={e => e.stopPropagation()}>
          <button onClick={handleTogglePriority} className="p-2 rounded-lg hover:bg-app-bg text-app-muted transition-colors" title="Toggle Priority">
            <Star size={16} className={task.priority ? PRIORITY_STYLES[task.priority] : ''} fill={task.priority ? 'currentColor' : 'none'} />
          </button>
          
          <button onClick={() => { setShowNoteModal(true); setShowControls(false); }} className="p-2 rounded-lg hover:bg-app-bg text-app-muted transition-colors" title="Add Note">
            <FileText size={16} />
          </button>

          <button onClick={(e) => { e.stopPropagation(); onRename?.(task); setShowControls(false); }} className="p-2 rounded-lg hover:bg-app-bg text-app-muted transition-colors" title="Rename Task">
            <Edit2 size={16} />
          </button>

          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); dateInputRef.current?.showPicker(); }} 
              className={`p-2 rounded-lg transition-colors ${task.deadline ? 'text-accent hover:bg-accent/5' : 'text-app-muted hover:bg-app-bg'}`} 
              title="Change Date"
            >
              <Calendar size={16} />
            </button>
            <input 
              ref={dateInputRef}
              type="date"
              value={task.deadline || ''}
              onChange={(e) => { onUpdate?.(task.id, { deadline: e.target.value || null }); setShowControls(false); }}
              className="w-0 h-0 absolute opacity-0"
              onClick={e => e.stopPropagation()}
            />
          </div>

          {onMoveDirection && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onMoveDirection(task.id, 'up'); setShowControls(false); }} className="p-2 rounded-lg hover:bg-app-bg text-app-muted transition-colors" title="Move Up">
                <ChevronUp size={16} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onMoveDirection(task.id, 'down'); setShowControls(false); }} className="p-2 rounded-lg hover:bg-app-bg text-app-muted transition-colors" title="Move Down">
                <ChevronDown size={16} />
              </button>
            </>
          )}
          
          <div className="relative" ref={colorRef}>
            <button onClick={() => setShowColorPicker(!showColorPicker)} className="p-2 rounded-lg hover:bg-app-bg text-app-muted transition-colors" title="Pick Color">
              <Palette size={16} />
            </button>
            {showColorPicker && (
              <div className="absolute right-0 bottom-12 z-50 bg-white border border-app-border rounded-xl shadow-xl p-2 flex gap-1 animate-in zoom-in-95 duration-100">
                {['blue', 'green', 'yellow', 'red', 'purple'].map(c => (
                  <button key={c} onClick={() => handleColorSelect(c)} className={`w-6 h-6 rounded-full ${TASK_COLORS[c].bg} border border-black/5 hover:scale-110 transition-transform`} />
                ))}
                <button onClick={() => handleColorSelect(null)} className="w-6 h-6 rounded-full border border-app-border bg-white hover:scale-110 transition-transform" />
              </div>
            )}
          </div>

          {/* Assign Button (only in shared folders) */}
          {isSharedFolder && members.length > 0 && (
            <div className="relative" ref={assignRef}>
              <button onClick={() => setShowAssignPicker(!showAssignPicker)} className={`p-2 rounded-lg hover:bg-app-bg transition-colors ${task.assigned_to ? 'text-purple-500' : 'text-app-muted'}`}>
                <UserPlus size={16} />
              </button>
              {showAssignPicker && (
                <div className="absolute right-0 bottom-12 z-50 bg-white border border-app-border rounded-xl shadow-xl py-1 min-w-[160px] animate-in zoom-in-95 duration-100">
                  <p className="px-3 py-1.5 text-[10px] font-black text-app-muted uppercase tracking-widest">Assign to</p>
                  {task.assigned_to && (
                    <button onClick={() => handleAssign(null)} className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors">
                      <X size={12} /> Unassign
                    </button>
                  )}
                  {members.map(m => (
                    <button
                      key={m.user_id}
                      onClick={() => handleAssign(m.user_id)}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium hover:bg-app-bg transition-colors ${task.assigned_to === m.user_id ? 'text-accent font-bold bg-accent/5' : 'text-app-body'}`}
                    >
                      <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-[9px] font-black flex items-center justify-center shrink-0">
                        {m.username.charAt(0).toUpperCase()}
                      </span>
                      {m.username}
                      {task.assigned_to === m.user_id && <Check size={12} className="ml-auto text-accent" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {isOwner && (
            <button onClick={() => onDelete?.(task.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Delete">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}
      {showIndexModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={e => e.stopPropagation()}>
          <div className="bg-white rounded-2xl shadow-2xl border border-app-border w-full max-w-[280px] p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-app-heading mb-4 text-center">Change Position</h3>
            <form onSubmit={handleIndexSubmit}>
              <input 
                autoFocus
                type="number"
                value={newIndexValue}
                onChange={e => setNewIndexValue(e.target.value)}
                className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl text-center text-lg font-black text-accent focus:outline-none focus:border-accent mb-6"
                placeholder="Index..."
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowIndexModal(false)} className="flex-1 py-3 text-sm font-bold text-app-body hover:bg-app-bg rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-accent text-white rounded-xl text-sm font-bold shadow-lg shadow-accent/20 transition-all active:scale-95">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showNoteModal && (
        <NoteModal 
          initialText={task.description}
          onSave={(newText) => onUpdate?.(task.id, { description: newText || null })}
          onClose={() => setShowNoteModal(false)}
        />
      )}
    </div>
  );
}
