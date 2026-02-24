import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Home,
  Plus,
  QrCode,
  Search,
  UserCircle2,
  Users2,
} from 'lucide-react';
import { mockAlerts, mockChildren } from '../../mockData';
import { Alert, Child } from '../../types';

type Surface = 'home' | 'vault' | 'alerts' | 'profile';
type Overlay = 'none' | 'add' | 'report' | 'status' | 'profile' | 'qr' | 'tip' | 'tip_success' | 'reunion';

const GUARDIAN_ID = 'user-1';

export default function GuardianDashboard({ onLogout }: { onLogout: () => void }) {
  const [surface, setSurface] = useState<Surface>('home');
  const [overlay, setOverlay] = useState<Overlay>('none');
  const [children, setChildren] = useState<Child[]>(
    mockChildren.filter((child) => child.guardianId === GUARDIAN_ID),
  );
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    mockChildren.find((child) => child.guardianId === GUARDIAN_ID)?.id ?? null,
  );
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [feedMode, setFeedMode] = useState<'community' | 'mine'>('community');
  const [settings, setSettings] = useState({ sms: true, whatsapp: true });

  const [childForm, setChildForm] = useState({
    name: '',
    age: '6',
    gender: 'Female',
    bloodType: 'O+',
    medicalNotes: '',
    physicalDescription: '',
    languages: 'English',
    emergencyName: '',
    emergencyPhone: '',
  });
  const [reportForm, setReportForm] = useState({ location: '', time: '', clothing: '', context: '' });
  const [tipForm, setTipForm] = useState({
    description: '',
    location: '',
    when: '',
    reporter: 'Community Volunteer',
  });

  const myChildren = useMemo(() => children.filter((c) => c.guardianId === GUARDIAN_ID), [children]);
  const myAlerts = useMemo(() => alerts.filter((a) => a.reportedBy === GUARDIAN_ID), [alerts]);
  const selectedChild = useMemo(
    () => myChildren.find((c) => c.id === selectedChildId) ?? myChildren[0] ?? null,
    [myChildren, selectedChildId],
  );
  const selectedAlert = useMemo(
    () => alerts.find((a) => a.id === selectedAlertId) ?? myAlerts[0] ?? null,
    [alerts, myAlerts, selectedAlertId],
  );
  const activeCount = useMemo(() => alerts.filter((a) => a.status === 'active').length, [alerts]);
  const feedAlerts = useMemo(() => {
    const source = feedMode === 'community' ? alerts : myAlerts;
    return [...source].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }, [alerts, myAlerts, feedMode]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const showToast = (m: string) => setToast(m);

  const addChild = (event: React.FormEvent) => {
    event.preventDefault();
    const now = new Date().toISOString();
    const child: Child = {
      id: `child-${Date.now()}`,
      guardianId: GUARDIAN_ID,
      name: childForm.name || 'New Child',
      age: Number(childForm.age) || 6,
      gender: childForm.gender,
      bloodType: childForm.bloodType,
      medicalNotes: childForm.medicalNotes || 'None',
      physicalDescription: childForm.physicalDescription || 'No note yet',
      photoUrl: `https://picsum.photos/seed/${Date.now()}/500/500`,
      qrCodeId: `KA-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
      braceletStatus: 'pending',
      languages: childForm.languages.split(',').map((v) => v.trim()).filter(Boolean),
      emergencyContacts: [
        {
          id: `ec-${Date.now()}`,
          name: childForm.emergencyName || 'Emergency Contact',
          phone: childForm.emergencyPhone || 'N/A',
          relation: 'Family',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    setChildren((prev) => [child, ...prev]);
    setSelectedChildId(child.id);
    setOverlay('profile');
    showToast('Child added to Vault.');
  };

  const createFlare = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedChild) return;
    const now = new Date().toISOString();
    const alert: Alert = {
      id: `alert-${Date.now()}`,
      childId: selectedChild.id,
      reportedBy: GUARDIAN_ID,
      status: 'pending_verification',
      lastKnownLocation: { lat: -1.2864, lng: 36.8172, address: reportForm.location || 'Current location' },
      currentRadiusKm: 10,
      startedAt: now,
      nextExpansionAt: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
      notifiedPeople: 380,
      caseNotes: reportForm.context || 'Guardian report submitted.',
      partnerNotifications: { police: true, hospitals: true, schools: true, transport: true },
      logs: [{ id: `log-${Date.now()}`, timestamp: now, action: 'REPORT_SUBMITTED', details: 'Awaiting admin verification.', severity: 'info' }],
      tips: [],
      child: selectedChild,
    };
    setAlerts((prev) => [alert, ...prev]);
    setSelectedAlertId(alert.id);
    setOverlay('status');
    setSurface('alerts');
    setReportForm({ location: '', time: '', clothing: '', context: '' });
    showToast('Report submitted for verification.');
    window.setTimeout(() => {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alert.id
            ? {
                ...a,
                status: 'active',
                logs: [
                  {
                    id: `log-${Date.now()}-ok`,
                    timestamp: new Date().toISOString(),
                    action: 'ADMIN_CONFIRMED',
                    details: 'Alert verified and live flare activated.',
                    severity: 'success',
                  },
                  ...a.logs,
                ],
              }
            : a,
        ),
      );
      showToast('Flare is now live.');
    }, 9000);
  };

  const submitTip = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAlert) return;

    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === selectedAlert.id
          ? {
              ...alert,
              tips: [
                {
                  id: `tip-${Date.now()}`,
                  alertId: selectedAlert.id,
                  submittedAt: new Date().toISOString(),
                  reporterName: tipForm.reporter,
                  description: tipForm.description,
                  location: tipForm.location,
                  status: 'pending',
                },
                ...alert.tips,
              ],
            }
          : alert,
      ),
    );
    setTipForm({ description: '', location: '', when: '', reporter: 'Community Volunteer' });
    setOverlay('tip_success');
    showToast('Tip sent to task force.');
  };

  const resolveAlert = () => {
    if (!selectedAlert) return;
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === selectedAlert.id
          ? {
              ...a,
              status: 'resolved',
              logs: [
                {
                  id: `log-${Date.now()}-resolved`,
                  timestamp: new Date().toISOString(),
                  action: 'CHILD_RECOVERED',
                  details: 'Child safely reunited.',
                  severity: 'success',
                },
                ...a.logs,
              ],
            }
          : a,
      ),
    );
    setOverlay('reunion');
    showToast('Case closed and partners notified.');
  };

  const shareAlert = async (alert: Alert) => {
    const payload = `KimbAlert: ${alert.child?.name} near ${alert.lastKnownLocation.address}`;
    try {
      await navigator.clipboard.writeText(payload);
      showToast('Alert copied to clipboard.');
    } catch {
      showToast('Alert ready for sharing.');
    }
  };

  if (overlay === 'add') {
    return (
      <AppShell>
        <TopBar title="Register Child" subtitle="Secure Vault Profile" onBack={() => setOverlay('none')} />
        <main className="px-4 py-4 space-y-4">
          <form onSubmit={addChild} className="space-y-4">
            <Card>
              <Field label="Full Name" value={childForm.name} onChange={(v) => setChildForm((p) => ({ ...p, name: v }))} />
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Field label="Age" type="number" value={childForm.age} onChange={(v) => setChildForm((p) => ({ ...p, age: v }))} />
                <Field label="Gender" value={childForm.gender} onChange={(v) => setChildForm((p) => ({ ...p, gender: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Field label="Blood Type" value={childForm.bloodType} onChange={(v) => setChildForm((p) => ({ ...p, bloodType: v }))} />
                <Field label="Languages" value={childForm.languages} onChange={(v) => setChildForm((p) => ({ ...p, languages: v }))} />
              </div>
              <Field label="Medical Notes" value={childForm.medicalNotes} onChange={(v) => setChildForm((p) => ({ ...p, medicalNotes: v }))} className="mt-3" />
              <Field label="Physical Description" value={childForm.physicalDescription} onChange={(v) => setChildForm((p) => ({ ...p, physicalDescription: v }))} className="mt-3" />
            </Card>
            <button type="submit" className="w-full rounded-xl bg-brand-orange py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-orange/35">
              Save to Vault
            </button>
          </form>
        </main>
      </AppShell>
    );
  }

  if (overlay === 'report') {
    return (
      <AppShell>
        <TopBar title="Report Missing" subtitle="Emergency Flare Activation" onBack={() => setOverlay('none')} />
        <main className="px-4 py-4 space-y-4">
          <Card>
            <div className="flex items-center gap-2 text-alert-500 text-xs font-bold uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-alert-500 animate-pulse" /> Report Missing Child
            </div>
            <p className="text-sm text-text-muted mt-2">This activates The Flare after command-center verification.</p>
          </Card>
          <form onSubmit={createFlare} className="space-y-4">
            <Card>
              <Field label="Last Seen Location" value={reportForm.location} onChange={(v) => setReportForm((p) => ({ ...p, location: v }))} />
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Field label="Date / Time" type="datetime-local" value={reportForm.time} onChange={(v) => setReportForm((p) => ({ ...p, time: v }))} />
                <Field label="Outfit" value={reportForm.clothing} onChange={(v) => setReportForm((p) => ({ ...p, clothing: v }))} />
              </div>
              <Field label="Additional Context" value={reportForm.context} onChange={(v) => setReportForm((p) => ({ ...p, context: v }))} className="mt-3" />
            </Card>
            <button type="submit" className="w-full rounded-xl bg-alert-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-alert-500/35">
              Activate The Flare
            </button>
          </form>
        </main>
      </AppShell>
    );
  }

  if (overlay === 'profile' && selectedChild) {
    return (
      <AppShell>
        <TopBar title="Child Profile" subtitle="The Vault" onBack={() => setOverlay('none')} />
        <main className="px-4 py-4 space-y-4 pb-24">
          <Card>
            <div className="text-center">
              <img src={selectedChild.photoUrl} alt={selectedChild.name} className="h-24 w-24 rounded-full object-cover mx-auto border-4 border-brand-orange-light" />
              <h2 className="font-display text-3xl font-bold text-text-main mt-3">{selectedChild.name}</h2>
              <p className="text-sm text-text-muted">{selectedChild.age} Years Old | {selectedChild.gender}</p>
              <span className="inline-flex mt-2 rounded-full border border-brand-orange/20 bg-brand-orange-light px-3 py-1 text-xs font-semibold text-brand-orange">THE VAULT</span>
            </div>
          </Card>
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Medical</h3>
            <p className="text-sm text-text-main mt-2">Blood: {selectedChild.bloodType}</p>
            <p className="text-sm text-text-main">{selectedChild.medicalNotes}</p>
          </Card>
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Digital ID</h3>
            <div className="mt-2 rounded-xl bg-[linear-gradient(120deg,#0A1628,#1E3255)] p-4 text-white">
              <p className="text-xs text-white/70">ID Number</p>
              <p className="font-display text-3xl font-bold">{selectedChild.qrCodeId}</p>
              <button onClick={() => setOverlay('qr')} className="mt-3 rounded-full border border-white/25 px-3 py-1 text-xs font-semibold">View QR</button>
            </div>
          </Card>
          <button onClick={() => setOverlay('report')} className="w-full rounded-full bg-alert-500 py-4 text-sm font-bold text-white shadow-lg shadow-alert-500/35">
            Report Missing
          </button>
        </main>
      </AppShell>
    );
  }

  if (overlay === 'qr' && selectedChild) {
    return (
      <AppShell>
        <TopBar title="QR Bracelet" subtitle="Instant Rescue Scan" onBack={() => setOverlay('profile')} />
        <main className="px-4 py-4 space-y-4">
          <Card>
            <h2 className="font-display text-3xl font-bold text-text-main text-center">{selectedChild.name}</h2>
            <p className="text-sm text-text-muted text-center">Active Profile</p>
            <div className="mt-4 rounded-2xl border border-brand-orange/15 bg-bg-primary p-4">
              <div className="h-56 rounded-xl border border-slate-300 bg-white flex items-center justify-center">
                <div className="h-20 w-20 rounded-2xl border border-brand-orange/20 bg-brand-orange-light flex items-center justify-center">
                  <QrCode className="h-11 w-11 text-brand-orange" />
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-brand-orange/20 bg-brand-orange-light p-3 text-center">
                <p className="text-xs uppercase tracking-wider text-brand-orange font-bold">Bracelet ID</p>
                <p className="font-display text-3xl font-bold text-text-main">{selectedChild.qrCodeId}</p>
              </div>
            </div>
            <p className="text-sm text-text-muted mt-3">When scanned, this code alerts the task force immediately.</p>
          </Card>
          <button onClick={() => showToast('Bracelet card ready for sharing.')} className="w-full rounded-xl bg-brand-orange py-3.5 text-sm font-bold text-white">Share / Print Bracelet</button>
        </main>
      </AppShell>
    );
  }

  if (overlay === 'status' && selectedAlert) {
    return (
      <AppShell>
        <TopBar title="Alert Status" subtitle="Live Flare Tracking" onBack={() => setOverlay('none')} />
        <main className="px-4 py-4 space-y-4 pb-24">
          <Card>
            <div className="flex items-center gap-3">
              <img src={selectedAlert.child?.photoUrl} alt={selectedAlert.child?.name} className="h-14 w-14 rounded-full object-cover" />
              <div>
                <p className="font-semibold text-text-main">{selectedAlert.child?.name}</p>
                <p className="text-xs text-text-muted">{selectedAlert.lastKnownLocation.address}</p>
              </div>
              <span className={`ml-auto rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${selectedAlert.status === 'active' ? 'border-alert-500/30 bg-alert-500/10 text-alert-500' : selectedAlert.status === 'pending_verification' ? 'border-amber-400/30 bg-amber-500/10 text-amber-600' : 'border-brand-green/30 bg-brand-green-light text-brand-green'}`}>{selectedAlert.status.replace('_', ' ')}</span>
            </div>
            <div className="mt-4 h-52 rounded-xl bg-[linear-gradient(135deg,#0A1628,#13223B)] border border-slate-700 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute h-52 w-52 rounded-full border border-alert-500/30 bg-alert-500/10 animate-ping" style={{ animationDuration: '3.5s' }} />
                <div className="absolute h-36 w-36 rounded-full border border-alert-500/30 bg-alert-500/10 animate-pulse" />
                <div className="h-24 w-24 rounded-full bg-white text-center flex flex-col justify-center">
                  <span className="text-[10px] text-text-muted uppercase">Radius</span>
                  <span className="font-display text-2xl font-bold text-text-main">{selectedAlert.currentRadiusKm}km</span>
                </div>
              </div>
              <div className="absolute bottom-3 left-3 right-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/10 bg-black/35 px-2 py-1"><p className="text-[10px] text-white/60 uppercase">Notified</p><p className="text-sm font-bold text-white">{selectedAlert.notifiedPeople.toLocaleString()}</p></div>
                <div className="rounded-lg border border-white/10 bg-black/35 px-2 py-1"><p className="text-[10px] text-white/60 uppercase">Tips</p><p className="text-sm font-bold text-white">{selectedAlert.tips.length}</p></div>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Activity Log</h3>
            <div className="mt-2 space-y-2 max-h-44 overflow-y-auto">
              {selectedAlert.logs.map((log) => (
                <article key={log.id} className="rounded-xl border border-brand-orange/10 bg-bg-primary p-3">
                  <p className="text-sm font-semibold text-text-main">{human(log.action)}</p>
                  <p className="text-xs text-text-muted">{log.details}</p>
                  <p className="text-[11px] text-text-muted mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                </article>
              ))}
            </div>
          </Card>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => shareAlert(selectedAlert)} className="rounded-xl border border-brand-orange/20 bg-white py-3 text-xs font-semibold text-text-main">Share</button>
            <button onClick={() => setOverlay('tip')} className="rounded-xl border border-brand-orange/20 bg-brand-orange-light py-3 text-xs font-semibold text-brand-orange">Submit Tip</button>
            <button onClick={resolveAlert} className="rounded-xl bg-brand-green py-3 text-xs font-bold text-white">Mark Found</button>
          </div>
        </main>
      </AppShell>
    );
  }

  if (overlay === 'tip') {
    return (
      <AppShell>
        <TopBar title="Share Information" subtitle="Tip Line" onBack={() => setOverlay('status')} />
        <main className="px-4 py-4 space-y-4">
          <form onSubmit={submitTip} className="space-y-4">
            <Card>
              <Field label="What did you see?" value={tipForm.description} onChange={(v) => setTipForm((p) => ({ ...p, description: v }))} />
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Field label="When" type="datetime-local" value={tipForm.when} onChange={(v) => setTipForm((p) => ({ ...p, when: v }))} />
                <Field label="Where" value={tipForm.location} onChange={(v) => setTipForm((p) => ({ ...p, location: v }))} />
              </div>
            </Card>
            <button type="submit" className="w-full rounded-xl bg-brand-orange py-3.5 text-sm font-bold text-white">Submit Information</button>
          </form>
        </main>
      </AppShell>
    );
  }

  if (overlay === 'tip_success') {
    return (
      <AppShell>
        <main className="min-h-screen px-6 py-10 flex flex-col items-center justify-center text-center">
          <div className="h-24 w-24 rounded-full border border-brand-green/20 bg-brand-green-light flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-brand-green" />
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold text-text-main">Information Received</h1>
          <p className="mt-2 text-sm text-text-muted">Task force has received your tip and is reviewing it now.</p>
          <button onClick={() => { setOverlay('none'); setSurface('alerts'); }} className="mt-8 w-full max-w-xs rounded-full bg-brand-orange py-3.5 text-sm font-bold text-white">Back to Feed</button>
        </main>
      </AppShell>
    );
  }

  if (overlay === 'reunion') {
    return (
      <AppShell>
        <main className="min-h-screen px-6 py-10 flex flex-col items-center justify-center text-center">
          <div className="h-28 w-28 rounded-full border border-brand-green/20 bg-brand-green-light flex items-center justify-center animate-pulse">
            <CheckCircle2 className="h-14 w-14 text-brand-green" />
          </div>
          <h1 className="mt-6 font-display text-5xl font-bold text-brand-green">Reunited!</h1>
          <p className="mt-2 text-sm text-text-muted">The alert has been safely closed.</p>
          <button onClick={() => { setOverlay('none'); setSurface('home'); }} className="mt-8 w-full max-w-xs rounded-xl bg-brand-orange py-3.5 text-sm font-bold text-white">Go to Dashboard</button>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="px-4 pt-6 pb-28 space-y-5">
        {surface === 'home' && (
          <div className="space-y-5 animate-fade-in">
            <section className="rounded-[1.8rem] bg-[linear-gradient(155deg,#07162D_0%,#0F2545_52%,#1E365A_100%)] text-white p-5 shadow-2xl shadow-slate-900/40 relative overflow-hidden">
              <div className="absolute -right-20 -top-24 h-60 w-60 rounded-full bg-brand-orange/20 blur-3xl" />
              <div className="relative">
                <p className="text-xs uppercase tracking-wider text-white/60">Guardian Dashboard</p>
                <div className="flex items-start justify-between mt-1">
                  <h1 className="font-display text-4xl font-bold leading-tight">Good morning, Amara</h1>
                  <button onClick={() => setSurface('profile')} className="h-10 w-10 rounded-full border border-white/20 bg-white/10 flex items-center justify-center">
                    <Bell className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Stat label="Children" value={String(myChildren.length)} dark />
                  <Stat label="Live" value={String(activeCount)} dark />
                  <Stat label="Pending" value={String(alerts.filter((a) => a.status === 'pending_verification').length)} dark />
                </div>
              </div>
            </section>

            <button onClick={() => setOverlay('report')} className="w-full rounded-2xl bg-brand-orange p-4 text-left text-white shadow-xl shadow-brand-orange/35">
              <p className="font-display text-2xl font-bold">Report Missing Child</p>
              <p className="text-sm text-white/85">Activate The Flare immediately</p>
            </button>

            <Card>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-text-main">My Children</p>
                <button onClick={() => setSurface('vault')} className="text-[11px] uppercase tracking-wider text-brand-orange font-bold">View all</button>
              </div>
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {myChildren.map((child) => (
                  <button key={child.id} onClick={() => { setSelectedChildId(child.id); setOverlay('profile'); }} className="min-w-[136px] rounded-xl border border-brand-orange/10 bg-bg-primary p-3 text-left">
                    <img src={child.photoUrl} alt={child.name} className="h-14 w-14 rounded-full object-cover" />
                    <p className="mt-2 font-semibold text-text-main">{child.name}</p>
                    <p className="text-xs text-text-muted">{child.age} yrs | {child.gender}</p>
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <p className="text-sm font-bold text-text-main">Recent Activity</p>
              <div className="mt-3 space-y-2">
                {myAlerts.slice(0, 2).map((alert) => (
                  <article key={alert.id} className="rounded-xl border border-brand-orange/10 bg-bg-primary p-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-text-main">{alert.child?.name}</p>
                      <p className="text-xs text-text-muted">{alert.lastKnownLocation.address}</p>
                    </div>
                    <span className="text-[11px] text-text-muted">{timeAgo(alert.startedAt)}</span>
                  </article>
                ))}
              </div>
            </Card>
          </div>
        )}

        {surface === 'vault' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold text-text-main">My Children</h1>
                <p className="text-sm text-text-muted">Secure family registry</p>
              </div>
              <button onClick={() => setOverlay('add')} className="h-10 w-10 rounded-full bg-brand-orange text-white flex items-center justify-center shadow-lg shadow-brand-orange/30"><Plus className="h-5 w-5" /></button>
            </div>
            <div className="rounded-full border border-brand-orange/15 bg-white px-4 py-2.5 flex items-center gap-2"><Search className="h-4 w-4 text-text-muted" /><input className="w-full bg-transparent text-sm text-text-main placeholder:text-text-muted focus:outline-none" placeholder="Search child profile..." /></div>
            <Card>
              <p className="text-sm font-semibold text-brand-green">Vault Secure</p>
              <p className="text-xs text-text-muted mt-1">All child profiles are synced and alert-ready.</p>
            </Card>
            <div className="grid grid-cols-2 gap-3">
              {myChildren.map((child) => (
                <button key={child.id} onClick={() => { setSelectedChildId(child.id); setOverlay('profile'); }} className="rounded-2xl border border-brand-orange/10 bg-white p-3 text-left shadow-sm">
                  <img src={child.photoUrl} alt={child.name} className="h-14 w-14 rounded-full object-cover" />
                  <p className="mt-2 font-semibold text-text-main">{child.name}</p>
                  <p className="text-xs text-text-muted">{child.age} yrs | {child.gender}</p>
                  <p className="mt-2 text-[11px] font-semibold text-brand-orange">Vault</p>
                </button>
              ))}
              <button onClick={() => setOverlay('add')} className="rounded-2xl border-2 border-dashed border-brand-orange/20 bg-bg-primary p-3 text-center text-text-muted"><Plus className="h-5 w-5 mx-auto mb-2" />Register Child</button>
            </div>
          </div>
        )}

        {surface === 'alerts' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold text-text-main">Live Alerts</h1>
                <p className="text-sm text-text-muted">Community watch and task feed</p>
              </div>
            </div>
            <div className="rounded-full border border-brand-orange/15 bg-white p-1 grid grid-cols-2">
              <button onClick={() => setFeedMode('community')} className={`rounded-full px-3 py-2 text-sm font-semibold ${feedMode === 'community' ? 'bg-bg-primary border border-brand-orange/15 text-text-main' : 'text-text-muted'}`}>Community</button>
              <button onClick={() => setFeedMode('mine')} className={`rounded-full px-3 py-2 text-sm font-semibold ${feedMode === 'mine' ? 'bg-bg-primary border border-brand-orange/15 text-text-main' : 'text-text-muted'}`}>My Alerts</button>
            </div>
            <div className="space-y-3">
              {feedAlerts.map((alert) => (
                <article key={alert.id} className="rounded-2xl border border-brand-orange/10 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <img src={alert.child?.photoUrl} alt={alert.child?.name} className="h-14 w-14 rounded-xl object-cover" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-text-main">{alert.child?.name}</p>
                          <p className="text-xs text-text-muted">{alert.lastKnownLocation.address}</p>
                        </div>
                        <Status status={alert.status} />
                      </div>
                      <p className="text-xs text-text-muted mt-1">{timeAgo(alert.startedAt)} | Radius {alert.currentRadiusKm}km</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button onClick={() => shareAlert(alert)} className="rounded-lg border border-brand-orange/20 bg-white py-2 text-xs font-semibold text-text-main">Share</button>
                    <button onClick={() => { setSelectedAlertId(alert.id); setOverlay('tip'); }} className="rounded-lg border border-brand-orange/20 bg-brand-orange-light py-2 text-xs font-semibold text-brand-orange">Help Search</button>
                    <button onClick={() => { setSelectedAlertId(alert.id); setOverlay('status'); }} className="rounded-lg bg-brand-orange py-2 text-xs font-bold text-white">Live</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {surface === 'profile' && (
          <div className="space-y-4 animate-fade-in">
            <Card>
              <div className="text-center">
                <div className="h-20 w-20 mx-auto rounded-full border-4 border-brand-orange-light bg-brand-orange-light flex items-center justify-center">
                  <UserCircle2 className="h-10 w-10 text-brand-orange" />
                </div>
                <h1 className="font-display text-3xl font-bold text-text-main mt-3">Amara Nkomo</h1>
                <p className="text-sm text-text-muted">Guardian ID: #882910</p>
                <span className="inline-flex mt-2 rounded-full border border-brand-green/20 bg-brand-green-light px-3 py-1 text-xs font-semibold text-brand-green">Verified Guardian</span>
              </div>
            </Card>
            <Card>
              <Toggle label="SMS Alerts" enabled={settings.sms} onToggle={() => setSettings((p) => ({ ...p, sms: !p.sms }))} />
              <Toggle label="WhatsApp Alerts" enabled={settings.whatsapp} onToggle={() => setSettings((p) => ({ ...p, whatsapp: !p.whatsapp }))} className="mt-3" />
            </Card>
            <button onClick={onLogout} className="w-full rounded-xl border border-alert-500/25 bg-alert-500/10 py-3.5 text-sm font-bold text-alert-500">Log Out</button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-brand-orange/10 bg-white/95 px-3 py-2 pb-4 backdrop-blur md:left-1/2 md:max-w-[430px] md:-translate-x-1/2 md:rounded-t-2xl md:border md:shadow-lg">
        <div className="grid grid-cols-5 items-end gap-1">
          <Nav icon={<Home className="h-4.5 w-4.5" />} label="Home" active={surface === 'home'} onClick={() => setSurface('home')} />
          <Nav icon={<Users2 className="h-4.5 w-4.5" />} label="Children" active={surface === 'vault'} onClick={() => setSurface('vault')} />
          <button onClick={() => setOverlay('report')} className="-mt-7 mx-auto h-14 w-14 rounded-full border-4 border-white bg-brand-orange text-white shadow-2xl shadow-brand-orange/35 flex items-center justify-center"><AlertTriangle className="h-6 w-6" /></button>
          <Nav icon={<Bell className="h-4.5 w-4.5" />} label="Alerts" active={surface === 'alerts'} onClick={() => setSurface('alerts')} />
          <Nav icon={<UserCircle2 className="h-4.5 w-4.5" />} label="Profile" active={surface === 'profile'} onClick={() => setSurface('profile')} />
        </div>
      </nav>

      {toast && <div className="fixed top-4 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-text-main px-4 py-2 text-sm text-white shadow-xl">{toast}</div>}
    </AppShell>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff6f0_0%,#fdf8f2_45%,#f8f2ea_100%)] font-sans">
      <div className="mx-auto w-full max-w-[430px] min-h-screen bg-bg-primary border-x border-brand-orange/10 md:rounded-[2.2rem] md:border md:my-6 md:shadow-[0_30px_80px_rgba(17,24,39,0.18)] md:overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-2xl border border-brand-orange/10 bg-white p-4 shadow-sm">{children}</section>;
}

function TopBar({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
}) {
  return (
    <header className="bg-bg-primary px-4 pt-6 pb-4 border-b border-brand-orange/10">
      <button onClick={onBack} className="text-sm font-semibold text-text-muted">
        Back
      </button>
      <p className="text-[11px] uppercase tracking-wider text-text-muted mt-2">{subtitle}</p>
      <h1 className="font-display text-3xl font-bold text-text-main">{title}</h1>
    </header>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-text-main">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-brand-orange/20 bg-bg-primary px-3.5 py-2.5 text-sm text-text-main focus:outline-none focus:border-brand-orange"
      />
    </label>
  );
}

function Stat({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={`rounded-xl border p-2.5 ${dark ? 'border-white/15 bg-white/5' : 'border-brand-orange/10 bg-white'}`}>
      <p className={`text-[10px] uppercase tracking-wider ${dark ? 'text-white/65' : 'text-text-muted'}`}>{label}</p>
      <p className={`font-display text-2xl font-bold ${dark ? 'text-white' : 'text-text-main'}`}>{value}</p>
    </div>
  );
}

function Status({ status }: { status: Alert['status'] }) {
  const style = {
    active: 'border-alert-500/30 bg-alert-500/10 text-alert-500',
    pending_verification: 'border-amber-400/30 bg-amber-500/10 text-amber-600',
    resolved: 'border-brand-green/30 bg-brand-green-light text-brand-green',
    closed: 'border-slate-300 bg-slate-100 text-slate-500',
  };
  return <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${style[status]}`}>{status.replace('_', ' ')}</span>;
}

function Toggle({
  label,
  enabled,
  onToggle,
  className = '',
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button onClick={onToggle} className={`w-full rounded-xl border border-brand-orange/10 bg-bg-primary px-3 py-2.5 flex items-center justify-between ${className}`}>
      <span className="text-sm font-semibold text-text-main">{label}</span>
      <span className={`h-6 w-10 rounded-full relative ${enabled ? 'bg-brand-orange' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
      </span>
    </button>
  );
}

function Nav({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 py-1">
      <span className={active ? 'text-brand-orange' : 'text-text-muted'}>{icon}</span>
      <span className={`text-[10px] font-semibold ${active ? 'text-brand-orange' : 'text-text-muted'}`}>{label}</span>
    </button>
  );
}

function timeAgo(time: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(time).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

function human(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((piece) => piece.charAt(0).toUpperCase() + piece.slice(1))
    .join(' ');
}
