import React, { useMemo, useState } from 'react';
import { ArrowLeft, Camera, Download, Printer, QrCode, ScanLine, Share2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import Chip from '../../components/common/Chip';
import BottomSheet from '../../components/common/BottomSheet';

export default function QrBraceletPage() {
  const [params] = useSearchParams();
  const startId = params.get('child');
  const { currentUser, children, pushToast } = useAppContext();
  const [selectedChildId, setSelectedChildId] = useState(startId ?? '');
  const [scanMode, setScanMode] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const mine = useMemo(() => children.filter((child) => child.guardianId === currentUser.id), [children, currentUser.id]);
  const activeId = selectedChildId || mine[0]?.id || '';
  const child = mine.find((entry) => entry.id === activeId) ?? mine[0] ?? null;

  const modules = useMemo(() => {
    if (!child) return [] as boolean[];
    const seed = child.qrBraceletId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array.from({ length: 29 * 29 }, (_, index) => {
      const row = Math.floor(index / 29);
      const col = index % 29;
      const finder =
        (row < 7 && col < 7) ||
        (row < 7 && col > 21) ||
        (row > 21 && col < 7);
      if (finder) {
        const r = row % 7;
        const c = col % 7;
        return r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
      }
      return ((row * 31 + col * 17 + seed) % 7) < 3;
    });
  }, [child]);

  if (!child) {
    return <p className="text-sm text-text-muted">No child profiles available.</p>;
  }

  const downloadImage = () => {
    pushToast('success', 'QR bracelet image prepared for download');
  };

  return (
    <div className="guardian-screen animate-page-in pb-4">
      <header className="flex items-center justify-between">
        <Link to="/guardian/children" className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-200 bg-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="guardian-page-title">QR Bracelet</h1>
        <button onClick={() => setScanMode((prev) => !prev)} className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-brand-orange/20 bg-brand-orange-light text-brand-orange">
          <ScanLine className="h-4.5 w-4.5" />
        </button>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {mine.map((entry) => (
          <Chip key={entry.id} variant={entry.id === child.id ? 'orange' : 'neutral'} selected={entry.id === child.id} onClick={() => setSelectedChildId(entry.id)}>
            {entry.name}
          </Chip>
        ))}
      </div>

      <section className="guardian-panel p-5 text-center">
        <h2 className="guardian-page-title">{child.name}</h2>
        <p className="type-muted">Active profile</p>

        <div className="mx-auto mt-4 w-fit rounded-[var(--r-lg)] border border-slate-200 bg-[#f7f7f7] p-4 shadow-sm">
          <div className="qr-grid rounded-[var(--r-sm)] bg-white p-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(29, 7px)', gap: '1px' }}>
            {modules.map((filled, index) => (
              <span key={index} className={`${filled ? 'bg-black' : 'bg-white'} h-[7px] w-[7px]`} />
            ))}
          </div>
          <div className="mt-3 rounded-[var(--r-sm)] border border-brand-orange/20 bg-brand-orange-light px-3 py-2">
            <p className="type-kicker text-brand-orange">Bracelet ID</p>
            <p className="font-mono text-lg font-bold text-text-main">{child.qrBraceletId}</p>
          </div>
        </div>

        <p className="mt-3 type-muted">When scanned, this code alerts the task force and links to the secure vault profile.</p>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setShareOpen(true)} className="rounded-[var(--r-pill)] bg-brand-orange py-3 text-sm font-bold text-white shadow-orange"><Share2 className="mr-1 inline h-4 w-4" /> Share</button>
        <button onClick={() => window.print()} className="rounded-[var(--r-pill)] border border-slate-300 bg-white py-3 text-sm font-semibold text-text-main"><Printer className="mr-1 inline h-4 w-4" /> Print</button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={downloadImage} className="rounded-[var(--r-pill)] border border-slate-300 bg-white py-2.5 text-xs font-semibold text-text-main"><Download className="mr-1 inline h-3.5 w-3.5" /> Download</button>
        <button onClick={() => pushToast('info', 'Physical bracelet ordering coming soon')} className="rounded-[var(--r-pill)] border border-brand-orange/25 bg-brand-orange-light py-2.5 text-xs font-semibold text-brand-orange">Order Physical Bracelet</button>
      </div>

      <section className="guardian-card p-4">
        <h2 className="guardian-section-title">How it works</h2>
        <div className="mt-2 space-y-2 text-sm text-text-muted">
          <p>1. A scanner reads the bracelet code.</p>
          <p>2. KimbAlert checks active missing-child records.</p>
          <p>3. Task force receives immediate location and guardian context.</p>
        </div>
      </section>

      <section className="guardian-card p-4">
        <h2 className="guardian-section-title">Scan History</h2>
        <div className="mt-2 space-y-2 text-sm text-text-muted">
          <article className="rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2">Johannesburg CBD • 2h ago</article>
          <article className="rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2">Sandton • Yesterday</article>
          <article className="rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2">Soweto • 4 days ago</article>
        </div>
      </section>

      {scanMode ? (
        <section className="rounded-[var(--r-lg)] border border-brand-orange/25 bg-brand-orange-light p-4 text-sm text-brand-orange">
          <p className="font-semibold">Scan Mode Active</p>
          <p className="text-text-muted">Camera overlay placeholder for bracelet scanning UI.</p>
        </section>
      ) : null}

      <BottomSheet open={shareOpen} onClose={() => setShareOpen(false)} title="Share QR" snap="40">
        <div className="space-y-2 text-sm text-text-muted">
          <button onClick={() => pushToast('success', 'QR link copied')} className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-white px-3 py-2.5 text-left text-text-main">Copy link</button>
          <button onClick={() => pushToast('success', 'QR sent to emergency contacts')} className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-white px-3 py-2.5 text-left text-text-main">Share to emergency contacts</button>
          <button onClick={() => pushToast('info', 'QR shared to WhatsApp')} className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-white px-3 py-2.5 text-left text-text-main">Share to WhatsApp</button>
        </div>
      </BottomSheet>
    </div>
  );
}


