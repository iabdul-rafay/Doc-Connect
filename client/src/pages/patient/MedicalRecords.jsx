import { useState } from 'react';
import { HeartPulse, Droplet, Cake, AlertTriangle, Activity, Phone } from 'lucide-react';
import { PageHeader, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import api from '../../api/client';

const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function MedicalRecords() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const m = user?.medical || {};
  const [form, setForm] = useState({
    bloodGroup: m.bloodGroup || '',
    dateOfBirth: m.dateOfBirth || '',
    allergies: m.allergies || '',
    conditions: m.conditions || '',
    emergencyContact: m.emergencyContact || '',
  });
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.put('/users/me', { medical: form });
      updateUser(data.user);
      toast.success('Medical records updated.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Medical records" subtitle="Keep your health details handy — your doctor can see these on your visits." />

      <form onSubmit={save} className="grid gap-5 lg:grid-cols-3">
        <div className="card space-y-4 p-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label flex items-center gap-1.5"><Droplet size={14} /> Blood group</label>
              <select value={form.bloodGroup} onChange={set('bloodGroup')} className="field">
                {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b || 'Select…'}</option>)}
              </select>
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Cake size={14} /> Date of birth</label>
              <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} className="field" />
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-1.5"><AlertTriangle size={14} /> Allergies</label>
            <textarea rows={2} value={form.allergies} onChange={set('allergies')} className="field resize-none"
              placeholder="e.g. Penicillin, peanuts — or 'None'." />
          </div>

          <div>
            <label className="label flex items-center gap-1.5"><Activity size={14} /> Chronic conditions</label>
            <textarea rows={2} value={form.conditions} onChange={set('conditions')} className="field resize-none"
              placeholder="e.g. Asthma, hypertension, diabetes." />
          </div>

          <div>
            <label className="label flex items-center gap-1.5"><Phone size={14} /> Emergency contact</label>
            <input value={form.emergencyContact} onChange={set('emergencyContact')} className="field"
              placeholder="Name and phone number" />
          </div>

          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Save records'}
          </button>
        </div>

        {/* Summary card */}
        <div className="card h-fit space-y-4 p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <HeartPulse size={20} />
            </span>
            <div>
              <p className="font-semibold text-ink">{user?.name}</p>
              <p className="text-xs text-ink-soft">Health summary</p>
            </div>
          </div>
          <dl className="space-y-2 text-sm">
            <Row label="Blood group" value={form.bloodGroup} />
            <Row label="Date of birth" value={form.dateOfBirth} />
            <Row label="Allergies" value={form.allergies} />
            <Row label="Conditions" value={form.conditions} />
            <Row label="Emergency" value={form.emergencyContact} />
          </dl>
          <p className="rounded-lg bg-mist px-3 py-2 text-xs text-ink-soft">
            This information is private to you and the doctors you book with.
          </p>
        </div>
      </form>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line pb-2 last:border-0">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="max-w-[60%] text-right font-medium text-ink">{value || '—'}</dd>
    </div>
  );
}
