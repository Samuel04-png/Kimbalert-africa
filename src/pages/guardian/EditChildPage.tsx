import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import BottomSheet from '../../components/common/BottomSheet';

export default function EditChildPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { children, updateChild, deleteChild, pushToast } = useAppContext();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const child = useMemo(() => children.find((item) => item.id === id) ?? null, [children, id]);
  const draftKey = `draft_edit_child_${id}`;

  const [form, setForm] = useState({
    name: '',
    dob: '',
    gender: '',
    physicalDescription: '',
    bloodType: '',
    schoolName: '',
    address: '',
    emergencyName: '',
    emergencyPhone: '',
  });

  useEffect(() => {
    if (!child) return;
    const raw = localStorage.getItem(draftKey);
    if (raw) {
      try {
        setForm(JSON.parse(raw) as typeof form);
        return;
      } catch {
        // ignore bad draft
      }
    }

    setForm({
      name: child.name,
      dob: child.dob,
      gender: child.gender,
      physicalDescription: child.physicalDescription,
      bloodType: child.medical.bloodType,
      schoolName: child.location.schoolName,
      address: child.location.address,
      emergencyName: child.emergencyContacts[0]?.name ?? '',
      emergencyPhone: child.emergencyContacts[0]?.phone ?? '',
    });
  }, [child, draftKey]);

  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify(form));
  }, [form, draftKey]);

  if (!child) {
    return (
      <div className="space-y-3">
        <Link to="/guardian/children" className="text-sm text-brand-orange">Back</Link>
        <p className="text-sm text-text-muted">Child profile not found.</p>
      </div>
    );
  }

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    updateChild(child.id, {
      name: form.name,
      dob: form.dob,
      gender: form.gender,
      physicalDescription: form.physicalDescription,
      medical: {
        ...child.medical,
        bloodType: form.bloodType,
      },
      location: {
        ...child.location,
        schoolName: form.schoolName,
        address: form.address,
      },
      emergencyContacts: [
        {
          id: child.emergencyContacts[0]?.id ?? `ec-${Date.now()}`,
          relation: child.emergencyContacts[0]?.relation ?? 'Guardian Contact',
          name: form.emergencyName,
          phone: form.emergencyPhone,
        },
      ],
      vaultScore: Math.min(100, child.vaultScore + 5),
    });
    localStorage.removeItem(draftKey);
    pushToast('success', 'Changes saved');
    navigate(`/guardian/children/${child.id}`);
  };

  const remove = () => {
    deleteChild(child.id);
    localStorage.removeItem(draftKey);
    navigate('/guardian/children');
  };

  return (
    <div className="guardian-screen animate-page-in pb-4">
      <header className="flex items-center justify-between">
        <Link to={`/guardian/children/${child.id}`} className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-200 bg-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <button onClick={() => setConfirmDelete(true)} className="rounded-[var(--r-pill)] border border-red-500/30 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500">
          <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Delete
        </button>
      </header>

      <section className="guardian-panel p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Edit Child Profile</p>
        <h1 className="mt-1 guardian-page-title">{child.name}</h1>
      </section>

      <form onSubmit={save} className="space-y-3 guardian-card p-4">
        <Input label="Name" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
        <div className="grid grid-cols-2 gap-2">
          <Input label="DOB" type="date" value={form.dob} onChange={(value) => setForm((prev) => ({ ...prev, dob: value }))} />
          <Input label="Gender" value={form.gender} onChange={(value) => setForm((prev) => ({ ...prev, gender: value }))} />
        </div>
        <Input label="Physical Description" value={form.physicalDescription} onChange={(value) => setForm((prev) => ({ ...prev, physicalDescription: value }))} />
        <Input label="Blood Type" value={form.bloodType} onChange={(value) => setForm((prev) => ({ ...prev, bloodType: value }))} />
        <Input label="School" value={form.schoolName} onChange={(value) => setForm((prev) => ({ ...prev, schoolName: value }))} />
        <Input label="Address" value={form.address} onChange={(value) => setForm((prev) => ({ ...prev, address: value }))} />
        <div className="grid grid-cols-2 gap-2">
          <Input label="Emergency Name" value={form.emergencyName} onChange={(value) => setForm((prev) => ({ ...prev, emergencyName: value }))} />
          <Input label="Emergency Phone" value={form.emergencyPhone} onChange={(value) => setForm((prev) => ({ ...prev, emergencyPhone: value }))} />
        </div>

        <button type="submit" className="btn-interactive mt-1 w-full rounded-[var(--r-pill)] bg-brand-orange py-3.5 text-sm font-bold text-white shadow-orange">
          Save Changes
        </button>
      </form>

      <BottomSheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete Child Profile" snap="40">
        <p className="text-sm text-text-muted">This action removes the profile and linked reports from your account.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-[var(--r-pill)] border border-slate-300 bg-white py-2.5 text-sm font-semibold text-text-main">Cancel</button>
          <button type="button" onClick={remove} className="rounded-[var(--r-pill)] bg-red-500 py-2.5 text-sm font-bold text-white">Delete</button>
        </div>
      </BottomSheet>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
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


