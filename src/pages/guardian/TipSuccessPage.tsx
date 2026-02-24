import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import PhoneFrame from '../../components/layout/PhoneFrame';

export default function TipSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { from?: string } | null)?.from ?? '/guardian/activity';

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate(returnTo, { replace: true });
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [navigate, returnTo]);

  return (
    <PhoneFrame>
      <div className="min-h-screen px-6 py-10 flex flex-col items-center justify-center text-center">
        <div className="grid h-24 w-24 place-items-center rounded-[var(--r-pill)] border border-brand-green/25 bg-brand-green-light shadow-green animate-fade-in">
          <CheckCircle2 className="h-12 w-12 text-brand-green" />
        </div>
        <h1 className="mt-6 type-page-title">Information Received</h1>
        <p className="mt-2 text-sm leading-6 text-text-muted max-w-xs">
          Thank you for your vigilance. The task force has been notified and is reviewing your tip now.
        </p>
        <p className="mt-4 rounded-[var(--r-md)] border border-brand-orange/25 bg-brand-orange-light px-4 py-3 text-xs text-brand-orange">
          Every second counts. Thank you for helping bring a child home.
        </p>
        <button
          type="button"
          onClick={() => navigate(returnTo, { replace: true })}
          className="btn-interactive mt-8 w-full max-w-xs rounded-[var(--r-pill)] bg-brand-orange py-3.5 text-sm font-bold text-white shadow-orange"
        >
          Back to Feed
        </button>
      </div>
    </PhoneFrame>
  );
}

