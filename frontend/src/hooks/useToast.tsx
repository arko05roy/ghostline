"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type ToastType = "pending" | "success" | "error";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastCtx {
  toasts: Toast[];
  toast: (message: string, type?: ToastType) => number;
  dismiss: (id: number) => void;
  update: (id: number, message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastCtx>({
  toasts: [],
  toast: () => 0,
  dismiss: () => {},
  update: () => {},
});

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "pending") => {
    const id = nextId++;
    setToasts((t) => [...t, { id, message, type }]);
    if (type !== "pending") {
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
    }
    return id;
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const update = useCallback((id: number, message: string, type: ToastType) => {
    setToasts((t) => t.map((x) => (x.id === id ? { ...x, message, type } : x)));
    if (type !== "pending") {
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, update }}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
