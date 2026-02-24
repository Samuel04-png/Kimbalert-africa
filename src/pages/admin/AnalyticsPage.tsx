import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useAppContext } from '../../app/AppContext';

export default function AnalyticsPage() {
  const { analytics, reports, partners, pushToast } = useAppContext();
  const [range, setRange] = useState('7d');

  const totals = useMemo(() => {
    const alerts = analytics.reduce((acc, item) => acc + item.alerts, 0);
    const avgResponse = analytics.length ? Math.round(analytics.reduce((acc, item) => acc + item.avgResponseMins, 0) / analytics.length) : 0;
    const found = analytics.reduce((acc, item) => acc + item.found, 0);
    const falseReports = analytics.reduce((acc, item) => acc + item.falseReports, 0);
    const open = analytics.reduce((acc, item) => acc + item.open, 0);
    const sms = analytics.reduce((acc, item) => acc + item.smsSent, 0);
    const push = analytics.reduce((acc, item) => acc + item.pushSent, 0);
    const rate = alerts ? Math.round((found / alerts) * 100) : 0;
    return { alerts, avgResponse, found, falseReports, open, sms, push, rate };
  }, [analytics]);

  const maxAlerts = Math.max(...analytics.map((item) => item.alerts), 1);
  const maxResponse = Math.max(...analytics.map((item) => item.avgResponseMins), 1);

  const linePoints = analytics
    .map((day, index) => `${(index / (analytics.length - 1 || 1)) * 100},${100 - (day.avgResponseMins / maxResponse) * 100}`)
    .join(' ');

  const locations = useMemo(() => {
    const map = new Map<string, number>();
    reports.forEach((report) => {
      const area = report.lastSeenLocation.address.split(',')[0].trim();
      map.set(area, (map.get(area) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [reports]);

  const outcomeTotal = totals.found + totals.falseReports + totals.open;
  const foundPct = outcomeTotal ? (totals.found / outcomeTotal) * 100 : 0;
  const falsePct = outcomeTotal ? (totals.falseReports / outcomeTotal) * 100 : 0;

  const heatmap = locations.map(([area, count]) => ({ area, level: Math.min(4, count) }));

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100 px-4 pb-24 pt-4 md:px-6 md:pb-8">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-display text-4xl font-bold">Analytics</h1>
          <p className="text-sm text-slate-400">Operational insight and partner performance</p>
        </div>
        <button type="button" onClick={() => pushToast('success', 'Analytics report exported')} className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-700 bg-[#111a2b]">
          <Download className="h-4 w-4" />
        </button>
      </header>

      <div className="mt-3 flex flex-wrap gap-2">
        {['7d', '30d', '90d', 'custom'].map((item) => (
          <button key={item} type="button" onClick={() => setRange(item)} className={`rounded-[var(--r-pill)] px-3 py-1.5 text-xs font-semibold ${range === item ? 'bg-brand-orange text-white' : 'border border-slate-700 bg-[#111a2b] text-slate-300'}`}>
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      <section className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Total Alerts" value={String(totals.alerts)} />
        <Metric label="Avg Response" value={`${totals.avgResponse}m`} />
        <Metric label="Resolution" value={`${totals.rate}%`} />
        <Metric label="Tips" value={String(totals.found + totals.falseReports)} />
        <Metric label="SMS Sent" value={totals.sms.toLocaleString()} />
        <Metric label="Push Sent" value={totals.push.toLocaleString()} />
      </section>

      <section className="mt-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Alerts per Day</h2>
        <div className="mt-2 grid grid-cols-7 gap-2 items-end h-32">
          {analytics.map((day) => (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <div className="w-full rounded-[6px] bg-brand-orange" style={{ height: `${(day.alerts / maxAlerts) * 100}%`, minHeight: '10px' }} />
              <span className="text-[10px] text-slate-400">{day.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Response Time Trend</h2>
        <svg viewBox="0 0 100 100" className="mt-2 h-28 w-full rounded-[var(--r-sm)] bg-[#0f1625] p-2">
          <polyline points={linePoints} fill="none" stroke="#e8622a" strokeWidth="2" />
        </svg>
      </section>

      <section className="mt-3 grid gap-3 md:grid-cols-2">
        <article className="rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
          <h2 className="font-display text-2xl font-bold">Outcome Mix</h2>
          <div className="mt-3 mx-auto h-36 w-36 rounded-[var(--r-pill)]" style={{ background: `conic-gradient(#5a7a5c 0 ${foundPct}%, #d63b3b ${foundPct}% ${foundPct + falsePct}%, #f0a11a ${foundPct + falsePct}% 100%)` }} />
          <div className="mt-2 text-xs text-slate-400">
            Found {totals.found} • False {totals.falseReports} • Open {totals.open}
          </div>
        </article>

        <article className="rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
          <h2 className="font-display text-2xl font-bold">Heatmap by Area</h2>
          <div className="mt-2 grid gap-2">
            {heatmap.map((item) => (
              <div key={item.area} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] px-3 py-2">
                <p className="text-sm">{item.area}</p>
                <div className="flex gap-1">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <span key={idx} className={`h-2 w-2 rounded-[var(--r-pill)] ${idx < item.level ? 'bg-brand-orange' : 'bg-slate-600'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Top Locations</h2>
        <div className="mt-2 space-y-2">
          {locations.map(([area, count]) => (
            <article key={area} className="rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] px-3 py-2 text-sm">
              {area} • {count} alerts
            </article>
          ))}
        </div>
      </section>

      <section className="mt-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Partner Performance</h2>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="py-2">Partner</th>
              <th>Type</th>
              <th>Active</th>
              <th>Last Notified</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => (
              <tr key={partner.id} className="border-t border-slate-700">
                <td className="py-2">{partner.name}</td>
                <td>{partner.type}</td>
                <td>{partner.active ? 'Yes' : 'No'}</td>
                <td>{partner.lastNotifiedAt ? new Date(partner.lastNotifiedAt).toLocaleDateString() : '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[var(--r-md)] border border-slate-700 bg-[#111a2b] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </article>
  );
}