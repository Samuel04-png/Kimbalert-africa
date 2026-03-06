import React, { useCallback, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import PhoneFrame from '../../components/layout/PhoneFrame';
import { auth, db, isFirebaseConfigured } from '../../lib/firebase';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function normalizePhoneForAuth(value: string) {
  const compact = value.replace(/[\s\-()]/g, '');
  if (compact.startsWith('+')) {
    return `+${compact.slice(1).replace(/\D/g, '')}`;
  }

  const digits = compact.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `+27${digits.slice(1)}`;
  if (digits.startsWith('27')) return `+${digits}`;
  return `+27${digits}`;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { guardians, admins, setCurrentUser, pushToast } = useAppContext();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [shake, setShake] = useState(false);
  const [form, setForm] = useState({ identifier: '', password: '', forgotEmail: '' });
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; forgotEmail?: string }>({});

  // Hidden admin portal — activated by tapping the logo 5 times
  const [logoTaps, setLogoTaps] = useState(0);
  const adminPortalVisible = logoTaps >= 5;

  const handleLogoTap = useCallback(() => {
    setLogoTaps((prev) => {
      const next = prev + 1;
      if (next === 5) {
        // Subtle haptic-like feedback — brief flash
        document.body.style.transition = 'background-color 0.15s';
        document.body.style.backgroundColor = 'rgba(232,98,42,0.04)';
        window.setTimeout(() => { document.body.style.backgroundColor = ''; }, 200);
      }
      return next;
    });
  }, []);

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
    try {
      if (isFirebaseConfigured && auth && db) {
        const identifier = form.identifier.trim();

        // Phone number → OTP flow
        if (!identifier.includes('@')) {
          const e164 = normalizePhoneForAuth(identifier);
          if (!e164) {
            pushToast('warning', 'Enter a valid phone number for OTP sign in');
            setLoading(false);
            return;
          }
          localStorage.removeItem('pending_profile');
          localStorage.removeItem('pending_role');
          localStorage.setItem('pending_phone', identifier);
          localStorage.setItem('pending_phone_e164', e164);
          localStorage.setItem('pending_auth_mode', 'login');
          navigate('/verify');
          setLoading(false);
          return;
        }

        // Email + password → Firebase Auth
        const credential = await signInWithEmailAndPassword(auth, identifier, form.password);
        const { user } = credential;
        const userId = user.uid;

        // Check admin first, then guardian — auto-routes to correct dashboard
        try {
          const adminDoc = await getDoc(doc(db, 'admins', userId));
          console.log("Login: Admin doc check:", adminDoc.exists(), adminDoc.data());
          if (adminDoc.exists()) {
            setCurrentUser(adminDoc.data() as typeof admins[number]);
            pushToast('success', 'Welcome back, Commander');
            navigate('/admin/dashboard');
            return;
          }
        } catch (adminLoginErr) {
          console.error("Login: Failed to read admin doc:", adminLoginErr);
        }

        const guardianDoc = await getDoc(doc(db, 'guardians', userId));
        console.log("Login: Guardian doc check:", guardianDoc.exists(), guardianDoc.data());
        if (guardianDoc.exists()) {
          setCurrentUser(guardianDoc.data() as typeof guardians[number]);
        } else {
          // First-time email user — create guardian profile
          const fallbackGuardian = {
            id: user.uid,
            role: 'guardian' as const,
            fullName: user.displayName || 'Guardian User',
            phone: user.phoneNumber || '',
            phoneNormalized: normalizePhoneForAuth(user.phoneNumber || ''),
            email: user.email || identifier,
            location: 'South Africa',
            joinedAt: new Date().toISOString(),
            childrenCount: 0,
            verified: true,
          };
          await setDoc(doc(db, 'guardians', user.uid), fallbackGuardian, { merge: true });
          setCurrentUser(fallbackGuardian);
        }
        pushToast('success', 'Welcome back');
        navigate('/guardian/home');
        return;
      }

      // Local fallback when Firebase env is not configured.
      await new Promise((resolve) => window.setTimeout(resolve, 800));
      if (adminPortalVisible) {
        setCurrentUser(admins[0]);
        pushToast('info', 'Admin session started');
        navigate('/admin/dashboard');
        return;
      }

      setCurrentUser(guardians[0]);
      pushToast('success', 'Welcome back');
      navigate('/guardian/home');
    } catch {
      setShake(true);
      window.setTimeout(() => setShake(false), 260);
      pushToast('error', 'Login failed', 'Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const continueWithOtp = () => {
    const identifier = form.identifier.trim();
    const e164 = normalizePhoneForAuth(identifier);
    if (!e164) {
      pushToast('warning', 'Enter your phone number first');
      return;
    }
    localStorage.removeItem('pending_profile');
    localStorage.removeItem('pending_role');
    localStorage.setItem('pending_phone', identifier);
    localStorage.setItem('pending_phone_e164', e164);
    localStorage.setItem('pending_auth_mode', 'login');
    navigate('/verify');
  };

  const submitForgot = async () => {
    if (!form.forgotEmail.trim()) {
      setErrors((prev) => ({ ...prev, forgotEmail: 'Enter your email or phone' }));
      return;
    }
    try {
      if (isFirebaseConfigured && auth && form.forgotEmail.includes('@')) {
        await sendPasswordResetEmail(auth, form.forgotEmail.trim());
        pushToast('success', 'Reset link sent', 'Check your email for recovery instructions.');
      } else {
        pushToast('success', 'Reset link sent', 'Check your messages for recovery instructions.');
      }
      setForgotOpen(false);
      setForm((prev) => ({ ...prev, forgotEmail: '' }));
    } catch {
      pushToast('error', 'Unable to send reset link');
    }
  };

  return (
    <PhoneFrame>
      <div className="auth-screen relative min-h-screen overflow-hidden px-4 pb-8 pt-3">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(232,98,42,0.22),transparent_40%),radial-gradient(circle_at_10%_85%,rgba(39,84,138,0.18),transparent_45%)] animate-float" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <Link to="/" className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-brand-orange/20 bg-white text-text-main">
              <ArrowLeft className="h-4 w-4" />
            </Link>

            {/* Hidden admin activator — looks like a decorative logo */}
            <button
              type="button"
              onClick={handleLogoTap}
              className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] bg-transparent select-none"
              aria-label="App logo"
            >
              <img
                src={`${import.meta.env.BASE_URL}Kimbalert-africa_logo.png`}
                alt=""
                className="h-8 w-8 rounded-[var(--r-sm)] object-contain"
                draggable={false}
              />
            </button>
          </div>

          <section className={`mt-6 rounded-[var(--r-xl)] border border-slate-200 bg-white p-6 shadow-xl ${shake ? 'animate-shake' : ''}`}>
            <p className="type-kicker">{adminPortalVisible ? 'Command Center' : 'Guardian Login'}</p>
            <h1 className="mt-2 type-page-title">Welcome Back</h1>
            <p className="mt-1 type-muted">
              {adminPortalVisible
                ? 'Sign in with your admin credentials to access the command center.'
                : 'Login to access your Child Vault and manage alerts.'}
            </p>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <Field
                label="Email or Phone"
                value={form.identifier}
                onChange={(value) => setForm((prev) => ({ ...prev, identifier: value }))}
                placeholder={adminPortalVisible ? 'admin@kimbalert.com' : 'example@email.com'}
                icon={adminPortalVisible ? <Shield className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
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

              {/* Admin portal banner — only visible after 5 taps on logo */}
              {adminPortalVisible ? (
                <div className="rounded-[var(--r-md)] border border-slate-700 bg-[#101827] p-3 text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-brand-orange" />
                  <span>Command Center access enabled. Sign in with admin credentials.</span>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className={`btn-interactive w-full rounded-[var(--r-pill)] py-3.5 text-sm font-bold text-white shadow-orange disabled:opacity-70 ${adminPortalVisible ? 'bg-[#101827]' : 'bg-brand-orange'
                  }`}
              >
                {loading
                  ? 'Signing in...'
                  : adminPortalVisible
                    ? 'Enter Command Center'
                    : 'Sign In'}
              </button>

              {!adminPortalVisible ? (
                <button
                  type="button"
                  onClick={continueWithOtp}
                  className="flex w-full items-center justify-center gap-2 rounded-[var(--r-pill)] border border-slate-300 bg-white py-3.5 text-sm font-semibold text-text-main"
                >
                  <Phone className="h-4 w-4" />
                  Continue with Phone OTP
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setLogoTaps(0); }}
                  className="flex w-full items-center justify-center gap-2 rounded-[var(--r-pill)] border border-slate-300 bg-white py-3.5 text-sm font-semibold text-text-muted"
                >
                  Back to Guardian Login
                </button>
              )}

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
          className={`w-full rounded-[var(--r-sm)] border bg-bg-primary pl-10 pr-4 py-3 text-sm text-text-main focus:outline-none focus:border-brand-orange ${error ? 'border-red-400' : 'border-slate-200'
            }`}
          placeholder={placeholder}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </label>
  );
}
