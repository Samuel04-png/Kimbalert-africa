import React from 'react';

type ChipVariant = 'orange' | 'green' | 'danger' | 'pending' | 'navy' | 'neutral';
type ChipSize = 'sm' | 'md';

const variantClass: Record<ChipVariant, string> = {
  orange: 'border-brand-orange/25 bg-brand-orange-light text-brand-orange',
  green: 'border-brand-green/25 bg-brand-green-light text-brand-green',
  danger: 'border-red-500/25 bg-red-50 text-red-600',
  pending: 'border-amber-400/25 bg-amber-50 text-amber-600',
  navy: 'border-slate-600/30 bg-slate-800 text-slate-100',
  neutral: 'border-slate-200 bg-slate-50 text-slate-600',
};

const sizeClass: Record<ChipSize, string> = {
  sm: 'type-caption px-2.5 py-1',
  md: 'text-sm px-3 py-1.5',
};

export default function Chip({
  children,
  variant = 'neutral',
  size = 'md',
  selected,
  onClick,
}: {
  key?: React.Key;
  children: React.ReactNode;
  variant?: ChipVariant;
  size?: ChipSize;
  selected?: boolean;
  onClick?: () => void;
}) {
  const interactiveClass = onClick
    ? `transition-[var(--transition-fast)] active:scale-95 ${selected ? 'ring-2 ring-brand-orange/25' : ''}`
    : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[var(--r-pill)] border font-semibold tracking-wide ${variantClass[variant]} ${sizeClass[size]} ${interactiveClass}`}
    >
      {children}
    </button>
  );
}
