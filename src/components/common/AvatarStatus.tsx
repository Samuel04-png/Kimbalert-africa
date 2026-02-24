import React from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

type Status = 'online' | 'active-alert' | 'offline';

const sizeClass: Record<AvatarSize, string> = {
  xs: 'h-6 w-6',
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-20 w-20',
  '2xl': 'h-24 w-24',
};

const dotClass: Record<Status, string> = {
  online: 'bg-brand-green',
  'active-alert': 'bg-red-500 animate-pulse',
  offline: 'bg-slate-400',
};

export function AvatarStatus({
  src,
  alt,
  size = 'md',
  status = 'online',
}: {
  src?: string;
  alt: string;
  size?: AvatarSize;
  status?: Status;
}) {
  return (
    <div className={`relative ${sizeClass[size]} rounded-[var(--r-pill)] border border-white/60 bg-white shadow-sm overflow-hidden`}>
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-brand-orange-light text-brand-orange font-bold grid place-items-center">
          {alt.slice(0, 1)}
        </div>
      )}
      <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-[var(--r-pill)] border-2 border-white ${dotClass[status]}`} />
    </div>
  );
}

export function AvatarStack({ avatars }: { avatars: Array<{ src?: string; alt: string }> }) {
  return (
    <div className="flex -space-x-3">
      {avatars.map((avatar, index) => (
        <div key={`${avatar.alt}-${index}`} className="relative z-10" style={{ zIndex: avatars.length - index }}>
          <AvatarStatus src={avatar.src} alt={avatar.alt} size="sm" />
        </div>
      ))}
    </div>
  );
}
