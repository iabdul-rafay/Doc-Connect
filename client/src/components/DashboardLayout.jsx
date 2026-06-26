import { useState } from 'react';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarClock, CalendarDays, Stethoscope, Pill, Users, Search,
  UserCircle, LogOut, Menu, X, ShieldCheck, HeartPulse,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui';
import ThemeToggle from './ThemeToggle';
import { LogoMark } from './Logo';
import AnimatedBackground from './AnimatedBackground';
import NotificationBell from './NotificationBell';

const PATIENT_NAV = [
  { to: '/patient', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/patient/doctors', label: 'Find doctors', icon: Search },
  { to: '/patient/appointments', label: 'My appointments', icon: CalendarClock },
  { to: '/patient/prescriptions', label: 'Prescriptions', icon: Pill },
  { to: '/patient/records', label: 'Medical records', icon: HeartPulse },
];

const DOCTOR_NAV = [
  { to: '/doctor', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/doctor/appointments', label: 'Appointments', icon: CalendarClock },
  { to: '/doctor/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/doctor/patients', label: 'Patients', icon: Users },
  { to: '/doctor/prescriptions', label: 'Prescriptions', icon: Pill },
  { to: '/doctor/profile', label: 'My profile', icon: Stethoscope },
];

const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/admin/patients', label: 'Patients', icon: HeartPulse },
];

const NAV_BY_ROLE = { patient: PATIENT_NAV, doctor: DOCTOR_NAV, admin: ADMIN_NAV };

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const nav = NAV_BY_ROLE[user.role] || PATIENT_NAV;
  const accountHref = `/${user.role}/account`;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
      isActive
        ? 'bg-brand-600 text-white shadow-[0_8px_24px_-8px_rgba(15,118,110,0.8)]'
        : 'text-brand-50/75 hover:bg-white/10 hover:text-white'
    }`;

  const SidebarContent = (
    <>
      <div className="flex items-center gap-2.5 px-2 pb-6 pt-1">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white p-1 shadow-sm">
          <LogoMark className="h-full w-full object-contain" />
        </span>
        <div>
          <p className="font-display text-lg font-bold leading-none text-white">DocConnect</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs capitalize text-brand-100/70">
            {user.role === 'admin' && <ShieldCheck size={11} />}{user.role} panel
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={linkClass} onClick={() => setOpen(false)}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 border-t border-white/10 pt-4">
        <NavLink to={accountHref} className={linkClass} onClick={() => setOpen(false)}>
          <UserCircle size={18} />
          Account settings
        </NavLink>
        <button
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-brand-50/75 transition-all hover:bg-white/10 hover:text-white"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen lg:flex">
      <AnimatedBackground variant="subtle" />
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col bg-brand-800 p-4 lg:flex">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-brand-800 p-4 animate-fade-in">
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-canvas/80 px-4 py-3 backdrop-blur-xl lg:px-8">
          <button
            className="rounded-lg p-2 text-ink hover:bg-mist lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-ink">{user.name}</p>
              <p className="text-xs text-ink-soft">{user.email}</p>
            </div>
            <Avatar name={user.name} src={user.avatar} size={38} />
          </div>
        </header>

        <main key={location.pathname} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 animate-fade-up lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
