import React from 'react';

export default function PhoneFrame({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--gradient-beige)] py-0 md:py-6">
      <div className={`mx-auto min-h-screen w-full max-w-[430px] bg-bg-primary md:min-h-[900px] md:rounded-[var(--r-xxl)] md:border md:border-slate-200 md:shadow-xl ${className}`}>
        {children}
      </div>
    </div>
  );
}
