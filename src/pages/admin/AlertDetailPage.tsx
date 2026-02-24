import React, { useMemo, useState } from 'react';
import { ArrowLeft, Expand, MessageSquareMore, ShieldAlert } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import BottomSheet from '../../components/common/BottomSheet';
import Chip from '../../components/common/Chip';
import ToggleSwitch from '../../components/common/ToggleSwitch';

export default function AlertDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { reports, children, admins, tips, updateReport, pushToast } = useAppContext();
  const [note, setNote] = useState('');
  const [broadcast, setBroadcast] = useState('');
  const [tipsOpen, setTipsOpen] = useState(false);

  const report = useMemo(() => reports.find((entry) => entry.id === id) ?? null, [reports, id]);
  const child = useMemo(() => children.find((entry) => entry.id === report?.childId) ?? null, [children, report?.childId]);
  const linkedTips = useMemo(() => tips.filter((tip) => tip.reportId === report?.id), [tips, report?.id]);
  const assigned = admins.find((admin) => admin.id === report?.assignedAdminId);

  if (!report || !child) {
    return (
      <div className="min-h-screen bg-[#0b1220] text-slate-100 px-4 pt-4">
        <Link to="/admin/alerts" className="text-sm text-brand-orange">Back to queue</Link>
        <p className="mt-2 text-sm text-slate-400">Alert not found.</p>
      </div>
    );
  }

  const escalate = report.status === 'active' && (Date.now() - new Date(report.startedAt).getTime()) / 3600000 >= 3;

  const addNote = () => {
    if (!note.trim()) return;
    updateReport(report.id, { caseNotes: [...report.caseNotes, note] });
    setNote('');
    pushToast('success', 'Case note added');
  };

  const sendBroadcast = () => {
    if (!broadcast.trim()) return;
    updateReport(report.id, {
      timeline: [
        ...report.timeline,
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString(),
          title: 'Internal broadcast',
          detail: broadcast,
          severity: 'info',
          actor: 'Admin',
        },
      ],
    });
    setBroadcast('');
    pushToast('success', 'Broadcast sent to notified channels');
  };

  const updatePartner = (key: keyof typeof report.partnerNotified, value: boolean) => {
    updateReport(report.id, {
      partnerNotified: {
        ...report.partnerNotified,
        [key]: value,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100 px-4 pb-24 pt-4 md:px-6 md:pb-8">
      <header className="flex items-center justify-between">
        <Link to="/admin/alerts" className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-700 bg-[#111a2b]">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Chip variant={report.priority === 'critical' ? 'danger' : report.priority === 'high' ? 'pending' : 'neutral'}>{report.priority.toUpperCase()}</Chip>
          <Chip variant={report.status === 'active' ? 'danger' : report.status === 'pending' ? 'pending' : report.status === 'found' ? 'green' : 'neutral'}>
            {report.status.toUpperCase()}
          </Chip>
        </div>
      </header>

      {escalate ? (
        <section className="mt-3 rounded-[var(--r-md)] border border-red-500/40 bg-red-500/15 p-3 text-sm text-red-200">
          Alert has been active 3+ hours without resolution.
        </section>
      ) : null}

      <section className="mt-3 rounded-[var(--r-xl)] border border-slate-700 bg-[var(--gradient-navy)] p-4 shadow-lg">
        <p className="text-xs uppercase tracking-wider text-slate-400">Child Vault Card</p>
        <div className="mt-2 flex items-start gap-3">
          <img src={child.photoUrls[0]} alt={child.name} className="h-16 w-16 rounded-[var(--r-md)] object-cover border border-white/20" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-3xl font-bold">{child.name}</h1>
            <p className="text-xs text-slate-300">{child.age} yrs • {child.gender} • {child.location.schoolName}</p>
            <p className="mt-1 text-xs text-slate-300">Blood: {child.medical.bloodType} • {child.medical.conditions.join(', ') || 'No conditions'}</p>
          </div>
        </div>
      </section>

      <section className="mt-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Location Map</h2>
        <div className="mt-2 h-44 rounded-[var(--r-md)] border border-slate-700 bg-[#0f1625] relative">
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[var(--r-pill)] border border-red-500/40 bg-red-500/15 px-2 py-1 text-[10px] font-bold text-red-300">
            Radius {report.currentRadiusKm}km
          </span>
        </div>
        <button
          type="button"
          onClick={() => updateReport(report.id, { currentRadiusKm: report.currentRadiusKm + 5 })}
          className="mt-3 rounded-[var(--r-pill)] bg-brand-orange px-4 py-2 text-xs font-bold text-white"
        >
          <Expand className="mr-1 inline h-3.5 w-3.5" /> Expand Radius
        </button>
      </section>

      <section className="mt-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Partner Notifications</h2>
        <div className="mt-2 space-y-2">
          <ToggleRow label="Police" checked={report.partnerNotified.police} onChange={(next) => updatePartner('police', next)} />
          <ToggleRow label="Hospital" checked={report.partnerNotified.hospital} onChange={(next) => updatePartner('hospital', next)} />
          <ToggleRow label="School" checked={report.partnerNotified.school} onChange={(next) => updatePartner('school', next)} />
          <ToggleRow label="Media" checked={report.partnerNotified.media} onChange={(next) => updatePartner('media', next)} />
        </div>
      </section>

      <section className="mt-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Case Notes</h2>
        <div className="mt-2 space-y-2">
          {report.caseNotes.map((item, index) => (
            <article key={`${item}-${index}`} className="rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] px-3 py-2 text-sm text-slate-300">
              {item}
            </article>
          ))}
        </div>
        <textarea
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add case note"
          className="mt-3 w-full rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] px-3 py-2 text-sm"
        />
        <button type="button" onClick={addNote} className="mt-2 rounded-[var(--r-pill)] border border-brand-orange px-3 py-1.5 text-xs font-semibold text-brand-orange">
          Add Note
        </button>
      </section>

      <section className="mt-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Admin Assignment</h2>
        <p className="mt-1 text-sm text-slate-300">Assigned to: {assigned?.fullName ?? 'Unassigned'}</p>
        <p className="text-xs text-slate-400">Priority flag: {report.priority}</p>
      </section>

      <section className="mt-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Internal Broadcast</h2>
        <textarea
          rows={3}
          value={broadcast}
          onChange={(event) => setBroadcast(event.target.value)}
          placeholder="Send update to all notified partners"
          className="mt-2 w-full rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] px-3 py-2 text-sm"
        />
        <button type="button" onClick={sendBroadcast} className="mt-2 rounded-[var(--r-pill)] bg-brand-orange px-3 py-1.5 text-xs font-bold text-white">Send Update</button>
      </section>

      <section className="mt-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Alert Timeline</h2>
        <div className="mt-2 space-y-2">
          {report.timeline.map((entry) => (
            <article key={entry.id} className="rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{entry.title}</p>
                <p className="text-[11px] text-slate-400">{timeAgo(entry.timestamp)}</p>
              </div>
              <p className="text-xs text-slate-400">{entry.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">SMS Preview</h2>
        <article className="mt-2 rounded-[var(--r-sm)] border border-brand-orange/35 bg-brand-orange/10 p-3 text-xs text-slate-200">
          ALERT: Missing child near {report.lastSeenLocation.address}. Radius {report.currentRadiusKm}km. If seen call emergency line.
        </article>
      </section>

      <section className="mt-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Linked Tips</h2>
          <button type="button" onClick={() => setTipsOpen(true)} className="rounded-[var(--r-pill)] border border-slate-700 bg-[#0f1625] px-3 py-1.5 text-xs font-semibold text-slate-200">View Tips</button>
        </div>
        <div className="mt-2 space-y-2">
          {linkedTips.slice(0, 2).map((tip) => (
            <article key={tip.id} className="rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] p-3">
              <p className="text-sm font-semibold">{tip.location}</p>
              <p className="text-xs text-slate-400">{tip.description}</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => navigate(`/admin/alerts/${report.id}/tip/${tip.id}`)} className="rounded-[var(--r-pill)] border border-brand-orange px-2 py-1 text-[11px] font-semibold text-brand-orange">Verify</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => updateReport(report.id, { status: 'found' })} className="rounded-[var(--r-pill)] bg-brand-green py-3 text-sm font-bold text-white">Mark as Found</button>
        <button type="button" onClick={() => navigate(`/admin/alerts/${report.id}/resolve`)} className="rounded-[var(--r-pill)] border border-red-500/40 bg-transparent py-3 text-sm font-semibold text-red-300">Close Case</button>
      </div>

      <BottomSheet open={tipsOpen} onClose={() => setTipsOpen(false)} title="Tips" snap="70">
        <div className="space-y-2">
          {linkedTips.length ? linkedTips.map((tip) => (
            <article key={tip.id} className="rounded-[var(--r-sm)] border border-slate-200 bg-white p-3 text-sm text-text-main">
              <p className="font-semibold">{tip.location}</p>
              <p className="text-xs text-text-muted">{tip.description}</p>
              <button type="button" onClick={() => navigate(`/admin/alerts/${report.id}/tip/${tip.id}`)} className="mt-2 rounded-[var(--r-pill)] bg-brand-orange px-3 py-1.5 text-xs font-bold text-white">Open Verification</button>
            </article>
          )) : <p className="text-sm text-text-muted">No tips for this alert yet.</p>}
        </div>
      </BottomSheet>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] px-3 py-2">
      <p className="text-sm text-slate-200">{label}</p>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

function timeAgo(value: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}