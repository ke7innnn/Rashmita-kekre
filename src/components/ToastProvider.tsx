'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  error: (message: string) => void;
  success: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    if (!message) return;
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]); // Keep max 4

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const error = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const success = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const warning = useCallback((message: string) => showToast(message, 'warning'), [showToast]);
  const info = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  // Global override for native window.alert so all alert() calls match the theme
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg?: any) => {
      const messageStr = typeof msg === 'string' ? msg : String(msg ?? '');
      // Determine type based on message text
      if (
        messageStr.toLowerCase().includes('success') ||
        messageStr.toLowerCase().includes('updated') ||
        messageStr.toLowerCase().includes('shared')
      ) {
        showToast(messageStr, 'success');
      } else if (
        messageStr.toLowerCase().includes('failed') ||
        messageStr.toLowerCase().includes('error') ||
        messageStr.toLowerCase().includes('already') ||
        messageStr.toLowerCase().includes('invalid')
      ) {
        showToast(messageStr, 'error');
      } else {
        showToast(messageStr, 'info');
      }
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, error, success, warning, info }}>
      {children}

      {/* Floating Toast Notification Stack (Bottom-Right / Top-Center) */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 z-[99999] flex flex-col gap-3 pointer-events-none max-w-sm sm:max-w-md w-[calc(100%-2rem)]">
        <AnimatePresence mode="sync">
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            const isWarning = toast.type === 'warning';
            const isError = toast.type === 'error';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-auto w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-[#120D1F]/90 backdrop-blur-xl border border-white/12 shadow-[0_12px_40px_rgba(0,0,0,0.6)] text-[#F5F3FA]"
                style={{
                  boxShadow: isError
                    ? '0 12px 35px rgba(255, 93, 122, 0.15)'
                    : isSuccess
                    ? '0 12px 35px rgba(25, 227, 177, 0.15)'
                    : '0 12px 35px rgba(0, 0, 0, 0.5)',
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isError
                        ? 'bg-[#FF5D7A]/15 text-[#FF5D7A] border border-[#FF5D7A]/30'
                        : isSuccess
                        ? 'bg-[#19E3B1]/15 text-[#19E3B1] border border-[#19E3B1]/30'
                        : isWarning
                        ? 'bg-[#FFB454]/15 text-[#FFB454] border border-[#FFB454]/30'
                        : 'bg-white/10 text-white border border-white/20'
                    }`}
                  >
                    {isError && <AlertCircle className="w-5 h-5" />}
                    {isSuccess && <CheckCircle2 className="w-5 h-5" />}
                    {isWarning && <Info className="w-5 h-5" />}
                    {toast.type === 'info' && <Info className="w-5 h-5" />}
                  </div>

                  <p className="text-sm font-medium text-[#F5F3FA] leading-snug tracking-tight truncate-two-lines">
                    {toast.message}
                  </p>
                </div>

                <button
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 p-1.5 rounded-lg text-[#F5F3FA]/50 hover:text-[#F5F3FA] hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
