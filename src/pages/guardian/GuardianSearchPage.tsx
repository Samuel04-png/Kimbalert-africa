import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import EmptyState from '../../components/common/EmptyState';

const key = 'guardian_recent_searches';

export default function GuardianSearchPage() {
  const navigate = useNavigate();
  const { currentUser, children, communityAlerts, resources } = useAppContext();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      setRecent(JSON.parse(raw) as string[]);
    } catch {
      // ignore parse errors
    }
  }, []);

  const saveRecent = (value: string) => {
    if (!value.trim()) return;
    const next = [value, ...recent.filter((item) => item !== value)].slice(0, 6);
    setRecent(next);
    localStorage.setItem(key, JSON.stringify(next));
  };

  const mine = useMemo(
    () => children.filter((child) => child.guardianId === currentUser.id),
    [children, currentUser.id],
  );

  const q = query.trim().toLowerCase();
  const childResults = mine.filter((child) => `${child.name} ${child.qrBraceletId}`.toLowerCase().includes(q));
  const alertResults = communityAlerts.filter((alert) => `${alert.firstName} ${alert.location}`.toLowerCase().includes(q));
  const resourceResults = resources.filter((resource) => `${resource.name} ${resource.type} ${resource.address}`.toLowerCase().includes(q));

  const hasResults = !q || childResults.length || alertResults.length || resourceResults.length;

  return (
    <div className="guardian-screen animate-page-in pb-4">
      <header className="flex items-center gap-2">
        <Link to="/guardian/home" className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-200 bg-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="guardian-page-title">Search</h1>
      </header>

      <section className="rounded-[var(--r-pill)] border border-slate-200 bg-white px-4 py-2.5 flex items-center gap-2">
        <Search className="h-4 w-4 text-text-muted" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            saveRecent(event.target.value.trim());
          }}
          placeholder="Children, alerts, resources"
          className="w-full bg-transparent text-sm text-text-main placeholder:text-text-muted focus:outline-none"
        />
      </section>

      {!query.trim() && recent.length ? (
        <section className="guardian-card p-4">
          <h2 className="guardian-section-title">Recent Searches</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {recent.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setQuery(item)}
                className="rounded-[var(--r-pill)] border border-slate-300 bg-bg-primary px-3 py-1.5 text-xs font-semibold text-text-main"
              >
                {item}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {query.trim() ? (
        hasResults ? (
          <div className="space-y-3">
            <ResultGroup title="Your Children" count={childResults.length}>
              {childResults.map((child) => (
                <button key={child.id} type="button" onClick={() => navigate(`/guardian/children/${child.id}`)} className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2 text-left text-sm text-text-main">
                  {child.name} • {child.qrBraceletId}
                </button>
              ))}
            </ResultGroup>

            <ResultGroup title="Community Alerts" count={alertResults.length}>
              {alertResults.map((alert) => (
                <button key={alert.id} type="button" onClick={() => navigate(`/guardian/activity/${alert.id}`)} className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2 text-left text-sm text-text-main">
                  {alert.firstName} • {alert.location}
                </button>
              ))}
            </ResultGroup>

            <ResultGroup title="Resources" count={resourceResults.length}>
              {resourceResults.map((resource) => (
                <button key={resource.id} type="button" onClick={() => navigate('/guardian/resources')} className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2 text-left text-sm text-text-main">
                  {resource.name} • {resource.type}
                </button>
              ))}
            </ResultGroup>
          </div>
        ) : (
          <EmptyState icon="🔍" title="Nothing found" body="Try different words or fewer filters." />
        )
      ) : null}
    </div>
  );
}

function ResultGroup({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="guardian-card p-4">
      <h2 className="guardian-section-title">{title}</h2>
      <p className="text-xs text-text-muted">{count} results</p>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

