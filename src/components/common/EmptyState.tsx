import React from 'react';

export default function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--r-lg)] border border-dashed border-slate-300 bg-white px-6 py-8 text-center shadow-xs">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-[var(--r-pill)] bg-brand-orange-light text-brand-orange">
        <div className="text-2xl leading-none">{icon}</div>
      </div>
      <h3 className="mt-4 type-section-title">{title}</h3>
      <p className="mx-auto mt-2 max-w-[220px] type-caption leading-6">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
