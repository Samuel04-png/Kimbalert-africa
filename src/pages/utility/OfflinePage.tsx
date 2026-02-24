import React from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen grid place-items-center bg-[var(--gradient-beige)] px-4">
      <section className="w-full max-w-md rounded-[var(--r-xl)] border border-slate-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-[var(--r-pill)] bg-brand-orange-light text-brand-orange">
          <WifiOff className="h-9 w-9" />
        </div>
        <h1 className="mt-5 font-display text-4xl font-bold text-text-main">You're offline</h1>
        <p className="mt-2 text-sm text-text-muted">Connection is unavailable. Critical safety info stays cached for offline access.</p>
        <button type="button" onClick={() => window.location.reload()} className="btn-interactive mt-6 rounded-[var(--r-pill)] bg-brand-orange px-5 py-3 text-sm font-bold text-white shadow-orange">
          Retry
        </button>
      </section>
    </div>
  );
}