import React, { useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, Edit3, FileText, MapPin, Printer, Share2, TriangleAlert } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAppContext } from '../../app/AppContext';
import { storage, isFirebaseConfigured } from '../../lib/firebase';
import Chip from '../../components/common/Chip';
import ProgressRing from '../../components/common/ProgressRing';
import BottomSheet from '../../components/common/BottomSheet';

export default function ChildProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { children, pushToast, updateChild } = useAppContext();
  const [medicalOpen, setMedicalOpen] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);

  // Document Upload State
  const [docOpen, setDocOpen] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');

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

  const handleDocUpload = async () => {
    if (!docName.trim()) {
      pushToast('error', 'Please provide a document name');
      return;
    }
    if (!docFile) {
      pushToast('error', 'Please select a file to upload');
      return;
    }

    setDocUploading(true);
    try {
      let url = '';
      if (isFirebaseConfigured && storage) {
        const fileExt = docFile.name.split('.').pop();
        const storageRef = ref(storage, `children/${child.id}/documents/${Date.now()}.${fileExt}`);
        await uploadBytes(storageRef, docFile);
        url = await getDownloadURL(storageRef);
      } else {
        // Mock upload for local dev
        url = URL.createObjectURL(docFile);
      }

      const newDocs = [...(child.documents || []), { name: docName, url }];
      updateChild(child.id, { documents: newDocs });

      setDocOpen(false);
      setDocName('');
      setDocFile(null);
      pushToast('success', 'Document uploaded securely');
    } catch (err) {
      console.error(err);
      pushToast('error', 'Failed to upload document');
    } finally {
      setDocUploading(false);
    }
  };

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
          <Chip variant={child.vaultScore >= 90 ? 'green' : 'pending'}>{child.vaultScore >= 90 ? '✓ Complete' : '✓ Incomplete (tap to finish)'}</Chip>
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

      <section className="rounded-[var(--r-lg)] border border-slate-200 bg-slate-50 p-4 shadow-sm mb-6">
        <h2 className="font-display text-2xl font-bold text-slate-400">Documents</h2>
        <p className="text-xs text-slate-400 mb-3">Secure uploads and official records.</p>

        {child.documents && child.documents.length > 0 ? (
          <div className="space-y-2 mb-3">
            {child.documents.map((doc, idx) => (
              <a key={idx} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-[var(--r-sm)] border border-slate-200 bg-white p-2 text-sm text-text-main hover:bg-slate-50">
                <FileText className="h-4 w-4 text-brand-orange" />
                <span className="flex-1 truncate">{doc.name}</span>
                <span className="text-[10px] text-brand-orange underline">View</span>
              </a>
            ))}
          </div>
        ) : null}

        <button type="button" onClick={() => setDocOpen(true)} className="rounded-[var(--r-pill)] border border-brand-orange/20 bg-brand-orange-light px-4 py-2 text-xs font-semibold text-brand-orange">
          + Upload Document
        </button>
      </section>

      <button onClick={() => navigate(`/guardian/alert?child=${child.id}`)} className="fixed bottom-22 left-1/2 z-20 w-[calc(100%-2rem)] max-w-[398px] -translate-x-1/2 rounded-[var(--r-pill)] bg-alert-500 py-3.5 text-sm font-bold text-white shadow-danger">
        <TriangleAlert className="mr-1 inline h-4 w-4" /> Report Missing
      </button>

      <BottomSheet open={docOpen} onClose={() => setDocOpen(false)} title="Upload Secure Document" snap="70">
        <div className="space-y-4 p-2 text-sm text-text-main">
          <p className="text-text-muted">Files uploaded here are encrypted and stored in your child's secure vault.</p>
          <label className="block">
            <span className="mb-1.5 block font-semibold">Document Name</span>
            <input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="e.g. Birth Certificate" className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2" />
          </label>
          <label className="block">
            <span className="mb-1.5 block font-semibold">File</span>
            <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] || null)} className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2" />
          </label>
          <button onClick={handleDocUpload} disabled={docUploading} className="mt-2 w-full rounded-[var(--r-pill)] bg-brand-orange py-3 font-bold text-white shadow-orange disabled:opacity-70">
            {docUploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

function timeAgo(value: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}


