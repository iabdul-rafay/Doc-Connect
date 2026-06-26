import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock } from 'lucide-react';
import { PageHeader, PageLoader, EmptyState, Avatar, StatusBadge } from '../../components/ui';
import { useToast } from '../../components/Toast';
import api from '../../api/client';

function prettyDate(iso) {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tmr = new Date(today); tmr.setDate(tmr.getDate() + 1);
  if (d.getTime() === today.getTime()) return 'Today';
  if (d.getTime() === tmr.getTime()) return 'Tomorrow';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}

export default function DoctorSchedule() {
  const toast = useToast();
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/appointments/doctor')
      .then(({ data }) => setAppts(data.appointments || []))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const groups = useMemo(() => {
    const todayISO = new Date().toISOString().slice(0, 10);
    const upcoming = appts
      .filter((a) => (a.date || '').slice(0, 10) >= todayISO && ['pending', 'confirmed'].includes(a.status))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const byDate = {};
    upcoming.forEach((a) => {
      const key = (a.date || '').slice(0, 10);
      (byDate[key] = byDate[key] || []).push(a);
    });
    return Object.entries(byDate);
  }, [appts]);

  const total = groups.reduce((s, [, list]) => s + list.length, 0);

  return (
    <div>
      <PageHeader title="My schedule" subtitle="Your upcoming confirmed and pending visits, by day." />

      {loading ? (
        <PageLoader />
      ) : groups.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Nothing scheduled" message="Upcoming confirmed and pending appointments will appear here as an agenda." />
      ) : (
        <>
          <p className="mb-4 text-sm text-ink-soft">{total} upcoming appointment{total !== 1 ? 's' : ''} across {groups.length} day{groups.length !== 1 ? 's' : ''}.</p>
          <div className="space-y-6">
            {groups.map(([date, list], gi) => (
              <div key={date} className="stagger" style={{ '--i': gi }}>
                <div className="mb-2 flex items-center gap-2">
                  <CalendarDays size={16} className="text-brand-600" />
                  <h3 className="font-semibold text-ink">{prettyDate(date)}</h3>
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{list.length}</span>
                </div>
                <div className="card divide-y divide-line">
                  {list.map((a) => (
                    <div key={a._id} className="flex items-center gap-4 p-4">
                      <div className="flex w-16 shrink-0 flex-col items-center rounded-lg bg-mist py-2">
                        <Clock size={14} className="text-brand-600" />
                        <span className="mt-0.5 text-sm font-semibold text-ink">{a.time}</span>
                      </div>
                      <Avatar name={a.patient?.name} src={a.patient?.avatar} size={42} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">{a.patient?.name}</p>
                        {a.reason && <p className="truncate text-sm text-ink-soft">{a.reason}</p>}
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
