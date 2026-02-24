import React from 'react';
import StatusBar from '../common/StatusBar';

export default function PhoneFrame({
  children,
  withStatusBar = true,
  className = '',
}: {
  children: React.ReactNode;
  withStatusBar?: boolean;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--gradient-beige)] py-0 md:py-6">
      <div className={`mx-auto min-h-screen w-full max-w-[430px] bg-bg-primary md:min-h-[900px] md:rounded-[var(--r-xxl)] md:border md:border-slate-200 md:shadow-xl ${className}`}>
        {withStatusBar ? <StatusBar /> : null}
        {children}
      </div>
    </div>
  );
}
