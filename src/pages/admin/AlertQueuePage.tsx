import React, { useMemo, useState } from 'react';
import { Download, RefreshCw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import Chip from '../../components/common/Chip';
import DataTable, { DataTableColumn } from '../../components/common/DataTable';

type StatusFilter = 'all' | 'active' | 'pending' | 'found' | 'closed';
type SortKey = 'newest' | 'oldest' | 'radius' | 'notified';

interface Row {
  id: string;
  childName: string;
  location: string;
  time: string;
  radius: number;
  notified: number;
  status: string;
  elapsed: string;
}

export default function AlertQueuePage() {
  const navigate = useNavigate();
  const { reports, children, pushToast } = useAppContext();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [mapView, setMapView] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const rows = useMemo<Row[]>(() => {
    const q = query.trim().toLowerCase();
    let list = reports
      .filter((report) => (status === 'all' ? true : report.status === status))
      .map((report) => {
        const child = children.find((entry) => entry.id === report.childId);
        return {
          id: report.id,
          childName: child?.name ?? report.childId,
          location: report.lastSeenLocation.address,
          time: report.startedAt,
          radius: report.currentRadiusKm,
          notified: report.notifiedCount,
          status: report.status,
          elapsed: elapsed(report.startedAt),
        };
      });

    if (q) {
      list = list.filter((row) => `${row.id} ${row.childName} ${row.location}`.toLowerCase().includes(q));
    }

    if (sort === 'newest') list = [...list].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    if (sort === 'oldest') list = [...list].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    if (sort === 'radius') list = [...list].sort((a, b) => b.radius - a.radius);
    if (sort === 'notified') list = [...list].sort((a, b) => b.notified - a.notified);

    return list;
  }, [reports, children, query, status, sort]);

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (row) => <span className="font-mono text-xs">{row.id.toUpperCase()}</span>,
    },
    {
      key: 'child',
      header: 'Child',
      render: (row) => <span className="font-semibold">{row.childName}</span>,
    },
    {
      key: 'location',
      header: 'Location',
      render: (row) => <span className="text-xs text-slate-300">{row.location}</span>,
    },
    {
      key: 'time',
      header: 'Time',
      render: (row) => (
        <div>
          <p className="text-xs text-slate-300">{timeAgo(row.time)}</p>
          <p className={`text-[11px] ${warningElapsed(row.elapsed) ? 'text-amber-300' : 'text-slate-400'}`}>{row.elapsed} active</p>
        </div>
      ),
    },
    {
      key: 'radius',
      header: 'Radius',
      render: (row) => <span>{row.radius}km</span>,
    },
    {
      key: 'notified',
      header: 'Notified',
      render: (row) => <span>{row.notified.toLocaleString()}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <span className={`rounded-[var(--r-pill)] px-2 py-1 text-[10px] font-bold ${statusClass(row.status)}`}>{row.status.toUpperCase()}</span>,
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/admin/alerts/${row.id}`)}
          className="rounded-[var(--r-pill)] bg-brand-orange px-3 py-1 text-[11px] font-bold text-white"
        >
          View
        </button>
      ),
    },
  ];

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const refresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    setRefreshing(false);
    pushToast('success', 'Queue refreshed');
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100 px-4 pb-24 pt-4 md:px-6 md:pb-8">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-display text-4xl font-bold">Alert Queue</h1>
          <p className="text-sm text-slate-400">Operational review and dispatch</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void refresh()} className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-700 bg-[#111a2b]">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" onClick={() => pushToast('success', 'CSV export ready')} className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-700 bg-[#111a2b]">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </header>

      <section className="mt-3 rounded-[var(--r-pill)] border border-slate-700 bg-[#111a2b] px-4 py-2.5 flex items-center gap-2">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search child name, location, ID"
          className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
        />
      </section>

      <div className="mt-3 flex flex-wrap gap-2">
        <Chip variant={status === 'all' ? 'orange' : 'navy'} selected={status === 'all'} onClick={() => setStatus('all')}>All</Chip>
        <Chip variant={status === 'active' ? 'danger' : 'navy'} selected={status === 'active'} onClick={() => setStatus('active')}>Active</Chip>
        <Chip variant={status === 'pending' ? 'pending' : 'navy'} selected={status === 'pending'} onClick={() => setStatus('pending')}>Pending</Chip>
        <Chip variant={status === 'found' ? 'green' : 'navy'} selected={status === 'found'} onClick={() => setStatus('found')}>Found</Chip>
        <Chip variant={status === 'closed' ? 'navy' : 'navy'} selected={status === 'closed'} onClick={() => setStatus('closed')}>Closed</Chip>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <Chip variant={sort === 'newest' ? 'orange' : 'navy'} selected={sort === 'newest'} onClick={() => setSort('newest')}>Newest</Chip>
        <Chip variant={sort === 'oldest' ? 'orange' : 'navy'} selected={sort === 'oldest'} onClick={() => setSort('oldest')}>Oldest</Chip>
        <Chip variant={sort === 'radius' ? 'orange' : 'navy'} selected={sort === 'radius'} onClick={() => setSort('radius')}>Radius</Chip>
        <Chip variant={sort === 'notified' ? 'orange' : 'navy'} selected={sort === 'notified'} onClick={() => setSort('notified')}>Notified</Chip>
        <button type="button" onClick={() => setMapView((prev) => !prev)} className="rounded-[var(--r-pill)] border border-slate-700 bg-[#111a2b] px-3 py-1.5 text-xs font-semibold">
          {mapView ? 'Table View' : 'Map View'}
        </button>
      </div>

      {selected.length ? (
        <section className="mt-3 rounded-[var(--r-md)] border border-brand-orange/35 bg-brand-orange/10 p-3">
          <p className="text-xs text-brand-orange">{selected.length} selected</p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => pushToast('info', 'Broadcast update sent to selected alerts')} className="rounded-[var(--r-pill)] bg-brand-orange px-3 py-1.5 text-xs font-bold text-white">Broadcast Update</button>
            <button type="button" onClick={() => pushToast('success', 'Selected rows exported')} className="rounded-[var(--r-pill)] border border-brand-orange px-3 py-1.5 text-xs font-semibold text-brand-orange">Export Selected</button>
          </div>
        </section>
      ) : null}

      {mapView ? (
        <section className="mt-3 h-64 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(232,98,42,0.2),transparent_30%)]" />
          <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-slate-300">Map view placeholder with active alert pins</p>
        </section>
      ) : (
        <section className="mt-3">
          <DataTable rows={rows} columns={columns} selected={selected} onToggle={toggleSelect} />
        </section>
      )}
    </div>
  );
}

function statusClass(status: string) {
  if (status === 'active') return 'border border-red-500/40 bg-red-500/20 text-red-300';
  if (status === 'pending') return 'border border-amber-500/40 bg-amber-500/20 text-amber-300';
  if (status === 'found') return 'border border-brand-green/40 bg-brand-green/20 text-brand-green';
  return 'border border-slate-500/40 bg-slate-500/20 text-slate-300';
}

function timeAgo(value: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

function elapsed(value: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function warningElapsed(value: string) {
  const parts = value.split('h');
  const hour = Number(parts[0].trim());
  return Number.isFinite(hour) && hour >= 4;
}