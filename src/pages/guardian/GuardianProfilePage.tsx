import React, { useMemo, useState } from 'react';
import { ChevronRight, Globe2, LogOut, Shield, Trash2, UserCircle2, UserPen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import BottomSheet from '../../components/common/BottomSheet';
import ProgressRing from '../../components/common/ProgressRing';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import Watermark from '../../components/common/Watermark';

const languages = ['English', 'French', 'Swahili', 'Yoruba', 'Zulu'];

export default function GuardianProfilePage() {
  const navigate = useNavigate();
  const { currentUser, children, reports, pushToast } = useAppContext();
  const [language, setLanguage] = useState('English');
  const [sms, setSms] = useState(true);
  const [whatsApp, setWhatsApp] = useState(true);
  const [sheet, setSheet] = useState<'logout' | 'delete' | 'prefs' | null>(null);

  const myChildren = useMemo(() => children.filter((child) => child.guardianId === currentUser.id), [children, currentUser.id]);
  const myReports = useMemo(() => reports.filter((report) => report.guardianId === currentUser.id), [reports, currentUser.id]);

  const completion = useMemo(() => {
    let score = 45;
    if (currentUser.email) score += 10;
    if (currentUser.phone) score += 10;
    if (myChildren.length) score += 15;
    if (myChildren.every((child) => child.vaultScore >= 90)) score += 10;
    if (currentUser.location) score += 10;
    return Math.min(100, score);
  }, [currentUser.email, currentUser.phone, currentUser.location, myChildren]);

  const badges = useMemo(
    () => [
      {
        id: 'vault',
        label: 'Vault Guardian',
        unlocked: myChildren.length > 0 && myChildren.every((child) => child.vaultScore >= 90),
      },
      {
        id: 'veteran',
        label: 'Alert Veteran',
        unlocked: myReports.some((report) => report.status === 'found' || report.status === 'closed'),
      },
      {
        id: 'helper',
        label: 'Community Helper',
        unlocked: false,
      },
    ],
    [myChildren, myReports],
  );

  const logout = () => {
    setSheet(null);
    navigate('/login');
  };

  return (
    <div className="guardian-screen animate-page-in pb-4">
      <header className="guardian-panel p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={currentUser.avatarUrl || 'https://picsum.photos/seed/profile/300/300'}
              alt={currentUser.fullName}
              className="h-16 w-16 rounded-[var(--r-pill)] object-cover border border-slate-200"
            />
            <button
              type="button"
              onClick={() => navigate('/guardian/profile/edit')}
              className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-[var(--r-pill)] bg-brand-orange text-white"
            >
              <UserPen className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate guardian-page-title">{currentUser.fullName}</h1>
            <p className="type-caption">{currentUser.phone} • {currentUser.email}</p>
            <span className="mt-1 inline-flex rounded-[var(--r-pill)] border border-brand-green/20 bg-brand-green-light px-2 py-1 type-caption font-semibold text-brand-green">
              Verified Guardian
            </span>
          </div>

          <ProgressRing value={completion} size={72} stroke={8} label="Profile" />
        </div>
      </header>

      <section className="grid grid-cols-3 gap-2">
        <StatCard label="Children" value={String(myChildren.length)} />
        <StatCard label="Reports" value={String(myReports.length)} />
        <StatCard label="Drills" value="3" />
      </section>

      <section className="guardian-card p-4">
        <h2 className="guardian-section-title">Menu</h2>
        <div className="mt-2 space-y-2">
          <MenuRow label="My Account" onClick={() => navigate('/guardian/profile/edit')} />
          <MenuRow label="Community" onClick={() => navigate('/guardian/activity')} />
          <MenuRow label="Settings" onClick={() => setSheet('prefs')} />
        </div>
      </section>

      <section className="guardian-card p-4">
        <h2 className="guardian-section-title">Referral</h2>
        <p className="mt-1 text-sm text-text-muted">Invite a neighbour to KimbAlert.</p>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText('KIMB-INVITE-882910');
            pushToast('success', 'Referral code copied');
          }}
          className="mt-3 rounded-[var(--r-pill)] bg-brand-orange px-4 py-2 text-xs font-bold text-white"
        >
          Copy Invite Code
        </button>
      </section>

      <section className="guardian-card p-4">
        <h2 className="guardian-section-title">Badges</h2>
        <div className="mt-2 grid gap-2">
          {badges.map((badge) => (
            <article key={badge.id} className={`rounded-[var(--r-sm)] border px-3 py-2 text-sm ${badge.unlocked ? 'border-brand-green/25 bg-brand-green-light text-brand-green' : 'border-slate-200 bg-bg-primary text-text-muted'}`}>
              {badge.unlocked ? 'Unlocked' : 'Locked'} • {badge.label}
            </article>
          ))}
        </div>
      </section>

      <section className="guardian-card p-4">
        <h2 className="guardian-section-title">Preferences</h2>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-text-main">SMS Alerts</p>
            <ToggleSwitch checked={sms} onChange={setSms} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-text-main">WhatsApp Alerts</p>
            <ToggleSwitch checked={whatsApp} onChange={setWhatsApp} />
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-text-main">Language</span>
            <select value={language} onChange={(event) => setLanguage(event.target.value)} className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2.5 text-sm">
              {languages.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setSheet('logout')} className="rounded-[var(--r-pill)] border border-red-500/30 bg-red-50 py-3 text-sm font-semibold text-red-600">
          <LogOut className="mr-1 inline h-4 w-4" /> Log Out
        </button>
        <button type="button" onClick={() => setSheet('delete')} className="rounded-[var(--r-pill)] border border-slate-300 bg-white py-3 text-sm font-semibold text-text-main">
          <Trash2 className="mr-1 inline h-4 w-4" /> Delete Account
        </button>
      </div>

      <BottomSheet open={sheet === 'logout'} onClose={() => setSheet(null)} title="Log Out" snap="40">
        <p className="text-sm text-text-muted">Are you sure you want to log out of your guardian account?</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setSheet(null)} className="rounded-[var(--r-pill)] border border-slate-300 bg-white py-2.5 text-sm font-semibold text-text-main">Cancel</button>
          <button type="button" onClick={logout} className="rounded-[var(--r-pill)] bg-red-500 py-2.5 text-sm font-bold text-white">Log Out</button>
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === 'delete'} onClose={() => setSheet(null)} title="Delete Account" snap="40">
        <p className="text-sm text-text-muted">This will permanently remove profile access. Child records are archived per policy.</p>
        <button
          type="button"
          onClick={() => {
            setSheet(null);
            pushToast('warning', 'Deletion request submitted');
          }}
          className="mt-4 w-full rounded-[var(--r-pill)] bg-red-500 py-2.5 text-sm font-bold text-white"
        >
          Request Deletion
        </button>
      </BottomSheet>

      <BottomSheet open={sheet === 'prefs'} onClose={() => setSheet(null)} title="Notification Preferences" snap="70">
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2">
            <p className="text-sm text-text-main">SMS Alerts</p>
            <ToggleSwitch checked={sms} onChange={setSms} />
          </div>
          <div className="flex items-center justify-between rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2">
            <p className="text-sm text-text-main">WhatsApp Alerts</p>
            <ToggleSwitch checked={whatsApp} onChange={setWhatsApp} />
          </div>
          <div className="flex items-center justify-between rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2">
            <p className="text-sm text-text-main">Biometric Login</p>
            <ToggleSwitch checked={true} onChange={() => undefined} />
          </div>
          <button type="button" onClick={() => setSheet(null)} className="w-full rounded-[var(--r-pill)] bg-brand-orange py-2.5 text-sm font-bold text-white">Done</button>
        </div>
      </BottomSheet>

      <Watermark className="self-end pb-3 pr-3" />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[var(--r-md)] border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
      <p className="type-kicker">{label}</p>
      <p className="guardian-stat-value">{value}</p>
    </article>
  );
}

function MenuRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2.5 text-left">
      <span className="text-sm font-semibold text-text-main">{label}</span>
      <ChevronRight className="h-4 w-4 text-text-muted" />
    </button>
  );
}

