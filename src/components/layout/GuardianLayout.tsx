import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bell, Home, Smartphone, UserCircle2, Users2 } from 'lucide-react';
import { Link, NavLink, Outlet, matchPath, useLocation } from 'react-router-dom';
import PhoneFrame from './PhoneFrame';
import ToastHost from '../common/ToastHost';

const hiddenNavPatterns = [
  '/guardian/children/add',
  '/guardian/children/:id/edit',
  '/guardian/alert/status',
  '/guardian/alert/status/:id',
  '/guardian/activity/:id',
  '/guardian/activity/history',
  '/guardian/activity/tip-success',
  '/guardian/profile/edit',
  '/guardian/resources',
  '/guardian/notifications',
  '/guardian/search',
  '/guardian/alert/qr',
];

export default function GuardianLayout() {
  const location = useLocation();
  const hideNav = hiddenNavPatterns.some((pattern) => matchPath(pattern, location.pathname));
  const mobileAllowed = useGuardianMobileGate();

  return (
    <PhoneFrame>
      <div className="guardian-app">
        {mobileAllowed ? (
          <>
            <div className="screen screen-content bg-[radial-gradient(circle_at_8%_4%,#fff8f2,transparent_36%),radial-gradient(circle_at_92%_96%,#ffeada,transparent_34%)] px-4 pb-28 pt-3">
              <Outlet />
            </div>

            {!hideNav ? (
              <nav className="bottom-nav fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[430px] border-t border-brand-orange/15 bg-[#fffdfb]/95 px-3 pb-4 pt-2 backdrop-blur">
                <div className="grid grid-cols-5 items-end gap-1">
                  <TabLink to="/guardian/home" icon={<Home className="h-[18px] w-[18px]" />} label="Home" />
                  <TabLink to="/guardian/children" icon={<Users2 className="h-[18px] w-[18px]" />} label="Children" />
                  <NavLink to="/guardian/alert" className="mx-auto -mt-7 grid h-14 w-14 place-items-center rounded-[var(--r-pill)] border-4 border-[#fffdfb] bg-brand-orange text-white shadow-orange tappable transition-[var(--transition-spring)] active:scale-95">
                    <AlertTriangle className="h-6 w-6" />
                  </NavLink>
                  <TabLink to="/guardian/activity" icon={<Bell className="h-[18px] w-[18px]" />} label="Activity" />
                  <TabLink to="/guardian/profile" icon={<UserCircle2 className="h-[18px] w-[18px]" />} label="Profile" />
                </div>
              </nav>
            ) : null}
          </>
        ) : (
          <div className="screen min-h-screen px-5 py-8">
            <section className="guardian-panel p-6 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-[var(--r-pill)] bg-brand-orange-light text-brand-orange">
                <Smartphone className="h-8 w-8" />
              </div>
              <h1 className="mt-4 guardian-page-title">Guardian app is mobile-only</h1>
              <p className="mt-2 type-muted">
                For security and response speed, guardian workflows are restricted to phone devices or installed mobile PWA mode.
              </p>
              <div className="mt-5 space-y-2 text-left rounded-[var(--r-md)] border border-brand-orange/20 bg-brand-orange-light px-4 py-3 type-caption">
                <p>1. Open KimbAlert on your phone browser.</p>
                <p>2. Tap <strong>Add to Home Screen</strong> or <strong>Install App</strong>.</p>
                <p>3. Launch the installed app and continue to Guardian.</p>
              </div>
              <Link to="/" className="btn-interactive mt-5 inline-flex w-full items-center justify-center rounded-[var(--r-pill)] bg-brand-orange px-4 py-3 text-sm font-bold text-white shadow-orange">
                Back to website
              </Link>
            </section>
          </div>
        )}

        <ToastHost position="guardian" />
      </div>
    </PhoneFrame>
  );
}

function TabLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink to={to} className="flex flex-col items-center gap-1 py-1 tappable">
      {({ isActive }) => (
        <>
          <span className={isActive ? 'text-brand-orange' : 'text-slate-500'}>{icon}</span>
          <span className={`type-micro font-semibold ${isActive ? 'text-brand-orange' : 'text-slate-500'}`}>{label}</span>
        </>
      )}
    </NavLink>
  );
}

function useGuardianMobileGate() {
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    const evaluate = () => {
      const width = window.innerWidth;
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
      setAllowed(standalone || (width <= 900 && (touch || mobileUa)));
    };

    evaluate();
    window.addEventListener('resize', evaluate);
    return () => window.removeEventListener('resize', evaluate);
  }, []);

  return allowed;
}
