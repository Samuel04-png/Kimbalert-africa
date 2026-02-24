import React, { useMemo } from 'react';
import { Activity, Bell, Download, Megaphone, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import Watermark from '../../components/common/Watermark';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { reports, children, analytics, tips, partners, pushToast } = useAppContext();

  const activeReports = reports.filter((report) => report.status === 'active');
  const pendingReports = reports.filter((report) => report.status === 'pending');
  const resolutionRate = reports.length
    ? Math.round(
        (reports.filter((report) => report.status === 'found' || report.status === 'closed').length /
          reports.length) *
          100,
      )
    : 0;

  const today = analytics[analytics.length - 1];
  const chartMax = Math.max(...analytics.map((item) => item.alerts), 1);

  const recentQueue = useMemo(
    () =>
      [...reports]
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        .slice(0, 5),
    [reports],
  );

  const recentTips = useMemo(
    () =>
      [...tips]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3),
    [tips],
  );

  const system = [
    { name: 'Firebase', ok: true },
    { name: 'SMS Gateway', ok: true },
    { name: 'Push', ok: true },
    { name: 'Maps', ok: true },
  ];

  return (
    <div className="min-h-screen bg-[#0b1220] px-4 pb-24 pt-4 text-slate-100 md:px-6 md:pb-8">
      <header className="rounded-[var(--r-xl)] border border-slate-700 bg-[var(--gradient-navy)] p-4 shadow-lg">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Command Center</p>
            <h1 className="mt-1 font-display text-4xl font-bold">Overview of current operations</h1>
          </div>
          <Link
            to="/admin/notifications"
            className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-600 bg-slate-900/50"
          >
            <Bell className="h-4.5 w-4.5" />
          </Link>
        </div>

        <span className="mt-4 inline-flex items-center rounded-[var(--r-pill)] bg-red-500 px-3 py-1 text-xs font-bold uppercase tracking-wider animate-pulse">
          {activeReports.length} active alerts
        </span>
      </header>

      <section className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi title="Active Alerts" value={String(activeReports.length)} tone="danger" />
        <Kpi title="Pending Review" value={String(pendingReports.length)} tone="pending" />
        <Kpi title="Registered Profiles" value={String(children.length)} tone="orange" />
        <Kpi title="Resolution Rate" value={`${resolutionRate}%`} tone="green" />
      </section>

      <section className="mt-4 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Today's Summary</h2>
        <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
          <SmallStat label="Alerts Today" value={String(today?.alerts ?? 0)} />
          <SmallStat label="Tips Received" value={String(tips.length)} />
          <SmallStat
            label="New Registrations"
            value={String(
              children.filter(
                (child) => Date.now() - new Date(child.createdAt).getTime() < 86400000,
              ).length,
            )}
          />
          <SmallStat
            label="Partners Online"
            value={String(partners.filter((partner) => partner.active).length)}
          />
        </div>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">Alerts last 7 days</p>
          <div className="mt-2 grid h-28 grid-cols-7 items-end gap-1.5">
            {analytics.map((day) => (
              <div key={day.date} className="flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-[6px] bg-brand-orange/80"
                  style={{ height: `${(day.alerts / chartMax) * 100}%`, minHeight: '10px' }}
                />
                <span className="text-[10px] text-slate-400">{day.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => pushToast('info', 'Broadcast queued to all active channels')}
          className="rounded-[var(--r-md)] border border-slate-700 bg-[#111a2b] p-3 text-left"
        >
          <Megaphone className="h-4 w-4 text-brand-orange" />
          <p className="mt-2 text-sm font-semibold">Broadcast Announcement</p>
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/partners')}
          className="rounded-[var(--r-md)] border border-slate-700 bg-[#111a2b] p-3 text-left"
        >
          <Plus className="h-4 w-4 text-brand-orange" />
          <p className="mt-2 text-sm font-semibold">Add Partner</p>
        </button>
        <button
          type="button"
          onClick={() => pushToast('success', 'Report export prepared')}
          className="rounded-[var(--r-md)] border border-slate-700 bg-[#111a2b] p-3 text-left"
        >
          <Download className="h-4 w-4 text-brand-orange" />
          <p className="mt-2 text-sm font-semibold">Export Report</p>
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/analytics')}
          className="rounded-[var(--r-md)] border border-slate-700 bg-[#111a2b] p-3 text-left"
        >
          <Activity className="h-4 w-4 text-brand-orange" />
          <p className="mt-2 text-sm font-semibold">View Analytics</p>
        </button>
      </section>

      <section className="mt-4 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Live Alert Queue</h2>
          <Link
            to="/admin/alerts"
            className="text-xs font-semibold uppercase tracking-wider text-brand-orange"
          >
            View All Alerts
          </Link>
        </div>
        <div className="mt-2 space-y-2">
          {recentQueue.map((report) => {
            const child = children.find((entry) => entry.id === report.childId);
            return (
              <button
                key={report.id}
                type="button"
                onClick={() => navigate(`/admin/alerts/${report.id}`)}
                className="flex w-full items-center justify-between rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] px-3 py-2 text-left"
              >
                <div>
                  <p className="text-sm font-semibold">{child?.name ?? report.childId}</p>
                  <p className="text-xs text-slate-400">
                    {report.lastSeenLocation.address} • {timeAgo(report.startedAt)}
                  </p>
                </div>
                <span
                  className={`rounded-[var(--r-pill)] px-2 py-1 text-[10px] font-bold ${statusClass(report.status)}`}
                >
                  {report.status.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-4 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Recent Tips</h2>
        <div className="mt-2 space-y-2">
          {recentTips.map((tip) => (
            <article key={tip.id} className="rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] p-3">
              <p className="text-sm font-semibold">{tip.location}</p>
              <p className="text-xs text-slate-400">{tip.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">System Status</h2>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {system.map((item) => (
            <article key={item.name} className="rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] px-3 py-2">
              <p className="text-sm font-semibold">{item.name}</p>
              <p className={`text-xs ${item.ok ? 'text-brand-green' : 'text-red-400'}`}>
                {item.ok ? 'Operational' : 'Degraded'}
              </p>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-4 flex justify-end pb-3 pr-3">
        <Watermark tone="admin" />
      </div>
    </div>
  );
}

function Kpi({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: 'danger' | 'pending' | 'orange' | 'green';
}) {
  const color =
    tone === 'danger'
      ? 'border-red-500 text-red-300'
      : tone === 'pending'
        ? 'border-amber-400 text-amber-300'
        : tone === 'green'
          ? 'border-brand-green text-brand-green'
          : 'border-brand-orange text-brand-orange';
  return (
    <article className={`rounded-[var(--r-md)] border-l-4 bg-[#111a2b] p-3 ${color}`}>
      <p className="text-[11px] uppercase tracking-wider text-slate-400">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </article>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-lg font-bold text-slate-100">{value}</p>
    </article>
  );
}

function statusClass(status: string) {
  if (status === 'active') return 'border border-red-500/40 bg-red-500/20 text-red-300';
  if (status === 'pending') return 'border border-amber-500/40 bg-amber-500/20 text-amber-300';
  if (status === 'found') return 'border border-brand-green/40 bg-brand-green/20 text-brand-green';
  return 'border border-slate-600/40 bg-slate-600/20 text-slate-300';
}

function timeAgo(value: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}
