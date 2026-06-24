import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, BadgeCheck, Clock, Mail, Phone, MapPin } from 'lucide-react';
import { PageHeader, PageLoader, EmptyState, Avatar, Modal, Spinner } from '../../components/ui';
import { useToast } from '../../components/Toast';
import api from '../../api/client';

export default function AdminUsers({ role }) {
  const toast = useToast();
  const label = role === 'doctor' ? 'doctor' : 'patient';

  const [users, setUsers] = useState([]);
  const [specs, setSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // user object or {} for new
  const [removing, setRemoving] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/admin/users', { params: { role } })
      .then(({ data }) => setUsers(data.users))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [role]); // eslint-disable-line

  useEffect(() => {
    load();
    if (role === 'doctor') api.get('/doctors/meta/specializations').then(({ data }) => setSpecs(data.specializations));
  }, [role, load]);

  const shown = users.filter(
    (u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase())
  );

  const confirmDelete = async () => {
    try {
      await api.delete(`/admin/users/${removing._id}`);
      toast.success(`${label[0].toUpperCase() + label.slice(1)} deleted.`);
      setRemoving(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title={role === 'doctor' ? 'Doctors' : 'Patients'}
        subtitle={`Add, edit, verify, or remove ${label} accounts.`}
        action={
          <button onClick={() => setEditing({})} className="btn-primary">
            <Plus size={17} /> Add {label}
          </button>
        }
      />

      {!loading && users.length > 0 && (
        <div className="relative mb-5 max-w-sm">
          <Search size={18} className="pointer-events-none absolute left-3 top-3 text-faint" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${label}s`} className="field pl-10" />
        </div>
      )}

      {loading ? (
        <PageLoader />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={role === 'doctor' ? BadgeCheck : Mail}
          title={users.length === 0 ? `No ${label}s yet` : 'No matches'}
          message={users.length === 0 ? `Add your first ${label} with the button above.` : 'Try a different search.'}
        />
      ) : (
        <div className="space-y-3">
          {shown.map((u) => (
            <div key={u._id} className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar name={u.name} src={u.avatar} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-ink">{u.name}</p>
                    {u.isVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        <BadgeCheck size={12} /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                        <Clock size={12} /> Unverified
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
                    <span className="flex items-center gap-1"><Mail size={13} className="text-faint" />{u.email}</span>
                    {u.phone && <span className="flex items-center gap-1"><Phone size={13} className="text-faint" />{u.phone}</span>}
                    {u.city && <span className="flex items-center gap-1"><MapPin size={13} className="text-faint" />{u.city}</span>}
                  </div>
                  {role === 'doctor' && u.doctorProfile && (
                    <p className="mt-1 text-sm font-medium text-brand-700">
                      {u.doctorProfile.specialization}
                      {u.doctorProfile.fee ? ` · Rs. ${u.doctorProfile.fee}` : ''}
                      {u.doctorProfile.experienceYears ? ` · ${u.doctorProfile.experienceYears} yrs` : ''}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(u)} className="btn-outline text-xs"><Pencil size={14} /> Edit</button>
                  <button onClick={() => setRemoving(u)} className="btn-danger text-xs"><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <UserModal user={editing} role={role} specs={specs} onClose={() => setEditing(null)} onSaved={load} />

      <Modal open={!!removing} onClose={() => setRemoving(null)} title={`Delete ${label}?`}>
        {removing && (
          <div>
            <p className="text-sm text-ink-soft">
              This permanently removes <span className="font-semibold text-ink">{removing.name}</span> and all their
              appointments and prescriptions. This can't be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setRemoving(null)} className="btn-outline flex-1">Cancel</button>
              <button onClick={confirmDelete} className="btn-danger flex-1">Delete permanently</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function UserModal({ user, role, specs, onClose, onSaved }) {
  const toast = useToast();
  const isNew = user && !user._id;
  const isDoctor = role === 'doctor';
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!user) return;
    const dp = user.doctorProfile || {};
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      city: user.city || '',
      isVerified: user.isVerified ?? true,
      specialization: dp.specialization || specs[0] || 'General Physician',
      qualifications: dp.qualifications || '',
      hospital: dp.hospital || '',
      experienceYears: dp.experienceYears ?? '',
      fee: dp.fee ?? '',
      availableDays: dp.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    });
  }, [user, specs]);

  if (!user || !form) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleDay = (day) =>
    set('availableDays', form.availableDays.includes(day) ? form.availableDays.filter((d) => d !== day) : [...form.availableDays, day]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const doctorProfile = isDoctor
        ? {
            specialization: form.specialization,
            qualifications: form.qualifications,
            hospital: form.hospital,
            experienceYears: Number(form.experienceYears) || 0,
            fee: Number(form.fee) || 0,
            availableDays: form.availableDays,
          }
        : undefined;

      if (isNew) {
        await api.post('/admin/users', {
          name: form.name, email: form.email, password: form.password, role,
          phone: form.phone, city: form.city, doctorProfile,
        });
        toast.success('Account created.');
      } else {
        await api.put(`/admin/users/${user._id}`, {
          name: form.name, email: form.email, phone: form.phone, city: form.city,
          isVerified: form.isVerified, doctorProfile,
        });
        toast.success('Account updated.');
      }
      onClose();
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!user} onClose={onClose} wide title={isNew ? `Add ${role}` : `Edit ${form.name}`}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Full name</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} className="field" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="field" required />
          </div>
          {isNew && (
            <div>
              <label className="label">Password</label>
              <input type="password" minLength={8} value={form.password} onChange={(e) => set('password', e.target.value)}
                placeholder="At least 8 characters" className="field" required />
            </div>
          )}
          <div>
            <label className="label">Phone</label>
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="field" />
          </div>
          <div>
            <label className="label">City</label>
            <input value={form.city} onChange={(e) => set('city', e.target.value)} className="field" />
          </div>
        </div>

        {isDoctor && (
          <div className="rounded-xl border border-line p-4">
            <p className="mb-3 text-sm font-semibold text-ink">Professional details</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Specialization</label>
                <select value={form.specialization} onChange={(e) => set('specialization', e.target.value)} className="field">
                  {specs.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Qualifications</label>
                <input value={form.qualifications} onChange={(e) => set('qualifications', e.target.value)} placeholder="MBBS, FCPS" className="field" />
              </div>
              <div>
                <label className="label">Hospital</label>
                <input value={form.hospital} onChange={(e) => set('hospital', e.target.value)} className="field" />
              </div>
              <div>
                <label className="label">Experience (years)</label>
                <input type="number" min={0} value={form.experienceYears} onChange={(e) => set('experienceYears', e.target.value)} className="field" />
              </div>
              <div>
                <label className="label">Fee (Rs.)</label>
                <input type="number" min={0} value={form.fee} onChange={(e) => set('fee', e.target.value)} className="field" />
              </div>
            </div>
            <label className="label mt-3">Working days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const on = form.availableDays.includes(day);
                return (
                  <button key={day} type="button" onClick={() => toggleDay(day)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${on ? 'bg-brand-600 text-white' : 'bg-mist text-ink-soft hover:bg-brand-50'}`}>
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!isNew && (
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={form.isVerified} onChange={(e) => set('isVerified', e.target.checked)}
              className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500" />
            <span className="text-sm text-ink">Email verified (can sign in)</span>
          </label>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary flex-1">
            {busy ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : isNew ? 'Create account' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
