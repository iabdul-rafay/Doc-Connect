import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, X, MessageSquare, Star } from 'lucide-react';
import { PageHeader, PageLoader, EmptyState, Avatar, StatusBadge, Modal, Spinner } from '../../components/ui';
import { Stars, StarInput } from '../../components/StarRating';
import { useToast } from '../../components/Toast';
import { formatDate } from '../../lib/format';
import api from '../../api/client';

const TABS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

export default function MyAppointments() {
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [reviews, setReviews] = useState({}); // appointmentId -> {rating}
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [reviewing, setReviewing] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/appointments/mine'), api.get('/reviews/mine')])
      .then(([a, r]) => {
        setAppointments(a.data.appointments);
        const map = {};
        r.data.reviews.forEach((rv) => { if (rv.appointment) map[rv.appointment] = rv; });
        setReviews(map);
      })
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
      <PageHeader title="My appointments" subtitle="Track your bookings and review doctors after a visit." />

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
              tab === t ? 'bg-brand-600 text-white' : 'bg-surface text-ink-soft ring-1 ring-line hover:bg-mist'
            }`}>
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
          {shown.map((a, i) => (
            <div key={a._id} className="card stagger p-4 sm:p-5" style={{ '--i': i }}>
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
                {a.status === 'completed' && (
                  reviews[a._id] ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      <Stars value={reviews[a._id].rating} size={12} /> Reviewed
                    </span>
                  ) : (
                    <button onClick={() => setReviewing(a)} className="btn-ghost text-xs">
                      <Star size={14} /> Leave a review
                    </button>
                  )
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

      <ReviewModal appointment={reviewing} onClose={() => setReviewing(null)} onSaved={load} />
    </div>
  );
}

function ReviewModal({ appointment, onClose, onSaved }) {
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (appointment) { setRating(5); setComment(''); }
  }, [appointment]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/reviews', {
        doctorId: appointment.doctor?._id,
        appointmentId: appointment._id,
        rating,
        comment,
      });
      toast.success('Thanks for your review!');
      onClose();
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!appointment} onClose={onClose} title={appointment ? `Review ${appointment.doctor?.name}` : ''}>
      {appointment && (
        <form onSubmit={submit} className="space-y-4">
          <div className="flex flex-col items-center gap-2 py-2">
            <StarInput value={rating} onChange={setRating} />
            <span className="text-sm text-ink-soft">{['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rating]}</span>
          </div>
          <div>
            <label className="label">Comment <span className="text-faint">(optional)</span></label>
            <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience to help other patients." className="field resize-none" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary flex-1">
              {busy ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Submit review'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
