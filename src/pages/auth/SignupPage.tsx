import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, Shield, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PhoneFrame from '../../components/layout/PhoneFrame';
import BottomSheet from '../../components/common/BottomSheet';
import StepIndicator from '../../components/common/StepIndicator';

const countryCodes = [
  { code: 'ZA', dial: '+27', name: 'South Africa' },
  { code: 'KE', dial: '+254', name: 'Kenya' },
  { code: 'GH', dial: '+233', name: 'Ghana' },
  { code: 'NG', dial: '+234', name: 'Nigeria' },
  { code: 'ZM', dial: '+260', name: 'Zambia' },
  { code: 'UG', dial: '+256', name: 'Uganda' },
  { code: 'TZ', dial: '+255', name: 'Tanzania' },
  { code: 'ET', dial: '+251', name: 'Ethiopia' },
  { code: 'SN', dial: '+221', name: 'Senegal' },
  { code: 'CI', dial: '+225', name: "Cote d'Ivoire" },
];

const defaultCountryCode = String(import.meta.env.VITE_DEFAULT_COUNTRY ?? 'ZA').toUpperCase();
const defaultCountry = countryCodes.find((entry) => entry.code === defaultCountryCode) ?? countryCodes[0];

function passwordScore(value: string) {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^a-zA-Z0-9]/.test(value)) score += 1;
  return score;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showCountrySheet, setShowCountrySheet] = useState(false);
  const [query, setQuery] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    fullName: '',
    country: defaultCountry,
    phone: '',
    email: '',
    nationalId: '',
    role: 'guardian',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });

  const strength = useMemo(() => passwordScore(form.password), [form.password]);
  const filteredCodes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countryCodes;
    return countryCodes.filter((item) => `${item.code} ${item.name} ${item.dial}`.toLowerCase().includes(q));
  }, [query]);

  const validateStepOne = () => {
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required';
    if (!form.phone.trim()) next.phone = 'Phone is required';
    if (!form.email.trim()) next.email = 'Email is required';
    if (!form.nationalId.trim()) next.nationalId = 'National ID is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStepTwo = () => {
    const next: Record<string, string> = {};
    if (!form.password) next.password = 'Password is required';
    if (strength < 2) next.password = 'Password is too weak';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match';
    if (!form.termsAccepted) next.termsAccepted = 'Accept terms to continue';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStepOne()) return;
    setStep(2);
  };

  const createAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateStepTwo()) return;
    setLoading(true);
    localStorage.setItem('pending_phone', `${form.country.dial} ${form.phone}`);
    localStorage.setItem('pending_role', form.role);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    navigate('/verify');
  };

  return (
    <PhoneFrame>
      <div className="auth-screen px-4 pb-8 pt-3">
        <Link to="/login" className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-brand-orange/20 bg-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <section className="mt-5 rounded-[var(--r-xl)] border border-slate-200 bg-white p-6 shadow-lg">
          <p className="type-kicker">Create Account</p>
          <h1 className="mt-2 type-page-title">Protect your child today</h1>
          <p className="mt-2 type-muted">Complete 2 quick steps to secure your vault access.</p>

          <div className="mt-5">
            <StepIndicator current={step} total={2} />
          </div>

          {step === 1 ? (
            <div className="mt-5 space-y-4 animate-slide-right">
              <InputField
                label="Full Name"
                value={form.fullName}
                onChange={(value) => setForm((prev) => ({ ...prev, fullName: value }))}
                error={errors.fullName}
              />

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-text-main">Phone Number</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCountrySheet(true)}
                    className="rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 text-sm font-semibold"
                  >
                    {form.country.code} {form.country.dial}
                  </button>
                  <input
                    value={form.phone}
                    onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                    className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3.5 py-2.5 text-sm"
                    placeholder="97 123 4567"
                  />
                </div>
                {errors.phone ? <p className="mt-1 text-xs text-red-500">{errors.phone}</p> : null}
              </div>

              <InputField label="Email" value={form.email} onChange={(value) => setForm((prev) => ({ ...prev, email: value }))} error={errors.email} />
              <InputField label="National ID" value={form.nationalId} onChange={(value) => setForm((prev) => ({ ...prev, nationalId: value }))} error={errors.nationalId} />

              <div>
                <p className="mb-1.5 text-sm font-semibold text-text-main">Role</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, role: 'guardian' }))}
                    className={`rounded-[var(--r-sm)] border px-3 py-2 text-sm font-semibold ${form.role === 'guardian' ? 'border-brand-orange bg-brand-orange-light text-brand-orange' : 'border-slate-200 bg-bg-primary text-text-muted'}`}
                  >
                    Guardian
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, role: 'partner' }))}
                    className={`rounded-[var(--r-sm)] border px-3 py-2 text-sm font-semibold ${form.role === 'partner' ? 'border-brand-orange bg-brand-orange-light text-brand-orange' : 'border-slate-200 bg-bg-primary text-text-muted'}`}
                  >
                    Partner
                  </button>
                </div>
              </div>

              <button type="button" onClick={goNext} className="btn-interactive mt-1 w-full rounded-[var(--r-pill)] bg-brand-orange py-3.5 text-sm font-bold text-white shadow-orange">
                Next: Security
              </button>
            </div>
          ) : (
            <form onSubmit={createAccount} className="mt-5 space-y-4 animate-slide-right">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-text-main">Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary pl-10 pr-4 py-2.5 text-sm"
                    placeholder="Create a secure password"
                  />
                </div>
                {errors.password ? <p className="mt-1 text-xs text-red-500">{errors.password}</p> : null}
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((item) => (
                    <span
                      key={item}
                      className={`h-2 rounded-[var(--r-pill)] ${
                        item <= strength
                          ? item <= 1
                            ? 'bg-red-500'
                            : item <= 2
                              ? 'bg-amber-500'
                              : item <= 3
                                ? 'bg-brand-orange'
                                : 'bg-brand-green'
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <InputField
                label="Confirm Password"
                value={form.confirmPassword}
                onChange={(value) => setForm((prev) => ({ ...prev, confirmPassword: value }))}
                type="password"
                error={errors.confirmPassword}
              />

              <label className="flex items-start gap-2 rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary p-3 text-sm text-text-main">
                <input
                  type="checkbox"
                  checked={form.termsAccepted}
                  onChange={(event) => setForm((prev) => ({ ...prev, termsAccepted: event.target.checked }))}
                  className="mt-0.5 h-4 w-4"
                />
                <span>I accept the Terms and Privacy Policy for child safety processing.</span>
              </label>
              {errors.termsAccepted ? <p className="text-xs text-red-500">{errors.termsAccepted}</p> : null}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button type="button" onClick={() => setStep(1)} className="rounded-[var(--r-pill)] border border-slate-300 bg-white py-3 text-sm font-semibold text-text-main">
                  Back
                </button>
                <button type="submit" disabled={loading} className="btn-interactive rounded-[var(--r-pill)] bg-brand-orange py-3 text-sm font-bold text-white shadow-orange">
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-orange">
              Log in
            </Link>
          </p>
        </section>
      </div>

      <BottomSheet open={showCountrySheet} onClose={() => setShowCountrySheet(false)} title="Select Country Code" snap="70">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3.5 py-2.5 text-sm"
          placeholder="Search country"
        />
        <div className="mt-3 space-y-1">
          {filteredCodes.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                setForm((prev) => ({ ...prev, country: item }));
                setShowCountrySheet(false);
              }}
              className="flex w-full items-center justify-between rounded-[var(--r-sm)] border border-slate-200 bg-white px-3 py-2 text-left text-sm"
            >
              <span>{item.name}</span>
              <span className="font-semibold text-brand-orange">{item.dial}</span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </PhoneFrame>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-text-main">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-[var(--r-sm)] border bg-bg-primary px-3.5 py-2.5 text-sm ${error ? 'border-red-400' : 'border-slate-200'}`}
      />
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </label>
  );
}
