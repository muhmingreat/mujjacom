
import {
  createContext,
  useCallback,
  useContext,
  useState
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X
} from "lucide-react";

const ToastContext = createContext(null);

const toastStyles = {
  success: {
    icon: CheckCircle2,
    color: "text-green-600",
    background: "bg-green-50",
    border: "border-green-200"
  },
  error: {
    icon: XCircle,
    color: "text-red-600",
    background: "bg-red-50",
    border: "border-red-200"
  },
  warning: {
    icon: AlertTriangle,
    color: "text-yellow-600",
    background: "bg-yellow-50",
    border: "border-yellow-200"
  },
  info: {
    icon: Info,
    color: "text-blue-600",
    background: "bg-blue-50",
    border: "border-blue-200"
  }
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) =>
      current.filter((toast) => toast.id !== id)
    );
  }, []);

  const showToast = useCallback((message, options = {}) => {
    const {
      type = "info",
      duration = 30000,
      title = ""
    } = options;

    const id = `${Date.now()}-${Math.random()}`;

    setToasts((current) => [
      ...current,
      { id, message, title, type, duration }
    ]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }

    return id;
  }, [removeToast]);

  const success = useCallback(
    (message, options = {}) =>
      showToast(message, { ...options, type: "success" }),
    [showToast]
  );

  const error = useCallback(
    (message, options = {}) =>
      showToast(message, { ...options, type: "error" }),
    [showToast]
  );

  const warning = useCallback(
    (message, options = {}) =>
      showToast(message, { ...options, type: "warning" }),
    [showToast]
  );

  const info = useCallback(
    (message, options = {}) =>
      showToast(message, { ...options, type: "info" }),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{ showToast, success, error, warning, info, removeToast }}
    >
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const style = toastStyles[toast.type] || toastStyles.info;
            const Icon = style.icon;

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-xl ${style.background} ${style.border}`}
                role="status"
              >
                <Icon
                  size={22}
                  className={`mt-0.5 shrink-0 ${style.color}`}
                />

                <div className="min-w-0 flex-1">
                  {toast.title && (
                    <p className="text-sm font-bold text-gray-900">
                      {toast.title}
                    </p>
                  )}

                  <p className="text-sm leading-5 text-gray-700">
                    {toast.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="rounded-md p-1 text-gray-500 transition hover:bg-black/5 hover:text-gray-900"
                  aria-label="Dismiss notification"
                >
                  <X size={17} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast must be used inside ToastProvider"
    );
  }

  return context;
}
