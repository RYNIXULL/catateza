import { create } from 'zustand';
import type { ReactNode } from 'react';
import { soundManager } from '../lib/sound';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // Play appropriate sound based on toast type
    switch (toast.type) {
      case 'success':
        soundManager.playSuccess();
        break;
      case 'warning':
        soundManager.playWarning();
        break;
      case 'error':
        soundManager.playError();
        break;
      default:
        soundManager.playNotification();
        break;
    }

    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export function useToast() {
  const { addToast, removeToast } = useToastStore();
  
  return {
    toast: (toast: Omit<Toast, 'id'>) => addToast(toast),
    success: (message: string, description?: string) => addToast({ type: 'success', message, description }),
    error: (message: string, description?: string) => addToast({ type: 'error', message, description }),
    info: (message: string, description?: string) => addToast({ type: 'info', message, description }),
    warning: (message: string, description?: string) => addToast({ type: 'warning', message, description }),
    dismiss: removeToast
  };
}
