import { useState, useRef } from 'react';
import { X, Bold, List } from 'lucide-react';

export default function NoteModal({ initialText, onSave, onClose }) {
  const [text, setText] = useState(initialText || '');
  const textareaRef = useRef(null);

  const insertText = (before, after = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const val = el.value;
    const selected = val.substring(start, end);
    const newVal = val.substring(0, start) + before + selected + after + val.substring(end);
    setText(newVal);
    
    // Reset focus and selection
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const handleBold = () => insertText('**', '**');
  const handleBullet = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const val = el.value;
    // If we're not at the start of a line, add a newline
    const prefix = (start === 0 || val[start - 1] === '\n') ? '• ' : '\n• ';
    insertText(prefix);
  };

  return (
    <div className="fixed inset-0 z-[200] flex sm:items-center items-end justify-center bg-black/40 px-0 sm:px-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl border-x border-t sm:border border-app-border w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300 ease-out"
        onClick={e => e.stopPropagation()}
        draggable={false}
        onDragStart={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-app-border bg-app-bg/50">
          <div>
            <h3 className="text-sm font-black text-app-heading uppercase tracking-wider">Note Editor</h3>
            <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest mt-0.5">Format with markdown tags</p>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white border border-app-border hover:bg-app-bg rounded-xl text-app-muted transition-all active:scale-90">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 sm:p-8">
          {/* Toolbar */}
          <div className="flex gap-1 mb-5 p-1.5 bg-app-bg rounded-2xl border border-app-border w-fit shadow-sm">
            <button 
              onClick={handleBold}
              className="p-2.5 px-4 hover:bg-white hover:shadow-sm rounded-xl text-app-muted hover:text-accent transition-all flex items-center gap-2 text-xs font-bold"
              title="Bold (**text**)"
            >
              <Bold size={16} /> Bold
            </button>
            <div className="w-px h-4 bg-app-border self-center mx-1" />
            <button 
              onClick={handleBullet}
              className="p-2.5 px-4 hover:bg-white hover:shadow-sm rounded-xl text-app-muted hover:text-accent transition-all flex items-center gap-2 text-xs font-bold"
              title="Bullet (• text)"
            >
              <List size={16} /> Bullet
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="What's on your mind? Add notes, links, or bullet points..."
            className="w-full min-h-[280px] sm:min-h-[200px] p-5 bg-app-bg border border-app-border rounded-2xl text-sm font-medium focus:outline-none focus:border-accent transition-all resize-none placeholder:text-app-muted/30 shadow-inner"
            autoFocus
          />

          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
            <button onClick={onClose} className="flex-1 py-4 text-sm font-bold text-app-body hover:bg-app-bg rounded-2xl transition-colors border border-app-border sm:border-transparent">Cancel</button>
            <button 
              onClick={() => { onSave(text.trim()); onClose(); }} 
              className="sm:flex-[1.5] py-4 bg-accent text-white rounded-2xl text-sm font-bold hover:bg-accent-hover shadow-lg shadow-accent/20 transition-all active:scale-95"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
