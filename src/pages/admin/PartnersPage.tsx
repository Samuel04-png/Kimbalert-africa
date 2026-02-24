import React, { useMemo, useState } from 'react';
import { Download, Plus, Send } from 'lucide-react';
import { useAppContext } from '../../app/AppContext';
import BottomSheet from '../../components/common/BottomSheet';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import { PartnerNode } from '../../types';

export default function PartnersPage() {
  const { partners, pushToast } = useAppContext();
  const [localPartners, setLocalPartners] = useState(partners);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'police', phone: '', location: '' });

  const groups = useMemo<Array<{ key: PartnerNode['type']; items: PartnerNode[] }>>(
    () => [
      { key: 'police', items: localPartners.filter((item) => item.type === 'police') },
      { key: 'hospital', items: localPartners.filter((item) => item.type === 'hospital') },
      { key: 'school', items: localPartners.filter((item) => item.type === 'school') },
      { key: 'media', items: localPartners.filter((item) => item.type === 'media') },
      { key: 'community', items: localPartners.filter((item) => item.type === 'community') },
    ],
    [localPartners],
  );

  const setActive = (id: string, active: boolean) => {
    setLocalPartners((prev) => prev.map((item) => (item.id === id ? { ...item, active } : item)));
  };

  const health = (date?: string) => {
    if (!date) return { label: 'Unknown', tone: 'text-slate-400' };
    const days = (Date.now() - new Date(date).getTime()) / 86400000;
    if (days < 7) return { label: `Last notified ${Math.round(days)}d ago`, tone: 'text-brand-green' };
    if (days <= 30) return { label: `Last notified ${Math.round(days)}d ago`, tone: 'text-amber-400' };
    return { label: `Last notified ${Math.round(days)}d ago`, tone: 'text-red-400' };
  };

  const savePartner = () => {
    if (!form.name.trim() || !form.phone.trim()) {
      pushToast('warning', 'Name and phone are required');
      return;
    }
    setLocalPartners((prev) => [
      {
        id: `pn-${Date.now()}`,
        name: form.name,
        type: form.type as PartnerNode['type'],
        contactPhone: form.phone,
        location: form.location || 'Not set',
        active: true,
        notificationHistory: [],
      },
      ...prev,
    ]);
    setForm({ name: '', type: 'police', phone: '', location: '' });
    setSheetOpen(false);
    pushToast('success', 'Partner added');
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100 px-4 pb-24 pt-4 md:px-6 md:pb-8">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-display text-4xl font-bold">Partner Management</h1>
          <p className="text-sm text-slate-400">Police, hospitals, schools, media and community nodes</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => pushToast('success', 'Partner CSV import ready')}
            className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-700 bg-[#111a2b]"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] bg-brand-orange text-white"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </header>

      {groups.map(({ key, items }) => (
        <section key={key} className="mt-4 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-2xl font-bold capitalize">{key}</h2>
            <button
              type="button"
              onClick={() => pushToast('info', `Test alert sent to all ${key} partners`)}
              className="rounded-[var(--r-pill)] border border-slate-700 bg-[#0f1625] px-3 py-1.5 text-xs font-semibold"
            >
              Bulk notify {key}
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {items.length ? (
              items.map((partner) => {
                const state = health(partner.lastNotifiedAt);
                return (
                  <article key={partner.id} className="rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{partner.name}</p>
                        <p className="text-xs text-slate-400">
                          {partner.contactPhone} • {partner.location}
                        </p>
                        <p className={`text-[11px] ${state.tone}`}>{state.label}</p>
                      </div>
                      <ToggleSwitch checked={partner.active} onChange={(next) => setActive(partner.id, next)} />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => pushToast('info', 'Partner detail panel opening soon')}
                        className="rounded-[var(--r-pill)] border border-slate-700 bg-[#111a2b] px-3 py-1 text-[11px] font-semibold"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => pushToast('success', `Test alert sent to ${partner.name}`)}
                        className="rounded-[var(--r-pill)] border border-slate-700 bg-[#111a2b] px-3 py-1 text-[11px] font-semibold"
                      >
                        <Send className="mr-1 inline h-3.5 w-3.5" /> Send test alert
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="text-sm text-slate-400">No {key} partners added yet.</p>
            )}
          </div>
        </section>
      ))}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Add Partner" snap="70">
        <div className="space-y-3">
          <Input label="Partner Name" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-text-main">Category</span>
            <select
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
              className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2.5 text-sm"
            >
              <option value="police">Police</option>
              <option value="hospital">Hospital</option>
              <option value="school">School</option>
              <option value="media">Media</option>
              <option value="community">Community</option>
            </select>
          </label>
          <Input label="Phone" value={form.phone} onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))} />
          <Input label="Location" value={form.location} onChange={(value) => setForm((prev) => ({ ...prev, location: value }))} />
          <button type="button" onClick={savePartner} className="w-full rounded-[var(--r-pill)] bg-brand-orange py-3 text-sm font-bold text-white">
            Save Partner
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-text-main">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3.5 py-2.5 text-sm"
      />
    </label>
  );
}
