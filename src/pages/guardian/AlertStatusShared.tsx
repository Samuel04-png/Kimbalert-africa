import React, { useMemo, useState } from 'react';
import { MapPin, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import BottomSheet from '../../components/common/BottomSheet';
import Chip from '../../components/common/Chip';
import FlarePulse from '../../components/common/FlarePulse';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix leaflet default icon issue in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function AlertStatusShared({ reportId }: { reportId?: string }) {
  const navigate = useNavigate();
  const { currentUser, reports, children, tips, updateReport, pushToast } = useAppContext();
  const [mapMode, setMapMode] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateNote, setUpdateNote] = useState('');

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

  const confirmCancel = () => {
    updateReport(report.id, {
      status: 'closed',
      closedAt: new Date().toISOString(),
      resolutionType: 'guardian_retracted',
      caseNotes: [
        ...report.caseNotes,
        `Guardian retracted alert: ${cancelReason || 'No reason provided'}`,
      ],
      timeline: [
        ...report.timeline,
        {
          id: `tl-cancel-${Date.now()}`,
          timestamp: new Date().toISOString(),
          title: 'Alert Cancelled by Guardian',
          detail: cancelReason || 'Guardian retracted the alert.',
          severity: 'info',
          actor: 'Guardian',
        },
      ],
    });
    setCancelOpen(false);
    setCancelReason('');
    pushToast('warning', 'Alert has been cancelled');
    navigate('/guardian/home');
  };

  const submitUpdate = () => {
    if (!updateNote.trim()) {
      pushToast('warning', 'Provide an update description');
      return;
    }
    updateReport(report.id, {
      timeline: [
        ...report.timeline,
        {
          id: `tl-update-${Date.now()}`,
          timestamp: new Date().toISOString(),
          title: 'Guardian Update',
          detail: updateNote,
          severity: 'info',
          actor: 'Guardian',
        },
      ],
      caseNotes: [...report.caseNotes, `Guardian update: ${updateNote}`],
    });
    setUpdateOpen(false);
    setUpdateNote('');
    pushToast('success', 'Update added to timeline');
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

        <div className="mt-4 grid h-[300px] place-items-center overflow-hidden rounded-[var(--r-lg)] border border-slate-200 bg-bg-primary relative z-0">
          {mapMode ? (
            <MapContainer
              center={[report.lastSeenLocation.lat || -1.2921, report.lastSeenLocation.lng || 36.8219]}
              zoom={13}
              scrollWheelZoom={false}
              className="h-full w-full z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[report.lastSeenLocation.lat || -1.2921, report.lastSeenLocation.lng || 36.8219]} />
              <Circle
                center={[report.lastSeenLocation.lat || -1.2921, report.lastSeenLocation.lng || 36.8219]}
                pathOptions={{ color: '#e8622a', fillColor: '#e8622a', fillOpacity: 0.15 }}
                radius={(report.currentRadiusKm || 1) * 1000}
              />
            </MapContainer>
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
        <button onClick={() => setCancelOpen(true)} className="rounded-[var(--r-pill)] border border-red-500/30 bg-red-50 py-2.5 text-xs font-semibold text-red-600">Cancel</button>
        <button onClick={() => setUpdateOpen(true)} className="guardian-primary-btn py-2.5 text-xs">Update</button>
      </div>

      {/* Cancel Alert Confirmation */}
      <BottomSheet open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel This Alert?" snap="70">
        <div className="space-y-3">
          <p className="rounded-[var(--r-md)] border border-red-500/30 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
            Warning: This will deactivate the alert and notify all partners and community that the search is cancelled.
          </p>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-text-main">Reason for cancellation (optional)</span>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="e.g. Child found safe at home, false alarm..."
              className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3.5 py-2.5 text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setCancelOpen(false)} className="rounded-[var(--r-pill)] border border-slate-300 bg-white py-2.5 text-sm font-semibold text-text-main">
              Keep Active
            </button>
            <button type="button" onClick={confirmCancel} className="rounded-[var(--r-pill)] bg-red-500 py-2.5 text-sm font-bold text-white">
              Cancel Alert
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Update Alert Info */}
      <BottomSheet open={updateOpen} onClose={() => setUpdateOpen(false)} title="Update Alert Info" snap="70">
        <div className="space-y-3">
          <p className="text-sm text-text-muted">
            Add new information to help searchers. This update will appear in the alert timeline and be visible to partners and the command center.
          </p>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-text-main">Update details</span>
            <textarea
              rows={4}
              value={updateNote}
              onChange={(event) => setUpdateNote(event.target.value)}
              placeholder="e.g. Child was last seen wearing different clothes, new sighting near..."
              className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3.5 py-2.5 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={submitUpdate}
            className="btn-interactive w-full rounded-[var(--r-pill)] bg-brand-orange py-3 text-sm font-bold text-white shadow-orange"
          >
            Submit Update
          </button>
        </div>
      </BottomSheet>

      {/* Tips Viewer */}
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
