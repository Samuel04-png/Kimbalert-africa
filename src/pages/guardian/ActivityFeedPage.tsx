import React, { useMemo, useState } from 'react';
import { BellDot, Clock3, History, RefreshCw, Search, Share2, Siren, Users2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import BottomSheet from '../../components/common/BottomSheet';
import Chip from '../../components/common/Chip';
import EmptyState from '../../components/common/EmptyState';

const distanceFilters = [5, 10, 20, 999] as const;

export default function ActivityFeedPage() {
  const navigate = useNavigate();
  const { currentUser, communityAlerts, reports, addTip, pushToast } = useAppContext();
  const [tab, setTab] = useState<'community' | 'mine'>('community');
  const [distance, setDistance] = useState<(typeof distanceFilters)[number]>(999);
  const [refreshing, setRefreshing] = useState(false);
  const [tipAlertId, setTipAlertId] = useState<string | null>(null);
  const [tipForm, setTipForm] = useState({ what: '', where: '', when: '', consent: false });

  const myReports = useMemo(
    () => reports.filter((report) => report.guardianId === currentUser.id),
    [reports, currentUser.id],
  );

  const filteredCommunity = useMemo(() => {
    const base = communityAlerts.filter((alert) => alert.distanceKm <= distance || distance === 999);
    return base.sort((a, b) => a.distanceKm - b.distanceKm);
  }, [communityAlerts, distance]);

  const hasNearbyActive = filteredCommunity.some((alert) => alert.status === 'active' || alert.status === 'pending');

  const doRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setRefreshing(false);
    pushToast('success', 'Feed refreshed');
  };

  const submitTip = () => {
    if (!tipAlertId || !tipForm.what.trim() || !tipForm.where.trim() || !tipForm.consent) {
      pushToast('warning', 'Complete all tip fields and consent');
      return;
    }

    addTip({
      reportId: tipAlertId,
      reporterName: 'Community Member',
      description: tipForm.what,
      location: tipForm.where,
      when: tipForm.when || new Date().toISOString(),
    });

    setTipAlertId(null);
    setTipForm({ what: '', where: '', when: '', consent: false });
    navigate('/guardian/activity/tip-success');
  };

  return (
    <div className="guardian-screen animate-page-in">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h1 className="guardian-page-title">Live Alerts</h1>
          <p className="text-sm text-text-muted">Community and your report activity</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/guardian/activity/history" className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-200 bg-white text-text-main">
            <History className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => void doRefresh()}
            className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-200 bg-white text-text-main"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <section className="rounded-[var(--r-lg)] border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setTab('community')}
            className={`rounded-[var(--r-pill)] px-3 py-2 text-sm font-semibold ${tab === 'community' ? 'bg-brand-orange text-white' : 'bg-bg-primary text-text-muted'}`}
          >
            Community
          </button>
          <button
            type="button"
            onClick={() => setTab('mine')}
            className={`rounded-[var(--r-pill)] px-3 py-2 text-sm font-semibold ${tab === 'mine' ? 'bg-brand-orange text-white' : 'bg-bg-primary text-text-muted'}`}
          >
            My Alerts
          </button>
        </div>
      </section>

      {tab === 'community' ? (
        <>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {distanceFilters.map((value) => (
              <Chip
                key={value}
                variant={distance === value ? 'orange' : 'neutral'}
                selected={distance === value}
                onClick={() => setDistance(value)}
              >
                {value === 999 ? 'All' : `${value}km`}
              </Chip>
            ))}
          </div>

          {!hasNearbyActive ? (
            <section className="rounded-[var(--r-lg)] border border-brand-green/30 bg-brand-green-light p-4">
              <p className="text-xs uppercase tracking-wider text-brand-green">All Clear</p>
              <p className="mt-1 text-sm font-semibold text-text-main">No missing children nearby right now.</p>
            </section>
          ) : null}

          {filteredCommunity.length ? (
            <div className="space-y-3">
              {filteredCommunity.map((alert) => (
                <article key={alert.id} className="rounded-[var(--r-lg)] border border-slate-200 bg-white p-3 shadow-sm card-interactive">
                  <div className="flex items-start gap-3">
                    {alert.blurredPhotoUrl ? (
                      <img src={alert.blurredPhotoUrl} alt={alert.firstName} className="h-14 w-14 rounded-[var(--r-md)] object-cover blur-[1.2px]" />
                    ) : (
                      <div className="grid h-14 w-14 place-items-center rounded-[var(--r-md)] bg-slate-200 text-slate-500">
                        <Users2 className="h-5 w-5" />
                      </div>
                    )}

                    <button type="button" onClick={() => navigate(`/guardian/activity/${alert.id}`)} className="flex-1 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-text-main">{alert.firstName} • {alert.age}</p>
                        <span className="text-xs font-semibold text-brand-orange">{alert.distanceKm.toFixed(1)}km</span>
                      </div>
                      <p className="text-xs text-text-muted">{alert.location}</p>
                      <p className="text-xs text-text-muted">Last seen {timeAgo(alert.lastSeenAt)} • radius {alert.radiusKm}km</p>
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`KimbAlert community alert: ${alert.firstName} near ${alert.location}.`);
                        pushToast('success', 'Alert share text copied');
                      }}
                      className="rounded-[var(--r-pill)] border border-slate-300 bg-white py-2 text-xs font-semibold text-text-main"
                    >
                      <Share2 className="mr-1 inline h-3.5 w-3.5" /> Share
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipAlertId(alert.reportId)}
                      className="rounded-[var(--r-pill)] bg-brand-orange py-2 text-xs font-bold text-white"
                    >
                      I Think I Saw Them
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/guardian/activity/${alert.id}`)}
                      className="rounded-[var(--r-pill)] border border-slate-300 bg-white py-2 text-xs font-semibold text-text-main"
                    >
                      Live
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🔍"
              title="Nothing found"
              body="No community alerts match that distance filter."
              action={<button type="button" onClick={() => setDistance(999)} className="rounded-[var(--r-pill)] bg-brand-orange px-4 py-2 text-xs font-bold text-white">Show All</button>}
            />
          )}
        </>
      ) : (
        <>
          {myReports.length ? (
            <div className="space-y-3">
              {myReports.map((report) => (
                <article key={report.id} className="rounded-[var(--r-lg)] border border-slate-200 bg-white p-3 shadow-sm card-interactive">
                  <button type="button" onClick={() => navigate(`/guardian/alert/status/${report.id}`)} className="w-full text-left">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-text-main">{report.id.toUpperCase()}</p>
                      <Chip size="sm" variant={statusVariant(report.status)}>{report.status.toUpperCase()}</Chip>
                    </div>
                    <p className="mt-1 text-xs text-text-muted">Radius {report.currentRadiusKm}km • Notified {report.notifiedCount.toLocaleString()}</p>
                    <p className="text-xs text-text-muted">Started {timeAgo(report.startedAt)}</p>
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="📋"
              title="No alerts submitted yet"
              body="Your reports will appear here once you activate a flare."
              action={<Link to="/guardian/alert" className="rounded-[var(--r-pill)] bg-brand-orange px-4 py-2 text-xs font-bold text-white">Start Report</Link>}
            />
          )}
        </>
      )}

      <BottomSheet open={Boolean(tipAlertId)} onClose={() => setTipAlertId(null)} title="Share Information" snap="70">
        <div className="space-y-3">
          <TextArea
            label="What did you see?"
            placeholder="I saw a child matching this description near..."
            value={tipForm.what}
            onChange={(value) => setTipForm((prev) => ({ ...prev, what: value }))}
          />
          <Input
            label="When did you see them?"
            type="datetime-local"
            value={tipForm.when}
            onChange={(value) => setTipForm((prev) => ({ ...prev, when: value }))}
          />
          <Input
            label="Where did you see them?"
            value={tipForm.where}
            onChange={(value) => setTipForm((prev) => ({ ...prev, where: value }))}
            placeholder="Landmark or area"
          />
          <label className="flex items-center gap-2 text-sm text-text-main">
            <input
              type="checkbox"
              checked={tipForm.consent}
              onChange={(event) => setTipForm((prev) => ({ ...prev, consent: event.target.checked }))}
            />
            I consent to share this tip with the task force.
          </label>
          <button
            type="button"
            onClick={submitTip}
            className="btn-interactive w-full rounded-[var(--r-pill)] bg-brand-orange py-3 text-sm font-bold text-white"
          >
            Submit Information
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
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-text-main">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3.5 py-2.5 text-sm"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-text-main">{label}</span>
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
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


