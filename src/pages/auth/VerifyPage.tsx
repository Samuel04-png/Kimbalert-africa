import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Edit3, KeyRound, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PhoneFrame from '../../components/layout/PhoneFrame';
import BottomSheet from '../../components/common/BottomSheet';
import FlarePulse from '../../components/common/FlarePulse';

const OTP_LENGTH = 6;

export default function VerifyPage() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const code = useMemo(() => digits.join(''), [digits]);
  const phone = localStorage.getItem('pending_phone') ?? '+27 71 234 5678';

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (code.length === OTP_LENGTH && !code.includes('')) {
      void verifyCode();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleChange = (index: number, raw: string) => {
    const next = raw.replace(/\D/g, '').slice(-1);
    if (errorText) setErrorText('');
    setDigits((prev) => {
      const clone = [...prev];
      clone[index] = next;
      return clone;
    });
    if (next && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const value = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!value) return;
    event.preventDefault();
    const split = value.split('');
    setDigits(Array.from({ length: OTP_LENGTH }, (_, index) => split[index] ?? ''));
    refs.current[Math.min(split.length, OTP_LENGTH) - 1]?.focus();
  };

  const verifyCode = async () => {
    if (loading || success) return;
    if (digits.some((digit) => !digit)) {
      setErrorText('Enter the full 6-digit code.');
      setShake(true);
      window.setTimeout(() => setShake(false), 250);
      return;
    }

    setLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 900));

    if (code === '000000') {
      setLoading(false);
      setDigits(Array(OTP_LENGTH).fill(''));
      setErrorText('Invalid code. Please try again.');
      setShake(true);
      window.setTimeout(() => setShake(false), 260);
      refs.current[0]?.focus();
      return;
    }

    setSuccess(true);
    setLoading(false);
    window.setTimeout(() => navigate('/auth/success'), 700);
  };

  const resend = () => {
    setCountdown(60);
    setDigits(Array(OTP_LENGTH).fill(''));
    setErrorText('');
    refs.current[0]?.focus();
  };

  const progress = (countdown / 60) * 100;

  return (
    <PhoneFrame>
      <div className="auth-screen relative min-h-screen overflow-hidden px-4 pb-8 pt-3">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(232,98,42,0.2),transparent_45%),radial-gradient(circle_at_15%_80%,rgba(46,64,87,0.15),transparent_45%)]" />
        <div className="relative z-10">
          <Link to="/login" className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-brand-orange/20 bg-white">
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <section className="mt-6 overflow-hidden rounded-[var(--r-xl)] border border-slate-200 bg-white p-6 shadow-lg">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-[var(--r-lg)] border border-brand-orange/25 bg-brand-orange-light text-brand-orange">
              {success ? <CheckCircle2 className="h-8 w-8 text-brand-green" /> : <KeyRound className="h-8 w-8" />}
            </div>
            <h1 className="mt-4 text-center type-page-title">Verify Your Number</h1>
            <p className="mt-1 text-center type-muted">We sent a 6-digit code to</p>
            <div className="mt-1 flex items-center justify-center gap-2 text-sm font-semibold text-text-main">
              <span>{phone}</span>
              <Link to="/signup" className="text-brand-orange">
                <Edit3 className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className={`mt-5 grid grid-cols-6 gap-2 ${shake ? 'animate-shake' : ''}`}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    refs.current[index] = element;
                  }}
                  value={digit}
                  onChange={(event) => handleChange(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  onPaste={handlePaste}
                  maxLength={1}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className={`h-12 w-full min-w-0 rounded-[var(--r-sm)] border text-center text-lg font-bold transition-[var(--transition-fast)] ${
                    success
                      ? 'border-brand-green bg-brand-green-light text-brand-green'
                      : 'border-slate-200 bg-bg-primary text-text-main focus:border-brand-orange'
                  }`}
                />
              ))}
            </div>
            {errorText ? <p className="mt-2 text-center text-xs font-semibold text-red-500">{errorText}</p> : null}

            <div className="mt-4 flex items-center justify-between rounded-[var(--r-md)] border border-slate-200 bg-bg-primary px-3 py-2">
              <span className="text-xs uppercase tracking-wider text-text-muted">Resend timer</span>
              <div className="flex items-center gap-2">
                <CircleProgress progress={progress} />
                <span className="text-sm font-semibold text-text-main">00:{String(countdown).padStart(2, '0')}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={loading || success}
              onClick={() => void verifyCode()}
              className="btn-interactive mt-5 w-full rounded-[var(--r-pill)] bg-brand-orange py-3.5 text-sm font-bold text-white shadow-orange disabled:opacity-70"
            >
              {loading ? 'Verifying...' : success ? 'Verified' : 'Verify & Continue'}
            </button>

            {loading ? (
              <div className="mt-5 grid place-items-center">
                <FlarePulse size={72} tone="orange" />
              </div>
            ) : null}

            <div className="mt-4 text-center text-sm">
              {countdown > 0 ? (
                <span className="text-text-muted">Resend code in {countdown}s</span>
              ) : (
                <button type="button" onClick={resend} className="font-semibold text-brand-orange">
                  Resend Code
                </button>
              )}
            </div>

            <button type="button" onClick={() => setHelpOpen(true)} className="mt-3 w-full text-center text-xs font-semibold uppercase tracking-wider text-text-muted">
              Didn't receive code?
            </button>

            <article className="mt-5 rounded-[var(--r-md)] border border-brand-green/20 bg-brand-green-light px-3 py-3 text-sm text-brand-green">
              <p className="flex items-center gap-2 font-semibold"><Shield className="h-4 w-4" /> Why we verify</p>
              <p className="mt-1 text-xs leading-5 text-text-muted">
                Verification protects child vault access and ensures only trusted guardians can trigger emergency flares.
              </p>
            </article>
          </section>
        </div>
      </div>

      <BottomSheet open={helpOpen} onClose={() => setHelpOpen(false)} title="OTP Help" snap="40">
        <div className="space-y-3 text-sm text-text-muted">
          <p>1. Confirm your phone number is correct.</p>
          <p>2. Wait for countdown to finish, then resend.</p>
          <p>3. Check SMS filtering and network signal.</p>
          <p>4. Still blocked? Use password login and update your phone in profile settings.</p>
        </div>
      </BottomSheet>
    </PhoneFrame>
  );
}

function CircleProgress({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(100, progress));
  const radius = 11;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
      <circle cx="14" cy="14" r={radius} stroke="#E5E7EB" strokeWidth="3" fill="none" />
      <circle
        cx="14"
        cy="14"
        r={radius}
        stroke="#E8622A"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}
