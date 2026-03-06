import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Download, Printer, ScanLine, Share2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAppContext } from '../../app/AppContext';
import Chip from '../../components/common/Chip';
import BottomSheet from '../../components/common/BottomSheet';

export default function QrBraceletPage() {
  const [params] = useSearchParams();
  const startId = params.get('child');
  const { currentUser, children, pushToast, addOrder } = useAppContext();
  const [selectedChildId, setSelectedChildId] = useState(startId ?? '');
  const [scanMode, setScanMode] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    name: currentUser.fullName || '',
    phone: currentUser.phone || '',
    address: '',
    quantity: 1,
  });
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const mine = useMemo(() => children.filter((child) => child.guardianId === currentUser.id), [children, currentUser.id]);
  const activeId = selectedChildId || mine[0]?.id || '';
  const child = mine.find((entry) => entry.id === activeId) ?? mine[0] ?? null;

  useEffect(() => {
    if (scanMode) {
      if (!scannerRef.current) {
        scannerRef.current = new Html5QrcodeScanner(
          'qr-reader',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );
        scannerRef.current.render(
          (decodedText) => {
            pushToast('success', 'QR Code Scanned', `Bracelet ID: ${decodedText}`);
            // If we found a matching child, switch to them; in reality, this would initiate a report
            const matchedChild = children.find(c => c.qrBraceletId === decodedText);
            if (matchedChild) {
              setSelectedChildId(matchedChild.id);
              pushToast('info', 'Found child profile', matchedChild.name);
            }
            setScanMode(false); // turn off after successful scan
          },
          (errorMessage) => {
            // parse errors are normal (no qr code visible), just ignore
          }
        );
      }
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [scanMode, pushToast, children]);

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

  const submitOrder = async () => {
    if (!orderForm.address.trim()) {
      pushToast('error', 'Please provide a delivery address');
      return;
    }

    await addOrder({
      guardianId: currentUser.id,
      childId: child.id,
      guardianName: orderForm.name,
      phone: orderForm.phone,
      address: orderForm.address,
      quantity: orderForm.quantity,
    });

    setOrderOpen(false);
    pushToast('success', 'Order submitted to the Command Center.');
  };

  return (
    <div className="guardian-screen animate-page-in pb-4">
      <header className="flex flex-col gap-4 mb-4">
        <div className="flex items-center justify-between">
          <Link to="/guardian/children" className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-200 bg-white">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="guardian-page-title">QR Bracelet</h1>
          <button onClick={() => setScanMode((prev) => !prev)} className={`grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border ${scanMode ? 'bg-brand-orange text-white' : 'border-brand-orange/20 bg-brand-orange-light text-brand-orange'}`}>
            <ScanLine className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      {scanMode ? (
        <section className="mb-4 overflow-hidden rounded-[var(--r-lg)] border border-brand-orange/25 bg-white shadow-sm">
          <div className="p-3 bg-brand-orange-light text-brand-orange text-sm font-semibold flex justify-between items-center">
            <span>Scan Bracelet or Tag</span>
            <button onClick={() => setScanMode(false)} className="text-xs underline">Close</button>
          </div>
          <div id="qr-reader" className="w-full"></div>
        </section>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-4">
        {mine.map((entry) => (
          <Chip key={entry.id} variant={entry.id === child.id ? 'orange' : 'neutral'} selected={entry.id === child.id} onClick={() => setSelectedChildId(entry.id)}>
            {entry.name}
          </Chip>
        ))}
      </div>

      <section className="guardian-panel p-5 text-center mb-4">
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

        <p className="mt-3 type-muted text-sm px-2">When scanned, this code alerts the task force and links to the secure vault profile.</p>
      </section>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <button onClick={() => setShareOpen(true)} className="rounded-[var(--r-pill)] bg-brand-orange py-3 text-sm font-bold text-white shadow-orange"><Share2 className="mr-1 inline h-4 w-4" /> Share</button>
        <button onClick={() => window.print()} className="rounded-[var(--r-pill)] border border-slate-300 bg-white py-3 text-sm font-semibold text-text-main"><Printer className="mr-1 inline h-4 w-4" /> Print</button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={downloadImage} className="rounded-[var(--r-pill)] border border-slate-300 bg-white py-2.5 text-xs font-semibold text-text-main"><Download className="mr-1 inline h-3.5 w-3.5" /> Download</button>
        <button onClick={() => setOrderOpen(true)} className="rounded-[var(--r-pill)] border border-brand-orange/25 bg-brand-orange-light py-2.5 text-xs font-semibold text-brand-orange">Order Physical Tag</button>
      </div>

      <section className="guardian-card p-4 mb-4">
        <h2 className="guardian-section-title">Scan History</h2>
        <div className="mt-2 space-y-2 text-sm text-text-muted">
          <article className="rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2 flex justify-between">
            <span>Johannesburg CBD</span>
            <span className="text-xs">2h ago</span>
          </article>
          <article className="rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2 flex justify-between">
            <span>Sandton</span>
            <span className="text-xs">Yesterday</span>
          </article>
        </div>
      </section>

      <BottomSheet open={shareOpen} onClose={() => setShareOpen(false)} title="Share QR" snap="40">
        <div className="space-y-2 text-sm text-text-muted p-2">
          <button onClick={() => pushToast('success', 'QR link copied')} className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-white px-3 py-3 text-left font-medium text-text-main hover:bg-slate-50 transition-colors">Copy link</button>
          <button onClick={() => pushToast('success', 'QR sent to emergency contacts')} className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-white px-3 py-3 text-left font-medium text-text-main hover:bg-slate-50 transition-colors">Share to emergency contacts</button>
          <button onClick={() => pushToast('info', 'QR shared to WhatsApp')} className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-white px-3 py-3 text-left font-medium text-text-main hover:bg-slate-50 transition-colors">Share to WhatsApp</button>
        </div>
      </BottomSheet>

      <BottomSheet open={orderOpen} onClose={() => setOrderOpen(false)} title="Order Physical Bracelet" snap="70">
        <div className="space-y-3 p-2 text-sm text-text-main">
          <p className="text-text-muted">Fill out your delivery details to order a durable, waterproof physical bracelet linked to {child.name}'s profile. Your order will be sent to our Command Center for processing.</p>
          <label className="block">
            <span className="mb-1.5 block font-semibold">Guardian Name</span>
            <input value={orderForm.name} onChange={(e) => setOrderForm(prev => ({ ...prev, name: e.target.value }))} className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2" />
          </label>
          <label className="block">
            <span className="mb-1.5 block font-semibold">Contact Phone</span>
            <input value={orderForm.phone} onChange={(e) => setOrderForm(prev => ({ ...prev, phone: e.target.value }))} className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2" />
          </label>
          <label className="block">
            <span className="mb-1.5 block font-semibold">Delivery Address</span>
            <textarea rows={2} value={orderForm.address} onChange={(e) => setOrderForm(prev => ({ ...prev, address: e.target.value }))} placeholder="Full street address..." className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2" />
          </label>
          <label className="block">
            <span className="mb-1.5 block font-semibold">Quantity</span>
            <input type="number" min="1" value={orderForm.quantity} onChange={(e) => setOrderForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))} className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2" />
          </label>
          <button onClick={() => void submitOrder()} className="mt-2 w-full rounded-[var(--r-pill)] bg-brand-orange py-3 font-bold text-white shadow-orange">
            Submit Order
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}


