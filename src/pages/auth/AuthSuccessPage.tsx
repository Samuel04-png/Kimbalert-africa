import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import PhoneFrame from '../../components/layout/PhoneFrame';

export default function AuthSuccessPage() {
  return (
    <PhoneFrame>
      <div className="auth-screen min-h-screen px-6 py-10 flex flex-col items-center justify-center text-center">
        <div className="relative">
          <Sparkles className="absolute -left-10 -top-6 h-5 w-5 text-brand-orange animate-bounce" />
          <Sparkles className="absolute -right-10 -top-3 h-4 w-4 text-brand-green animate-bounce" style={{ animationDelay: '120ms' }} />
          <div className="grid h-24 w-24 place-items-center rounded-[var(--r-pill)] border border-brand-green/25 bg-brand-green-light shadow-green">
            <CheckCircle2 className="h-12 w-12 text-brand-green" />
          </div>
        </div>

        <h1 className="mt-6 type-page-title">You're now protected</h1>
        <p className="mt-2 text-sm leading-6 text-text-muted max-w-xs">
          Verification complete. Your secure guardian access is active.
        </p>

        <Link to="/auth/profile-completion" className="btn-interactive mt-8 w-full max-w-xs rounded-[var(--r-pill)] bg-brand-orange py-3.5 text-sm font-bold text-white shadow-orange">
          Continue
        </Link>
      </div>
    </PhoneFrame>
  );
}
