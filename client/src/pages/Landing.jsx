import { Link } from 'react-router-dom';
import { Plus, CalendarClock, Pill, ShieldCheck, Stethoscope, HeartPulse, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { homeFor } from '../App';
import ThemeToggle from '../components/ThemeToggle';

export default function Landing() {
  const { user } = useAuth();
  const dashboardHref = user ? homeFor(user.role) : '/register';

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            <Plus size={20} strokeWidth={3} />
          </span>
          <span className="font-display text-lg font-bold text-ink">Doc-Connect</span>
        </div>
        <nav className="flex items-center gap-2">
          <ThemeToggle className="mr-1" />
          {user ? (
            <Link to={dashboardHref} className="btn-primary">Go to dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn-outline">Sign in</Link>
              <Link to="/register" className="btn-primary">Get started</Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl overflow-hidden px-5 pb-8 pt-12 lg:pt-20">
        <div className="ambient -left-20 top-0 h-72 w-72 bg-brand-300/30" />
        <div className="ambient right-0 top-24 h-72 w-72 bg-brand-500/20" style={{ animationDelay: '-8s' }} />
        <div className="relative grid items-center gap-12 lg:grid-cols-2">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 ring-1 ring-brand-100">
              <ShieldCheck size={15} /> Verified doctors & patients
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.1] text-ink sm:text-5xl">
              Book the right doctor,{' '}
              <span className="text-gradient">skip the waiting room.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-ink-soft">
              Doc-Connect links patients and doctors in one place — search by specialty, book in
              seconds, and keep every appointment and prescription organized.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={dashboardHref} className="btn-primary px-5 py-3 text-base">
                {user ? 'Go to dashboard' : 'Create your account'} <ArrowRight size={18} />
              </Link>
              {!user && <Link to="/login" className="btn-outline px-5 py-3 text-base">I already have an account</Link>}
            </div>
          </div>

          {/* Role cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <RoleCard
              icon={HeartPulse} title="For patients"
              points={['Search verified doctors', 'Book & track appointments', 'View digital prescriptions']}
            />
            <RoleCard
              icon={Stethoscope} title="For doctors" highlight
              points={['Manage appointment requests', 'Keep a patient list', 'Write prescriptions & medicines']}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          <Feature icon={CalendarClock} title="Appointments" text="Request, confirm, and track every visit with live status updates." />
          <Feature icon={Pill} title="Prescriptions" text="Doctors prescribe medicines with dosage and instructions, stored for patients." />
          <Feature icon={ShieldCheck} title="Email verified" text="Every account confirms their email before they can sign in." />
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-sm text-ink-soft">
        © {new Date().getFullYear()} Doc-Connect — a doctor appointment management platform.
      </footer>
    </div>
  );
}

function RoleCard({ icon: Icon, title, points, highlight }) {
  return (
    <div className={`card p-6 ${highlight ? 'ring-2 ring-brand-200' : ''}`}>
      <span className={`mb-4 grid h-11 w-11 place-items-center rounded-xl ${highlight ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'}`}>
        <Icon size={22} />
      </span>
      <h3 className="font-semibold text-ink">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-ink-soft">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" /> {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Feature({ icon: Icon, title, text }) {
  return (
    <div className="card p-6">
      <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
        <Icon size={22} />
      </span>
      <h3 className="font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm text-ink-soft">{text}</p>
    </div>
  );
}
