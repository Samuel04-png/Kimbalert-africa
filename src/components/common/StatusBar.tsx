import React from 'react';

export default function StatusBar() {
  return (
    <div className="status-bar flex items-center justify-between px-4 pt-2 text-[11px] text-slate-500">
      <span className="time font-semibold">9:41</span>
      <div className="indicators flex items-center gap-1.5">
        <SignalIcon />
        <WifiIcon />
        <BatteryIcon />
      </div>
    </div>
  );
}

function SignalIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="7" width="2" height="4" rx="1" fill="currentColor" />
      <rect x="5" y="5" width="2" height="6" rx="1" fill="currentColor" />
      <rect x="9" y="3" width="2" height="8" rx="1" fill="currentColor" />
      <rect x="13" y="1" width="2" height="10" rx="1" fill="currentColor" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 4C4.5 1.2 11.5 1.2 15 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 7C6.3 5.3 9.7 5.3 12 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="20" height="12" viewBox="0 0 20 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <rect x="3" y="3" width="10" height="6" rx="1" fill="currentColor" />
      <rect x="18" y="4" width="1" height="4" rx="0.5" fill="currentColor" />
    </svg>
  );
}
