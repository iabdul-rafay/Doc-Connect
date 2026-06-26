import { Link } from 'react-router-dom';
import { ShieldCheck, CalendarClock, Pill } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import ThemeToggle from './ThemeToggle';
import { LogoFull } from './Logo';

/**
 * Auth screen shell: a full-bleed animated background with a centered glass
 * card. Same props as before (title, subtitle, children, footer) so all auth
 * pages keep working unchanged.
 */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />

      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md animate-fade-up">
          <Link to="/" className="mb-6 flex justify-center">
            <LogoFull className="h-14 drop-shadow-sm sm:h-16" />
          </Link>

          <div className="glass-card rounded-3xl p-7 sm:p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-ink">{title}</h1>
              {subtitle && <p className="mt-1.5 text-sm text-ink-soft">{subtitle}</p>}
            </div>

            <div className="mt-6">{children}</div>

            {footer && <div className="mt-6 text-center text-sm text-ink-soft">{footer}</div>}
          </div>

          {/* trust badges */}
          <div className="mt-5 flex items-center justify-center gap-5 text-xs font-medium text-ink-soft">
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-brand-600" /> Verified accounts</span>
            <span className="flex items-center gap-1.5"><CalendarClock size={14} className="text-brand-600" /> Easy booking</span>
            <span className="flex items-center gap-1.5"><Pill size={14} className="text-brand-600" /> e-Prescriptions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
