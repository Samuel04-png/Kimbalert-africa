import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  MapPin,
  Radio,
  Search,
  Shield,
  Users,
} from 'lucide-react';
import { mockAlerts, mockChildren } from '../../mockData';
import { Alert, PartnerChannel, Tip } from '../../types';

type AdminTab = 'radar' | 'queue' | 'registry' | 'partners' | 'tips' | 'analytics';
type QueueFilter = 'all' | 'active' | 'pending' | 'resolved';

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<AdminTab>('radar');
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all');
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const activeAlerts = useMemo(() => alerts.filter((alert) => alert.status === 'active'), [alerts]);
  const pendingAlerts = useMemo(
    () => alerts.filter((alert) => alert.status === 'pending_verification'),
    [alerts],
  );
  const resolvedAlerts = useMemo(() => alerts.filter((alert) => alert.status === 'resolved'), [alerts]);

  const pendingTips = useMemo(
    () =>
      alerts.flatMap((alert) =>
        alert.tips
          .filter((tip) => tip.status === 'pending')
          .map((tip) => ({ ...tip, alertId: alert.id, childName: alert.child?.name ?? 'Unknown' })),
      ),
    [alerts],
  );

  const filteredQueue = useMemo(() => {
    const byFilter = alerts.filter((alert) => {
      if (queueFilter === 'all') return true;
      if (queueFilter === 'active') return alert.status === 'active';
      if (queueFilter === 'pending') return alert.status === 'pending_verification';
      return alert.status === 'resolved';
    });

    const q = search.trim().toLowerCase();
    if (!q) return byFilter;

    return byFilter.filter((alert) => {
      const fields = [
        alert.id,
        alert.child?.name ?? '',
        alert.lastKnownLocation.address,
        alert.child?.qrCodeId ?? '',
      ];

      return fields.some((value) => value.toLowerCase().includes(q));
    });
  }, [alerts, queueFilter, search]);

  const selectedAlert = useMemo(
    () => alerts.find((alert) => alert.id === selectedAlertId) ?? null,
    [alerts, selectedAlertId],
  );

  const resolutionRate = useMemo(() => {
    const total = activeAlerts.length + pendingAlerts.length + resolvedAlerts.length;
    if (total === 0) return 0;
    return Math.round((resolvedAlerts.length / total) * 100);
  }, [activeAlerts.length, pendingAlerts.length, resolvedAlerts.length]);

  const mutateAlert = (alertId: string, updater: (alert: Alert) => Alert) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? updater(alert) : alert)));
  };

  const expandRadius = (alertId: string) => {
    mutateAlert(alertId, (alert) => {
      const nextRadius = alert.currentRadiusKm + 5;
      return {
        ...alert,
        currentRadiusKm: nextRadius,
        logs: [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'RADIUS_EXPANDED',
            details: `Operator expanded search radius to ${nextRadius}km.`,
            severity: 'warning',
          },
          ...alert.logs,
        ],
      };
    });
  };

  const verifyPending = (alertId: string) => {
    mutateAlert(alertId, (alert) => ({
      ...alert,
      status: 'active',
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'ADMIN_CONFIRMED',
          details: 'Alert verified and promoted to active flare.',
          severity: 'success',
        },
        ...alert.logs,
      ],
    }));
  };

  const markResolved = (alertId: string) => {
    mutateAlert(alertId, (alert) => ({
      ...alert,
      status: 'resolved',
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'CHILD_RECOVERED',
          details: 'Child marked as found and safe. Broadcast closed.',
          severity: 'success',
        },
        ...alert.logs,
      ],
    }));
  };

  const updateCaseNotes = (alertId: string, notes: string) => {
    mutateAlert(alertId, (alert) => ({ ...alert, caseNotes: notes }));
  };

  const togglePartner = (alertId: string, channel: PartnerChannel) => {
    mutateAlert(alertId, (alert) => ({
      ...alert,
      partnerNotifications: {
        ...alert.partnerNotifications,
        [channel]: !alert.partnerNotifications[channel],
      },
    }));
  };

  const updateTipStatus = (alertId: string, tipId: string, status: Tip['status']) => {
    mutateAlert(alertId, (alert) => ({
      ...alert,
      tips: alert.tips.map((tip) => (tip.id === tipId ? { ...tip, status } : tip)),
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: status === 'verified' ? 'TIP_VERIFIED' : 'TIP_DISMISSED',
          details: status === 'verified' ? 'Tip verified and dispatch team notified.' : 'Tip dismissed after review.',
          severity: status === 'verified' ? 'success' : 'info',
        },
        ...alert.logs,
      ],
    }));
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans md:flex">
      <aside className="md:w-64 bg-[#141B2B] border-r border-[#334155] shrink-0">
        <div className="p-5 border-b border-[#334155]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-alert-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white">KimbAlert</h1>
              <p className="text-[11px] tracking-wide uppercase text-slate-500">Command Center</p>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          <SidebarItem icon={<Activity />} label="Live Radar" active={tab === 'radar'} onClick={() => setTab('radar')} />
          <SidebarItem icon={<AlertTriangle />} label="Alert Queue" active={tab === 'queue'} onClick={() => setTab('queue')} badge={activeAlerts.length + pendingAlerts.length} />
          <SidebarItem icon={<Users />} label="Registry" active={tab === 'registry'} onClick={() => setTab('registry')} />
          <SidebarItem icon={<Shield />} label="Partners" active={tab === 'partners'} onClick={() => setTab('partners')} />
          <SidebarItem icon={<Bell />} label="Tip Review" active={tab === 'tips'} onClick={() => setTab('tips')} badge={pendingTips.length} />
          <SidebarItem icon={<BarChart3 />} label="Analytics" active={tab === 'analytics'} onClick={() => setTab('analytics')} />
        </nav>

        <div className="p-3 border-t border-[#334155] mt-auto">
          <button onClick={onLogout} className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-400 hover:bg-[#1E293B] hover:text-white transition-colors">Secure Logout</button>
        </div>
      </aside>

      <main className="flex-1 min-h-screen">
        <header className="h-16 bg-[#141B2B] border-b border-[#334155] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search child, QR ID, location..."
              className="w-full bg-[#0B0F19] border border-[#334155] rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-brand-orange"
            />
          </div>

          <div className="ml-4 flex items-center gap-3">
            <div className="rounded-full bg-alert-500/15 border border-alert-500/30 px-3 py-1 text-xs font-bold text-alert-500">
              {activeAlerts.length} ACTIVE
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-orange-light border border-brand-orange flex items-center justify-center text-xs font-bold text-brand-orange">AD</div>
          </div>
        </header>

        <section className="p-4 sm:p-6 space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi title="Active Flares" value={String(activeAlerts.length)} tone="danger" subtitle="Live now" />
            <Kpi title="Pending Review" value={String(pendingAlerts.length)} tone="warn" subtitle="Needs verification" />
            <Kpi title="Registered" value={String(mockChildren.length)} subtitle="Vault profiles" />
            <Kpi title="Resolution Rate" value={`${resolutionRate}%`} tone="success" subtitle="Current cycle" />
          </div>

          {selectedAlert ? (
            <section className="bg-[#141B2B] border border-[#334155] rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedAlertId(null)} className="w-9 h-9 rounded-full bg-[#1E293B] text-slate-300 hover:text-white flex items-center justify-center">
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                  <div>
                    <h2 className="font-display font-bold text-xl text-white">Case Detail: {selectedAlert.child?.name}</h2>
                    <p className="text-xs text-slate-400">{selectedAlert.id} | {selectedAlert.lastKnownLocation.address}</p>
                  </div>
                </div>
                <StatusBadge status={selectedAlert.status} />
              </div>

              <div className="grid lg:grid-cols-[1fr_1.2fr] gap-4">
                <div className="space-y-4">
                  <div className="bg-[#0B0F19] border border-[#334155] rounded-xl p-4">
                    <img src={selectedAlert.child?.photoUrl} alt={selectedAlert.child?.name} className="w-24 h-24 rounded-xl object-cover mb-3" />
                    <p className="font-bold text-white text-lg">{selectedAlert.child?.name}</p>
                    <p className="text-xs text-slate-400 mt-1">Age {selectedAlert.child?.age} | {selectedAlert.child?.gender} | {selectedAlert.child?.bloodType}</p>
                    <p className="text-xs text-slate-400 mt-2">QR: {selectedAlert.child?.qrCodeId}</p>
                  </div>

                  <div className="bg-[#0B0F19] border border-[#334155] rounded-xl p-4">
                    <p className="text-sm font-semibold text-white mb-2">Partner Channels</p>
                    <div className="space-y-2">
                      {(Object.keys(selectedAlert.partnerNotifications) as PartnerChannel[]).map((channel) => (
                        <button
                          key={channel}
                          onClick={() => togglePartner(selectedAlert.id, channel)}
                          className="w-full px-3 py-2 rounded-lg border border-[#334155] bg-[#141B2B] flex items-center justify-between text-sm"
                        >
                          <span>{partnerLabel(channel)}</span>
                          <span className={selectedAlert.partnerNotifications[channel] ? 'text-brand-green' : 'text-slate-500'}>
                            {selectedAlert.partnerNotifications[channel] ? 'On' : 'Off'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => expandRadius(selectedAlert.id)} className="rounded-lg bg-alert-500 hover:bg-alert-600 text-white text-sm font-semibold py-2.5">Expand +5km</button>
                    {selectedAlert.status === 'pending_verification' ? (
                      <button onClick={() => verifyPending(selectedAlert.id)} className="rounded-lg bg-brand-orange hover:bg-brand-orange-hover text-white text-sm font-semibold py-2.5">Verify Alert</button>
                    ) : (
                      <button onClick={() => markResolved(selectedAlert.id)} className="rounded-lg bg-brand-green hover:bg-brand-green-hover text-white text-sm font-semibold py-2.5">Mark Found</button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-[#0B0F19] border border-[#334155] rounded-xl p-4">
                    <p className="text-sm font-semibold text-white mb-2">Case Notes</p>
                    <textarea
                      value={selectedAlert.caseNotes}
                      onChange={(event) => updateCaseNotes(selectedAlert.id, event.target.value)}
                      className="w-full h-28 bg-[#141B2B] border border-[#334155] rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-brand-orange"
                    />
                  </div>

                  <div className="bg-[#0B0F19] border border-[#334155] rounded-xl p-4">
                    <p className="text-sm font-semibold text-white mb-3">Activity Timeline</p>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {selectedAlert.logs.map((log) => (
                        <div key={log.id} className="border border-[#334155] bg-[#141B2B] rounded-lg p-3">
                          <p className="text-sm font-semibold text-white">{human(log.action)}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{log.details}</p>
                          <p className="text-[11px] text-slate-500 mt-1">{fmt(log.timestamp)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {!selectedAlert && tab === 'radar' && (
            <section className="grid lg:grid-cols-[1.2fr_1fr] gap-4">
              <div className="bg-[#141B2B] border border-[#334155] rounded-xl h-[420px] relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                {activeAlerts.map((alert, index) => (
                  <div key={alert.id} className="absolute" style={{ top: `${28 + index * 18}%`, left: `${32 + index * 20}%` }}>
                    <div className="absolute -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-alert-500/10 border border-alert-500/20 animate-ping" style={{ animationDuration: '3s' }} />
                    <div className="relative -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-alert-500 shadow-[0_0_18px_rgba(255,122,89,.9)]" />
                    <div className="mt-2 -ml-14 bg-[#0B0F19] border border-[#334155] rounded-full px-2 py-1 text-[11px] text-white whitespace-nowrap">{alert.child?.name} | {alert.currentRadiusKm}km</div>
                  </div>
                ))}
              </div>

              <div className="bg-[#141B2B] border border-[#334155] rounded-xl p-4">
                <h3 className="font-display font-bold text-white mb-3">Priority Queue</h3>
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {[...activeAlerts, ...pendingAlerts].map((alert) => (
                    <button key={alert.id} onClick={() => setSelectedAlertId(alert.id)} className="w-full text-left border border-[#334155] bg-[#0B0F19] rounded-lg p-3 hover:border-brand-orange/40">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-white">{alert.child?.name}</p>
                          <p className="text-xs text-slate-400">{alert.lastKnownLocation.address}</p>
                        </div>
                        <StatusBadge status={alert.status} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {!selectedAlert && tab === 'queue' && (
            <section className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Chip label="All" active={queueFilter === 'all'} onClick={() => setQueueFilter('all')} />
                <Chip label={`Active (${activeAlerts.length})`} active={queueFilter === 'active'} onClick={() => setQueueFilter('active')} />
                <Chip label={`Pending (${pendingAlerts.length})`} active={queueFilter === 'pending'} onClick={() => setQueueFilter('pending')} />
                <Chip label={`Resolved (${resolvedAlerts.length})`} active={queueFilter === 'resolved'} onClick={() => setQueueFilter('resolved')} />
              </div>
              <div className="space-y-2">
                {filteredQueue.map((alert) => (
                  <div key={alert.id} className="bg-[#141B2B] border border-[#334155] rounded-xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <img src={alert.child?.photoUrl} alt={alert.child?.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <p className="font-semibold text-white">{alert.child?.name}</p>
                        <p className="text-xs text-slate-400">{alert.lastKnownLocation.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={alert.status} />
                      <button onClick={() => setSelectedAlertId(alert.id)} className="rounded-lg bg-[#1E293B] hover:bg-[#334155] text-sm text-white px-3 py-2">Manage</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!selectedAlert && tab === 'registry' && (
            <section className="bg-[#141B2B] border border-[#334155] rounded-xl p-4 overflow-x-auto">
              <table className="w-full text-sm min-w-[680px]">
                <thead className="text-slate-400">
                  <tr className="border-b border-[#334155]">
                    <th className="text-left py-2">Child</th><th className="text-left py-2">QR ID</th><th className="text-left py-2">Age</th><th className="text-left py-2">Guardian</th><th className="text-left py-2">Bracelet</th>
                  </tr>
                </thead>
                <tbody>
                  {mockChildren.map((child) => (
                    <tr key={child.id} className="border-b border-[#334155]/50 hover:bg-[#1E293B]">
                      <td className="py-3 text-white">{child.name}</td>
                      <td className="py-3 font-mono text-xs text-slate-300">{child.qrCodeId}</td>
                      <td className="py-3 text-slate-300">{child.age}</td>
                      <td className="py-3 font-mono text-xs text-slate-400">{child.guardianId}</td>
                      <td className="py-3 text-slate-300">{child.braceletStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {!selectedAlert && tab === 'partners' && (
            <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {['Police', 'Hospitals', 'Schools', 'Transport', 'Child Protection', 'Community Watch'].map((name, i) => (
                <article key={name} className="bg-[#141B2B] border border-[#334155] rounded-xl p-4">
                  <p className="font-semibold text-white">{name}</p>
                  <p className="text-xs text-slate-400 mt-1">Node {i + 1} online and receiving alerts.</p>
                  <p className="text-xs mt-3 text-brand-green">Response SLA: {i % 2 ? '2 min' : '90 sec'}</p>
                </article>
              ))}
            </section>
          )}

          {!selectedAlert && tab === 'tips' && (
            <section className="space-y-3">
              {pendingTips.map((tip) => (
                <article key={tip.id} className="bg-[#141B2B] border border-[#334155] rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white">{tip.childName}</p>
                      <p className="text-xs text-slate-400">{tip.location} | {fmt(tip.submittedAt)}</p>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/20">PENDING</span>
                  </div>
                  <p className="text-sm text-slate-300 mt-2">{tip.description}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button onClick={() => setSelectedAlertId(tip.alertId)} className="rounded-lg bg-[#1E293B] text-white py-2 text-xs">Open Case</button>
                    <button onClick={() => updateTipStatus(tip.alertId, tip.id, 'verified')} className="rounded-lg bg-brand-green text-white py-2 text-xs">Verify</button>
                    <button onClick={() => updateTipStatus(tip.alertId, tip.id, 'dismissed')} className="rounded-lg bg-alert-500 text-white py-2 text-xs">Dismiss</button>
                  </div>
                </article>
              ))}
              {pendingTips.length === 0 && <p className="text-sm text-slate-400">No pending tips right now.</p>}
            </section>
          )}

          {!selectedAlert && tab === 'analytics' && (
            <section className="space-y-4">
              <div className="bg-[#141B2B] border border-[#334155] rounded-xl p-4">
                <h3 className="font-semibold text-white mb-3">Resolution Funnel</h3>
                <Bar label="Active" value={activeAlerts.length} total={Math.max(1, alerts.length)} color="bg-alert-500" />
                <Bar label="Pending" value={pendingAlerts.length} total={Math.max(1, alerts.length)} color="bg-amber-500" />
                <Bar label="Resolved" value={resolvedAlerts.length} total={Math.max(1, alerts.length)} color="bg-brand-green" />
              </div>
              <div className="bg-[#141B2B] border border-[#334155] rounded-xl p-4">
                <p className="text-sm text-slate-300">Average dispatch time: <span className="text-white font-semibold">2.4 mins</span></p>
                <p className="text-sm text-slate-300 mt-2">Community tip conversion: <span className="text-white font-semibold">41%</span></p>
              </div>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, badge }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badge?: number }) {
  return <button onClick={onClick} className={`w-full rounded-lg px-3 py-2.5 flex items-center justify-between ${active ? 'bg-brand-orange/15 text-brand-orange' : 'text-slate-400 hover:bg-[#1E293B] hover:text-white'}`}><span className="flex items-center gap-2.5 text-sm font-medium">{icon}{label}</span>{badge && badge > 0 ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-alert-500 text-white">{badge}</span> : null}</button>;
}
function Kpi({ title, value, subtitle, tone }: { title: string; value: string; subtitle: string; tone?: 'danger' | 'warn' | 'success' }) {
  const color = tone === 'danger' ? 'text-alert-500' : tone === 'warn' ? 'text-amber-400' : tone === 'success' ? 'text-brand-green' : 'text-white';
  return <div className="bg-[#141B2B] border border-[#334155] rounded-xl p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">{title}</p><p className={`font-display font-bold text-2xl mt-1 ${color}`}>{value}</p><p className="text-xs text-slate-500">{subtitle}</p></div>;
}
function StatusBadge({ status }: { status: Alert['status'] }) {
  const map = { active: 'bg-red-500/15 text-red-300 border-red-400/25', pending_verification: 'bg-amber-500/15 text-amber-300 border-amber-400/25', resolved: 'bg-brand-green/15 text-brand-green border-brand-green/30', closed: 'bg-slate-600/20 text-slate-300 border-slate-500/30' };
  return <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wider ${map[status]}`}>{status.replace('_', ' ')}</span>;
}
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${active ? 'bg-brand-orange/15 border-brand-orange/40 text-brand-orange' : 'bg-[#141B2B] border-[#334155] text-slate-300'}`}>{label}</button>;
}
function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const width = Math.max(6, Math.round((value / total) * 100));
  return <div className="mb-3"><div className="flex items-center justify-between text-xs text-slate-400 mb-1"><span>{label}</span><span>{value}</span></div><div className="h-2 rounded-full bg-[#0B0F19] border border-[#334155]"><div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} /></div></div>;
}
function human(value: string) { return value.toLowerCase().split('_').map((x) => x[0].toUpperCase() + x.slice(1)).join(' '); }
function fmt(time: string) { return new Date(time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function partnerLabel(channel: PartnerChannel) { if (channel === 'police') return 'Police'; if (channel === 'hospitals') return 'Hospitals'; if (channel === 'schools') return 'Schools'; return 'Transport'; }
