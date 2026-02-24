import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';

const resolutionOptions = [
  { key: 'found_safe', label: 'Found Safe' },
  { key: 'found_medical', label: 'Found (Medical Attention Needed)' },
  { key: 'false_report', label: 'False Report' },
  { key: 'guardian_retracted', label: 'Guardian Retracted' },
] as const;

export default function AlertResolutionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { reports, children, tips, updateReport, pushToast } = useAppContext();
  const [type, setType] = useState<(typeof resolutionOptions)[number]['key']>('found_safe');
  const [notes, setNotes] = useState('');

  const report = useMemo(() => reports.find((entry) => entry.id === id) ?? null, [reports, id]);
  const child = useMemo(() => children.find((entry) => entry.id === report?.childId) ?? null, [children, report?.childId]);
  const reportTips = useMemo(() => tips.filter((tip) => tip.reportId === report?.id), [tips, report?.id]);

  if (!report || !child) {
    return (
      <div className="min-h-screen bg-[#0b1220] text-slate-100 px-4 pt-4">
        <Link to="/admin/alerts" className="text-sm text-brand-orange">Back to queue</Link>
        <p className="mt-2 text-sm text-slate-400">Resolution target not found.</p>
      </div>
    );
  }

  const closeCase = () => {
    updateReport(report.id, {
      status: type === 'found_safe' || type === 'found_medical' ? 'found' : 'closed',
      closedAt: new Date().toISOString(),
      resolutionType: type,
      caseNotes: [...report.caseNotes, `Resolution note: ${notes || 'No note provided'}`],
    });
    pushToast('success', 'Case closed successfully');
    navigate('/admin/alerts');
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100 px-4 pb-8 pt-4">
      <header className="flex items-center gap-2">
        <Link to={`/admin/alerts/${report.id}`} className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-700 bg-[#111a2b]">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-4xl font-bold">Resolve Case</h1>
      </header>

      <section className="mt-4 rounded-[var(--r-xl)] border border-slate-700 bg-[#111a2b] p-4">
        <p className="text-xs uppercase tracking-wider text-slate-400">Resolution Summary</p>
        <h2 className="mt-1 text-xl font-bold">{child.name}</h2>
        <p className="text-sm text-slate-400">Time to resolve: {duration(report.startedAt, new Date().toISOString())}</p>
        <p className="text-sm text-slate-400">People notified: {report.notifiedCount.toLocaleString()}</p>
        <p className="text-sm text-slate-400">Tips received: {reportTips.length}</p>
      </section>

      <section className="mt-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Resolution Type</h2>
        <div className="mt-2 space-y-2">
          {resolutionOptions.map((option) => (
            <label key={option.key} className="flex items-center gap-2 rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] px-3 py-2 text-sm">
              <input type="radio" checked={type === option.key} onChange={() => setType(option.key)} />
              {option.label}
            </label>
          ))}
        </div>
      </section>

      <section className="mt-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Resolution Notes</h2>
        <textarea
          rows={5}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="mt-2 w-full rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] px-3 py-2 text-sm"
          placeholder="Add operational summary"
        />
      </section>

      <button type="button" onClick={closeCase} className="btn-interactive mt-4 w-full rounded-[var(--r-pill)] bg-brand-green py-3.5 text-sm font-bold text-white">
        <CheckCircle2 className="mr-1 inline h-4 w-4" /> Close Case
      </button>
    </div>
  );
}

function duration(start: string, end: string) {
  const mins = Math.max(1, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}