import React, { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';

export default function TipVerificationPage() {
  const { id, tipId } = useParams();
  const navigate = useNavigate();
  const { tips, reports, updateTipStatus, updateReport, pushToast } = useAppContext();
  const [dismissReason, setDismissReason] = useState('Insufficient evidence');

  const tip = useMemo(() => tips.find((entry) => entry.id === tipId) ?? null, [tips, tipId]);
  const report = useMemo(() => reports.find((entry) => entry.id === id) ?? null, [reports, id]);
  const related = useMemo(() => tips.filter((entry) => entry.reportId === report?.id && entry.id !== tip?.id), [tips, report?.id, tip?.id]);

  if (!tip || !report) {
    return (
      <div className="min-h-screen bg-[#0b1220] text-slate-100 px-4 pt-4">
        <Link to="/admin/alerts" className="text-sm text-brand-orange">Back to queue</Link>
        <p className="mt-2 text-sm text-slate-400">Tip not found.</p>
      </div>
    );
  }

  const applyStatus = (status: 'credible' | 'investigate' | 'dismissed') => {
    updateTipStatus(tip.id, status, status === 'dismissed' ? dismissReason : undefined);
    updateReport(report.id, {
      timeline: [
        ...report.timeline,
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString(),
          title: `Tip ${status}`,
          detail: `Tip ${tip.id.toUpperCase()} marked ${status}${status === 'dismissed' ? `: ${dismissReason}` : ''}.`,
          severity: status === 'credible' ? 'success' : status === 'investigate' ? 'warning' : 'info',
          actor: 'Tip Desk',
        },
      ],
    });
    pushToast('success', `Tip marked ${status}`);
    navigate(`/admin/alerts/${report.id}`);
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100 px-4 pb-8 pt-4">
      <header className="flex items-center gap-2">
        <Link to={`/admin/alerts/${report.id}`} className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-700 bg-[#111a2b]">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-4xl font-bold">Tip Verification</h1>
      </header>

      <section className="mt-4 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <p className="text-xs uppercase tracking-wider text-slate-400">Tip Content</p>
        <p className="mt-2 text-sm">{tip.description}</p>
        <p className="mt-1 text-xs text-slate-400">Where: {tip.location}</p>
        <p className="text-xs text-slate-400">When: {new Date(tip.when).toLocaleString()}</p>
        <p className="text-xs text-slate-400">Tipster: Community Member (anonymous)</p>
      </section>

      <section className="mt-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Admin Actions</h2>
        <div className="mt-2 grid gap-2">
          <button type="button" onClick={() => applyStatus('credible')} className="rounded-[var(--r-pill)] bg-brand-green py-2.5 text-sm font-bold text-white">Mark as Credible</button>
          <button type="button" onClick={() => applyStatus('investigate')} className="rounded-[var(--r-pill)] bg-amber-500 py-2.5 text-sm font-bold text-white">Investigate Further</button>
          <label className="block rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] px-3 py-2">
            <span className="mb-1 block text-xs text-slate-400">Dismiss reason</span>
            <select value={dismissReason} onChange={(event) => setDismissReason(event.target.value)} className="w-full rounded-[var(--r-sm)] border border-slate-700 bg-[#111a2b] px-3 py-2 text-sm">
              <option>Insufficient evidence</option>
              <option>Duplicate report</option>
              <option>Location mismatch</option>
              <option>Inconsistent details</option>
            </select>
          </label>
          <button type="button" onClick={() => applyStatus('dismissed')} className="rounded-[var(--r-pill)] border border-red-500/40 bg-red-500/10 py-2.5 text-sm font-semibold text-red-300">Dismiss</button>
        </div>
      </section>

      <section className="mt-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Related Tips</h2>
        <div className="mt-2 space-y-2">
          {related.length ? (
            related.map((item) => (
              <article key={item.id} className="rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] p-3">
                <p className="text-sm font-semibold">{item.location}</p>
                <p className="text-xs text-slate-400">{item.description}</p>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-400">No additional tips on this case.</p>
          )}
        </div>
      </section>
    </div>
  );
}