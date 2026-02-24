import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Radio, Shield, Users2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PhoneFrame from '../../components/layout/PhoneFrame';

const steps = [
  {
    title: 'The Vault',
    subtitle: 'Register early. Protect faster.',
    body: 'Store identity, medical details, contacts, and language preferences before any emergency.',
    icon: <Shield className="h-7 w-7" />,
  },
  {
    title: 'The Flare',
    subtitle: '10km now. +5km every hour.',
    body: 'When activated, the alert broadcasts immediately and expands to outpace travel distance.',
    icon: <Radio className="h-7 w-7" />,
  },
  {
    title: 'Community',
    subtitle: 'No child alone.',
    body: 'Police, hospitals, schools, media, and neighbors receive coordinated guidance to help recover children.',
    icon: <Users2 className="h-7 w-7" />,
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const step = useMemo(() => steps[index], [index]);

  const finish = () => {
    localStorage.setItem('onboarding_seen', 'true');
    navigate('/signup');
  };

  const onTouchEnd = (x: number) => {
    if (touchStart === null) return;
    const delta = x - touchStart;
    if (delta < -40 && index < steps.length - 1) setIndex((prev) => prev + 1);
    if (delta > 40 && index > 0) setIndex((prev) => prev - 1);
    setTouchStart(null);
  };

  return (
    <PhoneFrame>
      <div className="px-4 pb-8 pt-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-brand-orange/20 bg-white">
            <ArrowLeft className="h-4 w-4 text-text-main" />
          </Link>
          <button
            type="button"
            onClick={finish}
            className="text-xs font-semibold uppercase tracking-wider text-text-muted"
          >
            Skip
          </button>
        </div>

        <section
          className="mt-6 rounded-[var(--r-xl)] border border-brand-orange/10 bg-white p-6 shadow"
          onTouchStart={(event) => setTouchStart(event.changedTouches[0].clientX)}
          onTouchEnd={(event) => onTouchEnd(event.changedTouches[0].clientX)}
        >
          <span className="grid h-16 w-16 place-items-center rounded-[var(--r-lg)] border border-brand-orange/20 bg-brand-orange-light text-brand-orange">
            {step.icon}
          </span>
          <p className="mt-5 text-xs uppercase tracking-[0.25em] text-text-muted">Step {index + 1} of {steps.length}</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-text-main">{step.title}</h1>
          <p className="mt-1 text-sm font-semibold text-brand-orange">{step.subtitle}</p>
          <p className="mt-4 text-sm leading-7 text-text-muted">{step.body}</p>

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => setIndex((prev) => Math.max(prev - 1, 0))}
              className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-200 bg-slate-50 text-slate-600 disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="flex gap-2">
              {steps.map((_, dotIndex) => (
                <span
                  key={dotIndex}
                  className={`h-2.5 rounded-[var(--r-pill)] transition-[var(--transition)] ${dotIndex === index ? 'w-8 bg-brand-orange' : 'w-2.5 bg-slate-300'}`}
                />
              ))}
            </div>

            {index < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setIndex((prev) => Math.min(prev + 1, steps.length - 1))}
                className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] bg-brand-orange text-white shadow-orange"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                className="rounded-[var(--r-pill)] bg-brand-orange px-4 py-2 text-sm font-bold text-white shadow-orange"
              >
                Get Started
              </button>
            )}
          </div>
        </section>
      </div>
    </PhoneFrame>
  );
}
