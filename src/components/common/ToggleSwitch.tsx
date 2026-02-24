import React from 'react';

export default function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? 'Toggle switch'}
      onClick={() => onChange(!checked)}
      className={`relative h-[26px] w-[48px] rounded-[var(--r-pill)] transition-[var(--transition)] ${
        checked ? 'bg-brand-orange shadow-orange' : 'bg-[#cfc5b6]'
      }`}
    >
      <span
        className={`absolute top-[3px] h-5 w-5 rounded-[var(--r-pill)] bg-white shadow-sm transition-[var(--transition-spring)] ${
          checked ? 'translate-x-6' : 'translate-x-[3px]'
        }`}
      />
    </button>
  );
}
