import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  variant: ToastVariant;
}

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

let idCounter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = (++idCounter).toString();
    set((state) => ({
      // Keep max 3 toasts stacked
      toasts: [...state.toasts, { ...toast, id }].slice(-3) 
    }));
    
    // Auto-remove after 3.5s
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }));
    }, 3500);
  },
  removeToast: (id) => 
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    })),
}));
