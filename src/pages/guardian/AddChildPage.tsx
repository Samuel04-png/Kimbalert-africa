import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Camera, CheckCircle2, ImagePlus, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import Chip from '../../components/common/Chip';
import StepIndicator from '../../components/common/StepIndicator';

const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const africanLanguages = ['English', 'French', 'Swahili', 'Hausa', 'Yoruba', 'Nyanja', 'Bemba', 'Zulu', 'Xhosa', 'Amharic', 'Igbo', 'Twi', 'Wolof', 'Shona', 'Other'];
const draftKey = 'draft_add_child';

export default function AddChildPage() {
  const navigate = useNavigate();
  const { currentUser, addChild, pushToast } = useAppContext();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    dob: '',
    gender: 'Female',
    physicalDescription: '',
    bloodType: 'O+',
    conditions: '',
    medications: '',
    allergies: '',
    doctorPhone: '',
    photos: ['', '', '', '', ''],
    schoolName: '',
    safeZoneLabel: '',
    address: '',
    lat: -1.2864,
    lng: 36.8172,
    languages: ['English'] as string[],
    emergencyName: '',
    emergencyPhone: '',
    qrBraceletId: `KA-${new Date().getFullYear()}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
  });

  useEffect(() => {
    const raw = localStorage.getItem(draftKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as typeof form;
      setForm((prev) => ({ ...prev, ...parsed }));
      pushToast('info', 'Draft restored');
    } catch {
      // no-op
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify(form));
  }, [form]);

  const completion = useMemo(() => {
    const checks = [
      Boolean(form.name && form.dob && form.gender),
      Boolean(form.bloodType && form.conditions !== ''),
      Boolean(form.photos.filter(Boolean).length > 0),
      Boolean(form.schoolName && form.address && form.languages.length > 0),
      Boolean(form.emergencyName && form.emergencyPhone),
    ];
    return checks;
  }, [form]);

  const next = () => setStep((prev) => Math.min(prev + 1, 5));
  const back = () => setStep((prev) => Math.max(prev - 1, 1));

  const saveDraft = () => {
    localStorage.setItem(draftKey, JSON.stringify(form));
    pushToast('info', 'Draft saved locally');
  };

  const submit = async () => {
    setSaving(true);
    const childId = addChild({
      guardianId: currentUser.id,
      name: form.name,
      dob: form.dob,
      gender: form.gender,
      photoUrls: form.photos.filter(Boolean),
      physicalDescription: form.physicalDescription,
      medical: {
        bloodType: form.bloodType,
        conditions: split(form.conditions),
        medications: split(form.medications),
        allergies: split(form.allergies),
        doctorPhone: form.doctorPhone,
      },
      location: {
        schoolName: form.schoolName,
        safeZoneLabel: form.safeZoneLabel,
        address: form.address,
        lat: form.lat,
        lng: form.lng,
      },
      languages: form.languages,
      emergencyContacts: [
        {
          id: `ec-${Date.now()}`,
          name: form.emergencyName,
          relation: 'Guardian Contact',
          phone: form.emergencyPhone,
        },
      ],
      qrBraceletId: form.qrBraceletId,
      qrLinked: false,
      vaultScore: 78,
    });

    localStorage.removeItem(draftKey);
    await new Promise((resolve) => window.setTimeout(resolve, 550));
    setSaving(false);
    pushToast('success', 'Child profile saved', 'Great work. Vault profile is now active.');
    navigate(`/guardian/children/${childId}`);
  };

  return (
    <div className="guardian-screen animate-page-in">
      <header className="flex items-center justify-between">
        <Link to="/guardian/children" className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-200 bg-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <button type="button" onClick={saveDraft} className="rounded-[var(--r-pill)] border border-brand-orange/20 bg-brand-orange-light px-3 py-1.5 text-xs font-semibold text-brand-orange">
          Save draft
        </button>
      </header>

      <section className="guardian-panel p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Step {step} of 5</p>
        <h1 className="mt-1 guardian-page-title">Add Child</h1>
        <p className="text-sm text-text-muted">Create a complete safety profile before emergencies.</p>
        <div className="mt-4">
          <StepIndicator current={step} total={5} />
        </div>
      </section>

      {step === 1 ? (
        <section className="guardian-card p-4 space-y-3">
          <StepHeadline icon="👶" title="Basic Information" subtitle="Identity and visual profile" />
          <Input label="Child Name" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Date of Birth" type="date" value={form.dob} onChange={(value) => setForm((prev) => ({ ...prev, dob: value }))} />
            <Input label="Gender" value={form.gender} onChange={(value) => setForm((prev) => ({ ...prev, gender: value }))} />
          </div>
          <TextArea label="Physical Description" value={form.physicalDescription} onChange={(value) => setForm((prev) => ({ ...prev, physicalDescription: value }))} placeholder="Height, haircut, distinctive marks, clothing hints" />
        </section>
      ) : null}

      {step === 2 ? (
        <section className="guardian-card p-4 space-y-3">
          <StepHeadline icon="🩺" title="Medical Information" subtitle="Encrypted and only shared during active emergencies" />
          <div>
            <p className="text-sm font-semibold text-text-main">Blood Type</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {bloodTypes.map((type) => (
                <Chip key={type} variant={form.bloodType === type ? 'orange' : 'neutral'} selected={form.bloodType === type} onClick={() => setForm((prev) => ({ ...prev, bloodType: type }))}>
                  {type}
                </Chip>
              ))}
            </div>
          </div>
          <Input label="Medical Conditions" value={form.conditions} onChange={(value) => setForm((prev) => ({ ...prev, conditions: value }))} placeholder="Asthma, epilepsy..." />
          <Input label="Current Medications" value={form.medications} onChange={(value) => setForm((prev) => ({ ...prev, medications: value }))} placeholder="Insulin, daily inhaler..." />
          <Input label="Allergies" value={form.allergies} onChange={(value) => setForm((prev) => ({ ...prev, allergies: value }))} placeholder="Peanuts, penicillin..." />
          <Input label="Doctor Phone" value={form.doctorPhone} onChange={(value) => setForm((prev) => ({ ...prev, doctorPhone: value }))} />
        </section>
      ) : null}

      {step === 3 ? (
        <section className="guardian-card p-4 space-y-3">
          <StepHeadline icon="📷" title="Photos" subtitle="Clear front-facing photos improve recovery speed" />
          <p className="text-xs text-text-muted">Guide: use bright light, clear face, and recent clothing context.</p>
          <div className="grid grid-cols-2 gap-2">
            {form.photos.map((photo, index) => (
              <label key={index} className="rounded-[var(--r-md)] border border-slate-200 bg-bg-primary p-2 block">
                <span className="text-[11px] font-semibold text-text-muted">Photo slot {index + 1}</span>
                <input
                  value={photo}
                  onChange={(event) => {
                    const next = [...form.photos];
                    next[index] = event.target.value;
                    setForm((prev) => ({ ...prev, photos: next }));
                  }}
                  placeholder="Paste image URL"
                  className="mt-2 w-full rounded-[var(--r-sm)] border border-slate-200 bg-white px-2 py-1.5 text-xs"
                />
                <div className="mt-2 h-20 rounded-[var(--r-sm)] border border-dashed border-slate-300 bg-white/70 grid place-items-center overflow-hidden">
                  {photo ? <img src={photo} alt={`slot-${index + 1}`} className="h-full w-full object-cover" /> : <ImagePlus className="h-5 w-5 text-slate-400" />}
                </div>
              </label>
            ))}
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="guardian-card p-4 space-y-3">
          <StepHeadline icon="🗺️" title="Location & Languages" subtitle="School zone and communication preferences" />
          <Input label="School Name" value={form.schoolName} onChange={(value) => setForm((prev) => ({ ...prev, schoolName: value }))} />
          <Input label="Safe Zone Label" value={form.safeZoneLabel} onChange={(value) => setForm((prev) => ({ ...prev, safeZoneLabel: value }))} placeholder="Morning route checkpoint" />
          <TextArea label="Address" value={form.address} onChange={(value) => setForm((prev) => ({ ...prev, address: value }))} />
          <div>
            <p className="text-sm font-semibold text-text-main">Languages</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {africanLanguages.map((language) => (
                <Chip
                  key={language}
                  variant={form.languages.includes(language) ? 'orange' : 'neutral'}
                  selected={form.languages.includes(language)}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      languages: prev.languages.includes(language)
                        ? prev.languages.filter((entry) => entry !== language)
                        : [...prev.languages, language],
                    }))
                  }
                >
                  {language}
                </Chip>
              ))}
            </div>
          </div>
          <Input label="Emergency Contact Name" value={form.emergencyName} onChange={(value) => setForm((prev) => ({ ...prev, emergencyName: value }))} />
          <Input label="Emergency Contact Phone" value={form.emergencyPhone} onChange={(value) => setForm((prev) => ({ ...prev, emergencyPhone: value }))} />
        </section>
      ) : null}

      {step === 5 ? (
        <section className="guardian-card p-4 space-y-3">
          <StepHeadline icon="✅" title="Final Review" subtitle="Everything look right?" />
          <Summary label="Name" value={form.name} />
          <Summary label="DOB" value={form.dob} />
          <Summary label="Blood Type" value={form.bloodType} />
          <Summary label="School" value={form.schoolName} />
          <Summary label="Languages" value={form.languages.join(', ')} />
          <Summary label="Emergency Contact" value={`${form.emergencyName} (${form.emergencyPhone})`} />
          <Summary label="Photos Uploaded" value={String(form.photos.filter(Boolean).length)} />

          <div className="rounded-[var(--r-md)] border border-brand-green/20 bg-brand-green-light p-3 text-sm text-brand-green">
            <p className="font-semibold">Profile readiness</p>
            <div className="mt-2 flex gap-2">
              {completion.map((done, index) => (
                <span key={index} className={`grid h-6 w-6 place-items-center rounded-[var(--r-pill)] text-xs ${done ? 'bg-brand-green text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                </span>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <footer className="grid grid-cols-2 gap-2 pb-3">
        <button type="button" onClick={back} disabled={step === 1} className="rounded-[var(--r-pill)] border border-slate-300 bg-white py-3 text-sm font-semibold text-text-main disabled:opacity-40">
          Back
        </button>
        {step < 5 ? (
          <button type="button" onClick={next} className="btn-interactive rounded-[var(--r-pill)] bg-brand-orange py-3 text-sm font-bold text-white shadow-orange">
            Next
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={saving} className="btn-interactive rounded-[var(--r-pill)] bg-brand-orange py-3 text-sm font-bold text-white shadow-orange disabled:opacity-70">
            {saving ? 'Saving...' : 'Save to Vault'}
          </button>
        )}
      </footer>
    </div>
  );
}

function StepHeadline({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{icon} {title}</p>
      <h2 className="guardian-section-title">{title}</h2>
      <p className="text-xs text-text-muted">{subtitle}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-text-main">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
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

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className="text-sm font-semibold text-text-main">{value || 'Not provided'}</p>
    </div>
  );
}

function split(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}


