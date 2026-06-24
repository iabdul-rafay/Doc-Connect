import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { PageHeader, PageLoader, Spinner } from '../../components/ui';
import { useToast } from '../../components/Toast';
import api from '../../api/client';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DoctorProfile() {
  const toast = useToast();
  const [specs, setSpecs] = useState([]);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/doctors/me/profile'), api.get('/doctors/meta/specializations')])
      .then(([p, s]) => {
        setSpecs(s.data.specializations);
        const d = p.data.doctor;
        setForm({
          specialization: d.specialization || 'General Physician',
          qualifications: d.qualifications || '',
          licenseNumber: d.licenseNumber || '',
          hospital: d.hospital || '',
          experienceYears: d.experienceYears ?? 0,
          fee: d.fee ?? 0,
          about: d.about || '',
          availableDays: d.availableDays || [],
          startTime: d.startTime || '09:00',
          endTime: d.endTime || '17:00',
          acceptingPatients: d.acceptingPatients ?? true,
        });
      })
      .catch((err) => toast.error(err.message));
  }, []); // eslint-disable-line

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const toggleDay = (day) =>
    setForm((f) => ({
      ...f,
      availableDays: f.availableDays.includes(day)
        ? f.availableDays.filter((d) => d !== day)
        : [...f.availableDays, day],
    }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put('/doctors/me/profile', {
        ...form,
        experienceYears: Number(form.experienceYears),
        fee: Number(form.fee),
      });
      toast.success('Profile saved. Patients can now see your details.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!form) return <PageLoader />;

  return (
    <div>
      <PageHeader title="My profile" subtitle="This is what patients see in the doctor directory." />

      <form onSubmit={submit} className="space-y-6">
        <section className="card p-6">
          <h2 className="mb-4 text-base font-semibold text-ink">Professional details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Specialization</label>
              <select value={form.specialization} onChange={(e) => set('specialization', e.target.value)} className="field">
                {specs.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Qualifications</label>
              <input value={form.qualifications} onChange={(e) => set('qualifications', e.target.value)}
                placeholder="e.g. MBBS, FCPS" className="field" />
            </div>
            <div>
              <label className="label">License / PMDC number</label>
              <input value={form.licenseNumber} onChange={(e) => set('licenseNumber', e.target.value)}
                placeholder="e.g. 12345-P" className="field" />
            </div>
            <div>
              <label className="label">Hospital / Clinic</label>
              <input value={form.hospital} onChange={(e) => set('hospital', e.target.value)}
                placeholder="e.g. Shifa International" className="field" />
            </div>
            <div>
              <label className="label">Years of experience</label>
              <input type="number" min={0} max={60} value={form.experienceYears}
                onChange={(e) => set('experienceYears', e.target.value)} className="field" />
            </div>
            <div>
              <label className="label">Consultation fee (Rs.)</label>
              <input type="number" min={0} value={form.fee}
                onChange={(e) => set('fee', e.target.value)} className="field" />
            </div>
          </div>
          <div className="mt-4">
            <label className="label">About you</label>
            <textarea rows={3} value={form.about} onChange={(e) => set('about', e.target.value)}
              placeholder="A short bio patients will see." className="field resize-none" />
          </div>
        </section>

        <section className="card p-6">
          <h2 className="mb-4 text-base font-semibold text-ink">Availability</h2>
          <label className="label">Working days</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const on = form.availableDays.includes(day);
              return (
                <button key={day} type="button" onClick={() => toggleDay(day)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    on ? 'bg-brand-600 text-white' : 'bg-mist text-ink-soft hover:bg-mist'
                  }`}>
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Start time</label>
              <input type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} className="field" />
            </div>
            <div>
              <label className="label">End time</label>
              <input type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} className="field" />
            </div>
          </div>
          <label className="mt-4 flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={form.acceptingPatients}
              onChange={(e) => set('acceptingPatients', e.target.checked)}
              className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500" />
            <span className="text-sm text-ink">Currently accepting new patients</span>
          </label>
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : <><Save size={17} /> Save profile</>}
          </button>
        </div>
      </form>
    </div>
  );
}
