import React from 'react';
import { useAppContext } from '../../app/AppContext';

export default function ToastHost({ position = 'guardian' }: { position?: 'guardian' | 'admin' }) {
  const { toasts, dismissToast } = useAppContext();

  if (!toasts.length) return null;

  return (
    <div
      className={`fixed z-[120] space-y-2 ${
        position === 'admin' ? 'top-4 right-4 max-w-sm' : 'top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm'
      }`}
    >
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className={`rounded-[var(--r-md)] border px-4 py-3 shadow-lg animate-toast-in ${toneClass(toast.type)}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold">{toast.title}</p>
              {toast.message ? <p className="mt-0.5 text-xs opacity-85">{toast.message}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-xs font-bold opacity-60 hover:opacity-100"
            >
              x
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function toneClass(type: 'success' | 'error' | 'info' | 'warning') {
  if (type === 'success') return 'border-brand-green/35 bg-brand-green-light text-brand-green';
  if (type === 'error') return 'border-red-500/35 bg-red-50 text-red-600';
  if (type === 'warning') return 'border-amber-500/35 bg-amber-50 text-amber-700';
  return 'border-brand-orange/35 bg-brand-orange-light text-brand-orange';
}
