import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Stethoscope, CalendarClock, Pill, ShieldCheck, HeartPulse, ArrowRight } from 'lucide-react';
import { StatCard, PageLoader } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import api from '../../api/client';
import { DashboardSkeleton } from '../../components/Skeleton';
import { DonutCard, BarCard } from '../../components/Charts';

export default function AdminDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/stats')
      .then(({ data }) => setStats(data.stats))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  if (loading) return <DashboardSkeleton stats={6} />;

  return (
    <div className="space-y-7">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <ShieldCheck className="text-brand-600" /> Admin overview
        </h1>
        <p className="mt-1 text-sm text-ink-soft">Welcome, {user.name}. Manage every account and record on the platform.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={HeartPulse} label="Patients" value={stats.patients} tone="brand" />
        <StatCard icon={Stethoscope} label="Doctors" value={stats.doctors} tone="emerald" />
        <StatCard icon={ShieldCheck} label="Verified accounts" value={stats.verified} tone="brand" />
        <StatCard icon={CalendarClock} label="Appointments" value={stats.appointments} tone="amber" />
        <StatCard icon={Pill} label="Prescriptions" value={stats.prescriptions} tone="emerald" />
        <StatCard icon={Users} label="Total users" value={stats.patients + stats.doctors} tone="brand" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DonutCard title="User base" subtitle="By role"
          data={[{ name: 'Patients', value: stats.patients }, { name: 'Doctors', value: stats.doctors }].filter((d) => d.value > 0)} />
        <BarCard title="Platform activity" subtitle="Totals" color="#06b6d4"
          data={[
            { name: 'Appts', value: stats.appointments },
            { name: 'Scripts', value: stats.prescriptions },
            { name: 'Verified', value: stats.verified },
            { name: 'Users', value: stats.patients + stats.doctors },
          ]} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ManageCard to="/admin/doctors" icon={Stethoscope} title="Manage doctors"
          text="Add, edit, verify, or remove doctors and their professional details." />
        <ManageCard to="/admin/patients" icon={HeartPulse} title="Manage patients"
          text="Add, edit, verify, or remove patient accounts." />
      </div>
    </div>
  );
}

function ManageCard({ to, icon: Icon, title, text }) {
  return (
    <Link to={to} className="card group flex items-center justify-between p-5 transition-all hover:border-brand-300 hover:shadow-[var(--shadow-glow)]">
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Icon size={22} />
        </span>
        <div>
          <p className="font-semibold text-ink">{title}</p>
          <p className="text-sm text-ink-soft">{text}</p>
        </div>
      </div>
      <ArrowRight size={18} className="text-faint transition-transform group-hover:translate-x-1 group-hover:text-brand-600" />
    </Link>
  );
}
