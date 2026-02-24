import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Shield,
  Sparkles,
  User,
} from 'lucide-react';

type AuthMode = 'signup' | 'otp' | 'login';

interface AuthFlowProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onBackHome: () => void;
  onAuthenticated: (portal: 'guardian' | 'admin') => void;
}

const OTP_LENGTH = 6;

export default function AuthFlow({ mode, onModeChange, onBackHome, onAuthenticated }: AuthFlowProps) {
  const [countdown, setCountdown] = useState(45);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));

  const [signupForm, setSignupForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    nationalId: '',
    password: '',
  });

  const [loginForm, setLoginForm] = useState({
    emailOrPhone: '',
    password: '',
  });

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const otpCode = useMemo(() => otpDigits.join(''), [otpDigits]);

  const adminUnlocked = useMemo(() => {
    const combined = `${loginForm.emailOrPhone}${loginForm.password}`;
    const specialCount = (combined.match(/[^a-zA-Z0-9]/g) ?? []).length;
    return specialCount >= 2;
  }, [loginForm.emailOrPhone, loginForm.password]);

  useEffect(() => {
    if (mode !== 'otp') return;

    setCountdown(45);
    const timer = window.setInterval(() => {
      setCountdown((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [mode]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const handleOtpChange = (index: number, rawValue: string) => {
    const value = rawValue.replace(/\D/g, '').slice(-1);

    setOtpDigits((previous) => {
      const next = [...previous];
      next[index] = value;
      return next;
    });

    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH)
      .split('');

    if (!pasted.length) return;

    event.preventDefault();
    setOtpDigits(Array.from({ length: OTP_LENGTH }, (_, idx) => pasted[idx] ?? ''));

    const lastIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
    otpRefs.current[lastIndex]?.focus();
  };

  const submitSignup = (event: React.FormEvent) => {
    event.preventDefault();
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    onModeChange('otp');
    setNotice('Account created. Enter the OTP sent to your phone.');
  };

  const submitLogin = (event: React.FormEvent) => {
    event.preventDefault();

    if (adminUnlocked) {
      setNotice('Admin credential pattern detected. Opening command center.');
      onAuthenticated('admin');
      return;
    }

    onAuthenticated('guardian');
  };

  const verifyOtp = () => {
    if (otpCode.length !== OTP_LENGTH) {
      setNotice('Enter all 6 digits to continue.');
      return;
    }

    onAuthenticated('guardian');
  };

  if (mode === 'login') {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#253241_0%,#0E1523_46%,#090D16_100%)] px-4 py-8 font-sans text-white">
        <div className="max-w-md mx-auto">
          <button
            onClick={onBackHome}
            className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-6 hover:bg-white/15"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-3xl p-6 shadow-2xl shadow-black/30 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-brand-orange/25 border border-brand-orange/40 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-brand-orange" />
                </div>
                <div>
                  <h1 className="font-display font-bold text-2xl">KimbAlert</h1>
                  <p className="text-xs text-white/60">Guardian Sign In</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-orange">Secure</span>
            </div>

            {notice && <Notice tone="dark">{notice}</Notice>}

            <form onSubmit={submitLogin} className="space-y-4 mt-4">
              <InputFieldDark
                label="Email or Phone"
                icon={<Mail className="w-4 h-4" />}
                value={loginForm.emailOrPhone}
                onChange={(value) => setLoginForm((previous) => ({ ...previous, emailOrPhone: value }))}
                placeholder="you@example.com"
              />

              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(event) => setLoginForm((previous) => ({ ...previous, password: event.target.value }))}
                    className="w-full rounded-xl border border-white/20 bg-black/20 pl-10 pr-11 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-brand-orange"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {adminUnlocked && (
                <div className="rounded-xl border border-brand-orange/35 bg-brand-orange/10 p-3 flex items-center gap-2 text-xs text-brand-orange font-semibold">
                  <Sparkles className="w-4 h-4" />
                  Admin access unlocked from special-character credential pattern.
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl py-3.5 font-bold shadow-lg shadow-brand-orange/35 transition-all active:scale-[0.98]"
              >
                {adminUnlocked ? 'Enter Command Center' : 'Continue to Guardian App'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setOtpDigits(Array(OTP_LENGTH).fill(''));
                  onModeChange('otp');
                }}
                className="w-full border border-white/25 text-white rounded-xl py-3.5 font-semibold hover:border-white/40 transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Login with OTP
              </button>

              <p className="text-sm text-white/70 text-center pt-1">
                New guardian?{' '}
                <button type="button" onClick={() => onModeChange('signup')} className="font-bold text-brand-orange hover:underline">
                  Create account
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'signup') {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_left,#FFF2EC_0%,#FDF8F2_45%,#F6EFE7_100%)] px-4 py-8 font-sans">
        <div className="max-w-md mx-auto">
          <button
            onClick={onBackHome}
            className="w-10 h-10 rounded-full bg-white border border-brand-orange/15 flex items-center justify-center mb-6 text-text-main hover:border-brand-orange"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="bg-white border border-brand-orange/15 rounded-3xl p-6 shadow-2xl shadow-brand-orange/10 animate-fade-in">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-orange mb-2">Guardian Registration</p>
              <h1 className="font-display font-bold text-3xl text-text-main">Create Your Account</h1>
              <p className="text-sm text-text-muted mt-1">Set up your secure vault access in under a minute.</p>
            </div>

            {notice && <Notice tone="light">{notice}</Notice>}

            <form onSubmit={submitSignup} className="space-y-4 mt-4">
              <InputFieldLight
                label="Full Name"
                icon={<User className="w-4 h-4" />}
                value={signupForm.fullName}
                onChange={(value) => setSignupForm((previous) => ({ ...previous, fullName: value }))}
                placeholder="Guardian full name"
              />
              <InputFieldLight
                label="Phone Number"
                icon={<Phone className="w-4 h-4" />}
                value={signupForm.phone}
                onChange={(value) => setSignupForm((previous) => ({ ...previous, phone: value }))}
                placeholder="+260 97 123 4567"
              />
              <InputFieldLight
                label="Email"
                icon={<Mail className="w-4 h-4" />}
                value={signupForm.email}
                onChange={(value) => setSignupForm((previous) => ({ ...previous, email: value }))}
                placeholder="guardian@example.com"
              />
              <InputFieldLight
                label="National ID"
                icon={<BadgeCheck className="w-4 h-4" />}
                value={signupForm.nationalId}
                onChange={(value) => setSignupForm((previous) => ({ ...previous, nationalId: value }))}
                placeholder="123456/10/1"
              />

              <div>
                <label className="block text-sm font-semibold text-text-main mb-2">Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signupForm.password}
                    onChange={(event) => setSignupForm((previous) => ({ ...previous, password: event.target.value }))}
                    className="w-full rounded-xl border border-brand-orange/20 bg-bg-primary pl-10 pr-11 py-3 text-sm text-text-main placeholder:text-text-muted/70 focus:outline-none focus:border-brand-orange"
                    placeholder="Create a secure password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-text-main hover:bg-slate-900 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-text-main/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Continue to OTP
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-sm text-text-muted text-center pt-1">
                Already have an account?{' '}
                <button type="button" onClick={() => onModeChange('login')} className="font-bold text-brand-orange hover:underline">
                  Log in
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#EEF6FF_0%,#F9FCFF_40%,#FFFFFF_100%)] px-4 py-8 font-sans">
      <div className="max-w-md mx-auto">
        <button
          onClick={onBackHome}
          className="w-10 h-10 rounded-full bg-white border border-brand-orange/15 flex items-center justify-center mb-6 text-text-main hover:border-brand-orange"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-2xl shadow-slate-200/60 animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-orange-light border border-brand-orange/20 flex items-center justify-center mb-3">
              <KeyRound className="w-8 h-8 text-brand-orange" />
            </div>
            <h1 className="font-display font-bold text-3xl text-text-main">Verify OTP</h1>
            <p className="text-sm text-text-muted mt-1">Enter the 6-digit code sent to your phone.</p>
          </div>

          {notice && <Notice tone="light">{notice}</Notice>}

          <div className="flex gap-2 my-5">
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  otpRefs.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(event) => handleOtpChange(index, event.target.value)}
                onKeyDown={(event) => handleOtpKeyDown(index, event)}
                onPaste={handleOtpPaste}
                className="flex-1 h-12 text-center text-lg font-bold rounded-xl border border-slate-200 bg-slate-50 text-text-main focus:outline-none focus:border-brand-orange"
              />
            ))}
          </div>

          <button
            onClick={verifyOtp}
            className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl py-3.5 font-bold shadow-lg shadow-brand-orange/30 transition-all active:scale-[0.98]"
          >
            Verify & Continue
          </button>

          <div className="text-center text-sm text-text-muted mt-4">
            {countdown > 0 ? (
              <span>Resend code in {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCountdown(45);
                  setOtpDigits(Array(OTP_LENGTH).fill(''));
                  otpRefs.current[0]?.focus();
                  setNotice('A new OTP was sent.');
                }}
                className="font-semibold text-brand-orange hover:underline"
              >
                Resend OTP
              </button>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200 text-center text-sm text-text-muted">
            Need password login?{' '}
            <button type="button" onClick={() => onModeChange('login')} className="font-bold text-brand-orange hover:underline">
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Notice({ children, tone }: { children: React.ReactNode; tone: 'dark' | 'light' }) {
  const classes =
    tone === 'dark'
      ? 'border-brand-orange/35 bg-brand-orange/10 text-brand-orange'
      : 'border-brand-green/20 bg-brand-green-light text-brand-green';

  return <div className={`rounded-xl border p-3 text-sm ${classes}`}>{children}</div>;
}

function InputFieldDark({
  label,
  icon,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white/90 mb-2">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">{icon}</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-white/20 bg-black/20 pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-brand-orange"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function InputFieldLight({
  label,
  icon,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-text-main mb-2">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{icon}</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-brand-orange/20 bg-bg-primary pl-10 pr-4 py-3 text-sm text-text-main placeholder:text-text-muted/70 focus:outline-none focus:border-brand-orange"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
