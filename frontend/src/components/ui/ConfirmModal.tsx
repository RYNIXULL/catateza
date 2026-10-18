import React from 'react';
import { AlertCircle, Trash2, X, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'primary';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  message,
  confirmText = 'Hapus',
  cancelText = 'Batal',
  isLoading = false,
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              variant === 'danger' 
                ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                : 'bg-primary/10 text-primary border border-primary/20'
            }`}>
              {variant === 'danger' ? (
                <Trash2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{title}</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/20 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border border-white/20 hover:bg-white/10 dark:hover:bg-white/5 transition-colors text-foreground disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
