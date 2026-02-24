import React from 'react';
import { Radio } from 'lucide-react';

export default function FlarePulse({ size = 120, tone = 'danger' }: { size?: number; tone?: 'danger' | 'orange' }) {
  const ringClass = tone === 'danger' ? 'bg-red-500/15 border-red-500/35' : 'bg-brand-orange/15 border-brand-orange/35';
  const coreClass = tone === 'danger' ? 'bg-red-500 text-white' : 'bg-brand-orange text-white';

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <span className={`absolute h-full w-full rounded-[var(--r-pill)] border ${ringClass} animate-ping`} style={{ animationDuration: '2.8s' }} />
      <span className={`absolute h-[72%] w-[72%] rounded-[var(--r-pill)] border ${ringClass} animate-pulse`} />
      <span className={`relative grid h-[44%] w-[44%] place-items-center rounded-[var(--r-pill)] ${coreClass} shadow-danger`}>
        <Radio className="h-5 w-5" />
      </span>
    </div>
  );
}
