import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (message, { type = "info", duration = 4000 } = {}) => {
      const id = ++idCounter;
      setToasts((t) => [...t, { id, message, type }]);
      if (duration) setTimeout(() => remove(id), duration);
    },
    [remove]
  );

  const toast = {
    success: (m) => push(m, { type: "success" }),
    error: (m) => push(m, { type: "error" }),
    info: (m) => push(m, { type: "info" }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-fade-in min-w-[280px] max-w-sm rounded-lg px-4 py-3 text-sm font-medium shadow-popover ring-1 ${
              t.type === "success"
                ? "bg-emerald-600 text-white ring-emerald-700"
                : t.type === "error"
                ? "bg-red-600 text-white ring-red-700"
                : "bg-slate-800 text-white ring-slate-900"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
