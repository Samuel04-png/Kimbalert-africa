import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BellRing, CheckCircle2, Download, QrCode, Radio, Shield, Smartphone, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import CountUp from '../../components/common/CountUp';
import Watermark from '../../components/common/Watermark';

export default function LandingPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  const isIosDevice = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches
        || (navigator as Navigator & { standalone?: boolean }).standalone === true;
      setInstalled(Boolean(standalone));
    };

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as InstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setShowIosHelp(false);
    };

    checkStandalone();
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    if (isIosDevice) {
      setShowIosHelp(true);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-beige)] text-text-main selection:bg-brand-orange/20 selection:text-brand-orange">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-brand-orange/10 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}Kimbalert-africa_logo.png`}
              alt="KimbAlert Africa"
              className="h-10 w-10 rounded-[var(--r-md)] object-contain bg-white p-1 shadow-xs"
            />
            <span className="font-display text-2xl font-bold tracking-tight">KimbAlert Africa</span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#how-it-works" className="text-sm font-semibold text-text-muted transition-colors hover:text-brand-orange">How it Works</a>
            <a href="#partners" className="text-sm font-semibold text-text-muted transition-colors hover:text-brand-orange">Partners</a>
            <a href="#qr-bracelet" className="text-sm font-semibold text-text-muted transition-colors hover:text-brand-orange">QR Technology</a>
          </div>

          <div className="flex items-center gap-3">
            {!installed ? (
              <button
                type="button"
                onClick={() => void installApp()}
                className="btn-interactive hidden items-center gap-2 rounded-[var(--r-pill)] border border-brand-orange/25 bg-brand-orange-light px-4 py-2 text-sm font-bold text-brand-orange md:inline-flex"
              >
                <Download className="h-4 w-4" />
                Install App
              </button>
            ) : null}
            <Link to="/login" className="hidden text-sm font-bold text-text-main transition-colors hover:text-brand-orange md:block">
              Sign In
            </Link>
            <Link to="/signup" className="btn-interactive rounded-[var(--r-pill)] bg-brand-orange px-5 py-2.5 text-sm font-bold text-white shadow-orange">
              Register Child
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-4 pb-20 pt-32 md:px-6 md:pb-28 md:pt-44">
        <div className="absolute right-0 top-24 -z-10 h-[740px] w-[740px] translate-x-1/3 rounded-[var(--r-pill)] bg-brand-orange/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -z-10 h-[560px] w-[560px] -translate-x-1/3 rounded-[var(--r-pill)] bg-brand-green/10 blur-3xl" />

        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2 md:items-center">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-[var(--r-pill)] border border-brand-orange/20 bg-brand-orange-light px-4 py-2 text-sm font-bold text-brand-orange">
              <span className="h-2 w-2 rounded-[var(--r-pill)] bg-brand-orange animate-pulse" />
              Live in 4 African Countries
            </div>

            <h1 className="font-display text-5xl font-bold leading-[1.08] text-text-main md:text-7xl">
              No child in Africa is ever
              <span className="relative ml-2 inline-block text-brand-orange">
                truly lost.
                <svg className="absolute -bottom-1 left-0 h-3 w-full text-brand-orange/25" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-muted">
              A mission-critical child safety network combining secure identity vaults, real-time flare broadcasts, and coordinated community response.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/signup" className="btn-interactive inline-flex items-center justify-center gap-2 rounded-[var(--r-pill)] bg-brand-orange px-8 py-4 text-lg font-bold text-white shadow-orange">
                Register to Protect
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/login" className="btn-interactive inline-flex items-center justify-center gap-2 rounded-[var(--r-pill)] border-2 border-brand-green/20 bg-white px-8 py-4 text-lg font-bold text-text-main hover:bg-brand-green-light">
                Enterprise Access
              </Link>
            </div>

            {!installed ? (
              <div className="mt-4 rounded-[var(--r-md)] border border-brand-orange/20 bg-white px-4 py-3">
                <p className="type-caption flex items-center gap-1.5 font-semibold text-text-main">
                  <Smartphone className="h-4 w-4 text-brand-orange" />
                  Use Guardian as a phone app (PWA)
                </p>
                <p className="mt-1 type-caption">Install KimbAlert to run Guardian in full-screen mobile mode with faster launch.</p>
                <button
                  type="button"
                  onClick={() => void installApp()}
                  className="btn-interactive mt-2 inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-brand-orange px-4 py-2 text-xs font-bold text-white shadow-orange"
                >
                  <Download className="h-3.5 w-3.5" />
                  Install KimbAlert App
                </button>
                {showIosHelp ? (
                  <p className="mt-2 type-caption">
                    On iPhone: tap <strong>Share</strong> then <strong>Add to Home Screen</strong>.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="relative flex h-[480px] items-center justify-center animate-float">
            <div className="absolute flex h-[390px] w-[390px] items-center justify-center rounded-[var(--r-pill)] border border-brand-orange/15">
              <div className="absolute flex h-[290px] w-[290px] items-center justify-center rounded-[var(--r-pill)] border border-brand-orange/25">
                <div className="absolute flex h-[190px] w-[190px] items-center justify-center rounded-[var(--r-pill)] border border-brand-orange/30">
                  <div className="animate-flare relative z-10 grid h-24 w-24 place-items-center rounded-[var(--r-pill)] bg-brand-orange text-white shadow-orange">
                    <Radio className="h-10 w-10" />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -left-2 top-20 z-20 flex items-center gap-3 rounded-[var(--r-lg)] border border-brand-orange/10 bg-white p-4 shadow">
              <div className="grid h-11 w-11 place-items-center rounded-[var(--r-pill)] bg-brand-orange-light text-brand-orange">
                <BellRing className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Alert Broadcast</p>
                <p className="text-sm font-bold text-text-main">10km Radius Active</p>
              </div>
            </div>

            <div className="absolute -right-2 bottom-20 z-20 flex items-center gap-3 rounded-[var(--r-lg)] border border-brand-green/10 bg-white p-4 shadow">
              <div className="grid h-11 w-11 place-items-center rounded-[var(--r-pill)] bg-brand-green-light text-brand-green">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Status</p>
                <p className="text-sm font-bold text-text-main">Child Recovered</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-brand-orange/10 bg-white py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 md:grid-cols-4 md:divide-x md:divide-brand-orange/10 md:px-6">
          <StatCard number={<CountUp target={14205} />} label="Children Protected" suffix="+" />
          <StatCard number={<CountUp target={342} />} label="Partner Nodes" />
          <StatCard number={<CountUp target={100} suffix="%" />} label="Notification Success" />
          <StatCard number="< 2m" label="Avg Broadcast Time" />
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-24 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="font-display text-4xl font-bold">How KimbAlert Works</h2>
            <p className="mt-4 text-lg text-text-muted">A coordinated digital response system from profile registration to recovery.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard icon={<Shield />} title="1. The Vault" description="Guardians pre-register photos, medical data, contacts, and languages in encrypted storage." tone="green" />
            <FeatureCard icon={<Radio />} title="2. The Flare" description="Missing alerts launch at 10km instantly and auto-expand by +5km every hour to keep pace." tone="orange" />
            <FeatureCard icon={<Users />} title="3. Reunification" description="Police, hospitals, schools, and community receive synchronized direction to recover children safely." tone="yellow" />
          </div>
        </div>
      </section>

      <section id="qr-bracelet" className="relative overflow-hidden bg-brand-orange px-4 py-24 text-white md:px-6">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-16 md:grid-cols-2 md:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur-sm">
              <QrCode className="h-4 w-4" />
              Wearable Safety
            </div>
            <h2 className="font-display text-4xl font-bold md:text-5xl">The KimbAlert QR Bracelet</h2>
            <p className="mt-6 text-lg leading-relaxed text-white/85">
              A physical safety layer. When scanned, the bracelet triggers secure verification and immediate task-force coordination.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                'Instant scan alerts the specialized Task Force',
                'Cross-references active missing-child database',
                'Secure reunification workflow with guardian confirmation',
                'No personal data stored directly on bracelet surface',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 grid h-5 w-5 place-items-center rounded-[var(--r-pill)] bg-white/20">
                    <CheckCircle2 className="h-3 w-3" />
                  </span>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/signup" className="btn-interactive mt-10 inline-block rounded-[var(--r-pill)] bg-white px-8 py-4 text-lg font-bold text-brand-orange">
              Learn About Bracelets
            </Link>
          </div>

          <div className="flex h-[400px] flex-col items-center justify-center rounded-[var(--r-xl)] border border-white/20 bg-white/10 p-8 backdrop-blur-md">
            <div className="w-48 rotate-3 rounded-[var(--r-lg)] bg-white p-4 shadow-2xl transition-transform duration-500 hover:rotate-0">
              <div className="flex h-40 flex-col justify-between border-4 border-text-main p-2">
                <div className="flex justify-between">
                  <div className="h-8 w-8 bg-text-main" />
                  <div className="h-8 w-8 bg-text-main" />
                </div>
                <div className="grid flex-1 place-items-center">
                  <QrCode className="h-16 w-16 text-brand-orange" />
                </div>
                <div className="flex justify-between">
                  <div className="h-8 w-8 bg-text-main" />
                  <div className="h-4 w-12 bg-text-main" />
                </div>
              </div>
            </div>
            <p className="mt-8 font-mono tracking-[0.2em] text-white/70">ID: KMB-8472-AF</p>
          </div>
        </div>
      </section>

      <section id="partners" className="bg-white px-4 py-20 md:px-6">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="font-display text-3xl font-bold">Integrated with Community Infrastructure</h2>
          <div className="mt-10 grid grid-cols-2 gap-6 opacity-65 md:grid-cols-5">
            {['Police', 'Hospitals', 'Schools', 'Media', 'Community'].map((item) => (
              <article key={item} className="rounded-[var(--r-md)] border border-brand-orange/10 bg-brand-orange-light/40 p-4 text-sm font-bold text-text-muted">
                {item}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-6">
        <div className="mx-auto max-w-4xl rounded-[var(--r-xl)] border border-brand-orange/15 bg-white p-8 text-center shadow">
          <blockquote className="font-display text-3xl font-bold leading-tight text-text-main">
            "When the flare goes live, every minute saved can mean a family reunited."
          </blockquote>
          <p className="mt-3 text-sm text-text-muted">KimbAlert Field Operations Team</p>
        </div>
      </section>

      <footer className="border-t border-brand-orange/10 bg-white px-4 py-12 md:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <img
                src={`${import.meta.env.BASE_URL}Kimbalert-africa_logo.png`}
                alt="KimbAlert Africa"
                className="h-8 w-8 rounded-[var(--r-sm)] object-contain bg-white p-0.5 shadow-xs"
              />
              <span className="font-display text-xl font-bold">KimbAlert Africa</span>
            </div>
            <p className="max-w-sm text-sm text-text-muted">A real-time missing child emergency alert network designed so no child is ever truly lost.</p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-text-main">Platform</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><Link to="/login" className="hover:text-brand-orange">Guardian Portal</Link></li>
              <li><Link to="/login" className="hover:text-brand-orange">Enterprise Access</Link></li>
              <li><Link to="/signup" className="hover:text-brand-orange">Create Account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-text-main">Quick Links</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><Link to="/onboarding" className="hover:text-brand-orange">Onboarding</Link></li>
              <li><Link to="/login" className="hover:text-brand-orange">Sign In</Link></li>
              <li><Link to="/signup" className="hover:text-brand-orange">Register</Link></li>
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-7xl border-t border-brand-orange/10 pt-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-text-muted">
              Copyright {new Date().getFullYear()} KimbAlert Africa. All rights reserved.
            </p>
            <Watermark className="self-end pb-3 pr-3" />
          </div>
        </div>
      </footer>
    </div>
  );
}

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function StatCard({
  number,
  label,
  suffix,
}: {
  number: React.ReactNode;
  label: string;
  suffix?: string;
}) {
  return (
    <article className="px-3 text-center md:px-5">
      <div className="font-display text-4xl font-bold text-text-main md:text-5xl">
        {number}
        {suffix || ''}
      </div>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-text-muted">{label}</p>
    </article>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone: 'orange' | 'green' | 'yellow';
}) {
  const toneClass =
    tone === 'green'
      ? 'border-brand-green/20 bg-brand-green-light text-brand-green'
      : tone === 'yellow'
        ? 'border-amber-300/40 bg-amber-50 text-amber-600'
        : 'border-brand-orange/20 bg-brand-orange-light text-brand-orange';

  return (
    <article className="card-interactive rounded-[var(--r-xl)] border border-brand-orange/10 bg-white p-7 shadow">
      <span className={`grid h-14 w-14 place-items-center rounded-[var(--r-md)] border ${toneClass}`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'h-7 w-7' })}
      </span>
      <h3 className="mt-5 font-display text-3xl font-bold text-text-main">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-text-muted">{description}</p>
    </article>
  );
}
