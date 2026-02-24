import React from 'react';

export default function StepIndicator({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;

        return (
          <React.Fragment key={step}>
            <div
              className={`h-7 w-7 rounded-[var(--r-pill)] border grid place-items-center text-xs font-bold transition-[var(--transition)] ${
                done
                  ? 'bg-brand-orange text-white border-brand-orange'
                  : active
                    ? 'bg-white border-brand-orange text-brand-orange'
                    : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
            >
              {done ? '✓' : step}
            </div>
            {step !== total ? (
              <div className="h-1 flex-1 rounded-[var(--r-pill)] bg-slate-200 overflow-hidden">
                <div
                  className={`h-full transition-[var(--transition)] ${step < current ? 'bg-brand-orange w-full' : 'bg-brand-orange w-0'}`}
                />
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}
