import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, X, CalIcon, MoreVertical, Trash2, Check, User, Edit2, FileText
} from 'lucide-react';
import NoteModal from '../components/NoteModal';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek,
  parseISO
} from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import ConfirmModal from '../components/ConfirmModal';

const COLOR_STYLES = {
  blue:   { bg: 'bg-[#BFDBFE]', text: 'text-blue-700', dot: '#3B82F6' },
  green:  { bg: 'bg-[#BBF7D0]', text: 'text-green-700', dot: '#22C55E' },
  yellow: { bg: 'bg-[#FEF3C7]', text: 'text-amber-700', dot: '#F59E0B' },
  red:    { bg: 'bg-[#FECACA]', text: 'text-red-700', dot: '#EF4444' },
  purple: { bg: 'bg-[#E9D5FF]', text: 'text-purple-700', dot: '#A855F7' },
  default: { bg: 'bg-[#BFDBFE]', text: 'text-blue-700', dot: '#3B82F6' },
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function DateModal({ defaultDate, onClose, onAction, mode = 'event', editingItem = null }) {
  const [title, setTitle] = useState(editingItem ? editingItem.title : '');
  const [date, setDate] = useState(editingItem ? editingItem.date : (defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')));
  const [color, setColor] = useState(editingItem ? editingItem.color || 'blue' : 'blue');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    await onAction(title.trim(), date, color, editingItem?.id);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-app-border w-full max-w-sm p-6 my-8 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-app-heading">
            {editingItem ? 'Edit Date' : (mode === 'event' ? 'Mark Date' : 'New Task')}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-app-bg rounded-lg text-app-muted transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-app-muted uppercase tracking-widest mb-1.5">{mode === 'event' ? 'Event Name' : 'Task Name'}</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={mode === 'event' ? "e.g. Exam, Birthday, Deadline" : "What needs to be done?"}
              className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-app-muted uppercase tracking-widest mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl text-sm focus:outline-none focus:border-accent"
            />
          </div>
          {mode === 'event' && (
            <div>
              <label className="block text-[10px] font-bold text-app-muted uppercase tracking-widest mb-1.5">Color</label>
              <div className="flex gap-2.5">
                {Object.entries(COLOR_STYLES).filter(([k]) => k !== 'default').map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setColor(key)}
                    style={{ backgroundColor: val.dot }}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${color === key ? 'border-white ring-2 ring-accent scale-110' : 'border-transparent'}`}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-app-body hover:bg-app-bg rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!title.trim() || loading}
              className="flex-1 py-3 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent-hover disabled:opacity-40 shadow-lg shadow-accent/20 transition-all active:scale-95">
              {loading ? 'Saving…' : (editingItem ? 'Save Changes' : (mode === 'event' ? 'Add Date' : 'Create Task'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CalendarMenu({ onClearPast }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 hover:bg-app-bg rounded-xl transition-colors text-app-muted"
      >
        <MoreVertical size={20} />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 bg-white border border-app-border rounded-xl shadow-xl py-2 min-w-[200px] overflow-hidden animate-in fade-in zoom-in duration-100">
          <div className="px-4 py-1.5 text-[10px] font-bold text-app-muted uppercase tracking-widest border-b border-app-border mb-1">Actions</div>
          <button
            onClick={() => { setConfirmClear(true); setOpen(false); }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} /> Clear all past dates
          </button>
        </div>
      )}
    </div>
  );
}

function DayCell({ day, isCurrentMonth, isToday, isSelected, tasks, importantDates, onClick }) {
  const allItems = [
    ...importantDates.map(d => ({ ...d, _type: 'date' })),
    ...tasks.map(t => ({ ...t, _type: 'task' })),
  ];

  const firstEventColor = importantDates[0]?.color;
  const cellColorStyle = firstEventColor ? COLOR_STYLES[firstEventColor] : null;

  return (
    <div
      className={`
        min-h-[70px] md:min-h-[90px] p-1 md:p-1.5 border-b border-r border-app-border/50 cursor-pointer transition-all duration-300
        ${!isCurrentMonth ? 'opacity-30 bg-app-bg/30' : (cellColorStyle ? cellColorStyle.bg : 'hover:bg-[#F5F9FF]')}
        ${isToday && !cellColorStyle ? 'bg-[#EFF6FF]' : ''}
        ${isSelected ? 'ring-2 ring-inset ring-accent bg-accent/5' : ''}
        ${cellColorStyle ? 'bg-opacity-40 hover:bg-opacity-60' : ''}
      `}
      onClick={() => onClick(day)}
    >
      <div className={`
        w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-[10px] md:text-xs rounded-full mb-1 font-bold
        ${isToday ? 'bg-accent text-white' : 'text-app-heading'}
      `}>
        {format(day, 'd')}
      </div>

      <div className="space-y-0.5">
        {allItems.slice(0, 3).map((item, i) => {
          const colorStyle = (item.color && COLOR_STYLES[item.color]) ? COLOR_STYLES[item.color] : COLOR_STYLES.default;
          const isDone = item.status === 'completed';
          return (
            <div key={i} className={`flex items-center gap-1 text-[8px] md:text-[10px] px-1 py-0.5 rounded truncate font-medium ${colorStyle.bg} ${colorStyle.text} leading-tight ${isDone ? 'opacity-50' : ''}`}>
              {item._type === 'date' ? '★ ' : (isDone ? '✓ ' : '')}
              <span className={isDone ? 'line-through' : ''}>{item.title}</span>
            </div>
          );
        })}
        {allItems.length > 3 && (
          <div className="text-[8px] md:text-[10px] text-app-muted px-1 font-bold">+{allItems.length - 3}</div>
        )}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [current, setCurrent] = useState(new Date());
  const [allTasks, setAllTasks] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState('event'); // 'event' | 'task'
  const [modalDefaultDate, setModalDefaultDate] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(null); // task object
  const [confirmClear, setConfirmClear] = useState(false);

  const {
    importantDates,
    fetchImportantDates,
    fetchCalendarTasks,
    addImportantDate,
    updateImportantDate,
    deleteImportantDate,
    purgeDeletedRecords,
    softDeletePastDates,
    addSimpleTask
  } = useAppStore();

  useEffect(() => {
    purgeDeletedRecords();
    fetchImportantDates();
    fetchCalendarTasks().then(tasks => setAllTasks(tasks || []));
  }, [purgeDeletedRecords, fetchImportantDates, fetchCalendarTasks]);

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const getTasksForDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return allTasks.filter(t => t.deadline && format(parseISO(t.deadline), 'yyyy-MM-dd') === dayStr);
  };

  const getImportantDatesForDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return importantDates.filter(d => format(parseISO(d.date), 'yyyy-MM-dd') === dayStr);
  };

  const handleDayClick = (day) => {
    setSelectedDay(isSameDay(day, selectedDay) ? null : day);
  };

  const handleModalAction = async (title, date, color, id) => {
    if (id) {
      // Editing
      await updateImportantDate(id, { title, date, color });
    } else {
      // Adding
      if (modalMode === 'event') {
        await addImportantDate(title, date, color);
      } else {
        await addSimpleTask(title, date);
        // Refresh tasks
        fetchCalendarTasks().then(tasks => setAllTasks(tasks || []));
      }
    }
  };

  const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay) : [];
  const selectedDayDates = selectedDay ? getImportantDatesForDay(selectedDay) : [];

  return (
    <div className="max-w-4xl mx-auto w-full py-8 px-4 md:px-6 mb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1 bg-white border border-app-border rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setCurrent(subMonths(current, 1))}
              className="p-1.5 rounded-lg hover:bg-app-bg transition-colors text-app-muted"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrent(new Date())}
              className="px-4 py-1.5 text-xs font-black text-app-body hover:bg-app-bg rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setCurrent(addMonths(current, 1))}
              className="p-1.5 rounded-lg hover:bg-app-bg transition-colors text-app-muted"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <h1 className="text-xl md:text-2xl font-black text-app-heading tracking-tight">
            {format(current, 'MMMM yyyy')}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <CalendarMenu onClearPast={() => setConfirmClear(true)} />
          <button
            onClick={() => { setModalDefaultDate(selectedDay || new Date()); setModalMode('event'); setShowAddModal(true); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-accent text-white text-xs font-bold rounded-xl hover:bg-accent-hover shadow-lg shadow-accent/20 transition-all active:scale-95"
          >
            <Plus size={16} strokeWidth={3} />
            Mark Date
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-app-border overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-app-border bg-app-bg/40">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-3 text-center text-[8px] md:text-[10px] font-black text-app-muted uppercase tracking-[0.2em]">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {monthDays.map((day) => (
            <DayCell
              key={day.toISOString()}
              day={day}
              isCurrentMonth={isSameMonth(day, monthStart)}
              isToday={isSameDay(day, new Date())}
              isSelected={selectedDay && isSameDay(day, selectedDay)}
              tasks={getTasksForDay(day)}
              importantDates={getImportantDatesForDay(day)}
              onClick={handleDayClick}
            />
          ))}
        </div>
      </div>

      {/* Details Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        {/* Selected Day Panel */}
        {selectedDay ? (
          <div className="bg-white border border-app-border rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-app-heading">
                {format(selectedDay, 'EEEE, d/MM/yyyy')}
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setModalDefaultDate(selectedDay); setModalMode('event'); setShowAddModal(true); }}
                  className="p-1.5 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors"
                  title="Mark Date"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
                <button onClick={() => setSelectedDay(null)} className="text-app-muted hover:text-app-body transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {selectedDayDates.length === 0 && selectedDayTasks.length === 0 ? (
              <p className="text-xs text-app-muted text-center py-6">No events or tasks on this day.</p>
            ) : (
              <div className="space-y-2">
                {selectedDayDates.map(d => {
                  const cs = (d.color && COLOR_STYLES[d.color]) ? COLOR_STYLES[d.color] : COLOR_STYLES.default;
                  return (
                    <div key={d.id} className={`flex items-center justify-between px-4 py-3 rounded-xl ${cs.bg} border border-black/5`}>
                      <div className="flex items-center gap-2.5">
                        <span className={`text-sm ${cs.text}`}>★</span>
                        <span className={`text-xs font-bold ${cs.text}`}>{d.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => { setEditingItem(d); setModalMode('event'); setShowAddModal(true); }}
                          className="p-1 hover:bg-white/20 rounded-lg text-app-muted transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => deleteImportantDate(d.id)} className="p-1 hover:bg-white/20 rounded-lg text-app-muted hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {selectedDayTasks.map(task => {
                  const cs = (task.color && COLOR_STYLES[task.color]) ? COLOR_STYLES[task.color] : { bg: 'bg-app-bg', text: 'text-app-body' };
                  const isDone = task.status === 'completed';
                  return (
                    <div key={task.id} className={`group flex items-center gap-3 px-4 py-3 rounded-xl ${cs.bg} border border-black/5 ${isDone ? 'opacity-60' : ''}`}>
                      <div className={`w-4 h-4 rounded flex items-center justify-center ${isDone ? 'bg-green-500 text-white' : 'bg-white border border-app-border'}`}>
                        {isDone && <Check size={10} strokeWidth={4} />}
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-xs font-bold ${cs.text} ${isDone ? 'line-through' : ''} truncate`}>
                          {task.title}
                        </span>
                        {task.description && <FileText size={10} className="text-app-muted shrink-0" />}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowNoteModal(task); }}
                        className="ml-auto p-1.5 hover:bg-black/5 rounded-lg text-app-muted transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit Note"
                      >
                        <FileText size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-app-bg/50 border border-dashed border-app-border rounded-2xl p-8 flex flex-col items-center justify-center text-center">
            <CalIcon size={24} className="text-app-muted/40 mb-2" />
            <p className="text-xs font-bold text-app-muted">Select a day to see details or add tasks</p>
          </div>
        )}

        {/* Marked Dates Overview */}
        <div className="bg-white border border-app-border rounded-2xl p-5 shadow-sm overflow-hidden flex flex-col">
          <h2 className="text-xs font-black text-app-muted uppercase tracking-[0.2em] mb-4">Marked Dates</h2>
          <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
            {importantDates.length === 0 ? (
              <p className="text-xs text-app-muted text-center py-6">No dates marked yet.</p>
            ) : (
              importantDates.map(d => {
                const cs = (d.color && COLOR_STYLES[d.color]) ? COLOR_STYLES[d.color] : COLOR_STYLES.default;
                return (
                  <div key={d.id} className={`flex items-center justify-between px-4 py-3 rounded-xl ${cs.bg} border border-black/5`}>
                    <div className="min-w-0 flex-1 mr-3">
                      <p className={`text-xs font-bold ${cs.text} truncate`}>{d.title}</p>
                      <p className="text-[10px] font-bold text-app-muted/70 mt-0.5">
                        {format(parseISO(d.date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => { setEditingItem(d); setModalMode('event'); setShowAddModal(true); }}
                        className="p-1.5 hover:bg-white/20 rounded-lg text-app-muted transition-colors"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => deleteImportantDate(d.id)} className="p-1.5 hover:bg-white/20 rounded-lg text-app-muted hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <DateModal
          defaultDate={modalDefaultDate || selectedDay}
          editingItem={editingItem}
          mode={modalMode}
          onClose={() => { setShowAddModal(false); setEditingItem(null); }}
          onAction={handleModalAction}
        />
      )}
      
      {showNoteModal && (
        <NoteModal 
          initialText={showNoteModal.description}
          onSave={async (newText) => {
            const userId = useAppStore.getState().userId; // Wait, I need updateTask logic
            // CalendarPage uses updateSimpleTask/updateGroupedTask indirectly?
            // Actually I should just use updateSimpleTask if it's a simple task or updateGroupedTask.
            // But wait, CalendarPage's allTasks comes from fetchCalendarTasks which returns * from tasks.
            // I should use useAppStore's updateSimpleTask if folder_id is null, else updateGroupedTask.
            
            if (showNoteModal.folder_id) {
              await useAppStore.getState().updateGroupedTask(showNoteModal.id, { description: newText || null });
            } else {
              await useAppStore.getState().updateSimpleTask(showNoteModal.id, { description: newText || null });
            }
            // Refresh tasks
            fetchCalendarTasks().then(tasks => setAllTasks(tasks || []));
          }}
          onClose={() => setShowNoteModal(null)}
        />
      )}

      <ConfirmModal
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={async () => {
          await softDeletePastDates();
          setConfirmClear(false);
        }}
        title="Clear Past Dates"
        message="This will move all past events to the archive. They will be permanently deleted after 1 day. Are you sure?"
      />
    </div>
  );
}
