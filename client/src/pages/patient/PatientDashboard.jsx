import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Clock, CheckCircle2, Activity, Search, Pill, ArrowRight, Heart } from 'lucide-react';
import { StatCard, PageLoader, StatusBadge, Avatar, EmptyState } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/format';
import api from '../../api/client';
import { DashboardSkeleton } from '../../components/Skeleton';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/appointments/patient/stats'), api.get('/appointments/mine')])
      .then(([s, a]) => {
        setStats(s.data.stats);
        setRecent(a.data.appointments.slice(0, 5));
      })
      .finally(() => setLoading(false));
    api.get('/users/me/favorites').then(({ data }) => setFavorites(data.doctors || [])).catch(() => {});
  }, []);

  if (loading) return <DashboardSkeleton stats={4} />;

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-ink">Hello, {user.name.split(' ')[0]} 👋</h1>
        <p className="mt-1 text-sm text-ink-soft">Here's a snapshot of your care.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Activity} label="Total appointments" value={stats.total} tone="brand" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} tone="amber" />
        <StatCard icon={CalendarClock} label="Confirmed" value={stats.confirmed} tone="brand" />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} tone="emerald" />
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/patient/doctors" className="card group flex items-center justify-between p-5 transition hover:border-brand-300">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Search size={22} />
            </span>
            <div>
              <p className="font-semibold text-ink">Find a doctor</p>
              <p className="text-sm text-ink-soft">Search by name, city, or specialty</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-faint transition group-hover:translate-x-1 group-hover:text-brand-600" />
        </Link>
        <Link to="/patient/prescriptions" className="card group flex items-center justify-between p-5 transition hover:border-brand-300">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <Pill size={22} />
            </span>
            <div>
              <p className="font-semibold text-ink">My prescriptions</p>
              <p className="text-sm text-ink-soft">View medicines your doctors prescribed</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-faint transition group-hover:translate-x-1 group-hover:text-brand-600" />
        </Link>
      </div>

      {/* Favorite doctors */}
      {favorites.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <Heart size={18} className="fill-rose-500 text-rose-500" /> Favorite doctors
            </h2>
            <Link to="/patient/doctors" className="text-sm font-medium text-brand-700 hover:underline">Find more</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((d, i) => (
              <Link key={d.id} to="/patient/doctors" style={{ '--i': i }}
                className="card stagger flex items-center gap-3 p-4 transition-shadow hover:shadow-[var(--shadow-glow)]">
                <Avatar name={d.name} src={d.avatar} size={44} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{d.name}</p>
                  <p className="truncate text-sm text-brand-700">{d.specialization}</p>
                  {d.city && <p className="text-xs text-ink-soft">{d.city} · Rs. {d.fee}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent appointments */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Recent appointments</h2>
          <Link to="/patient/appointments" className="text-sm font-medium text-brand-700 hover:underline">
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No appointments yet"
            message="Book your first appointment with a doctor to get started."
            action={<Link to="/patient/doctors" className="btn-primary">Find a doctor</Link>}
          />
        ) : (
          <div className="card divide-y divide-line">
            {recent.map((a) => (
              <div key={a._id} className="flex items-center gap-4 p-4">
                <Avatar name={a.doctor?.name} src={a.doctor?.avatar} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{a.doctor?.name}</p>
                  <p className="text-sm text-ink-soft">{formatDate(a.date)} · {a.time}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
