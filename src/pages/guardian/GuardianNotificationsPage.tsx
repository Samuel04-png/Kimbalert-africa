import React, { useMemo } from 'react';
import { ArrowLeft, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import EmptyState from '../../components/common/EmptyState';

export default function GuardianNotificationsPage() {
  const navigate = useNavigate();
  const { currentUser, notifications, markAllNotificationsRead, markNotificationRead } = useAppContext();

  const mine = useMemo(
    () => notifications.filter((item) => item.userId === currentUser.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notifications, currentUser.id],
  );

  return (
    <div className="guardian-screen animate-page-in pb-4">
      <header className="flex items-center justify-between">
        <Link to="/guardian/home" className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-200 bg-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={markAllNotificationsRead}
          className="rounded-[var(--r-pill)] border border-brand-orange/25 bg-brand-orange-light px-3 py-1.5 text-xs font-semibold text-brand-orange"
        >
          Mark all as read
        </button>
      </header>

      <section className="guardian-panel p-4">
        <h1 className="guardian-page-title">Notifications</h1>
        <p className="text-sm text-text-muted">Alert updates, confirmations and system notices.</p>
      </section>

      {mine.length ? (
        <div className="space-y-2">
          {mine.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                markNotificationRead(item.id);
                if (item.route) navigate(item.route);
              }}
              className="flex w-full items-start gap-3 rounded-[var(--r-lg)] border border-slate-200 bg-white p-3 text-left shadow-sm card-interactive"
            >
              <span className={`mt-0.5 grid h-9 w-9 place-items-center rounded-[var(--r-pill)] ${toneIcon(item.type)}`}>
                <Bell className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-text-main">{item.title}</p>
                  {!item.read ? <span className="h-2.5 w-2.5 rounded-[var(--r-pill)] bg-brand-orange" /> : null}
                </div>
                <p className="mt-0.5 text-xs text-text-muted">{item.body}</p>
                <p className="mt-1 text-[11px] text-text-muted">{timeAgo(item.createdAt)}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState icon="🔔" title="You're all caught up" body="No unread notifications right now." />
      )}
    </div>
  );
}

function toneIcon(type: string) {
  if (type === 'success') return 'bg-brand-green-light text-brand-green';
  if (type === 'error') return 'bg-red-50 text-red-600';
  if (type === 'warning') return 'bg-amber-50 text-amber-600';
  return 'bg-brand-orange-light text-brand-orange';
}

function timeAgo(value: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}


