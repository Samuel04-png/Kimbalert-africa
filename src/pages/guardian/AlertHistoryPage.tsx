import React, { useMemo, useState } from 'react';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import Chip from '../../components/common/Chip';
import EmptyState from '../../components/common/EmptyState';

type HistoryFilter = 'all' | 'active' | 'found' | 'closed';

export default function AlertHistoryPage() {
  const navigate = useNavigate();
  const { currentUser, reports, children, pushToast } = useAppContext();
  const [filter, setFilter] = useState<HistoryFilter>('all');

  const myReports = useMemo(
    () => reports.filter((report) => report.guardianId === currentUser.id),
    [reports, currentUser.id],
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return myReports;
    return myReports.filter((report) => report.status === filter);
  }, [myReports, filter]);

  const summary = useMemo(() => {
    const total = myReports.length;
    const found = myReports.filter((report) => report.status === 'found').length;
    const resolved = myReports.filter((report) => Boolean(report.closedAt));
    const avgMins = resolved.length
      ? Math.round(
          resolved.reduce((acc, report) => {
            const start = new Date(report.startedAt).getTime();
            const end = new Date(report.closedAt || report.startedAt).getTime();
            return acc + (end - start) / 60000;
          }, 0) / resolved.length,
        )
      : 0;

    return { total, found, avgMins };
  }, [myReports]);

  const exportHistory = () => {
    const text = filtered
      .map((report) => `${report.id},${report.status},${report.currentRadiusKm}km,${report.notifiedCount}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    pushToast('success', 'History copied for export');
  };

  return (
    <div className="guardian-screen animate-page-in pb-4">
      <header className="flex items-center justify-between">
        <Link to="/guardian/activity" className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-200 bg-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <button type="button" onClick={exportHistory} className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-200 bg-white text-text-main">
            <Download className="h-4 w-4" />
          </button>
          <button type="button" onClick={exportHistory} className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-200 bg-white text-text-main">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      <section className="guardian-panel p-4">
        <h1 className="guardian-page-title">Alert History</h1>
        <p className="text-sm text-text-muted">Track outcomes and response performance.</p>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat label="Total Alerts" value={String(summary.total)} />
          <Stat label="Found" value={String(summary.found)} tone="green" />
          <Stat label="Avg Response" value={summary.avgMins ? `${summary.avgMins}m` : '--'} tone="orange" />
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Chip variant={filter === 'all' ? 'orange' : 'neutral'} selected={filter === 'all'} onClick={() => setFilter('all')}>All</Chip>
        <Chip variant={filter === 'active' ? 'danger' : 'neutral'} selected={filter === 'active'} onClick={() => setFilter('active')}>Active</Chip>
        <Chip variant={filter === 'found' ? 'green' : 'neutral'} selected={filter === 'found'} onClick={() => setFilter('found')}>Found</Chip>
        <Chip variant={filter === 'closed' ? 'pending' : 'neutral'} selected={filter === 'closed'} onClick={() => setFilter('closed')}>Closed</Chip>
      </div>

      {filtered.length ? (
        <div className="space-y-2">
          {filtered.map((report) => {
            const child = children.find((entry) => entry.id === report.childId);
            return (
              <button
                key={report.id}
                type="button"
                onClick={() => navigate(`/guardian/alert/status/${report.id}`)}
                className="w-full rounded-[var(--r-lg)] border border-slate-200 bg-white p-3 text-left shadow-sm card-interactive"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-text-main">{child?.name ?? report.childId}</p>
                  <Chip size="sm" variant={statusVariant(report.status)}>
                    {report.status === 'active' ? 'ACTIVE' : report.status === 'found' ? 'FOUND' : report.status.toUpperCase()}
                  </Chip>
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  {new Date(report.startedAt).toLocaleDateString()} • Radius {report.currentRadiusKm}km • Notified {report.notifiedCount.toLocaleString()}
                </p>
                {report.closedAt ? (
                  <p className="text-xs text-brand-green">Resolved in {duration(report.startedAt, report.closedAt)}</p>
                ) : report.status === 'active' ? (
                  <p className="text-xs text-red-500 animate-pulse">Case is currently active</p>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState icon="📋" title="No alerts submitted yet" body="Your historical reports will appear here once you submit alerts." />
      )}
    </div>
  );
}

function Stat({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'green' | 'orange' }) {
  const toneClass = tone === 'green' ? 'text-brand-green' : tone === 'orange' ? 'text-brand-orange' : 'text-text-main';
  return (
    <article className="rounded-[var(--r-md)] border border-slate-200 bg-bg-primary px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className={`text-lg font-bold ${toneClass}`}>{value}</p>
    </article>
  );
}

function statusVariant(status: string): 'danger' | 'pending' | 'green' | 'neutral' {
  if (status === 'active') return 'danger';
  if (status === 'pending') return 'pending';
  if (status === 'found') return 'green';
  return 'neutral';
}

function duration(start: string, end: string) {
  const mins = Math.max(1, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m}m`;
  return `${h}h ${m}m`;
}


