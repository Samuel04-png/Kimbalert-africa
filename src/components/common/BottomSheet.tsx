import React, { useEffect } from 'react';

export default function BottomSheet({
  open,
  title,
  onClose,
  children,
  snap = '70',
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  snap?: '40' | '70' | '95';
}) {
  useEffect(() => {
    if (!open) return;
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-[8px]"
        onClick={onClose}
        aria-label="Close sheet"
      />
      <div
        className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-[430px] rounded-t-[var(--r-xl)] border border-slate-200 bg-white shadow-xl animate-sheet-up"
        style={{ minHeight: `${snap}vh` }}
      >
        <div className="px-4 pt-3">
          <div className="mx-auto h-1.5 w-12 rounded-[var(--r-pill)] bg-slate-300" />
          {title ? <p className="mt-3 text-sm font-semibold text-text-main">{title}</p> : null}
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-4 pb-6 pt-3">{children}</div>
      </div>
    </div>
  );
}
