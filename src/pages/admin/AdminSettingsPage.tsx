import React, { useState } from 'react';
import { Download, Plus, Send } from 'lucide-react';
import { useAppContext } from '../../app/AppContext';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import Watermark from '../../components/common/Watermark';

export default function AdminSettingsPage() {
  const { admins, pushToast } = useAppContext();
  const [defaultRadius, setDefaultRadius] = useState('10');
  const [expansionRate, setExpansionRate] = useState('5');
  const [smsOk, setSmsOk] = useState(true);
  const [pushOk, setPushOk] = useState(true);
  const [branding, setBranding] = useState({ appName: 'KimbAlert Africa', color: '#E8622A' });
  const [inviteEmail, setInviteEmail] = useState('');

  const inviteAdmin = () => {
    if (!inviteEmail.trim()) {
      pushToast('warning', 'Enter admin email');
      return;
    }
    setInviteEmail('');
    pushToast('success', 'Admin invitation sent');
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100 px-4 pb-24 pt-4 md:px-6 md:pb-8">
      <header>
        <h1 className="font-display text-4xl font-bold">Admin Settings</h1>
        <p className="text-sm text-slate-400">System configuration and command center controls</p>
      </header>

      <section className="mt-4 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Alert Expansion Rules</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Input label="Default Radius (km)" value={defaultRadius} onChange={setDefaultRadius} />
          <Input label="Expansion Rate (km/hr)" value={expansionRate} onChange={setExpansionRate} />
        </div>
        <button
          type="button"
          onClick={() => pushToast('success', 'Expansion rules saved')}
          className="mt-3 rounded-[var(--r-pill)] bg-brand-orange px-4 py-2 text-xs font-bold text-white"
        >
          Save Rules
        </button>
      </section>

      <section className="mt-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Gateway Status</h2>
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] px-3 py-2">
            <p className="text-sm">SMS Gateway</p>
            <ToggleSwitch checked={smsOk} onChange={setSmsOk} />
          </div>
          <div className="flex items-center justify-between rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] px-3 py-2">
            <p className="text-sm">Push Service</p>
            <ToggleSwitch checked={pushOk} onChange={setPushOk} />
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => pushToast('info', 'SMS gateway test sent')} className="rounded-[var(--r-pill)] border border-slate-700 bg-[#0f1625] px-3 py-1.5 text-xs font-semibold">Test SMS</button>
          <button type="button" onClick={() => pushToast('info', 'Push notification test sent')} className="rounded-[var(--r-pill)] border border-slate-700 bg-[#0f1625] px-3 py-1.5 text-xs font-semibold">Test Push</button>
        </div>
      </section>

      <section className="mt-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Admin User Management</h2>
        <div className="mt-2 space-y-2">
          {admins.map((admin) => (
            <article key={admin.id} className="rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] p-3">
              <p className="text-sm font-semibold">{admin.fullName}</p>
              <p className="text-xs text-slate-400">{admin.email}</p>
            </article>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder="Invite admin by email"
            className="rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] px-3 py-2 text-sm"
          />
          <button type="button" onClick={inviteAdmin} className="rounded-[var(--r-pill)] bg-brand-orange px-4 py-2 text-xs font-bold text-white">
            <Plus className="mr-1 inline h-3.5 w-3.5" /> Invite
          </button>
        </div>
      </section>

      <section className="mt-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Backup & Export</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => pushToast('success', 'Backup started')} className="rounded-[var(--r-pill)] border border-slate-700 bg-[#0f1625] py-2 text-xs font-semibold">
            Start Backup
          </button>
          <button type="button" onClick={() => pushToast('success', 'Data export prepared')} className="rounded-[var(--r-pill)] border border-slate-700 bg-[#0f1625] py-2 text-xs font-semibold">
            <Download className="mr-1 inline h-3.5 w-3.5" /> Export Data
          </button>
        </div>
      </section>

      <section className="mt-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Branding Settings</h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <Input label="App Name" value={branding.appName} onChange={(value) => setBranding((prev) => ({ ...prev, appName: value }))} />
          <Input label="Primary Color" value={branding.color} onChange={(value) => setBranding((prev) => ({ ...prev, color: value }))} />
        </div>
        <button type="button" onClick={() => pushToast('success', 'Brand settings saved')} className="mt-3 rounded-[var(--r-pill)] bg-brand-orange px-4 py-2 text-xs font-bold text-white">
          Save Branding
        </button>
      </section>

      <div className="mt-4 flex justify-end pb-3 pr-3">
        <Watermark tone="admin" />
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-200">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] px-3 py-2.5 text-sm"
      />
    </label>
  );
}
