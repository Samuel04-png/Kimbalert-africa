import React, { useMemo } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';

export default function AdminNotificationsPage() {
  const navigate = useNavigate();
  const { currentUser, notifications, markAllNotificationsRead, markNotificationRead } = useAppContext();

  const mine = useMemo(
    () => notifications.filter((item) => item.userId === currentUser.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notifications, currentUser.id],
  );

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100 px-4 pb-24 pt-4 md:px-6 md:pb-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold">Notifications</h1>
          <p className="text-sm text-slate-400">System announcements and alert updates</p>
        </div>
        <button type="button" onClick={markAllNotificationsRead} className="rounded-[var(--r-pill)] border border-brand-orange/40 bg-brand-orange/10 px-3 py-1.5 text-xs font-semibold text-brand-orange">
          Mark all as read
        </button>
      </header>

      <div className="mt-3 space-y-2">
        {mine.length ? (
          mine.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                markNotificationRead(item.id);
                if (item.route) navigate(item.route);
              }}
              className="flex w-full items-start gap-3 rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-3 text-left"
            >
              <span className={`mt-0.5 grid h-9 w-9 place-items-center rounded-[var(--r-pill)] ${toneIcon(item.type)}`}>
                <Bell className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{item.title}</p>
                  {!item.read ? <span className="h-2.5 w-2.5 rounded-[var(--r-pill)] bg-brand-orange" /> : null}
                </div>
                <p className="text-xs text-slate-400">{item.body}</p>
                <p className="mt-1 text-[11px] text-slate-500">{timeAgo(item.createdAt)}</p>
              </div>
            </button>
          ))
        ) : (
          <section className="rounded-[var(--r-lg)] border border-slate-700 bg-[#111a2b] p-6 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-[var(--r-pill)] bg-[#0f1625] text-slate-400">
              <Bell className="h-6 w-6" />
            </div>
            <h2 className="mt-3 font-display text-2xl font-bold">You're all caught up</h2>
            <p className="text-sm text-slate-400">No notifications right now.</p>
          </section>
        )}
      </div>
    </div>
  );
}

function toneIcon(type: string) {
  if (type === 'success') return 'bg-brand-green/20 text-brand-green';
  if (type === 'error') return 'bg-red-500/20 text-red-300';
  if (type === 'warning') return 'bg-amber-500/20 text-amber-300';
  return 'bg-brand-orange/20 text-brand-orange';
}

function timeAgo(value: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}