import React, { useMemo, useState } from 'react';
import { ArrowLeft, BrainCircuit, LocateFixed, Mic } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import BottomSheet from '../../components/common/BottomSheet';
import Chip from '../../components/common/Chip';
import FlarePulse from '../../components/common/FlarePulse';
import StepIndicator from '../../components/common/StepIndicator';

const outfits = ['School Uniform', 'Casual', 'Sports', 'Traditional', 'Unknown'];
const severities = [
  { key: 'just', label: 'Just Noticed (<30 min)', priority: 'medium' as const, radius: 10 },
  { key: 'while', label: 'Been a While (30m-2h)', priority: 'high' as const, radius: 15 },
  { key: 'serious', label: 'Serious Concern (2h+)', priority: 'critical' as const, radius: 20 },
];

export default function ReportMissingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const childQuery = params.get('child');
  const { currentUser, children, addReport } = useAppContext();
  const [step, setStep] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mine = useMemo(() => children.filter((child) => child.guardianId === currentUser.id), [children, currentUser.id]);

  const [form, setForm] = useState({
    childId: childQuery && mine.some((child) => child.id === childQuery) ? childQuery : mine[0]?.id ?? '',
    address: '',
    lat: -26.2041,
    lng: 28.0473,
    when: '',
    outfit: 'School Uniform',
    context: '',
    whoNearby: '',
    emergencyContact: mine[0]?.emergencyContacts[0]?.phone ?? '',
    withSomeone: false,
    someoneDetails: '',
    anonymousReport: false,
    severity: severities[0].key,
    voiceNote: '',
  });

  const selectedSeverity = severities.find((item) => item.key === form.severity) ?? severities[0];
  const estimated = 1800 + selectedSeverity.radius * 100;
  const selectedChild = mine.find((child) => child.id === form.childId) ?? null;

  const validateStep = () => {
    const next: Record<string, string> = {};
    if (step === 1 && !form.childId) next.childId = 'Select a child';
    if (step === 2 && !form.address.trim()) next.address = 'Last known location is required';
    if (step === 3 && !form.context.trim()) next.context = 'Context is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const back = () => setStep((prev) => Math.max(prev - 1, 1));

  const setCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      setForm((prev) => ({
        ...prev,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        address: `GPS: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
      }));
    });
  };

  const generateAiSummary = () => {
    const outfit = form.outfit ? `Wearing ${form.outfit.toLowerCase()}.` : '';
    const context = form.context ? `Context: ${form.context.trim()}.` : '';
    const nearby = form.whoNearby ? `Nearby: ${form.whoNearby.trim()}.` : '';
    const location = form.address ? `Last seen at ${form.address.trim()}.` : '';
    const base = selectedChild
      ? `${selectedChild.name}, age ${selectedChild.age}, reported missing.`
      : 'Child reported missing.';

    const summary = [base, location, outfit, context, nearby]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!summary) return;
    setAiSummary(summary);
    if (!form.context.trim()) {
      setForm((prev) => ({
        ...prev,
        context: summary,
      }));
    }
  };

  const submitReport = () => {
    if (!validateStep()) return;

    const reportId = addReport({
      childId: form.childId,
      guardianId: currentUser.id,
      status: 'pending',
      priority: selectedSeverity.priority,
      lastSeenLocation: {
        address: form.address,
        lat: form.lat,
        lng: form.lng,
      },
      lastSeenAt: form.when || new Date().toISOString(),
      outfit: form.outfit,
      context: form.context,
      whoNearby: form.whoNearby,
      withKnownPerson: form.withSomeone,
      knownPersonDetails: form.someoneDetails,
      anonymousReport: form.anonymousReport,
      currentRadiusKm: selectedSeverity.radius,
      expansionRateKmPerHour: 5,
      partnerNotified: {
        police: true,
        hospital: true,
        school: true,
        media: false,
        community: true,
      },
      caseNotes: [`Emergency contact: ${form.emergencyContact}`],
    });

    setSubmitted(true);
    window.setTimeout(() => navigate(`/guardian/alert/status/${reportId}`), 1600);
  };

  if (submitted) {
    return (
      <section className="min-h-[72vh] grid place-items-center text-center">
        <div>
          <FlarePulse size={120} tone="danger" />
          <h1 className="mt-4 guardian-page-title">Report Submitted</h1>
          <p className="mt-2 text-sm text-text-muted">Flare is initializing and authorities are being notified.</p>
        </div>
      </section>
    );
  }

  return (
    <div className="guardian-screen animate-page-in">
      <header className="flex items-center justify-between">
        <Link to="/guardian/home" className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-200 bg-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="rounded-[var(--r-pill)] border border-red-500/30 bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-600">
          Report Missing Child
        </span>
      </header>

      <section className="guardian-panel p-5">
        <h1 className="guardian-page-title">Activate Flare</h1>
        <p className="text-sm text-text-muted">This flow confirms child, location and context before notification.</p>
        <div className="mt-4">
          <StepIndicator current={step} total={3} />
        </div>
      </section>

      {step === 1 ? (
        <section className="guardian-card p-4 space-y-3">
          <h2 className="guardian-section-title">1. Confirm child</h2>
          <div className="grid grid-cols-3 gap-2">
            {mine.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, childId: child.id, emergencyContact: child.emergencyContacts[0]?.phone ?? '' }))}
                className={`rounded-[var(--r-md)] border p-2 text-left ${form.childId === child.id ? 'border-brand-orange bg-brand-orange-light' : 'border-slate-200 bg-bg-primary'}`}
              >
                <img src={child.photoUrls[0]} alt={child.name} className="h-12 w-12 rounded-[var(--r-pill)] object-cover" />
                <p className="mt-2 text-xs font-semibold text-text-main">{child.name}</p>
              </button>
            ))}
          </div>
          {errors.childId ? <p className="text-xs text-red-500">{errors.childId}</p> : null}
        </section>
      ) : null}

      {step === 2 ? (
        <section className="guardian-card p-4 space-y-3">
          <h2 className="guardian-section-title">2. Last known location</h2>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-text-main">Address / Landmark</span>
            <input
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3.5 py-2.5 text-sm"
              placeholder="Near taxi rank, Johannesburg"
            />
          </label>
          {errors.address ? <p className="text-xs text-red-500">{errors.address}</p> : null}
          <div className="h-36 rounded-[var(--r-md)] border border-slate-200 bg-[radial-gradient(circle_at_20%_20%,#ffe8d9,transparent_30%),#fff] relative overflow-hidden">
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[var(--r-pill)] bg-red-500 px-2 py-1 text-[10px] font-bold text-white">Map pin drop</span>
          </div>
          <button type="button" onClick={setCurrentLocation} className="rounded-[var(--r-pill)] border border-brand-orange/20 bg-brand-orange-light px-3 py-1.5 text-xs font-semibold text-brand-orange">
            <LocateFixed className="mr-1 inline h-3.5 w-3.5" /> Auto detect location
          </button>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Date & Time" type="datetime-local" value={form.when} onChange={(value) => setForm((prev) => ({ ...prev, when: value }))} />
            <Input label="Emergency Contact" value={form.emergencyContact} onChange={(value) => setForm((prev) => ({ ...prev, emergencyContact: value }))} />
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="guardian-card p-4 space-y-3">
          <h2 className="guardian-section-title">3. Context & clothing</h2>
          <div>
            <p className="text-sm font-semibold text-text-main">Outfit</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {outfits.map((outfit) => (
                <Chip key={outfit} variant={form.outfit === outfit ? 'orange' : 'neutral'} selected={form.outfit === outfit} onClick={() => setForm((prev) => ({ ...prev, outfit }))}>
                  {outfit}
                </Chip>
              ))}
            </div>
          </div>

          <TextArea label="Additional context" value={form.context} onChange={(value) => setForm((prev) => ({ ...prev, context: value }))} placeholder="What happened before last sighting?" />
          {errors.context ? <p className="text-xs text-red-500">{errors.context}</p> : null}
          <TextArea label="Who was nearby?" value={form.whoNearby} onChange={(value) => setForm((prev) => ({ ...prev, whoNearby: value }))} placeholder="Describe people, vehicles or companions" />

          <div className="rounded-[var(--r-md)] border border-brand-green/25 bg-brand-green-light p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-brand-green flex items-center gap-1.5">
                <BrainCircuit className="h-4 w-4" />
                AI Incident Draft
              </p>
              <button
                type="button"
                onClick={generateAiSummary}
                className="rounded-[var(--r-pill)] border border-brand-green/30 bg-white px-3 py-1.5 text-xs font-semibold text-brand-green"
              >
                Generate Summary
              </button>
            </div>
            <p className="mt-1 text-xs text-text-muted">
              This AI feature structures your report details for faster operator review. No chatbot required.
            </p>
            {aiSummary ? (
              <p className="mt-2 rounded-[var(--r-sm)] border border-brand-green/25 bg-white px-3 py-2 text-sm text-text-main">
                {aiSummary}
              </p>
            ) : null}
          </div>

          <button type="button" onClick={() => setForm((prev) => ({ ...prev, voiceNote: prev.voiceNote ? '' : 'Voice note recorded (simulated)' }))} className="rounded-[var(--r-pill)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-text-main">
            <Mic className="mr-1 inline h-3.5 w-3.5" /> {form.voiceNote ? 'Remove voice note' : 'Add voice note'}
          </button>

          <label className="flex items-center gap-2 text-sm text-text-main">
            <input type="checkbox" checked={form.withSomeone} onChange={(event) => setForm((prev) => ({ ...prev, withSomeone: event.target.checked }))} />
            Is your child with someone?
          </label>
          {form.withSomeone ? <Input label="Describe who" value={form.someoneDetails} onChange={(value) => setForm((prev) => ({ ...prev, someoneDetails: value }))} /> : null}

          <label className="flex items-center gap-2 text-sm text-text-main">
            <input type="checkbox" checked={form.anonymousReport} onChange={(event) => setForm((prev) => ({ ...prev, anonymousReport: event.target.checked }))} />
            Anonymous reporting
          </label>

          <div>
            <p className="text-sm font-semibold text-text-main">Severity</p>
            <div className="mt-2 space-y-2">
              {severities.map((severity) => (
                <label key={severity.key} className="flex items-center gap-2 rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2 text-sm">
                  <input type="radio" checked={form.severity === severity.key} onChange={() => setForm((prev) => ({ ...prev, severity: severity.key }))} />
                  {severity.label}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-[var(--r-md)] border border-brand-orange/20 bg-brand-orange-light p-3">
            <p className="text-xs uppercase tracking-wider text-brand-orange font-bold">Pre-activate summary</p>
            <p className="text-sm text-text-main mt-1">Will notify approximately {estimated.toLocaleString()} people in the first wave.</p>
          </div>
        </section>
      ) : null}

      <footer className="grid grid-cols-2 gap-2 pb-2">
        <button type="button" onClick={back} disabled={step === 1} className="rounded-[var(--r-pill)] border border-slate-300 bg-white py-3 text-sm font-semibold text-text-main disabled:opacity-40">Back</button>
        {step < 3 ? (
          <button type="button" onClick={next} className="btn-interactive rounded-[var(--r-pill)] bg-brand-orange py-3 text-sm font-bold text-white shadow-orange">Next</button>
        ) : (
          <button type="button" onClick={() => setConfirmOpen(true)} className="btn-interactive rounded-[var(--r-pill)] bg-red-500 py-3 text-sm font-bold text-white shadow-danger">Activate The Flare</button>
        )}
      </footer>

      <BottomSheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Alert Broadcast" snap="40">
        <div className="space-y-3 text-sm text-text-muted">
            <p className="rounded-[var(--r-md)] border border-red-500/30 bg-red-50 px-3 py-2 text-red-600 font-semibold">
              ⚠ This will notify authorities and nearby citizens.
            </p>
          <p>Initial radius: {selectedSeverity.radius}km. Expansion: +5km per hour.</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setConfirmOpen(false)} className="rounded-[var(--r-pill)] border border-slate-300 bg-white py-2.5 text-sm font-semibold text-text-main">Cancel</button>
            <button type="button" onClick={submitReport} className="rounded-[var(--r-pill)] bg-red-500 py-2.5 text-sm font-bold text-white">Confirm & Notify</button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-text-main">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3.5 py-2.5 text-sm"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-text-main">{label}</span>
      <textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3.5 py-2.5 text-sm"
      />
    </label>
  );
}


