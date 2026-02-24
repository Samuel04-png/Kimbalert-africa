import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton shimmer ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-[var(--r-lg)] border border-slate-200 bg-white p-4 shadow-xs">
      <Skeleton className="h-4 w-24 rounded-[var(--r-xs)]" />
      <Skeleton className="mt-3 h-3 w-full rounded-[var(--r-xs)]" />
      <Skeleton className="mt-2 h-3 w-5/6 rounded-[var(--r-xs)]" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-8 w-20 rounded-[var(--r-pill)]" />
        <Skeleton className="h-8 w-20 rounded-[var(--r-pill)]" />
      </div>
    </div>
  );
}
