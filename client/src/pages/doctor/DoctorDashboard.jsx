import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CalendarClock, CheckCircle2, Users, Pill, Activity, ArrowRight } from 'lucide-react';
import { StatCard, PageLoader, Avatar, EmptyState, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { formatDate } from '../../lib/format';
import api from '../../api/client';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const load = () => {
    Promise.all([
      api.get('/doctors/me/stats'),
      api.get('/appointments/doctor', { params: { status: 'pending' } }),
    ])
      .then(([s, a]) => {
        setStats(s.data.stats);
        setPending(a.data.appointments.slice(0, 5));
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const respond = async (id, status) => {
    setActingId(id);
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast.success(`Appointment ${status}.`);
      setLoading(true);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActingId(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-ink">Welcome, {user.name} 🩺</h1>
        <p className="mt-1 text-sm text-ink-soft">Your practice at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Clock} label="Pending requests" value={stats.pending} tone="amber" />
        <StatCard icon={CalendarClock} label="Confirmed" value={stats.confirmed} tone="brand" />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} tone="emerald" />
        <StatCard icon={Users} label="Patients" value={stats.uniquePatients} tone="brand" />
        <StatCard icon={Pill} label="Prescriptions" value={stats.prescriptions} tone="emerald" />
        <StatCard icon={Activity} label="Total appointments" value={stats.totalAppointments} tone="brand" />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">New appointment requests</h2>
          <Link to="/doctor/appointments" className="text-sm font-medium text-brand-700 hover:underline">
            Manage all <ArrowRight size={14} className="inline" />
          </Link>
        </div>

        {pending.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No pending requests" message="You're all caught up. New requests will show here." />
        ) : (
          <div className="space-y-3">
            {pending.map((a) => (
              <div key={a._id} className="card flex flex-wrap items-center gap-4 p-4">
                <Avatar name={a.patient?.name} src={a.patient?.avatar} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{a.patient?.name}</p>
                  <p className="text-sm text-ink-soft">{formatDate(a.date)} at {a.time}</p>
                  {a.reason && <p className="mt-1 text-sm text-ink-soft">“{a.reason}”</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => respond(a._id, 'confirmed')} disabled={actingId === a._id} className="btn-primary text-xs">
                    {actingId === a._id ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Accept'}
                  </button>
                  <button onClick={() => respond(a._id, 'cancelled')} disabled={actingId === a._id} className="btn-danger text-xs">
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
