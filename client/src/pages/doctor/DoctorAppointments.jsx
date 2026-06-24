import { useEffect, useState } from 'react';
import { CalendarClock, Plus, Trash2, FileText, Check, X, ClipboardCheck } from 'lucide-react';
import { PageHeader, PageLoader, EmptyState, Avatar, StatusBadge, Modal, Spinner } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { formatDate } from '../../lib/format';
import api from '../../api/client';

const TABS = ['pending', 'confirmed', 'completed', 'cancelled', 'all'];

export default function DoctorAppointments() {
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [actingId, setActingId] = useState(null);
  const [prescribeFor, setPrescribeFor] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get('/appointments/doctor')
      .then(({ data }) => setAppointments(data.appointments))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const setStatus = async (id, status) => {
    setActingId(id);
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast.success(`Appointment ${status}.`);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActingId(null);
    }
  };

  const shown = tab === 'all' ? appointments : appointments.filter((a) => a.status === tab);

  return (
    <div>
      <PageHeader title="Appointments" subtitle="Respond to requests and prescribe medicines." />

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const count = t === 'all' ? appointments.length : appointments.filter((a) => a.status === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
                tab === t ? 'bg-brand-600 text-white' : 'bg-surface text-ink-soft ring-1 ring-line hover:bg-mist'
              }`}
            >
              {t} {count > 0 && <span className={tab === t ? 'text-brand-100' : 'text-faint'}>({count})</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <PageLoader />
      ) : shown.length === 0 ? (
        <EmptyState icon={CalendarClock} title={`No ${tab} appointments`} message="Nothing to show in this category." />
      ) : (
        <div className="space-y-3">
          {shown.map((a) => (
            <div key={a._id} className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar name={a.patient?.name} src={a.patient?.avatar} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{a.patient?.name}</p>
                  <p className="text-sm text-ink-soft">
                    {formatDate(a.date)} at {a.time}
                    {a.patient?.phone && <> · {a.patient.phone}</>}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>

              {a.reason && (
                <p className="mt-3 rounded-lg bg-mist px-3 py-2 text-sm text-ink-soft">
                  <span className="font-medium text-ink">Reason: </span>{a.reason}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {a.status === 'pending' && (
                  <>
                    <button onClick={() => setStatus(a._id, 'confirmed')} disabled={actingId === a._id} className="btn-primary text-xs">
                      <Check size={15} /> Accept
                    </button>
                    <button onClick={() => setStatus(a._id, 'cancelled')} disabled={actingId === a._id} className="btn-danger text-xs">
                      <X size={15} /> Decline
                    </button>
                  </>
                )}
                {a.status === 'confirmed' && (
                  <button onClick={() => setStatus(a._id, 'completed')} disabled={actingId === a._id} className="btn-ghost text-xs">
                    <ClipboardCheck size={15} /> Mark completed
                  </button>
                )}
                {['confirmed', 'completed'].includes(a.status) && (
                  <button onClick={() => setPrescribeFor(a)} className="btn-outline text-xs">
                    <FileText size={15} /> {a.hasPrescription ? 'Add another prescription' : 'Write prescription'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <PrescriptionModal appointment={prescribeFor} onClose={() => setPrescribeFor(null)} onSaved={load} />
    </div>
  );
}

const emptyMedicine = () => ({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });

function PrescriptionModal({ appointment, onClose, onSaved }) {
  const toast = useToast();
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicines, setMedicines] = useState([emptyMedicine()]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (appointment) {
      setDiagnosis('');
      setAdvice('');
      setFollowUpDate('');
      setMedicines([emptyMedicine()]);
    }
  }, [appointment]);

  const updateMed = (i, field, value) =>
    setMedicines((meds) => meds.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));
  const addMed = () => setMedicines((meds) => [...meds, emptyMedicine()]);
  const removeMed = (i) => setMedicines((meds) => meds.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    const cleaned = medicines.filter((m) => m.name.trim());
    if (cleaned.length === 0) {
      toast.error('Add at least one medicine with a name.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/prescriptions', {
        appointmentId: appointment._id,
        diagnosis,
        advice,
        followUpDate,
        medicines: cleaned,
      });
      toast.success('Prescription saved.');
      onClose();
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!appointment} onClose={onClose} wide
      title={appointment ? `Prescription for ${appointment.patient?.name}` : ''}>
      {appointment && (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="diagnosis">Diagnosis</label>
            <input id="diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Seasonal allergic rhinitis" className="field" />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="label mb-0">Medicines</span>
              <button type="button" onClick={addMed} className="btn-ghost px-3 py-1.5 text-xs">
                <Plus size={14} /> Add medicine
              </button>
            </div>
            <div className="space-y-3">
              {medicines.map((m, i) => (
                <div key={i} className="rounded-xl border border-line p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-faint">Medicine {i + 1}</span>
                    {medicines.length > 1 && (
                      <button type="button" onClick={() => removeMed(i)} className="text-rose-500 hover:text-rose-700" aria-label="Remove medicine">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={m.name} onChange={(e) => updateMed(i, 'name', e.target.value)}
                      placeholder="Name (e.g. Cetirizine)" className="field col-span-2" />
                    <input value={m.dosage} onChange={(e) => updateMed(i, 'dosage', e.target.value)}
                      placeholder="Dosage (e.g. 10mg)" className="field" />
                    <input value={m.frequency} onChange={(e) => updateMed(i, 'frequency', e.target.value)}
                      placeholder="Frequency (e.g. Once a day)" className="field" />
                    <input value={m.duration} onChange={(e) => updateMed(i, 'duration', e.target.value)}
                      placeholder="Duration (e.g. 7 days)" className="field" />
                    <input value={m.instructions} onChange={(e) => updateMed(i, 'instructions', e.target.value)}
                      placeholder="Instructions (e.g. After meals)" className="field" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="advice">Advice <span className="text-faint">(optional)</span></label>
              <textarea id="advice" rows={2} value={advice} onChange={(e) => setAdvice(e.target.value)}
                placeholder="Rest, fluids, etc." className="field resize-none" />
            </div>
            <div>
              <label className="label" htmlFor="followup">Follow-up date <span className="text-faint">(optional)</span></label>
              <input id="followup" type="date" value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)} className="field" />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary flex-1">
              {busy ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Save prescription'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
