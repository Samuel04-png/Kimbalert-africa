import React, { useMemo, useState } from 'react';
import { MapPin, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import BottomSheet from '../../components/common/BottomSheet';
import Chip from '../../components/common/Chip';
import FlarePulse from '../../components/common/FlarePulse';

export default function AlertStatusShared({ reportId }: { reportId?: string }) {
  const navigate = useNavigate();
  const { currentUser, reports, children, tips, updateReport, pushToast } = useAppContext();
  const [mapMode, setMapMode] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);

  const myReports = useMemo(() => reports.filter((report) => report.guardianId === currentUser.id), [reports, currentUser.id]);
  const report = useMemo(() => {
    if (reportId) return myReports.find((entry) => entry.id === reportId) ?? null;
    return myReports.find((entry) => entry.status === 'active' || entry.status === 'pending') ?? myReports[0] ?? null;
  }, [myReports, reportId]);

  const child = useMemo(() => children.find((entry) => entry.id === report?.childId) ?? null, [children, report]);
  const linkedTips = useMemo(() => tips.filter((tip) => tip.reportId === report?.id), [tips, report?.id]);

  if (!report || !child) {
    return (
      <section className="guardian-card p-5">
        <p className="text-sm text-text-muted">No active alert found. Start a new report to view status tracking.</p>
      </section>
    );
  }

  const share = async () => {
    const text = `KimbAlert: ${child.name} missing near ${report.lastSeenLocation.address}. Radius ${report.currentRadiusKm}km.`;
    try {
      await navigator.clipboard.writeText(text);
      pushToast('success', 'Alert link copied');
    } catch {
      pushToast('info', 'Share payload prepared');
    }
  };

  return (
    <div className="guardian-screen animate-page-in pb-4">
      <section className="guardian-hero p-4">
        <div className="flex items-center gap-3">
          <img src={child.photoUrls[0]} alt={child.name} className="h-14 w-14 rounded-[var(--r-pill)] border border-slate-200 object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-text-main">{child.name}</p>
            <p className="text-xs text-text-muted">Last seen: {report.lastSeenLocation.address}</p>
          </div>
          <Chip variant={report.status === 'active' ? 'danger' : report.status === 'pending' ? 'pending' : 'green'} size="sm">
            {report.status.toUpperCase()}
          </Chip>
        </div>
      </section>

      <section className="guardian-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="guardian-section-title">Flare Status</h2>
          <button onClick={() => setMapMode((prev) => !prev)} className="guardian-secondary-btn px-3 py-1.5 text-xs">
            {mapMode ? 'Pulse View' : 'Map View'}
          </button>
        </div>

        <div className="mt-4 grid h-56 place-items-center overflow-hidden rounded-[var(--r-lg)] border border-slate-200 bg-bg-primary relative">
          {mapMode ? (
            <div className="relative h-full w-full bg-[radial-gradient(circle_at_20%_20%,#ffe6d9,transparent_35%),#fff]">
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[var(--r-pill)] border border-red-500/35 bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-500">Coverage {report.currentRadiusKm}km</span>
              <MapPin className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-red-500" />
            </div>
          ) : (
            <div className="grid place-items-center">
              <FlarePulse size={130} tone="danger" />
              <p className="mt-2 text-sm font-semibold text-text-main">Radius {report.currentRadiusKm}km</p>
            </div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Metric label="People Notified" value={report.notifiedCount.toLocaleString()} />
          <Metric label="Tips Received" value={String(report.tipsReceived)} />
          <Metric label="Next +5km" value="34m" />
        </div>

        <button onClick={() => setTipsOpen(true)} className="mt-3 guardian-secondary-btn px-3 py-1.5 text-xs">
          {linkedTips.length} tips from community
        </button>
      </section>

      <section className="guardian-card p-4">
        <h2 className="guardian-section-title">Partner Status</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <Chip variant={report.partnerNotified.police ? 'green' : 'neutral'}>Police {report.partnerNotified.police ? 'Online' : 'Pending'}</Chip>
          <Chip variant={report.partnerNotified.hospital ? 'green' : 'neutral'}>Hospital {report.partnerNotified.hospital ? 'Online' : 'Pending'}</Chip>
          <Chip variant={report.partnerNotified.school ? 'green' : 'neutral'}>School {report.partnerNotified.school ? 'Online' : 'Pending'}</Chip>
          <Chip variant={report.partnerNotified.community ? 'green' : 'neutral'}>Community {report.partnerNotified.community ? 'Online' : 'Pending'}</Chip>
        </div>
        <button
          onClick={() => {
            updateReport(report.id, {
              partnerNotified: {
                ...report.partnerNotified,
                media: true,
              },
            });
            pushToast('info', 'More partners notified');
          }}
          className="mt-3 rounded-[var(--r-pill)] border border-brand-orange/25 bg-brand-orange-light px-3 py-1.5 text-xs font-semibold text-brand-orange"
        >
          Notify More Partners
        </button>
      </section>

      <section className="guardian-card p-4">
        <h2 className="guardian-section-title">Status Timeline</h2>
        <div className="mt-3 space-y-2">
          {report.timeline.map((entry, index) => (
            <article key={entry.id} className="rounded-[var(--r-md)] border border-slate-200 bg-bg-primary p-3 animate-fade-in" style={{ animationDelay: `${Math.min(index, 6) * 0.05}s` }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-text-main">{entry.title}</p>
                <span className="text-[11px] text-text-muted">{timeAgo(entry.timestamp)}</span>
              </div>
              <p className="mt-0.5 text-xs text-text-muted">{entry.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="guardian-card p-4">
        <h2 className="guardian-section-title">Push Preview</h2>
        <article className="mt-2 rounded-[var(--r-md)] border border-brand-orange/20 bg-brand-orange-light p-3">
          <p className="text-xs uppercase tracking-wider font-semibold text-brand-orange">Notification</p>
          <p className="text-sm font-semibold text-text-main">{child.name} alert active in your area.</p>
          <p className="text-xs text-text-muted">Tap to open live map and submit a tip.</p>
        </article>
      </section>

      <div className="grid grid-cols-3 gap-2">
        <button onClick={share} className="guardian-secondary-btn py-2.5 text-xs"><Share2 className="mr-1 inline h-3.5 w-3.5" /> Share Alert</button>
        <button onClick={() => updateReport(report.id, { status: 'closed' })} className="rounded-[var(--r-pill)] border border-red-500/30 bg-red-50 py-2.5 text-xs font-semibold text-red-600">Cancel</button>
        <button onClick={() => navigate('/guardian/alert')} className="guardian-primary-btn py-2.5 text-xs">Update</button>
      </div>

      <BottomSheet open={tipsOpen} onClose={() => setTipsOpen(false)} title="Tips Received" snap="70">
        <div className="space-y-2">
          {linkedTips.length ? (
            linkedTips.map((tip) => (
              <article key={tip.id} className="rounded-[var(--r-sm)] border border-slate-200 bg-white p-3">
                <p className="text-sm font-semibold text-text-main">{tip.location}</p>
                <p className="text-xs text-text-muted">{tip.description}</p>
                <p className="mt-1 text-[11px] text-text-muted">{timeAgo(tip.createdAt)}</p>
              </article>
            ))
          ) : (
            <p className="text-sm text-text-muted">No tips submitted yet.</p>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--r-md)] border border-slate-200 bg-bg-primary px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wide text-text-muted">{label}</p>
      <p className="text-sm font-bold text-text-main">{value}</p>
    </div>
  );
}

function timeAgo(value: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}


