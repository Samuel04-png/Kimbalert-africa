import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-[var(--gradient-beige)] px-4">
      <section className="w-full max-w-md rounded-[var(--r-xl)] border border-slate-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-[var(--r-pill)] bg-brand-orange-light text-brand-orange text-3xl">
          404
        </div>
        <h1 className="mt-5 font-display text-4xl font-bold text-text-main">Page not found</h1>
        <p className="mt-2 text-sm text-text-muted">This route is unavailable or has moved.</p>
        <Link to="/guardian/home" className="btn-interactive mt-6 inline-flex rounded-[var(--r-pill)] bg-brand-orange px-5 py-3 text-sm font-bold text-white shadow-orange">
          Back to safety
        </Link>
      </section>
    </div>
  );
}