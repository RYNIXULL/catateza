import React from 'react';
import { useToastStore } from '../../hooks/useToast';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const icons = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />
};

export const ToastProvider: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "glass pointer-events-auto flex items-start gap-3 p-4 rounded-lg w-80 shadow-lg transform transition-all duration-300 animate-in slide-in-from-right-8",
            "border-l-4",
            toast.type === 'success' && "border-l-emerald-500",
            toast.type === 'error' && "border-l-red-500",
            toast.type === 'warning' && "border-l-yellow-500",
            toast.type === 'info' && "border-l-blue-500"
          )}
        >
          <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-foreground">{toast.message}</h4>
            {toast.description && (
              <p className="text-sm text-muted-foreground mt-1">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
