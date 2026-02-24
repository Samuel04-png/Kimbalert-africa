import React, { useMemo, useState } from 'react';
import { Download, Flag, MessageSquare } from 'lucide-react';
import { useAppContext } from '../../app/AppContext';
import Chip from '../../components/common/Chip';

type Tab = 'guardians' | 'children' | 'partners';

export default function RegistryPage() {
  const { guardians, children, partners, pushToast } = useAppContext();
  const [tab, setTab] = useState<Tab>('guardians');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedGuardians, setSelectedGuardians] = useState<string[]>([]);

  const q = query.trim().toLowerCase();
  const guardianRows = guardians.filter((item) => `${item.fullName} ${item.phone}`.toLowerCase().includes(q));
  const childRows = children.filter((item) => `${item.name} ${item.qrBraceletId}`.toLowerCase().includes(q));
  const partnerRows = partners.filter((item) => `${item.name} ${item.type} ${item.location}`.toLowerCase().includes(q));

  const stats = {
    total: guardians.length,
    verified: guardians.filter((item) => item.verified).length,
    unverified: guardians.filter((item) => !item.verified).length,
    newWeek: guardians.filter((item) => (Date.now() - new Date(item.joinedAt).getTime()) < 7 * 86400000).length,
  };

  const toggleGuardian = (id: string) => {
    setSelectedGuardians((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100 px-4 pb-24 pt-4 md:px-6 md:pb-8">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-display text-4xl font-bold">Central Registry</h1>
          <p className="text-sm text-slate-400">Guardians, children and partners</p>
        </div>
        <button type="button" onClick={() => pushToast('success', 'Registry CSV prepared')} className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-700 bg-[#111a2b]">
          <Download className="h-4 w-4" />
        </button>
      </header>

      <section className="mt-3 grid grid-cols-4 gap-2">
        <Stat label="Total" value={String(stats.total)} />
        <Stat label="Verified" value={String(stats.verified)} />
        <Stat label="Unverified" value={String(stats.unverified)} />
        <Stat label="New Week" value={String(stats.newWeek)} />
      </section>

      <section className="mt-3 rounded-[var(--r-pill)] border border-slate-700 bg-[#111a2b] px-4 py-2.5">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search registry"
          className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
      </section>

      <div className="mt-3 flex flex-wrap gap-2">
        <Chip variant={tab === 'guardians' ? 'orange' : 'navy'} selected={tab === 'guardians'} onClick={() => setTab('guardians')}>Guardians</Chip>
        <Chip variant={tab === 'children' ? 'orange' : 'navy'} selected={tab === 'children'} onClick={() => setTab('children')}>Children</Chip>
        <Chip variant={tab === 'partners' ? 'orange' : 'navy'} selected={tab === 'partners'} onClick={() => setTab('partners')}>Partners</Chip>
      </div>

      {tab === 'guardians' ? (
        <>
          {selectedGuardians.length ? (
            <section className="mt-3 rounded-[var(--r-md)] border border-brand-orange/35 bg-brand-orange/10 p-3">
              <p className="text-xs text-brand-orange">{selectedGuardians.length} selected guardians</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => pushToast('success', 'Selected guardians flagged as verified')} className="rounded-[var(--r-pill)] bg-brand-orange px-3 py-1.5 text-xs font-bold text-white">Bulk Verify</button>
                <button type="button" onClick={() => pushToast('warning', 'Suspicious account flag submitted')} className="rounded-[var(--r-pill)] border border-brand-orange px-3 py-1.5 text-xs font-semibold text-brand-orange">Flag Suspicious</button>
              </div>
            </section>
          ) : null}

          <div className="mt-3 space-y-2">
            {guardianRows.map((guardian) => (
              <article key={guardian.id} className="rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-3">
                <div className="flex items-start justify-between gap-2">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selectedGuardians.includes(guardian.id)}
                      onChange={() => toggleGuardian(guardian.id)}
                    />
                    <div>
                      <p className="text-sm font-semibold">{guardian.fullName}</p>
                      <p className="text-xs text-slate-400">{guardian.phone} • {guardian.childrenCount} children</p>
                    </div>
                  </label>
                  <Chip size="sm" variant={guardian.verified ? 'green' : 'pending'}>{guardian.verified ? 'Verified' : 'Unverified'}</Chip>
                </div>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => setExpandedId(expandedId === guardian.id ? null : guardian.id)} className="rounded-[var(--r-pill)] border border-slate-700 bg-[#0f1625] px-3 py-1 text-[11px] font-semibold">Details</button>
                  <button type="button" onClick={() => pushToast('info', 'Message composer opened')} className="rounded-[var(--r-pill)] border border-slate-700 bg-[#0f1625] px-3 py-1 text-[11px] font-semibold"><MessageSquare className="mr-1 inline h-3.5 w-3.5" /> Send Message</button>
                  <button type="button" onClick={() => pushToast('warning', 'Guardian flagged for review')} className="rounded-[var(--r-pill)] border border-slate-700 bg-[#0f1625] px-3 py-1 text-[11px] font-semibold"><Flag className="mr-1 inline h-3.5 w-3.5" /> Flag</button>
                </div>
                {expandedId === guardian.id ? (
                  <div className="mt-2 rounded-[var(--r-sm)] border border-slate-700 bg-[#0f1625] p-3 text-xs text-slate-300">
                    <p>Email: {guardian.email}</p>
                    <p>Joined: {new Date(guardian.joinedAt).toLocaleDateString()}</p>
                    <p>Location: {guardian.location || 'Not set'}</p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </>
      ) : null}

      {tab === 'children' ? (
        <div className="mt-3 space-y-2">
          {childRows.map((child) => (
            <article key={child.id} className="rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{child.name}</p>
                  <p className="text-xs text-slate-400">{child.age} yrs • guardian {child.guardianId}</p>
                </div>
                <div className="text-right">
                  <Chip size="sm" variant={child.vaultScore >= 90 ? 'green' : 'pending'}>{child.vaultScore}% Vault</Chip>
                  <p className="mt-1 text-[11px] text-slate-400">{child.qrLinked ? 'QR Linked' : 'No QR'}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {tab === 'partners' ? (
        <div className="mt-3 space-y-2">
          {partnerRows.map((partner) => (
            <article key={partner.id} className="rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{partner.name}</p>
                  <p className="text-xs text-slate-400">{partner.type} • {partner.location}</p>
                </div>
                <Chip size="sm" variant={partner.active ? 'green' : 'pending'}>{partner.active ? 'Active' : 'Inactive'}</Chip>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[var(--r-md)] border border-slate-700 bg-[#111a2b] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </article>
  );
}