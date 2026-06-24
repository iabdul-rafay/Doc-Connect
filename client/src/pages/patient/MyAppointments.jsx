import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, X, MessageSquare } from 'lucide-react';
import { PageHeader, PageLoader, EmptyState, Avatar, StatusBadge } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { formatDate } from '../../lib/format';
import api from '../../api/client';

const TABS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

export default function MyAppointments() {
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  const load = () => {
    setLoading(true);
    api
      .get('/appointments/mine')
      .then(({ data }) => setAppointments(data.appointments))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const cancel = async (id) => {
    try {
      await api.delete(`/appointments/${id}`);
      toast.success('Appointment cancelled.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const shown = tab === 'all' ? appointments : appointments.filter((a) => a.status === tab);

  return (
    <div>
      <PageHeader title="My appointments" subtitle="Track and manage your bookings." />

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
              tab === t ? 'bg-brand-600 text-white' : 'bg-surface text-ink-soft ring-1 ring-line hover:bg-mist'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={tab === 'all' ? 'No appointments yet' : `No ${tab} appointments`}
          message={tab === 'all' ? 'Book a doctor to see your appointments here.' : 'Nothing in this category right now.'}
          action={<Link to="/patient/doctors" className="btn-primary">Find a doctor</Link>}
        />
      ) : (
        <div className="space-y-3">
          {shown.map((a) => (
            <div key={a._id} className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar name={a.doctor?.name} src={a.doctor?.avatar} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{a.doctor?.name}</p>
                  <p className="text-sm text-ink-soft">{formatDate(a.date)} at {a.time}</p>
                </div>
                <StatusBadge status={a.status} />
                {['pending', 'confirmed'].includes(a.status) && (
                  <button onClick={() => cancel(a._id)} className="btn-danger text-xs">
                    <X size={15} /> Cancel
                  </button>
                )}
              </div>

              {a.reason && (
                <p className="mt-3 rounded-lg bg-mist px-3 py-2 text-sm text-ink-soft">
                  <span className="font-medium text-ink">Reason: </span>{a.reason}
                </p>
              )}
              {a.doctorNote && (
                <p className="mt-2 flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
                  <MessageSquare size={15} className="mt-0.5 shrink-0" />
                  <span><span className="font-medium">Doctor's note: </span>{a.doctorNote}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
