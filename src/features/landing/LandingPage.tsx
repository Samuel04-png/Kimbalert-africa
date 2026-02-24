import React from 'react';
import { Shield, Radio, Users, MapPin, ArrowRight, QrCode, HeartPulse, BellRing, CheckCircle2 } from 'lucide-react';

export default function LandingPage({ onNavigate }: { onNavigate: (role: 'login' | 'guardian' | 'admin') => void }) {
  return (
    <div className="min-h-screen bg-bg-primary text-text-main font-sans selection:bg-brand-orange/20 selection:text-brand-orange">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-brand-orange/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center shadow-lg shadow-brand-orange/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-text-main">KimbAlert</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm font-semibold text-text-muted hover:text-brand-orange transition-colors">How it Works</a>
            <a href="#partners" className="text-sm font-semibold text-text-muted hover:text-brand-orange transition-colors">Partners</a>
            <a href="#qr-bracelet" className="text-sm font-semibold text-text-muted hover:text-brand-orange transition-colors">QR Technology</a>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('login')}
              className="hidden md:block text-sm font-bold text-text-main hover:text-brand-orange transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => onNavigate('login')}
              className="bg-brand-orange hover:bg-brand-orange-hover text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-brand-orange/20 transition-all active:scale-95"
            >
              Register Child
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-20 right-0 w-[800px] h-[800px] bg-brand-orange/5 rounded-full blur-3xl -z-10 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-green/5 rounded-full blur-3xl -z-10 -translate-x-1/3"></div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-orange-light text-brand-orange text-sm font-bold mb-8 border border-brand-orange/20">
              <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse"></span>
              Live in 4 African Countries
            </div>
            <h1 className="font-display font-bold text-5xl md:text-7xl leading-[1.1] mb-6 text-text-main">
              No child in Africa is ever <span className="text-brand-orange relative inline-block">
                truly lost.
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-brand-orange/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>
            <p className="text-lg md:text-xl text-text-muted mb-10 leading-relaxed max-w-xl">
              A mission-critical, real-time emergency response platform. We combine secure identity vaults with an aggressive geospatial broadcast engine to mobilize communities instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => onNavigate('login')}
                className="bg-brand-orange hover:bg-brand-orange-hover text-white px-8 py-4 rounded-full text-lg font-bold shadow-xl shadow-brand-orange/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Register Your Child Now
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => onNavigate('login')}
                className="bg-white hover:bg-brand-green-light text-text-main border-2 border-brand-green/20 px-8 py-4 rounded-full text-lg font-bold transition-all active:scale-95 flex items-center justify-center gap-2">
                Enterprise Access
              </button>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative h-[500px] flex items-center justify-center animate-float">
            {/* Simulated Radar/Flare */}
            <div className="absolute w-[400px] h-[400px] rounded-full border border-brand-orange/10 flex items-center justify-center">
              <div className="absolute w-[300px] h-[300px] rounded-full border border-brand-orange/20 flex items-center justify-center">
                <div className="absolute w-[200px] h-[200px] rounded-full border border-brand-orange/30 flex items-center justify-center">
                  <div className="w-24 h-24 bg-brand-orange rounded-full shadow-[0_0_40px_rgba(255,122,89,0.5)] flex items-center justify-center animate-flare relative z-10">
                    <Radio className="w-10 h-10 text-white" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating UI Elements */}
            <div className="absolute top-1/4 -left-4 bg-white p-4 rounded-2xl shadow-xl border border-brand-orange/10 flex items-center gap-4 z-20">
              <div className="w-12 h-12 rounded-full bg-brand-orange-light flex items-center justify-center">
                <BellRing className="w-6 h-6 text-brand-orange" />
              </div>
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Alert Broadcast</p>
                <p className="font-bold text-text-main">10km Radius Active</p>
              </div>
            </div>

            <div className="absolute bottom-1/4 -right-4 bg-white p-4 rounded-2xl shadow-xl border border-brand-green/10 flex items-center gap-4 z-20">
              <div className="w-12 h-12 rounded-full bg-brand-green-light flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-brand-green" />
              </div>
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Status</p>
                <p className="font-bold text-text-main">Child Recovered</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-12 bg-white border-y border-brand-orange/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-brand-orange/10">
            <StatCard number="14,205" label="Children Protected" />
            <StatCard number="342" label="Partner Nodes" />
            <StatCard number="100%" label="Notification Success" />
            <StatCard number="< 2m" label="Avg. Broadcast Time" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display font-bold text-4xl mb-4">How KimbAlert Works</h2>
            <p className="text-text-muted text-lg">A coordinated digital dragnet that bridges the critical gap between disappearance and community mobilization.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Shield />}
              title="1. The Vault"
              description="Guardians pre-register children with high-res photos, medical data, and physical descriptions in our secure, encrypted database."
              color="green"
            />
            <FeatureCard 
              icon={<Radio />}
              title="2. The Flare"
              description="Upon report, an immediate broadcast hits a 10km radius via Push & SMS, expanding by 5km every hour to outpace travel distance."
              color="orange"
            />
            <FeatureCard 
              icon={<Users />}
              title="3. Reunification"
              description="Community members, police, and hospitals receive targeted alerts, turning every citizen into a potential rescuer."
              color="yellow"
            />
          </div>
        </div>
      </section>

      {/* QR Bracelet Feature */}
      <section id="qr-bracelet" className="py-24 px-6 bg-brand-orange text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-bold mb-6 backdrop-blur-sm">
              <QrCode className="w-4 h-4" />
              Wearable Safety
            </div>
            <h2 className="font-display font-bold text-4xl md:text-5xl mb-6">The KimbAlert QR Bracelet</h2>
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              An extra layer of physical safety. Each child is issued a unique, durable QR Code Bracelet. If a child is found, any community member or official can scan it.
            </p>
            <ul className="space-y-4 mb-10">
              {[
                'Instant scan alerts the specialized Task Force',
                'Cross-references with the active "Missing" database',
                'Secure, private reunification process',
                'No personal data stored directly on the bracelet'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <button 
              onClick={() => onNavigate('login')}
              className="bg-white text-brand-orange px-8 py-4 rounded-full text-lg font-bold shadow-xl transition-all active:scale-95 hover:bg-bg-primary">
              Learn About Bracelets
            </button>
          </div>
          <div className="relative h-[400px] bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 p-8 flex flex-col items-center justify-center">
            <div className="w-48 h-48 bg-white rounded-2xl p-4 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
              {/* Simulated QR Code */}
              <div className="w-full h-full border-4 border-text-main p-2 flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-8 h-8 bg-text-main"></div>
                  <div className="w-8 h-8 bg-text-main"></div>
                </div>
                <div className="flex justify-center items-center flex-1">
                  <QrCode className="w-16 h-16 text-brand-orange" />
                </div>
                <div className="flex justify-between">
                  <div className="w-8 h-8 bg-text-main"></div>
                  <div className="w-12 h-4 bg-text-main"></div>
                </div>
              </div>
            </div>
            <p className="mt-8 font-mono text-white/60 tracking-widest">ID: KMB-8472-AF</p>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section id="partners" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-display font-bold text-3xl mb-12">Integrated with Community Infrastructure</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Placeholder Logos */}
            <div className="h-16 flex items-center justify-center font-display font-bold text-xl text-text-muted">National Police</div>
            <div className="h-16 flex items-center justify-center font-display font-bold text-xl text-text-muted">Red Cross Africa</div>
            <div className="h-16 flex items-center justify-center font-display font-bold text-xl text-text-muted">Ministry of Health</div>
            <div className="h-16 flex items-center justify-center font-display font-bold text-xl text-text-muted">Telecom Partners</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-text-main text-white py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight">KimbAlert Africa</span>
            </div>
            <p className="text-white/60 max-w-sm">
              A real-time missing child emergency alert network designed to ensure no child is ever truly lost.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Platform</h4>
            <ul className="space-y-2 text-white/60">
              <li><button onClick={() => onNavigate('login')} className="hover:text-brand-orange transition-colors">Guardian Portal</button></li>
              <li><button onClick={() => onNavigate('login')} className="hover:text-brand-orange transition-colors">Enterprise Access</button></li>
              <li><button onClick={() => onNavigate('login')} className="hover:text-brand-orange transition-colors">Secure Login</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-white/60">
              <li><a href="#" className="hover:text-brand-orange transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-brand-orange transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-brand-orange transition-colors">Data Security</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 text-center text-white/40 text-sm">
          Copyright {new Date().getFullYear()} KimbAlert Africa. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function StatCard({ number, label }: { number: string, label: string }) {
  return (
    <div className="text-center px-4">
      <div className="font-display font-bold text-4xl md:text-5xl text-text-main mb-2">{number}</div>
      <div className="text-sm font-bold text-text-muted uppercase tracking-wider">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: 'orange' | 'green' | 'yellow' }) {
  const colorStyles = {
    orange: 'bg-brand-orange-light text-brand-orange border-brand-orange/20',
    green: 'bg-brand-green-light text-brand-green border-brand-green/20',
    yellow: 'bg-[#FFF9E6] text-brand-yellow border-brand-yellow/20',
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-brand-orange/10 shadow-xl shadow-brand-orange/5 hover:-translate-y-2 transition-transform duration-300">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${colorStyles[color]}`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-7 h-7' })}
      </div>
      <h3 className="font-display font-bold text-2xl mb-4 text-text-main">{title}</h3>
      <p className="text-text-muted leading-relaxed">{description}</p>
    </div>
  );
}


