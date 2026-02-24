import React, { useState } from 'react';
import { ArrowLeft, MapPin, Phone, Save, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../app/AppContext';
import PhoneFrame from '../../components/layout/PhoneFrame';
import Chip from '../../components/common/Chip';

const languages = ['English', 'isiZulu', 'isiXhosa', 'Afrikaans', 'Sesotho', 'Swahili'];

export default function ProfileCompletionPage() {
  const navigate = useNavigate();
  const { pushToast } = useAppContext();
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [form, setForm] = useState({ location: '', emergencyName: '', emergencyPhone: '' });

  const complete = (event: React.FormEvent) => {
    event.preventDefault();
    pushToast('success', 'Profile completed', 'Guardian onboarding is ready.');
    navigate('/guardian/home');
  };

  return (
    <PhoneFrame>
      <div className="auth-screen px-4 pb-8 pt-3">
        <Link to="/auth/success" className="grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border border-brand-orange/20 bg-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <section className="mt-6 rounded-[var(--r-xl)] border border-slate-200 bg-white p-6 shadow-lg">
          <p className="type-kicker">Profile Completion</p>
          <h1 className="mt-2 type-page-title">Finish setup</h1>
          <p className="mt-1 type-muted">Add key details so emergency response can move faster.</p>

          <form onSubmit={complete} className="mt-5 space-y-4">
            <Input icon={<MapPin className="h-4 w-4" />} label="City / Location" value={form.location} onChange={(value) => setForm((prev) => ({ ...prev, location: value }))} placeholder="Johannesburg, South Africa" />
            <Input icon={<Phone className="h-4 w-4" />} label="Emergency Contact Name" value={form.emergencyName} onChange={(value) => setForm((prev) => ({ ...prev, emergencyName: value }))} placeholder="Name" />
            <Input icon={<Phone className="h-4 w-4" />} label="Emergency Contact Phone" value={form.emergencyPhone} onChange={(value) => setForm((prev) => ({ ...prev, emergencyPhone: value }))} placeholder="+27..." />

            <div>
              <p className="text-sm font-semibold text-text-main">Preferred Language</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {languages.map((language) => (
                  <Chip key={language} variant={selectedLanguage === language ? 'orange' : 'neutral'} selected={selectedLanguage === language} onClick={() => setSelectedLanguage(language)}>
                    {language}
                  </Chip>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-interactive mt-2 w-full rounded-[var(--r-pill)] bg-brand-orange py-3.5 text-sm font-bold text-white shadow-orange">
              Go to Dashboard
            </button>
          </form>

          <div className="mt-4 rounded-[var(--r-md)] border border-brand-green/20 bg-brand-green-light p-3 text-xs text-text-muted">
            <p className="font-semibold text-brand-green flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Your profile data is encrypted.</p>
          </div>
        </section>
      </div>
    </PhoneFrame>
  );
}

function Input({
  icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-text-main">{label}</span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{icon}</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-[var(--r-sm)] border border-slate-200 bg-bg-primary px-3.5 py-2.5 pl-10 text-sm"
        />
      </div>
    </label>
  );
}
