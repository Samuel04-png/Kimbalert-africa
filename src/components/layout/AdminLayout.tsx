import React from 'react';
import { Activity, AlertTriangle, BarChart3, Bell, Home, Settings, Shield, Users } from 'lucide-react';
import { NavLink, Outlet, matchPath, useLocation } from 'react-router-dom';
import ToastHost from '../common/ToastHost';

const hiddenSidebarPatterns = ['/admin/alerts/:id/resolve', '/admin/alerts/:id/tip/:tipId'];

export default function AdminLayout() {
  const location = useLocation();
  const hideSidebar = hiddenSidebarPatterns.some((pattern) => matchPath(pattern, location.pathname));

  return (
    <div className="admin-app min-h-screen bg-[#0b1220] text-slate-200">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        {!hideSidebar ? (
          <aside className="hidden w-64 shrink-0 border-r border-slate-700 bg-[#101827] p-4 md:block">
            <div className="mb-6 flex items-center gap-3 px-2">
              <img
                src="/Kimbalert-africa_logo.png"
                alt="KimbAlert Africa"
                className="h-10 w-10 rounded-[var(--r-md)] object-contain bg-white p-1 shadow-xs"
              />
              <div>
                <p className="font-display text-xl font-bold">KimbAlert</p>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Command Center</p>
              </div>
            </div>
            <AdminNav />
          </aside>
        ) : null}

        <section className="min-w-0 flex-1">
          <Outlet />
        </section>
      </div>

      {!hideSidebar ? (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-700 bg-[#101827]/95 px-3 pb-4 pt-2 backdrop-blur md:hidden">
          <div className="grid grid-cols-5 gap-1">
            <MobileTab to="/admin/dashboard" icon={<Home className="h-4.5 w-4.5" />} label="Dash" />
            <MobileTab to="/admin/alerts" icon={<AlertTriangle className="h-4.5 w-4.5" />} label="Alerts" />
            <MobileTab to="/admin/registry" icon={<Users className="h-4.5 w-4.5" />} label="Registry" />
            <MobileTab to="/admin/analytics" icon={<BarChart3 className="h-4.5 w-4.5" />} label="Analytics" />
            <MobileTab to="/admin/settings" icon={<Settings className="h-4.5 w-4.5" />} label="Settings" />
          </div>
        </nav>
      ) : null}

      <ToastHost position="admin" />
    </div>
  );
}

function AdminNav() {
  return (
    <div className="space-y-1">
      <SideLink to="/admin/dashboard" icon={<Activity className="h-4.5 w-4.5" />} label="Dashboard" />
      <SideLink to="/admin/alerts" icon={<AlertTriangle className="h-4.5 w-4.5" />} label="Alert Queue" />
      <SideLink to="/admin/registry" icon={<Users className="h-4.5 w-4.5" />} label="Registry" />
      <SideLink to="/admin/partners" icon={<Shield className="h-4.5 w-4.5" />} label="Partners" />
      <SideLink to="/admin/analytics" icon={<BarChart3 className="h-4.5 w-4.5" />} label="Analytics" />
      <SideLink to="/admin/notifications" icon={<Bell className="h-4.5 w-4.5" />} label="Notifications" />
      <SideLink to="/admin/settings" icon={<Settings className="h-4.5 w-4.5" />} label="Settings" />
    </div>
  );
}

function SideLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded-[var(--r-sm)] px-3 py-2 text-sm font-medium transition-[var(--transition-fast)] ${
          isActive
            ? 'bg-brand-orange/15 text-brand-orange'
            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

function MobileTab({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink to={to} className="flex flex-col items-center gap-1 py-1">
      {({ isActive }) => (
        <>
          <span className={isActive ? 'text-brand-orange' : 'text-slate-400'}>{icon}</span>
          <span className={`type-micro ${isActive ? 'text-brand-orange' : 'text-slate-400'}`}>{label}</span>
        </>
      )}
    </NavLink>
  );
}
