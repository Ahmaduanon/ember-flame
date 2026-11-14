import React, { createContext, useContext, useState, useCallback, useId } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  notify: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
  notify: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 5000) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts(prev => [...prev.slice(-4), { id, type, message, duration }]);
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const notify = useCallback((message: string) => {
    const lower = message.toLowerCase();
    const type: ToastType = lower.includes('error') || lower.includes('failed') || lower.includes('cannot')
      ? 'error'
      : lower.includes('warning') || lower.includes('alert')
      ? 'warning'
      : lower.includes('saved') || lower.includes('ready') || lower.includes('applied') || lower.includes('connected') || lower.includes('success')
      ? 'success'
      : 'info';
    addToast(message, type, 5500);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, notify }}>
      {children}
      <div className="toast-stack" aria-live="polite" role="region" aria-label="Notifications">
        {toasts.map(toast => {
          const Icon = toast.type === 'success' ? CheckCircle2
            : toast.type === 'error' ? AlertCircle
            : toast.type === 'warning' ? AlertTriangle
            : Info;
          return (
            <div key={toast.id} className={`toast-card toast-${toast.type}`}>
              <Icon size={16} className="toast-icon shrink-0" />
              <span className="toast-text">{toast.message}</span>
              <button
                className="toast-close"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
