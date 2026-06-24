import { useEffect, useState } from 'react';
import { Search, MapPin, Stethoscope, Briefcase, Wallet, Star, CalendarPlus } from 'lucide-react';
import { PageHeader, PageLoader, EmptyState, Avatar, Modal, Spinner } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { todayISO } from '../../lib/format';
import api from '../../api/client';

export default function FindDoctors() {
  const toast = useToast();
  const [doctors, setDoctors] = useState([]);
  const [specs, setSpecs] = useState([]);
  const [filters, setFilters] = useState({ search: '', specialization: '', city: '' });
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null); // doctor being booked

  const load = (params = filters) => {
    setLoading(true);
    api
      .get('/doctors', { params })
      .then(({ data }) => setDoctors(data.doctors))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/doctors/meta/specializations').then(({ data }) => setSpecs(data.specializations));
    load();
  }, []); // eslint-disable-line

  const onSearch = (e) => {
    e.preventDefault();
    load();
  };

  return (
    <div>
      <PageHeader title="Find a doctor" subtitle="Search verified doctors and request an appointment." />

      <form onSubmit={onSearch} className="card mb-6 grid gap-3 p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3 top-3 text-faint" />
          <input
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Doctor name" className="field pl-10"
          />
        </div>
        <select
          value={filters.specialization}
          onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
          className="field"
        >
          <option value="">All specialties</option>
          {specs.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="relative">
          <MapPin size={18} className="pointer-events-none absolute left-3 top-3 text-faint" />
          <input
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            placeholder="City" className="field pl-10"
          />
        </div>
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {loading ? (
        <PageLoader />
      ) : doctors.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No doctors found"
          message="Try a different name, specialty, or city. Run the seed script to add demo doctors."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((d) => (
            <article key={d.id} className="card flex flex-col p-5">
              <div className="flex items-center gap-3">
                <Avatar name={d.name} src={d.avatar} size={52} />
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-ink">{d.name}</h3>
                  <p className="text-sm font-medium text-brand-700">{d.specialization}</p>
                </div>
              </div>

              <dl className="mt-4 space-y-1.5 text-sm text-ink-soft">
                {d.qualifications && (
                  <div className="flex items-center gap-2"><Star size={15} className="text-faint" />{d.qualifications}</div>
                )}
                <div className="flex items-center gap-2"><Briefcase size={15} className="text-faint" />{d.experienceYears} yrs experience</div>
                {d.city && <div className="flex items-center gap-2"><MapPin size={15} className="text-faint" />{d.city}</div>}
                <div className="flex items-center gap-2"><Wallet size={15} className="text-faint" />Rs. {d.fee} consultation</div>
              </dl>

              <button
                onClick={() => setBooking(d)}
                disabled={!d.acceptingPatients}
                className="btn-primary mt-5 w-full"
              >
                <CalendarPlus size={17} />
                {d.acceptingPatients ? 'Book appointment' : 'Not accepting patients'}
              </button>
            </article>
          ))}
        </div>
      )}

      <BookingModal doctor={booking} onClose={() => setBooking(null)} />
    </div>
  );
}

function BookingModal({ doctor, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({ date: todayISO(), time: '10:00', reason: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (doctor) setForm({ date: todayISO(), time: '10:00', reason: '' });
  }, [doctor]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/appointments', { doctorId: doctor.id, ...form });
      toast.success('Appointment requested. The doctor will confirm it.');
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!doctor} onClose={onClose} title={doctor ? `Book with ${doctor.name}` : ''}>
      {doctor && (
        <form onSubmit={submit} className="space-y-4">
          <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
            {doctor.specialization} · Rs. {doctor.fee} · Available {doctor.startTime}–{doctor.endTime}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="date">Date</label>
              <input id="date" type="date" min={todayISO()} required value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="time">Time</label>
              <input id="time" type="time" required value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })} className="field" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="reason">Reason for visit <span className="text-faint">(optional)</span></label>
            <textarea id="reason" rows={3} value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Brief description of your symptoms" className="field resize-none" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary flex-1">
              {busy ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Confirm booking'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
