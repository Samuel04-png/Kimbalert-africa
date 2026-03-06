import React, { useState } from 'react';
import { ArrowLeft, Camera, Fingerprint, Globe2, Save, UserCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAppContext } from '../../app/AppContext';
import { storage, isFirebaseConfigured } from '../../lib/firebase';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import { useTranslation } from 'react-i18next';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { currentUser, pushToast, updateCurrentUserProfile } = useAppContext();
  const storedPrefs = localStorage.getItem('guardian_preferences');
  const parsedPrefs = storedPrefs ? (JSON.parse(storedPrefs) as { language?: string; biometric?: boolean }) : null;
  const [biometric, setBiometric] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(currentUser.avatarUrl || '');
  const { i18n } = useTranslation();
  const [form, setForm] = useState({
    fullName: currentUser.fullName,
    phone: currentUser.phone,
    email: currentUser.email,
    location: currentUser.location || '',
    avatarUrl: currentUser.avatarUrl || '',
    language: parsedPrefs?.language || i18n.language || 'en',
  });

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      let finalAvatarUrl = form.avatarUrl.trim() || undefined;

      // Upload avatar to Firebase Storage if a file was selected
      if (avatarFile && isFirebaseConfigured && storage && currentUser.id) {
        const storageRef = ref(storage, `guardians/${currentUser.id}/avatar`);
        await uploadBytes(storageRef, avatarFile);
        finalAvatarUrl = await getDownloadURL(storageRef);
      }

      updateCurrentUserProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        location: form.location.trim() || 'South Africa',
        avatarUrl: finalAvatarUrl,
      });
      localStorage.setItem(
        'guardian_preferences',
        JSON.stringify({
          ...parsedPrefs,
          language: form.language,
          biometric,
        }),
      );
      i18n.changeLanguage(form.language);
      pushToast('success', 'Profile updated');
      navigate('/guardian/profile');
    } catch (error) {
      console.error('Failed to update profile', error);
      pushToast('error', 'Update failed', 'Please try again.');
    } finally {
      setSaving(false);
    }
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
        <div>
          <span className="mb-1.5 block text-sm font-semibold text-text-main">Profile Photo</span>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-[var(--r-pill)] border-2 border-brand-orange/25 bg-bg-primary">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserCircle2 className="h-8 w-8 text-text-muted" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setAvatarFile(file);
                  setAvatarPreview(URL.createObjectURL(file));
                }}
              />
            </label>
            <div>
              <p className="text-xs font-semibold text-brand-orange">Tap photo to change</p>
              <p className="text-xs text-text-muted">JPG, PNG up to 5MB</p>
            </div>
          </div>
        </div>
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
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="sw">Swahili</option>
          </select>
        </label>

        <div className="flex items-center justify-between rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3 py-2.5">
          <div>
            <p className="text-sm font-semibold text-text-main">Biometric Login</p>
            <p className="text-xs text-text-muted">Face ID / fingerprint unlock</p>
          </div>
          <ToggleSwitch checked={biometric} onChange={setBiometric} />
        </div>

        <button type="submit" disabled={saving} className="btn-interactive w-full rounded-[var(--r-pill)] bg-brand-orange py-3 text-sm font-bold text-white shadow-orange disabled:opacity-70">
          <Save className="mr-1 inline h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
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

