import { Link } from 'react-router-dom';
import { Plus, ShieldCheck, CalendarClock, Pill } from 'lucide-react';

/**
 * Two-column shell for all auth screens: a calm branded panel on the left and
 * the form on the right. Collapses to a single column on mobile.
 */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-800 p-12 text-white lg:flex">
        <div className="ambient -right-24 -top-24 h-80 w-80 bg-brand-500/40" />
        <div className="ambient -bottom-32 -left-16 h-80 w-80 bg-brand-400/30" style={{ animationDelay: '-6s' }} />

        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
            <Plus size={22} strokeWidth={3} />
          </span>
          <span className="font-display text-xl font-bold">Doc-Connect</span>
        </Link>

        <div className="relative max-w-sm">
          <h2 className="font-display text-3xl font-bold leading-tight">
            Healthcare appointments, without the waiting room queue.
          </h2>
          <p className="mt-4 text-brand-100/80">
            Find the right doctor, book in seconds, and keep every prescription in one place.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-brand-50/90">
            <li className="flex items-center gap-3">
              <CalendarClock size={18} className="text-brand-200" /> Book and track appointments live
            </li>
            <li className="flex items-center gap-3">
              <Pill size={18} className="text-brand-200" /> Digital prescriptions from your doctor
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-brand-200" /> Verified accounts for everyone
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-brand-100/50">© {new Date().getFullYear()} Doc-Connect</p>
      </div>

      {/* Form panel */}
      <div className="flex min-h-screen items-center justify-center px-5 py-12 lg:px-12">
        <div className="w-full max-w-md animate-fade-up">
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
              <Plus size={20} strokeWidth={3} />
            </span>
            <span className="font-display text-lg font-bold text-ink">Doc-Connect</span>
          </Link>

          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-soft">{subtitle}</p>}

          <div className="mt-7">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-ink-soft">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
