import React, { useState } from 'react';
import { ArrowLeft, Fingerprint, Globe2, Save, UserCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import ToggleSwitch from '../../components/common/ToggleSwitch';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { currentUser, pushToast } = useAppContext();
  const [biometric, setBiometric] = useState(true);
  const [form, setForm] = useState({
    fullName: currentUser.fullName,
    phone: currentUser.phone,
    email: currentUser.email,
    location: currentUser.location || '',
    avatarUrl: currentUser.avatarUrl || '',
    language: 'English',
  });

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    pushToast('success', 'Profile updated');
    navigate('/guardian/profile');
  };

  return (
    <div className="guardian-screen animate-page-in pb-4">
      <header className="flex items-center gap-2">
        <Link to="/guardian/profile" className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-slate-200 bg-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="guardian-page-title">Edit Profile</h1>
      </header>

      <form onSubmit={save} className="space-y-3 guardian-panel p-4">
        <Input label="Avatar URL" value={form.avatarUrl} onChange={(value) => setForm((prev) => ({ ...prev, avatarUrl: value }))} />
        <Input label="Full Name" value={form.fullName} onChange={(value) => setForm((prev) => ({ ...prev, fullName: value }))} />
        <Input label="Phone" value={form.phone} onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))} />
        <Input label="Email" value={form.email} onChange={(value) => setForm((prev) => ({ ...prev, email: value }))} />
        <Input label="Location" value={form.location} onChange={(value) => setForm((prev) => ({ ...prev, location: value }))} />

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-text-main">Language</span>
          <select
            value={form.language}
            onChange={(event) => setForm((prev) => ({ ...prev, language: event.target.value }))}
            className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2.5 text-sm"
          >
            <option>English</option>
            <option>French</option>
            <option>Swahili</option>
            <option>Yoruba</option>
            <option>Zulu</option>
          </select>
        </label>

        <div className="flex items-center justify-between rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2.5">
          <div>
            <p className="text-sm font-semibold text-text-main">Biometric Login</p>
            <p className="text-xs text-text-muted">Face ID / fingerprint unlock</p>
          </div>
          <ToggleSwitch checked={biometric} onChange={setBiometric} />
        </div>

        <button type="submit" className="btn-interactive w-full rounded-[var(--r-pill)] bg-brand-orange py-3 text-sm font-bold text-white shadow-orange">
          <Save className="mr-1 inline h-4 w-4" /> Save Changes
        </button>
      </form>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-text-main">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3.5 py-2.5 text-sm"
      />
    </label>
  );
}

