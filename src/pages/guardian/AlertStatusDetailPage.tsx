import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import AlertStatusShared from './AlertStatusShared';

export default function AlertStatusDetailPage() {
  const { id } = useParams();
  return (
    <div className="guardian-screen animate-page-in">
      <header className="flex items-center justify-between">
        <Link to="/guardian/activity" className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-200 bg-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="rounded-[var(--r-pill)] border border-red-500/30 bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-600">
          Alert Detail
        </span>
      </header>
      <AlertStatusShared reportId={id} />
    </div>
  );
}
