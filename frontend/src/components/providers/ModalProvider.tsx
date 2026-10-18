import React from 'react';
import { create } from 'zustand';

interface ModalOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'danger' | 'info' | 'warning';
}

interface ModalStore {
  isOpen: boolean;
  options: ModalOptions | null;
  openModal: (options: ModalOptions) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  isOpen: false,
  options: null,
  openModal: (options) => set({ isOpen: true, options }),
  closeModal: () => set({ isOpen: false, options: null }),
}));

export const useConfirm = () => {
  const openModal = useModalStore((state) => state.openModal);
  
  return (options: Omit<ModalOptions, 'onCancel'> & { onCancel?: () => void }) => {
    openModal(options);
  };
};

export const ModalProvider: React.FC = () => {
  const { isOpen, options, closeModal } = useModalStore();

  if (!isOpen || !options) return null;

  const handleConfirm = () => {
    options.onConfirm();
    closeModal();
  };

  const handleCancel = () => {
    if (options.onCancel) options.onCancel();
    closeModal();
  };

  const variantStyles = {
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    info: 'bg-primary hover:bg-primary/90 text-primary-foreground',
  };

  const btnStyle = variantStyles[options.variant || 'info'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div 
        className="fixed inset-0 bg-black/40  transition-opacity" 
        onClick={handleCancel}
      />
      
      <div className="glass relative z-10 w-full max-w-md rounded-xl p-6 shadow-2xl animate-in zoom-in-95">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {options.title}
        </h3>
        
        {options.description && (
          <p className="text-sm text-muted-foreground mb-6">
            {options.description}
          </p>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-secondary transition-colors"
          >
            {options.cancelText || 'Batal'}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${btnStyle}`}
          >
            {options.confirmText || 'Konfirmasi'}
          </button>
        </div>
      </div>
    </div>
  );
};
