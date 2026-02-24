import React, { useMemo, useState } from 'react';
import { ArrowLeft, Bell, MapPin, Share2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import BottomSheet from '../../components/common/BottomSheet';
import Chip from '../../components/common/Chip';
import FlarePulse from '../../components/common/FlarePulse';

export default function CommunityAlertDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { communityAlerts, reports, addTip, pushToast } = useAppContext();
  const [follow, setFollow] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [tip, setTip] = useState({ what: '', where: '', when: '', consent: false });

  const alert = useMemo(() => communityAlerts.find((entry) => entry.id === id) ?? null, [communityAlerts, id]);
  const report = useMemo(() => reports.find((entry) => entry.id === alert?.reportId) ?? null, [reports, alert?.reportId]);

  const similarAlerts = useMemo(() => {
    if (!alert) return [];
    return communityAlerts
      .filter((entry) => entry.id !== alert.id && Math.abs(entry.distanceKm - alert.distanceKm) <= 5)
      .slice(0, 2);
  }, [communityAlerts, alert]);

  if (!alert) {
    return (
      <div className="space-y-3">
        <Link to="/guardian/activity" className="text-sm text-brand-orange">Back to alerts</Link>
        <p className="text-sm text-text-muted">Alert not found.</p>
      </div>
    );
  }

  const submitTip = () => {
    if (!tip.what.trim() || !tip.where.trim() || !tip.consent) {
      pushToast('warning', 'Please complete the tip form and consent');
      return;
    }
    addTip({
      reportId: alert.reportId,
      reporterName: 'Community Member',
      description: tip.what,
      location: tip.where,
      when: tip.when || new Date().toISOString(),
    });
    setTip({ what: '', where: '', when: '', consent: false });
    setTipOpen(false);
    navigate('/guardian/activity/tip-success');
  };

  return (
    <div className="guardian-screen animate-page-in pb-4">
      <header className="flex items-center justify-between">
        <Link to="/guardian/activity" className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-200 bg-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={() => setFollow((prev) => !prev)}
          className={`rounded-[var(--r-pill)] px-3 py-1.5 text-xs font-semibold ${follow ? 'bg-brand-green text-white' : 'border border-slate-300 bg-white text-text-main'}`}
        >
          {follow ? 'Following' : 'Follow this Alert'}
        </button>
      </header>

      <section className="guardian-panel p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Community Alert Detail</p>
        <h1 className="mt-1 guardian-page-title">{alert.firstName}, {alert.age}</h1>
        <p className="text-sm text-text-muted">Last seen {alert.location} • {timeAgo(alert.lastSeenAt)}</p>

        <div className="mt-4 grid place-items-center rounded-[var(--r-lg)] border border-slate-200 bg-bg-primary py-6">
          <FlarePulse size={110} tone="orange" />
          <p className="mt-2 text-sm font-semibold text-text-main">Radius {alert.radiusKm}km</p>
          <p className="text-xs text-text-muted">{alert.notifiedCount.toLocaleString()} people notified</p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(`KimbAlert: ${alert.firstName} near ${alert.location}.`);
              pushToast('success', 'Alert link copied');
            }}
            className="rounded-[var(--r-pill)] border border-slate-300 bg-white py-2.5 text-xs font-semibold text-text-main"
          >
            <Share2 className="mr-1 inline h-3.5 w-3.5" /> Share
          </button>
          <button
            type="button"
            onClick={() => setTipOpen(true)}
            className="rounded-[var(--r-pill)] bg-brand-orange py-2.5 text-xs font-bold text-white"
          >
            Submit Tip
          </button>
        </div>
      </section>

      <section className="guardian-card p-4">
        <h2 className="guardian-section-title">Last Seen Area</h2>
        <div className="mt-3 h-36 rounded-[var(--r-md)] border border-slate-200 bg-[radial-gradient(circle_at_20%_20%,#ffe8d9,transparent_30%),#fff] relative">
          <MapPin className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-brand-orange" />
          <span className="absolute left-1/2 top-1/2 mt-5 -translate-x-1/2 rounded-[var(--r-pill)] bg-brand-orange px-2 py-1 text-[10px] font-bold text-white">
            Last seen
          </span>
        </div>
      </section>

      {report ? (
        <section className="guardian-card p-4">
          <h2 className="guardian-section-title">Timeline</h2>
          <div className="mt-2 space-y-2">
            {report.timeline.map((entry) => (
              <article key={entry.id} className="rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-text-main">{entry.title}</p>
                  <span className="text-[11px] text-text-muted">{timeAgo(entry.timestamp)}</span>
                </div>
                <p className="text-xs text-text-muted">{entry.detail}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {similarAlerts.length ? (
        <section className="guardian-card p-4">
          <h2 className="guardian-section-title">Similar Cases Nearby</h2>
          <div className="mt-2 space-y-2">
            {similarAlerts.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/guardian/activity/${item.id}`)}
                className="flex w-full items-center justify-between rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2 text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-text-main">{item.firstName} • {item.age}</p>
                  <p className="text-xs text-text-muted">{item.location}</p>
                </div>
                <Chip size="sm" variant={statusVariant(item.status)}>{item.status}</Chip>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <BottomSheet open={tipOpen} onClose={() => setTipOpen(false)} title="Submit Tip" snap="70">
        <div className="space-y-3">
          <TextArea label="What did you see?" value={tip.what} onChange={(value) => setTip((prev) => ({ ...prev, what: value }))} />
          <Input label="Where?" value={tip.where} onChange={(value) => setTip((prev) => ({ ...prev, where: value }))} />
          <Input label="When?" type="datetime-local" value={tip.when} onChange={(value) => setTip((prev) => ({ ...prev, when: value }))} />
          <label className="flex items-center gap-2 text-sm text-text-main">
            <input
              type="checkbox"
              checked={tip.consent}
              onChange={(event) => setTip((prev) => ({ ...prev, consent: event.target.checked }))}
            />
            I consent to sharing this tip with task force operators.
          </label>
          <button
            type="button"
            onClick={submitTip}
            className="btn-interactive w-full rounded-[var(--r-pill)] bg-brand-orange py-3 text-sm font-bold text-white"
          >
            Send Tip
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-text-main">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3.5 py-2.5 text-sm"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-text-main">{label}</span>
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3.5 py-2.5 text-sm"
      />
    </label>
  );
}

function statusVariant(status: string): 'danger' | 'pending' | 'green' | 'neutral' {
  if (status === 'active') return 'danger';
  if (status === 'pending') return 'pending';
  if (status === 'found') return 'green';
  return 'neutral';
}

function timeAgo(value: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

