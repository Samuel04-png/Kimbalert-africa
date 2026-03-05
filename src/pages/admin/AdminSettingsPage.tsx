import React, { useEffect, useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { useAppContext } from '../../app/AppContext';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import Watermark from '../../components/common/Watermark';
import { runAdminOperation } from '../../services/adminOpsService';

export default function AdminSettingsPage() {
  const {
    admins,
    adminInvites,
    systemConfig,
    currentUser,
    addNotification,
    saveSystemConfig,
    createAdminInvite,
    logAdminAction,
    pushToast,
  } = useAppContext();
  const [defaultRadius, setDefaultRadius] = useState(String(systemConfig.defaultRadiusKm));
  const [expansionRate, setExpansionRate] = useState(String(systemConfig.expansionRateKmPerHour));
  const [smsOk, setSmsOk] = useState(systemConfig.smsGatewayEnabled);
  const [pushOk, setPushOk] = useState(systemConfig.pushServiceEnabled);
  const [branding, setBranding] = useState({
    appName: systemConfig.branding.appName,
    color: systemConfig.branding.color,
  });
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    setDefaultRadius(String(systemConfig.defaultRadiusKm));
    setExpansionRate(String(systemConfig.expansionRateKmPerHour));
    setSmsOk(systemConfig.smsGatewayEnabled);
    setPushOk(systemConfig.pushServiceEnabled);
    setBranding({
      appName: systemConfig.branding.appName,
      color: systemConfig.branding.color,
    });
  }, [systemConfig]);

  const saveExpansionRules = () => {
    const radius = Number(defaultRadius);
    const rate = Number(expansionRate);

    if (!Number.isFinite(radius) || radius <= 0 || !Number.isFinite(rate) || rate <= 0) {
      pushToast('warning', 'Use valid numeric values for radius and expansion rate');
      return;
    }

    saveSystemConfig({
      defaultRadiusKm: radius,
      expansionRateKmPerHour: rate,
    });
    logAdminAction('settings:update-expansion', 'Updated alert expansion rules', {
      defaultRadiusKm: radius,
      expansionRateKmPerHour: rate,
    });
    pushToast('success', 'Expansion rules saved');
  };

  const saveGatewayStatus = () => {
    saveSystemConfig({
      smsGatewayEnabled: smsOk,
      pushServiceEnabled: pushOk,
    });
    logAdminAction('settings:update-gateway', 'Updated gateway status', {
      smsGatewayEnabled: smsOk,
      pushServiceEnabled: pushOk,
    });
    pushToast('success', 'Gateway settings saved');
  };

  const saveBranding = () => {
    const appName = branding.appName.trim();
    const color = branding.color.trim();
    const hexColorPattern = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;

    if (!appName) {
      pushToast('warning', 'App name cannot be empty');
      return;
    }
    if (!hexColorPattern.test(color)) {
      pushToast('warning', 'Use a valid hex color like #E8622A');
      return;
    }

    saveSystemConfig({
      branding: {
        appName,
        color,
      },
    });
    logAdminAction('settings:update-branding', 'Updated branding settings', { appName, color });
    pushToast('success', 'Brand settings saved');
  };

  const inviteAdmin = () => {
    const normalized = inviteEmail.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalized) {
      pushToast('warning', 'Enter an admin email');
      return;
    }
    if (!emailPattern.test(normalized)) {
      pushToast('warning', 'Enter a valid email address');
      return;
    }
    const existingPending = adminInvites.some(
      (invite) => invite.email === normalized && invite.status === 'pending',
    );
    if (existingPending) {
      pushToast('info', 'A pending invite already exists for this email');
      return;
    }

    const inviteId = createAdminInvite(normalized);
    logAdminAction('admin:invite', `Invited admin ${normalized}`, {
      inviteId,
      email: normalized,
    });
    setInviteEmail('');
    pushToast('success', 'Admin invitation sent');
  };

  const handleGatewayTest = async (channel: 'sms' | 'push') => {
    const type = channel === 'sms' ? 'test_sms' : 'test_push';
    const result = await runAdminOperation({
      type,
      title: channel === 'sms' ? 'SMS gateway test' : 'Push service test',
      body:
        channel === 'sms'
          ? 'SMS gateway test was triggered by admin settings.'
          : 'Push notification test was triggered by admin settings.',
      meta: { source: 'admin-settings' },
    });

    if (result?.ok) {
      pushToast('info', channel === 'sms' ? 'SMS gateway test sent' : 'Push notification test sent');
      return;
    }

    if (channel === 'sms') {
      logAdminAction('gateway:test-sms', 'Sent SMS gateway test');
    } else {
      logAdminAction('gateway:test-push', 'Sent push notification test');
    }
    addNotification({
      userId: currentUser.id,
      title: channel === 'sms' ? 'SMS test dispatched' : 'Push test dispatched',
      body: channel === 'sms' ? 'SMS gateway diagnostic request sent.' : 'Push delivery test initiated.',
      type: 'info',
      route: '/admin/notifications',
    });
    pushToast('info', channel === 'sms' ? 'SMS gateway test sent' : 'Push notification test sent');
  };

  const handleSystemOperation = async (type: 'backup' | 'export') => {
    const result = await runAdminOperation({
      type,
      title: type === 'backup' ? 'System backup started' : 'Data export ready',
      body:
        type === 'backup'
          ? 'Manual backup job has started from admin settings.'
          : 'System data export is now ready for download.',
      meta: { source: 'admin-settings' },
    });
    if (result?.ok) {
      pushToast('success', type === 'backup' ? 'Backup started' : 'Data export prepared');
      return;
    }

    if (type === 'backup') {
      logAdminAction('system:backup', 'Started manual backup');
      addNotification({
        userId: currentUser.id,
        title: 'Backup started',
        body: 'Manual backup was started successfully.',
        type: 'success',
        route: '/admin/notifications',
      });
      pushToast('success', 'Backup started');
      return;
    }

    logAdminAction('system:export', 'Prepared system data export');
    addNotification({
      userId: currentUser.id,
      title: 'Data export ready',
      body: 'System export package is available for download.',
      type: 'success',
      route: '/admin/notifications',
    });
    pushToast('success', 'Data export prepared');
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
          onClick={saveExpansionRules}
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
          <button
            type="button"
            onClick={() => void handleGatewayTest('sms')}
            className="rounded-[var(--r-pill)] border border-slate-700 bg-[#0f1625] px-3 py-1.5 text-xs font-semibold"
          >
            Test SMS
          </button>
          <button
            type="button"
            onClick={() => void handleGatewayTest('push')}
            className="rounded-[var(--r-pill)] border border-slate-700 bg-[#0f1625] px-3 py-1.5 text-xs font-semibold"
          >
            Test Push
          </button>
          <button
            type="button"
            onClick={saveGatewayStatus}
            className="rounded-[var(--r-pill)] bg-brand-orange px-3 py-1.5 text-xs font-bold text-white"
          >
            Save Gateway
          </button>
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
        {adminInvites.length ? (
          <div className="mt-3 space-y-2 border-t border-slate-700 pt-3">
            <p className="text-xs uppercase tracking-wider text-slate-400">Recent Invites</p>
            {adminInvites.slice(0, 5).map((invite) => (
              <article
                key={invite.id}
                className="rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] p-3"
              >
                <p className="text-sm font-semibold">{invite.email}</p>
                <p className="text-xs text-slate-400">
                  {invite.status.toUpperCase()} • {timeAgo(invite.invitedAt)}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="mt-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
        <h2 className="font-display text-2xl font-bold">Backup & Export</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void handleSystemOperation('backup')}
            className="rounded-[var(--r-pill)] border border-slate-700 bg-[#0f1625] py-2 text-xs font-semibold"
          >
            Start Backup
          </button>
          <button
            type="button"
            onClick={() => void handleSystemOperation('export')}
            className="rounded-[var(--r-pill)] border border-slate-700 bg-[#0f1625] py-2 text-xs font-semibold"
          >
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
        <button
          type="button"
          onClick={saveBranding}
          className="mt-3 rounded-[var(--r-pill)] bg-brand-orange px-4 py-2 text-xs font-bold text-white"
        >
          Save Branding
        </button>
      </section>

      <div className="mt-4 flex justify-end pb-3 pr-3">
        <Watermark tone="admin" />
      </div>
    </div>
  );
}

function timeAgo(value: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
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
