import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BrainCircuit,
  BookOpen,
  Clock3,
  QrCode,
  Radio,
  Siren,
  ShieldCheck,
  TriangleAlert,
  Users2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import FlarePulse from '../../components/common/FlarePulse';
import EmptyState from '../../components/common/EmptyState';
import { AvatarStatus } from '../../components/common/AvatarStatus';
import Watermark from '../../components/common/Watermark';

const tips = [
  'Set a family meeting point children can always remember.',
  'Review school exit plans once a month with your child.',
  'Keep two recent photos in your vault for faster alerts.',
  'Teach children one trusted emergency contact number.',
];

export default function GuardianHomePage() {
  const navigate = useNavigate();
  const { currentUser, children, reports, notifications, pushToast, updateReport } = useAppContext();
  const [tipIndex, setTipIndex] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);

  const guardianChildren = useMemo(
    () => children.filter((child) => child.guardianId === currentUser.id),
    [children, currentUser.id],
  );

  const myReports = useMemo(
    () => reports.filter((report) => report.guardianId === currentUser.id),
    [reports, currentUser.id],
  );

  const activeReport = useMemo(
    () => myReports.find((report) => report.status === 'active') ?? null,
    [myReports],
  );

  const pendingReport = useMemo(
    () => myReports.find((report) => report.status === 'pending') ?? null,
    [myReports],
  );
  const alertBannerState = activeReport ? 'active' : pendingReport ? 'pending' : 'idle';
  const bannerReport = activeReport ?? pendingReport;

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.userId === currentUser.id && !item.read).length,
    [notifications, currentUser.id],
  );

  const timelineFeed = useMemo(
    () =>
      myReports
        .flatMap((report) => report.timeline.map((event) => ({ ...event, reportId: report.id })))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5),
    [myReports],
  );

  const aiInsights = useMemo(() => {
    const averageVaultScore = guardianChildren.length
      ? Math.round(guardianChildren.reduce((sum, child) => sum + child.vaultScore, 0) / guardianChildren.length)
      : 0;
    const missingQr = guardianChildren.filter((child) => !child.qrLinked).length;
    const staleProfiles = guardianChildren.filter(
      (child) => Date.now() - new Date(child.lastUpdated).getTime() > 1000 * 60 * 60 * 24 * 45,
    ).length;

    return [
      {
        id: 'readiness',
        title: 'Readiness Score',
        value: `${averageVaultScore}%`,
        detail: averageVaultScore >= 85 ? 'Strong response readiness' : 'Update vault data to improve readiness',
        icon: ShieldCheck,
        toneClass: averageVaultScore >= 85
          ? 'text-brand-green bg-brand-green-light border-brand-green/25'
          : 'text-brand-orange bg-brand-orange-light border-brand-orange/25',
      },
      {
        id: 'qr',
        title: 'QR Coverage',
        value: missingQr ? `${missingQr} pending` : 'All linked',
        detail: missingQr ? 'Link bracelets for faster scan alerts' : 'All children are bracelet linked',
        icon: QrCode,
        toneClass: missingQr
          ? 'text-brand-orange bg-brand-orange-light border-brand-orange/25'
          : 'text-brand-green bg-brand-green-light border-brand-green/25',
      },
      {
        id: 'freshness',
        title: 'Profile Freshness',
        value: staleProfiles ? `${staleProfiles} outdated` : 'Up to date',
        detail: staleProfiles ? 'Refresh photos and descriptions this week' : 'Recent profile updates confirmed',
        icon: Clock3,
        toneClass: staleProfiles
          ? 'text-brand-orange bg-brand-orange-light border-brand-orange/25'
          : 'text-brand-green bg-brand-green-light border-brand-green/25',
      },
    ];
  }, [guardianChildren]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 10000);
    return () => window.clearInterval(timer);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const startHoldEmergency = () => {
    setHoldProgress(0);
    const started = performance.now();
    const duration = 1800;

    const tick = (time: number) => {
      const progress = Math.min(1, (time - started) / duration);
      setHoldProgress(progress * 100);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        pushToast('warning', 'Emergency Mode Active', 'Live location shared with trusted contacts and command center.');
        if (activeReport) {
          updateReport(activeReport.id, { priority: 'critical' });
        }
      }
    };

    requestAnimationFrame(tick);
  };

  const cancelHoldEmergency = () => {
    if (holdProgress < 100) setHoldProgress(0);
  };

  const openFlareBanner = () => {
    if (bannerReport) {
      navigate(`/guardian/alert/status/${bannerReport.id}`);
      return;
    }
    navigate('/guardian/alert');
  };

  return (
    <div className="guardian-screen animate-page-in">
      <header className="guardian-hero relative overflow-hidden p-5">
        <div className="absolute inset-x-0 -bottom-10 h-24 rounded-[100%] bg-brand-orange/8" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="type-kicker">Guardian Dashboard</p>
              <h1 className="guardian-page-title mt-1">{greeting}, {currentUser.fullName.split(' ')[0]}</h1>
              <p className="type-caption mt-1">Last activity: {myReports[0] ? timeAgo(myReports[0].startedAt) : 'No recent report'}</p>
            </div>

            <Link to="/guardian/notifications" className="relative grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-brand-orange/20 bg-white/85 text-text-main shadow-xs">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-[var(--r-pill)] bg-brand-orange px-1 type-micro font-bold text-white">
                  {Math.min(unreadCount, 9)}
                </span>
              ) : null}
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <HeaderChip label="Children" value={String(guardianChildren.length)} />
            <HeaderChip label="Active Alerts" value={String(myReports.filter((report) => report.status === 'active').length)} />
            <HeaderChip label="Drills" value="3" />
          </div>
        </div>
      </header>

      <button
        type="button"
        onClick={openFlareBanner}
        className={`relative w-full overflow-hidden rounded-[var(--r-lg)] border p-4 text-left shadow-lg btn-interactive ${
          alertBannerState === 'active'
            ? 'border-red-500/50 bg-[linear-gradient(135deg,#ef4444_0%,#dc2626_58%,#b91c1c_100%)] text-white shadow-danger'
            : alertBannerState === 'pending'
              ? 'border-amber-300/60 bg-[linear-gradient(160deg,#fff7ed_0%,#ffedd5_100%)] text-amber-900 shadow'
              : 'border-brand-orange/35 bg-[var(--gradient-orange)] text-white shadow-orange'
        }`}
      >
        {activeReport ? (
          <span className="absolute right-4 top-2 rounded-[var(--r-pill)] bg-white/20 p-1">
            <FlarePulse size={46} tone="danger" />
          </span>
        ) : null}
        <p className={`type-kicker ${alertBannerState === 'pending' ? 'text-amber-700' : 'text-white/80'}`}>
          {activeReport ? 'Active Flare Broadcast' : pendingReport ? 'Pending Verification' : 'Report Missing Child'}
        </p>
        <p className={`mt-1 text-xl font-bold leading-tight ${alertBannerState === 'pending' ? 'text-amber-900' : 'text-white'}`}>
          {activeReport ? `${childName(activeReport.childId, guardianChildren)} currently reported missing.` : 'Activate The Flare immediately'}
        </p>
        <p className={`type-caption ${alertBannerState === 'pending' ? 'text-amber-700' : 'text-white/85'}`}>
          {bannerReport ? 'Live map, timeline, and partner updates available.' : 'Tap to start a guided missing-child flare.'}
        </p>

        {bannerReport ? (
          <>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className={`rounded-[var(--r-sm)] border px-2.5 py-2 ${alertBannerState === 'pending' ? 'border-amber-300/60 bg-white/70' : 'border-white/25 bg-black/15'}`}>
                <p className={`type-micro uppercase ${alertBannerState === 'pending' ? 'text-amber-700' : 'text-white/70'}`}>Radius</p>
                <p className={`type-card-title ${alertBannerState === 'pending' ? 'text-amber-900' : 'text-white'}`}>{bannerReport.currentRadiusKm}km</p>
              </div>
              <div className={`rounded-[var(--r-sm)] border px-2.5 py-2 ${alertBannerState === 'pending' ? 'border-amber-300/60 bg-white/70' : 'border-white/25 bg-black/15'}`}>
                <p className={`type-micro uppercase ${alertBannerState === 'pending' ? 'text-amber-700' : 'text-white/70'}`}>Notified</p>
                <p className={`type-card-title ${alertBannerState === 'pending' ? 'text-amber-900' : 'text-white'}`}>{bannerReport.notifiedCount.toLocaleString()}</p>
              </div>
              <div className={`rounded-[var(--r-sm)] border px-2.5 py-2 ${alertBannerState === 'pending' ? 'border-amber-300/60 bg-white/70' : 'border-white/25 bg-black/15'}`}>
                <p className={`type-micro uppercase ${alertBannerState === 'pending' ? 'text-amber-700' : 'text-white/70'}`}>Started</p>
                <p className={`type-card-title ${alertBannerState === 'pending' ? 'text-amber-900' : 'text-white'}`}>{timeAgo(bannerReport.startedAt)}</p>
              </div>
            </div>
            <div className={`mt-3 inline-flex items-center rounded-[var(--r-pill)] px-3 py-1.5 text-xs font-semibold ${alertBannerState === 'pending' ? 'bg-amber-600 text-white' : 'bg-white text-red-600'}`}>
              {alertBannerState === 'pending' ? 'View Pending Flare' : 'View Live Flare'}
            </div>
          </>
        ) : null}
      </button>

      <section className="guardian-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="guardian-section-title">Quick Actions</h2>
          <Link to="/guardian/search" className="type-kicker text-brand-orange">
            Search
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <ActionButton label="Report Missing" icon={<TriangleAlert className="h-4.5 w-4.5" />} to="/guardian/alert" />
          <ActionButton label="View Children" icon={<Users2 className="h-4.5 w-4.5" />} to="/guardian/children" />
          <ActionButton label="Safety Tips" icon={<BookOpen className="h-4.5 w-4.5" />} to="/guardian/resources" />
          <ActionButton label="Contacts" icon={<Siren className="h-4.5 w-4.5" />} to="/guardian/resources" />
          <ActionButton label="QR Bracelet" icon={<QrCode className="h-4.5 w-4.5" />} to="/guardian/alert/qr" />
          <ActionButton label="Activity" icon={<Radio className="h-4.5 w-4.5" />} to="/guardian/activity" />
        </div>
      </section>

      <section className="guardian-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="guardian-section-title flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-brand-orange" />
            AI Safety Insights
          </h2>
          <span className="type-kicker text-brand-green">No Chatbot</span>
        </div>
        <p className="mt-1 type-caption">Signal-driven recommendations from your vault and live alert behavior.</p>
        <div className="mt-3 grid gap-2">
          {aiInsights.map((insight) => {
            const Icon = insight.icon;
            return (
              <article key={insight.id} className="rounded-[var(--r-md)] border border-slate-200 bg-bg-primary p-3">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 grid h-9 w-9 place-items-center rounded-[var(--r-sm)] border ${insight.toneClass}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="type-card-title">{insight.title}</p>
                      <p className="type-caption font-semibold text-text-main">{insight.value}</p>
                    </div>
                    <p className="mt-0.5 type-caption">{insight.detail}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="guardian-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="guardian-section-title">My Children</h2>
          <Link to="/guardian/children" className="type-kicker text-brand-orange">View All</Link>
        </div>
        {guardianChildren.length ? (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
            {guardianChildren.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => navigate(`/guardian/children/${child.id}`)}
                className="card-interactive min-w-[145px] rounded-[var(--r-md)] border border-slate-200 bg-bg-primary p-3 text-left"
              >
                <AvatarStatus src={child.photoUrls[0]} alt={child.name} size="md" status={activeReport?.childId === child.id ? 'active-alert' : 'online'} />
                <p className="mt-2 type-card-title">{child.name}</p>
                <p className="type-caption">{child.age} yrs | {child.gender}</p>
                <p className="mt-1 type-caption font-semibold text-brand-orange">Vault {child.vaultScore}%</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-3">
            <EmptyState
              icon={<Users2 className="h-9 w-9" />}
              title="Register your first child"
              body="Secure child details in the Vault to activate rapid alerts when needed."
              action={<Link to="/guardian/children/add" className="rounded-[var(--r-pill)] bg-brand-orange px-4 py-2 type-caption font-bold text-white">Add Child</Link>}
            />
          </div>
        )}
      </section>

      <section className="guardian-card p-4">
        <h2 className="guardian-section-title">Recent Activity</h2>
        <div className="mt-3 space-y-2">
          {timelineFeed.length ? (
            timelineFeed.map((entry) => (
              <article key={entry.id} className="rounded-[var(--r-md)] border border-slate-200 bg-bg-primary p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="type-card-title">{entry.title}</p>
                  <span className="type-caption">{timeAgo(entry.timestamp)}</span>
                </div>
                <p className="mt-0.5 type-caption">{entry.detail}</p>
              </article>
            ))
          ) : (
            <EmptyState icon={<Radio className="h-9 w-9" />} title="No alerts submitted yet" body="When you trigger a report, timeline updates will appear here." />
          )}
        </div>
      </section>

      <section className="guardian-card border-brand-orange/15 bg-brand-orange-light p-4">
        <p className="type-kicker text-brand-orange">Tip of the day</p>
        <p className="mt-2 guardian-section-title animate-fade-in">{tips[tipIndex]}</p>
      </section>

      <section className="guardian-card border-red-500/25 bg-red-50 p-4">
        <div className="flex items-center justify-between">
          <p className="type-card-title text-red-600">Emergency Mode</p>
          <span className="type-caption text-red-500">Hold to activate</span>
        </div>
        <button
          type="button"
          onPointerDown={startHoldEmergency}
          onPointerUp={cancelHoldEmergency}
          onPointerLeave={cancelHoldEmergency}
          className="mt-3 relative w-full overflow-hidden rounded-[var(--r-pill)] border border-red-400/40 bg-white px-4 py-3 type-body font-bold text-red-600"
        >
          <span className="absolute inset-y-0 left-0 bg-red-500/18 transition-[var(--transition-fast)]" style={{ width: `${holdProgress}%` }} />
          <span className="relative">Hold to Activate Emergency</span>
        </button>
      </section>

      <Watermark className="self-end pb-3 pr-3" />
    </div>
  );
}

function HeaderChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--r-md)] border border-brand-orange/15 bg-white/85 px-3 py-2.5 shadow-xs">
      <p className="type-kicker">{label}</p>
      <p className="guardian-stat-value">{value}</p>
    </div>
  );
}

function ActionButton({ label, icon, to }: { label: string; icon: React.ReactNode; to: string }) {
  return (
    <Link to={to} className="card-interactive rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary p-3 text-left">
      <span className="grid h-8 w-8 place-items-center rounded-[var(--r-sm)] bg-brand-orange-light text-brand-orange">{icon}</span>
      <p className="mt-2 type-caption font-semibold text-text-main">{label}</p>
    </Link>
  );
}

function timeAgo(value: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

function childName(childId: string, children: Array<{ id: string; name: string }>) {
  return children.find((child) => child.id === childId)?.name ?? 'Child';
}


