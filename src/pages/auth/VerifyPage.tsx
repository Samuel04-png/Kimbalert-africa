import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ConfirmationResult,
  EmailAuthProvider,
  RecaptchaVerifier,
  linkWithCredential,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { ArrowLeft, CheckCircle2, Edit3, KeyRound, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from 'firebase/firestore';
import { useAppContext } from '../../app/AppContext';
import BottomSheet from '../../components/common/BottomSheet';
import FlarePulse from '../../components/common/FlarePulse';
import PhoneFrame from '../../components/layout/PhoneFrame';
import { auth, db, isFirebaseConfigured } from '../../lib/firebase';
import { AdminUser, GuardianUser } from '../../types';

const OTP_LENGTH = 6;

type PendingProfile = {
  fullName?: string;
  phone?: string;
  phoneNormalized?: string;
  email?: string;
  nationalId?: string;
  location?: string;
  role?: 'guardian' | 'admin' | 'partner';
  password?: string;
};

function normalizePhoneForAuth(value?: string) {
  if (!value) return '';
  const compact = value.replace(/[\s\-()]/g, '');
  if (!compact) return '';
  if (compact.startsWith('+')) return `+${compact.slice(1).replace(/\D/g, '')}`;

  const digits = compact.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('0')) return `+27${digits.slice(1)}`;
  if (digits.startsWith('27')) return `+${digits}`;
  return `+27${digits}`;
}

function parsePendingProfile() {
  const raw = localStorage.getItem('pending_profile');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingProfile;
  } catch {
    return null;
  }
}

function clearPendingAuthCache() {
  localStorage.removeItem('pending_phone');
  localStorage.removeItem('pending_phone_e164');
  localStorage.removeItem('pending_auth_mode');
  localStorage.removeItem('pending_role');
  localStorage.removeItem('pending_profile');
}

function firebaseErrorMessage(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (!code) return 'Could not verify this code. Please try again.';

  if (code.includes('invalid-verification-code')) return 'Invalid OTP code. Please try again.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Wait and retry.';
  if (code.includes('captcha-check-failed')) return 'Captcha check failed. Retry sending OTP.';
  if (code.includes('invalid-phone-number')) return 'Phone number format is invalid.';
  if (code.includes('quota-exceeded')) return 'SMS quota reached. Try again later.';
  return 'Verification failed. Please try again.';
}

export default function VerifyPage() {
  const navigate = useNavigate();
  const { setCurrentUser, pushToast } = useAppContext();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);

  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  const pendingProfile = useMemo(parsePendingProfile, []);
  const authMode =
    localStorage.getItem('pending_auth_mode') || (pendingProfile ? 'signup' : 'login');
  const phoneDisplay =
    localStorage.getItem('pending_phone') || pendingProfile?.phone || '+27 71 234 5678';
  const phoneE164 =
    localStorage.getItem('pending_phone_e164') ||
    pendingProfile?.phoneNormalized ||
    normalizePhoneForAuth(phoneDisplay);

  const code = useMemo(() => digits.join(''), [digits]);

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

  useEffect(() => {
    void sendOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const sendOtp = async () => {
    if (sending) return;
    setSending(true);
    setErrorText('');

    if (!isFirebaseConfigured || !auth || !db) {
      // Local fallback when Firebase env is missing.
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      setCountdown(60);
      setSending(false);
      return;
    }

    if (!phoneE164) {
      setSending(false);
      setErrorText('Missing phone number. Go back and enter your phone.');
      return;
    }

    try {
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => undefined,
        });
      }

      confirmationRef.current = await signInWithPhoneNumber(auth, phoneE164, recaptchaRef.current);
      setCountdown(60);
      setDigits(Array(OTP_LENGTH).fill(''));
      refs.current[0]?.focus();
      pushToast('success', 'OTP sent', `Code sent to ${phoneDisplay}`);
    } catch (error) {
      setErrorText(firebaseErrorMessage(error));
      setShake(true);
      window.setTimeout(() => setShake(false), 250);
    } finally {
      setSending(false);
    }
  };

  const handleFirebaseLoginFlow = async (verifiedUid: string, verifiedPhone: string) => {
    if (!db) return;

    const adminDoc = await getDoc(doc(db, 'admins', verifiedUid));
    if (adminDoc.exists()) {
      const admin = adminDoc.data() as AdminUser;
      setCurrentUser(admin);
      clearPendingAuthCache();
      pushToast('success', 'Signed in to Command Center');
      setSuccess(true);
      window.setTimeout(() => navigate('/admin/dashboard'), 650);
      return;
    }

    const guardianDoc = await getDoc(doc(db, 'guardians', verifiedUid));
    if (guardianDoc.exists()) {
      const guardian = guardianDoc.data() as GuardianUser;
      setCurrentUser(guardian);
      clearPendingAuthCache();
      pushToast('success', 'Phone verified');
      setSuccess(true);
      window.setTimeout(() => navigate('/guardian/home'), 650);
      return;
    }

    const normalized = normalizePhoneForAuth(verifiedPhone);
    if (normalized) {
      const existing = await getDocs(
        query(collection(db, 'guardians'), where('phoneNormalized', '==', normalized), limit(1)),
      );
      if (!existing.empty) {
        const profile = {
          ...(existing.docs[0].data() as GuardianUser),
          id: verifiedUid,
          phone: verifiedPhone,
          phoneNormalized: normalized,
        };
        await setDoc(doc(db, 'guardians', verifiedUid), profile, { merge: true });
        setCurrentUser(profile);
        clearPendingAuthCache();
        pushToast('success', 'Phone verified');
        setSuccess(true);
        window.setTimeout(() => navigate('/guardian/home'), 650);
        return;
      }
    }

    const fallback: GuardianUser = {
      id: verifiedUid,
      role: 'guardian',
      fullName: 'Guardian User',
      phone: verifiedPhone,
      phoneNormalized: normalized,
      email: '',
      location: 'South Africa',
      joinedAt: new Date().toISOString(),
      childrenCount: 0,
      verified: true,
    };
    await setDoc(doc(db, 'guardians', verifiedUid), fallback, { merge: true });
    setCurrentUser(fallback);
    clearPendingAuthCache();
    pushToast('success', 'Phone verified');
    setSuccess(true);
    window.setTimeout(() => navigate('/guardian/home'), 650);
  };

  const handleFirebaseSignupFlow = async (verifiedUid: string, verifiedPhone: string) => {
    if (!auth || !db) return;

    const role = pendingProfile?.role || (localStorage.getItem('pending_role') as PendingProfile['role']) || 'guardian';

    if (pendingProfile?.email && pendingProfile?.password && auth.currentUser) {
      try {
        const credential = EmailAuthProvider.credential(
          pendingProfile.email.trim(),
          pendingProfile.password,
        );
        await linkWithCredential(auth.currentUser, credential);
      } catch (error) {
        const code = (error as { code?: string })?.code || '';
        if (!code.includes('provider-already-linked') && !code.includes('email-already-in-use')) {
          throw error;
        }
      }
    }

    if (role === 'admin') {
      const adminProfile: AdminUser = {
        id: verifiedUid,
        role: 'admin',
        fullName: pendingProfile?.fullName || 'Admin User',
        phone: pendingProfile?.phone || verifiedPhone,
        phoneNormalized: normalizePhoneForAuth(pendingProfile?.phone || verifiedPhone),
        email: pendingProfile?.email || auth.currentUser?.email || '',
        location: pendingProfile?.location || 'South Africa',
        nationalId: pendingProfile?.nationalId,
        joinedAt: new Date().toISOString(),
        permissions: ['alerts:read', 'alerts:write', 'registry:read', 'partners:write'],
        online: true,
      };

      await setDoc(doc(db, 'admins', verifiedUid), adminProfile, { merge: true });
      setCurrentUser(adminProfile);
      clearPendingAuthCache();
      setSuccess(true);
      pushToast('success', 'Verification complete');
      window.setTimeout(() => navigate('/admin/dashboard'), 700);
      return;
    }

    const guardianProfile: GuardianUser = {
      id: verifiedUid,
      role: 'guardian',
      fullName: pendingProfile?.fullName || 'Guardian User',
      phone: pendingProfile?.phone || verifiedPhone,
      phoneNormalized: normalizePhoneForAuth(pendingProfile?.phone || verifiedPhone),
      email: pendingProfile?.email || auth.currentUser?.email || '',
      location: pendingProfile?.location || 'South Africa',
      nationalId: pendingProfile?.nationalId,
      avatarUrl: auth.currentUser?.photoURL || undefined,
      joinedAt: new Date().toISOString(),
      childrenCount: 0,
      verified: true,
    };

    await setDoc(doc(db, 'guardians', verifiedUid), guardianProfile, { merge: true });
    setCurrentUser(guardianProfile);
    clearPendingAuthCache();
    setSuccess(true);
    pushToast('success', 'Verification complete');
    window.setTimeout(() => navigate('/auth/success'), 700);
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

    try {
      if (!isFirebaseConfigured || !auth || !db || !confirmationRef.current) {
        // Local fallback when Firebase env is missing.
        await new Promise((resolve) => window.setTimeout(resolve, 900));
        if (code === '000000') {
          throw new Error('invalid-code');
        }
        clearPendingAuthCache();
        setSuccess(true);
        window.setTimeout(() => navigate('/auth/success'), 700);
        return;
      }

      const credential = await confirmationRef.current.confirm(code);
      const verifiedPhone = credential.user.phoneNumber || phoneE164;

      if (authMode === 'signup') {
        await handleFirebaseSignupFlow(credential.user.uid, verifiedPhone);
      } else {
        await handleFirebaseLoginFlow(credential.user.uid, verifiedPhone);
      }
    } catch (error) {
      setDigits(Array(OTP_LENGTH).fill(''));
      setErrorText(firebaseErrorMessage(error));
      setShake(true);
      window.setTimeout(() => setShake(false), 260);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resend = () => {
    if (countdown > 0 || sending) return;
    setDigits(Array(OTP_LENGTH).fill(''));
    refs.current[0]?.focus();
    void sendOtp();
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
              <span>{phoneDisplay}</span>
              <Link to="/signup" className="text-brand-orange">
                <Edit3 className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className={`mt-5 flex items-center justify-center gap-2 ${shake ? 'animate-shake' : ''}`}>
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
                  className={`h-12 w-10 rounded-[var(--r-sm)] border text-center text-lg font-bold transition-[var(--transition-fast)] sm:w-11 ${
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
              disabled={loading || success || sending}
              onClick={() => void verifyCode()}
              className="btn-interactive mt-5 w-full rounded-[var(--r-pill)] bg-brand-orange py-3.5 text-sm font-bold text-white shadow-orange disabled:opacity-70"
            >
              {loading ? 'Verifying...' : success ? 'Verified' : 'Verify & Continue'}
            </button>

            {loading || sending ? (
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

        <div id="recaptcha-container" className="pointer-events-none h-0 w-0 overflow-hidden opacity-0" />
      </div>

      <BottomSheet open={helpOpen} onClose={() => setHelpOpen(false)} title="OTP Help" snap="40">
        <div className="space-y-3 text-sm text-text-muted">
          <p>1. Confirm your phone number is correct.</p>
          <p>2. Wait for countdown to finish, then resend.</p>
          <p>3. Check SMS filtering and network signal.</p>
          <p>4. If blocked, return to login and use email/password recovery.</p>
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

