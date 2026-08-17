'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle, Info, X } from 'lucide-react';

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#081B2B]/95 border border-[#00C853] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-[#00C853]" />
          ) : (
            <Info className="w-5 h-5 text-[#019DF4]" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white ml-2 text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
