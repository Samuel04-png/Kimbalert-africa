import React, { useMemo, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Phone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import PhoneFrame from '../../components/layout/PhoneFrame';

export default function LoginPage() {
  const navigate = useNavigate();
  const { guardians, admins, setCurrentUser, pushToast } = useAppContext();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [shake, setShake] = useState(false);
  const [form, setForm] = useState({ identifier: '', password: '', forgotEmail: '' });
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; forgotEmail?: string }>({});

  const adminUnlocked = useMemo(() => {
    const combined = `${form.identifier}${form.password}`;
    const specialCount = (combined.match(/[^a-zA-Z0-9]/g) ?? []).length;
    return specialCount >= 2;
  }, [form.identifier, form.password]);

  const validate = () => {
    const next: typeof errors = {};
    if (!form.identifier.trim()) next.identifier = 'Email or phone is required';
    if (!form.password.trim()) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      setShake(true);
      window.setTimeout(() => setShake(false), 250);
      return;
    }

    setLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 800));

    if (adminUnlocked) {
      setCurrentUser(admins[0]);
      pushToast('info', 'Admin credential pattern detected');
      navigate('/admin/dashboard');
      return;
    }

    setCurrentUser(guardians[0]);
    pushToast('success', 'Welcome back');
    navigate('/guardian/home');
  };

  const submitForgot = () => {
    if (!form.forgotEmail.trim()) {
      setErrors((prev) => ({ ...prev, forgotEmail: 'Enter your email or phone' }));
      return;
    }
    pushToast('success', 'Reset link sent', 'Check your messages for recovery instructions.');
    setForgotOpen(false);
    setForm((prev) => ({ ...prev, forgotEmail: '' }));
  };

  return (
    <PhoneFrame>
      <div className="auth-screen relative min-h-screen overflow-hidden px-4 pb-8 pt-3">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(232,98,42,0.22),transparent_40%),radial-gradient(circle_at_10%_85%,rgba(39,84,138,0.18),transparent_45%)] animate-float" />
        <div className="relative z-10">
          <Link to="/" className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-brand-orange/20 bg-white text-text-main">
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <section className={`mt-6 rounded-[var(--r-xl)] border border-slate-200 bg-white p-6 shadow-xl ${shake ? 'animate-shake' : ''}`}>
            <p className="type-kicker">Guardian Login</p>
            <h1 className="mt-2 type-page-title">Welcome Back</h1>
            <p className="mt-1 type-muted">Login to access your Child Vault and manage alerts.</p>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <Field
                label="Email or Phone"
                value={form.identifier}
                onChange={(value) => setForm((prev) => ({ ...prev, identifier: value }))}
                placeholder="example@email.com"
                icon={<Mail className="h-4 w-4" />}
                error={errors.identifier}
              />

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-text-main">Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    className={`w-full rounded-[var(--r-sm)] border bg-bg-primary pl-10 pr-11 py-3 text-sm text-text-main transition-[var(--transition-fast)] focus:outline-none focus:border-brand-orange ${errors.password ? 'border-red-400' : 'border-slate-200'}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password ? <p className="mt-1 text-xs text-red-500">{errors.password}</p> : null}
              </div>

              <button
                type="button"
                onClick={() => setForgotOpen((prev) => !prev)}
                className="text-right text-xs font-semibold text-brand-orange"
              >
                Forgot password?
              </button>

              {forgotOpen ? (
                <div className="rounded-[var(--r-md)] border border-brand-orange/20 bg-brand-orange-light p-3">
                  <p className="text-xs font-semibold text-brand-orange">Recovery</p>
                  <div className="mt-2 space-y-2">
                    <input
                      value={form.forgotEmail}
                      onChange={(event) => {
                        const value = event.target.value;
                        setForm((prev) => ({ ...prev, forgotEmail: value }));
                        setErrors((prev) => ({ ...prev, forgotEmail: undefined }));
                      }}
                      className="w-full rounded-[var(--r-sm)] border border-brand-orange/30 bg-white px-3 py-2 text-sm"
                      placeholder="Email or phone"
                    />
                    {errors.forgotEmail ? <p className="text-xs text-red-500">{errors.forgotEmail}</p> : null}
                    <button
                      type="button"
                      onClick={submitForgot}
                      className="rounded-[var(--r-pill)] bg-brand-orange px-4 py-2 text-xs font-bold text-white"
                    >
                      Send Reset Link
                    </button>
                  </div>
                </div>
              ) : null}

              {adminUnlocked ? (
                <div className="rounded-[var(--r-md)] border border-brand-orange/35 bg-brand-orange-light p-3 text-xs font-semibold text-brand-orange">
                  Admin access rule matched. Sign in will open command center.
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="btn-interactive w-full rounded-[var(--r-pill)] bg-brand-orange py-3.5 text-sm font-bold text-white shadow-orange disabled:opacity-70"
              >
                {loading ? 'Signing in...' : adminUnlocked ? 'Enter Command Center' : 'Sign In'}
              </button>

              <Link to="/verify" className="flex w-full items-center justify-center gap-2 rounded-[var(--r-pill)] border border-slate-300 bg-white py-3.5 text-sm font-semibold text-text-main">
                <Phone className="h-4 w-4" />
                Continue with Phone OTP
              </Link>

              <p className="text-center text-sm text-text-muted">
                New here?{' '}
                <Link to="/signup" className="font-bold text-brand-orange">
                  Create account
                </Link>
              </p>
            </form>
          </section>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-text-main">{label}</span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{icon}</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-[var(--r-sm)] border bg-bg-primary pl-10 pr-4 py-3 text-sm text-text-main focus:outline-none focus:border-brand-orange ${
            error ? 'border-red-400' : 'border-slate-200'
          }`}
          placeholder={placeholder}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </label>
  );
}
