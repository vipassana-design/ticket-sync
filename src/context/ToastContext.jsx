import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ message, type = 'error', duration = 4000 }) => {
        const id = nextId++;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            {/* Toast container — top-right on desktop, bottom center on mobile */}
            <div className="fixed top-4 right-4 sm:top-5 sm:right-5 z-[9999] flex flex-col gap-2 pointer-events-none max-w-xs sm:max-w-sm w-full">
                {toasts.map(toast => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onClose }) {
    const config = {
        error: { bg: 'bg-red-600', icon: 'error', iconColor: 'text-white' },
        warning: { bg: 'bg-amber-500', icon: 'warning', iconColor: 'text-white' },
        success: { bg: 'bg-status-green', icon: 'check_circle', iconColor: 'text-white' },
        info: { bg: 'bg-primary', icon: 'info', iconColor: 'text-white' },
    };
    const { bg, icon, iconColor } = config[toast.type] || config.error;

    return (
        <div
            className={`pointer-events-auto flex items-start gap-3 ${bg} text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-2xl animate-[slideInRight_0.25s_ease-out]`}
            style={{ animation: 'slideInRight 0.25s ease-out' }}
        >
            <span className={`material-symbols-outlined text-[18px] select-none shrink-0 mt-0.5 ${iconColor}`}>
                {icon}
            </span>
            <p className="flex-1 leading-snug">{toast.message}</p>
            <button
                onClick={onClose}
                className="shrink-0 opacity-70 hover:opacity-100 transition-opacity -mt-0.5"
            >
                <span className="material-symbols-outlined text-base select-none">close</span>
            </button>
        </div>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}
