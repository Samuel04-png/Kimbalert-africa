import React, { useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, Edit3, FileText, MapPin, Printer, Share2, TriangleAlert } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import Chip from '../../components/common/Chip';
import ProgressRing from '../../components/common/ProgressRing';

export default function ChildProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { children, pushToast } = useAppContext();
  const [medicalOpen, setMedicalOpen] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);

  const child = useMemo(() => children.find((entry) => entry.id === id) ?? null, [children, id]);

  if (!child) {
    return (
      <div className="space-y-3">
        <Link to="/guardian/children" className="text-sm text-brand-orange">Back</Link>
        <p className="text-sm text-text-muted">Child profile not found.</p>
      </div>
    );
  }

  const activePhoto = child.photoUrls[photoIndex] ?? child.photoUrls[0];

  return (
    <div className="guardian-screen animate-page-in pb-20">
      <header className="flex items-center justify-between">
        <Link to="/guardian/children" className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-200 bg-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <button onClick={() => navigate(`/guardian/children/${child.id}/edit`)} className="rounded-[var(--r-pill)] border border-brand-orange/20 bg-brand-orange-light px-3 py-1.5 text-xs font-semibold text-brand-orange">
          <Edit3 className="mr-1 inline h-3.5 w-3.5" /> Edit
        </button>
      </header>

      <section className="guardian-panel p-4">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div>
            <div className="relative h-52 overflow-hidden rounded-[var(--r-lg)] border border-slate-200 bg-bg-primary">
              <img src={activePhoto} alt={child.name} className="h-full w-full object-cover" />
            </div>
            {child.photoUrls.length > 1 ? (
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {child.photoUrls.map((photo, index) => (
                  <button key={photo} type="button" onClick={() => setPhotoIndex(index)} className={`h-14 w-14 overflow-hidden rounded-[var(--r-sm)] border ${photoIndex === index ? 'border-brand-orange' : 'border-slate-200'}`}>
                    <img src={photo} alt={`${child.name}-${index}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
            <h1 className="mt-4 guardian-page-title">{child.name}</h1>
            <p className="text-sm text-text-muted">{child.age} yrs | {child.gender}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {child.languages.map((language) => (
                <Chip key={language} size="sm" variant="neutral">{language}</Chip>
              ))}
            </div>
          </div>
          <div className="grid place-items-center">
            <ProgressRing value={child.vaultScore} label="Vault Score" />
            <p className="mt-2 text-[11px] text-text-muted">Last updated {timeAgo(child.lastUpdated)}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Chip variant={child.vaultScore >= 90 ? 'green' : 'pending'}>{child.vaultScore >= 90 ? '? Complete' : '? Incomplete (tap to finish)'}</Chip>
          <Chip variant={child.qrLinked ? 'green' : 'pending'}>{child.qrLinked ? 'QR linked' : 'QR missing'}</Chip>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/guardian/children/${child.id}`);
              pushToast('success', 'Shareable profile link copied');
            }}
            className="rounded-[var(--r-pill)] border border-slate-300 bg-white py-2 text-xs font-semibold text-text-main"
          >
            <Share2 className="mr-1 inline h-3.5 w-3.5" /> Share profile
          </button>
          <button type="button" onClick={() => window.print()} className="rounded-[var(--r-pill)] border border-slate-300 bg-white py-2 text-xs font-semibold text-text-main">
            <Printer className="mr-1 inline h-3.5 w-3.5" /> Print profile
          </button>
        </div>
      </section>

      <section className="guardian-card p-4">
        <button type="button" onClick={() => setMedicalOpen((prev) => !prev)} className="flex w-full items-center justify-between">
          <h2 className="guardian-section-title">Medical</h2>
          <ChevronDown className={`h-4 w-4 text-text-muted transition-[var(--transition-fast)] ${medicalOpen ? 'rotate-180' : ''}`} />
        </button>
        {medicalOpen ? (
          <div className="mt-3 space-y-2 animate-fade-in">
            <p className="text-sm text-text-main">Blood Type: {child.medical.bloodType}</p>
            <p className="text-sm text-text-main">Conditions: {child.medical.conditions.join(', ') || 'None'}</p>
            <p className="text-sm text-text-main">Medications: {child.medical.medications.join(', ') || 'None'}</p>
            <p className="text-sm text-text-main">Allergies: {child.medical.allergies.join(', ') || 'None'}</p>
            <p className="text-sm text-text-main">Doctor: {child.medical.doctorPhone || 'Not added'}</p>
          </div>
        ) : null}
      </section>

      <section className="guardian-card p-4">
        <h2 className="guardian-section-title">Location</h2>
        <p className="text-sm text-text-muted">{child.location.schoolName}</p>
        <div className="mt-3 h-32 rounded-[var(--r-md)] border border-slate-200 bg-[radial-gradient(circle_at_20%_20%,#ffe9de,transparent_40%),#fff] relative">
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[var(--r-pill)] bg-brand-orange px-2 py-1 text-[10px] font-bold text-white">Safe zone</span>
        </div>
        <p className="mt-2 text-xs text-text-muted">{child.location.address}</p>
      </section>

      <section className="guardian-card p-4">
        <h2 className="guardian-section-title">QR Bracelet</h2>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-text-muted">{child.qrBraceletId}</p>
          <Link to={`/guardian/alert/qr?child=${child.id}`} className="rounded-[var(--r-pill)] bg-brand-orange px-3 py-1.5 text-xs font-semibold text-white">View Full</Link>
        </div>
      </section>

      <section className="rounded-[var(--r-lg)] border border-slate-200 bg-slate-50 p-4 shadow-sm">
        <h2 className="font-display text-2xl font-bold text-slate-400">Documents</h2>
        <p className="text-xs text-slate-400">Future module — secure uploads and official records.</p>
        <button type="button" disabled className="mt-3 rounded-[var(--r-pill)] border border-slate-300 px-3 py-1.5 text-xs text-slate-400">Coming soon</button>
      </section>

      <button onClick={() => navigate(`/guardian/alert?child=${child.id}`)} className="fixed bottom-22 left-1/2 z-20 w-[calc(100%-2rem)] max-w-[398px] -translate-x-1/2 rounded-[var(--r-pill)] bg-alert-500 py-3.5 text-sm font-bold text-white shadow-danger">
        <TriangleAlert className="mr-1 inline h-4 w-4" /> Report Missing
      </button>
    </div>
  );
}

function timeAgo(value: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}


