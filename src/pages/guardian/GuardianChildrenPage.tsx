import React, { useMemo, useState } from 'react';
import { MoreVertical, Plus, Search, Share2, TriangleAlert, UserPen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import Chip from '../../components/common/Chip';
import BottomSheet from '../../components/common/BottomSheet';
import EmptyState from '../../components/common/EmptyState';
import { AvatarStatus } from '../../components/common/AvatarStatus';

export default function GuardianChildrenPage() {
  const navigate = useNavigate();
  const { currentUser, children } = useAppContext();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'complete' | 'missing_qr'>('all');
  const [sort, setSort] = useState<'name' | 'age' | 'recent'>('recent');
  const [activeChildId, setActiveChildId] = useState<string | null>(null);

  const guardianChildren = useMemo(() => children.filter((child) => child.guardianId === currentUser.id), [children, currentUser.id]);

  const result = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = guardianChildren.filter((child) => {
      if (filter === 'complete') return child.vaultScore >= 90;
      if (filter === 'missing_qr') return !child.qrLinked;
      return true;
    });

    if (q) {
      list = list.filter((child) => `${child.name} ${child.qrBraceletId}`.toLowerCase().includes(q));
    }

    if (sort === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sort === 'age') {
      list = [...list].sort((a, b) => b.age - a.age);
    }
    if (sort === 'recent') {
      list = [...list].sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    }

    return list;
  }, [guardianChildren, filter, query, sort]);

  const activeChild = result.find((child) => child.id === activeChildId) ?? null;

  return (
    <div className="guardian-screen animate-page-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="guardian-page-title">My Children</h1>
          <p className="text-sm text-text-muted">All profiles in your secure registry</p>
        </div>
        <Link to="/guardian/children/add" className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] bg-brand-orange text-white shadow-orange">
          <Plus className="h-5 w-5" />
        </Link>
      </header>

      <div className="rounded-[var(--r-pill)] border border-slate-200 bg-white px-4 py-2.5 flex items-center gap-2">
        <Search className="h-4 w-4 text-text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full bg-transparent text-sm text-text-main placeholder:text-text-muted focus:outline-none"
          placeholder="Search by name or QR"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip variant={filter === 'all' ? 'orange' : 'neutral'} selected={filter === 'all'} onClick={() => setFilter('all')}>All</Chip>
        <Chip variant={filter === 'complete' ? 'green' : 'neutral'} selected={filter === 'complete'} onClick={() => setFilter('complete')}>Complete Vault</Chip>
        <Chip variant={filter === 'missing_qr' ? 'pending' : 'neutral'} selected={filter === 'missing_qr'} onClick={() => setFilter('missing_qr')}>Missing QR</Chip>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip variant={sort === 'name' ? 'orange' : 'neutral'} selected={sort === 'name'} onClick={() => setSort('name')}>Name A-Z</Chip>
        <Chip variant={sort === 'age' ? 'orange' : 'neutral'} selected={sort === 'age'} onClick={() => setSort('age')}>Age</Chip>
        <Chip variant={sort === 'recent' ? 'orange' : 'neutral'} selected={sort === 'recent'} onClick={() => setSort('recent')}>Recently Added</Chip>
      </div>

      {result.length ? (
        <div className="grid grid-cols-2 gap-3">
          {result.map((child) => (
            <article key={child.id} className="group rounded-[var(--r-lg)] border border-slate-200 bg-white p-3 shadow-sm card-interactive">
              <div className="flex items-start justify-between gap-2">
                <button type="button" onClick={() => navigate(`/guardian/children/${child.id}`)} className="text-left">
                  <AvatarStatus src={child.photoUrls[0]} alt={child.name} size="lg" status={child.qrLinked ? 'online' : 'offline'} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChildId(child.id)}
                  className="rounded-[var(--r-pill)] border border-slate-200 p-1.5 text-slate-500"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              <button type="button" onClick={() => navigate(`/guardian/children/${child.id}`)} className="mt-2 text-left">
                <p className="font-semibold text-text-main">{child.name}</p>
                <p className="text-xs text-text-muted">{child.age} yrs • {child.gender}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Chip size="sm" variant="neutral">{child.medical.bloodType}</Chip>
                  <Chip size="sm" variant={child.qrLinked ? 'green' : 'pending'}>{child.qrLinked ? 'QR Linked' : 'No QR'}</Chip>
                </div>
                <p className="mt-2 text-[11px] text-text-muted">{child.location.schoolName}</p>
                <p className="text-[11px] text-text-muted">Updated {timeAgo(child.lastUpdated)}</p>
              </button>

              <div className="mt-2 rounded-[var(--r-pill)] bg-slate-100 h-2 overflow-hidden">
                <div className={`h-full ${child.vaultScore >= 80 ? 'bg-brand-green' : child.vaultScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${child.vaultScore}%` }} />
              </div>
              <p className="mt-1 text-[11px] font-semibold text-text-muted">Safety completeness {child.vaultScore}%</p>

              {!child.qrLinked || child.vaultScore < 70 ? (
                <p className="mt-1 text-[11px] font-semibold text-red-500">Incomplete profile</p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="👶"
          title="Register your first child"
          body="No children match your filters yet."
          action={<Link to="/guardian/children/add" className="rounded-[var(--r-pill)] bg-brand-orange px-4 py-2 text-xs font-bold text-white">Add Child</Link>}
        />
      )}

      <BottomSheet open={Boolean(activeChild)} onClose={() => setActiveChildId(null)} title={activeChild?.name ?? 'Child Actions'} snap="40">
        {activeChild ? (
          <div className="space-y-2">
            <Action onClick={() => navigate(`/guardian/children/${activeChild.id}`)} icon={<UserPen className="h-4 w-4" />} label="View" />
            <Action onClick={() => navigate(`/guardian/children/${activeChild.id}/edit`)} icon={<UserPen className="h-4 w-4" />} label="Edit" />
            <Action onClick={() => navigate(`/guardian/alert?child=${activeChild.id}`)} icon={<TriangleAlert className="h-4 w-4" />} label="Report Missing" />
            <Action onClick={() => navigate(`/guardian/alert/qr?child=${activeChild.id}`)} icon={<Share2 className="h-4 w-4" />} label="Share QR" />
          </div>
        ) : null}
      </BottomSheet>
    </div>
  );
}

function Action({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2 rounded-[var(--r-sm)] border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-text-main">
      {icon}
      {label}
    </button>
  );
}

function timeAgo(value: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}



