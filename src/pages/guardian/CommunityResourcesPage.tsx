import React, { useMemo, useState } from 'react';
import { ArrowLeft, MapPin, Phone, Plus, ShieldAlert, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import BottomSheet from '../../components/common/BottomSheet';
import Chip from '../../components/common/Chip';
import EmptyState from '../../components/common/EmptyState';

type ResourceFilter = 'all' | 'police' | 'hospital' | 'school';

export default function CommunityResourcesPage() {
  const { resources, pushToast } = useAppContext();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ResourceFilter>('all');
  const [mapMode, setMapMode] = useState(false);
  const [nearestFirst, setNearestFirst] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [custom, setCustom] = useState({ name: '', phone: '', type: 'police', address: '' });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = resources.filter((item) => (filter === 'all' ? true : item.type === filter));
    if (q) {
      list = list.filter((item) => `${item.name} ${item.address} ${item.type}`.toLowerCase().includes(q));
    }
    if (nearestFirst) {
      list = [...list].sort((a, b) => Math.abs(a.lat) + Math.abs(a.lng) - (Math.abs(b.lat) + Math.abs(b.lng)));
    }
    return list;
  }, [resources, filter, query, nearestFirst]);

  const grouped = useMemo(() => ({
    police: filtered.filter((item) => item.type === 'police'),
    hospital: filtered.filter((item) => item.type === 'hospital'),
    school: filtered.filter((item) => item.type === 'school'),
  }), [filtered]);

  const saveCustom = () => {
    if (!custom.name.trim() || !custom.phone.trim()) {
      pushToast('warning', 'Name and phone are required');
      return;
    }
    setAddOpen(false);
    setCustom({ name: '', phone: '', type: 'police', address: '' });
    pushToast('success', 'Custom contact saved locally');
  };

  return (
    <div className="guardian-screen animate-page-in pb-4">
      <header className="flex items-center justify-between">
        <Link to="/guardian/home" className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-200 bg-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] bg-brand-orange text-white shadow-orange"
        >
          <Plus className="h-4 w-4" />
        </button>
      </header>

      <section className="rounded-[var(--r-xl)] border border-red-500/30 bg-red-50 p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wider text-red-600">Emergency</p>
        <h1 className="mt-1 guardian-page-title">Call 999</h1>
        <a href="tel:999" className="mt-3 inline-flex rounded-[var(--r-pill)] bg-red-500 px-4 py-2 text-xs font-bold text-white">
          Call Emergency Line
        </a>
      </section>

      <section className="guardian-card p-4">
        <h2 className="guardian-section-title">Safety Center</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => pushToast('success', 'Check-in sent to trusted contacts')} className="rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary p-3 text-left">
            <p className="text-sm font-semibold text-text-main">Check-in</p>
            <p className="text-xs text-text-muted">Share your current safety status</p>
          </button>
          <article className="rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary p-3">
            <p className="text-sm font-semibold text-text-main">Tip</p>
            <p className="text-xs text-text-muted">Pre-mark school routes and meeting points.</p>
          </article>
        </div>
      </section>

      <div className="rounded-[var(--r-pill)] border border-slate-200 bg-white px-4 py-2.5">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search contacts"
          className="w-full bg-transparent text-sm text-text-main placeholder:text-text-muted focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip variant={filter === 'all' ? 'orange' : 'neutral'} selected={filter === 'all'} onClick={() => setFilter('all')}>All</Chip>
        <Chip variant={filter === 'police' ? 'orange' : 'neutral'} selected={filter === 'police'} onClick={() => setFilter('police')}>Police</Chip>
        <Chip variant={filter === 'hospital' ? 'orange' : 'neutral'} selected={filter === 'hospital'} onClick={() => setFilter('hospital')}>Hospitals</Chip>
        <Chip variant={filter === 'school' ? 'orange' : 'neutral'} selected={filter === 'school'} onClick={() => setFilter('school')}>Schools</Chip>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setNearestFirst((prev) => !prev)}
          className="rounded-[var(--r-pill)] border border-slate-300 bg-white py-2 text-xs font-semibold text-text-main"
        >
          {nearestFirst ? 'Default Sort' : 'Nearest to me'}
        </button>
        <button
          type="button"
          onClick={() => setMapMode((prev) => !prev)}
          className="rounded-[var(--r-pill)] border border-slate-300 bg-white py-2 text-xs font-semibold text-text-main"
        >
          {mapMode ? 'List View' : 'Map View'}
        </button>
      </div>

      {mapMode ? (
        <section className="h-44 rounded-[var(--r-lg)] border border-slate-200 bg-[radial-gradient(circle_at_20%_20%,#ffe8d9,transparent_30%),#fff] relative">
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[var(--r-pill)] bg-brand-orange px-2 py-1 text-[10px] font-bold text-white">
            Resource map pins
          </span>
        </section>
      ) : null}

      {filtered.length ? (
        <div className="space-y-3">
          <ResourceGroup title="Police" items={grouped.police} />
          <ResourceGroup title="Hospitals" items={grouped.hospital} />
          <ResourceGroup title="Schools" items={grouped.school} />
        </div>
      ) : (
        <EmptyState icon="🏥" title="No resources found" body="Try changing filters or search terms." />
      )}

      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title="Add Custom Contact" snap="70">
        <div className="space-y-3">
          <Input label="Name" value={custom.name} onChange={(value) => setCustom((prev) => ({ ...prev, name: value }))} />
          <Input label="Phone" value={custom.phone} onChange={(value) => setCustom((prev) => ({ ...prev, phone: value }))} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-text-main">Type</span>
            <select
              value={custom.type}
              onChange={(event) => setCustom((prev) => ({ ...prev, type: event.target.value }))}
              className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2.5 text-sm"
            >
              <option value="police">Police</option>
              <option value="hospital">Hospital</option>
              <option value="school">School</option>
            </select>
          </label>
          <Input label="Address" value={custom.address} onChange={(value) => setCustom((prev) => ({ ...prev, address: value }))} />
          <button type="button" onClick={saveCustom} className="w-full rounded-[var(--r-pill)] bg-brand-orange py-3 text-sm font-bold text-white">Save Contact</button>
        </div>
      </BottomSheet>
    </div>
  );
}

function ResourceGroup({ title, items }: { title: string; items: Array<{ id: string; name: string; phone: string; address: string }> }) {
  if (!items.length) return null;
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-text-muted">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-[var(--r-lg)] border border-slate-200 bg-white p-3 shadow-sm">
            <p className="font-semibold text-text-main">{item.name}</p>
            <p className="text-xs text-text-muted">{item.address}</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <a href={`tel:${item.phone}`} className="rounded-[var(--r-pill)] bg-brand-orange py-2 text-center text-xs font-bold text-white">Call Now</a>
              <a href={`https://wa.me/${item.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="rounded-[var(--r-pill)] border border-slate-300 bg-white py-2 text-center text-xs font-semibold text-text-main">WhatsApp</a>
              <button type="button" className="rounded-[var(--r-pill)] border border-slate-300 bg-white py-2 text-xs font-semibold text-text-main">Details</button>
            </div>
          </article>
        ))}
      </div>
    </section>
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

