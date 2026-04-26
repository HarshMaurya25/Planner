import { useState } from 'react';
import { X, LogOut, Trash2, AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'danger' // 'danger' or 'primary'
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-app-border w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
            type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
          }`}>
            {type === 'danger' ? <Trash2 size={28} /> : <LogOut size={28} />}
          </div>
          
          <h3 className="text-xl font-black text-app-heading mb-2">{title}</h3>
          <p className="text-sm font-medium text-app-muted leading-relaxed mb-6">
            {message}
          </p>
          
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 text-sm font-bold text-app-body bg-app-bg hover:bg-slate-200 rounded-2xl transition-all active:scale-95"
            >
              {cancelText}
            </button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className={`flex-1 py-3.5 text-sm font-bold text-white rounded-2xl shadow-lg transition-all active:scale-95 ${
                type === 'danger' 
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-200' 
                  : 'bg-accent hover:bg-accent-hover shadow-accent/20'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
