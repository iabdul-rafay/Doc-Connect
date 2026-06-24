import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Mail, Lock, Stethoscope, HeartPulse, Eye, EyeOff, MailCheck,
  ArrowRight, ArrowLeft, Check,
} from 'lucide-react';
import AuthShell from '../../components/AuthShell';
import { Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import api from '../../api/client';

const ROLES = [
  { value: 'patient', icon: HeartPulse, title: "I'm a patient", blurb: 'Find doctors, book visits, get prescriptions.' },
  { value: 'doctor', icon: Stethoscope, title: "I'm a doctor", blurb: 'Manage appointments, patients & prescriptions.' },
];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();

  const [role, setRole] = useState('patient');
  const [step, setStep] = useState(1); // doctors use step 2 for professional details
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [specs, setSpecs] = useState([]);

  const [form, setForm] = useState({ name: '', email: '', password: '', city: '', phone: '' });
  const [profile, setProfile] = useState({
    specialization: '', qualifications: '', licenseNumber: '', hospital: '',
    experienceYears: '', fee: '', about: '',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '09:00', endTime: '17:00',
  });

  useEffect(() => {
    api.get('/doctors/meta/specializations').then(({ data }) => {
      setSpecs(data.specializations);
      setProfile((p) => ({ ...p, specialization: data.specializations[0] || 'General Physician' }));
    });
  }, []);

  const setF = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const setP = (field, value) => setProfile((p) => ({ ...p, [field]: value }));
  const toggleDay = (day) =>
    setProfile((p) => ({
      ...p,
      availableDays: p.availableDays.includes(day)
        ? p.availableDays.filter((d) => d !== day)
        : [...p.availableDays, day],
    }));

  const changeRole = (r) => { setRole(r); setStep(1); };

  const accountValid = () => {
    if (!form.name || !form.email || form.password.length < 8) {
      toast.error('Fill in your name, email, and a password of at least 8 characters.');
      return false;
    }
    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!accountValid()) { setStep(1); return; }

    const payload = { ...form, role };
    if (role === 'doctor') {
      payload.doctorProfile = {
        ...profile,
        experienceYears: Number(profile.experienceYears) || 0,
        fee: Number(profile.fee) || 0,
      };
    }

    setBusy(true);
    try {
      await register(payload);
      setSentTo(form.email);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await api.post('/auth/resend-verification', { email: sentTo });
      toast.success('Verification link sent again.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ── Success: account created, must verify before login ──────────────────
  if (sentTo) {
    return (
      <AuthShell title="Check your inbox" subtitle="One quick step to activate your account.">
        <div className="card animate-scale-in border-brand-100 bg-brand-50/60 p-6 text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white">
            <MailCheck size={28} />
          </span>
          <p className="text-ink">We sent a verification link to <span className="font-semibold">{sentTo}</span>.</p>
          <p className="mt-2 text-sm text-ink-soft">Click the link to verify your address. You can't sign in until it's verified.</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button onClick={resend} className="btn-outline">Resend link</button>
            <Link to="/login" className="btn-primary">Go to sign in</Link>
          </div>
        </div>
        <p className="mt-5 text-center text-xs text-ink-soft">
          Using the default email setup? The verification link is printed in the server console.
        </p>
      </AuthShell>
    );
  }

  const isDoctor = role === 'doctor';

  return (
    <AuthShell
      title="Create your account"
      subtitle={isDoctor ? 'Doctors share their details so patients can find them.' : 'Pick how you’ll use Doc-Connect.'}
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-brand-700 hover:underline">Sign in</Link></>}
    >
      {/* Role cards */}
      <div className="grid grid-cols-2 gap-3">
        {ROLES.map(({ value, icon: Icon, title, blurb }) => {
          const active = role === value;
          return (
            <button key={value} type="button" onClick={() => changeRole(value)} aria-pressed={active}
              className={`rounded-2xl border-2 p-4 text-left transition-all ${
                active ? 'border-brand-600 bg-brand-50' : 'border-line bg-surface hover:border-brand-200'
              }`}>
              <span className={`mb-2 grid h-10 w-10 place-items-center rounded-xl ${active ? 'bg-brand-600 text-white' : 'bg-mist text-faint'}`}>
                <Icon size={20} />
              </span>
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="mt-0.5 text-xs text-ink-soft">{blurb}</p>
            </button>
          );
        })}
      </div>

      {/* Doctor step indicator */}
      {isDoctor && (
        <div className="mt-5 flex items-center gap-2 text-xs font-medium text-ink-soft">
          <StepDot n={1} step={step} label="Account" />
          <span className="h-px flex-1 bg-line" />
          <StepDot n={2} step={step} label="Professional" />
        </div>
      )}

      <form onSubmit={submit} className="mt-5 space-y-4">
        {/* Step 1: account basics (always for patients; step 1 for doctors) */}
        {(!isDoctor || step === 1) && (
          <div className="animate-fade-up space-y-4">
            <Labeled label="Full name" icon={User}>
              <input name="name" required value={form.name} onChange={setF}
                placeholder={isDoctor ? 'Dr. Sara Khan' : 'Ali Ahmed'} className="field pl-10" />
            </Labeled>
            <Labeled label="Email" icon={Mail}>
              <input name="email" type="email" required value={form.email} onChange={setF}
                placeholder="you@example.com" className="field pl-10" />
            </Labeled>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={18} className="pointer-events-none absolute left-3 top-3 text-faint" />
                <input name="password" type={showPw ? 'text' : 'password'} required minLength={8}
                  value={form.password} onChange={setF} placeholder="At least 8 characters" className="field px-10" />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-3 text-faint hover:text-ink"
                  aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">City <span className="text-faint">(optional)</span></label>
                <input name="city" value={form.city} onChange={setF} placeholder="Islamabad" className="field" />
              </div>
              <div>
                <label className="label">Phone <span className="text-faint">(optional)</span></label>
                <input name="phone" value={form.phone} onChange={setF} placeholder="+92 3xx xxxxxxx" className="field" />
              </div>
            </div>

            {isDoctor ? (
              <button type="button" onClick={() => accountValid() && setStep(2)} className="btn-primary w-full">
                Next: professional details <ArrowRight size={17} />
              </button>
            ) : (
              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Create account'}
              </button>
            )}
          </div>
        )}

        {/* Step 2: doctor professional details */}
        {isDoctor && step === 2 && (
          <div className="animate-fade-up space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Specialization</label>
                <select value={profile.specialization} onChange={(e) => setP('specialization', e.target.value)} className="field" required>
                  {specs.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Qualifications</label>
                <input value={profile.qualifications} onChange={(e) => setP('qualifications', e.target.value)} placeholder="MBBS, FCPS" className="field" />
              </div>
              <div>
                <label className="label">License / PMDC #</label>
                <input value={profile.licenseNumber} onChange={(e) => setP('licenseNumber', e.target.value)} placeholder="12345-P" className="field" />
              </div>
              <div className="col-span-2">
                <label className="label">Hospital / Clinic</label>
                <input value={profile.hospital} onChange={(e) => setP('hospital', e.target.value)} placeholder="Shifa International" className="field" />
              </div>
              <div>
                <label className="label">Experience (years)</label>
                <input type="number" min={0} max={60} value={profile.experienceYears} onChange={(e) => setP('experienceYears', e.target.value)} placeholder="5" className="field" />
              </div>
              <div>
                <label className="label">Consultation fee (Rs.)</label>
                <input type="number" min={0} value={profile.fee} onChange={(e) => setP('fee', e.target.value)} placeholder="2000" className="field" />
              </div>
            </div>
            <div>
              <label className="label">About you</label>
              <textarea rows={2} value={profile.about} onChange={(e) => setP('about', e.target.value)} placeholder="A short bio patients will see." className="field resize-none" />
            </div>
            <div>
              <label className="label">Working days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const on = profile.availableDays.includes(day);
                  return (
                    <button key={day} type="button" onClick={() => toggleDay(day)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${on ? 'bg-brand-600 text-white' : 'bg-mist text-ink-soft hover:bg-brand-50'}`}>
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start time</label>
                <input type="time" value={profile.startTime} onChange={(e) => setP('startTime', e.target.value)} className="field" />
              </div>
              <div>
                <label className="label">End time</label>
                <input type="time" value={profile.endTime} onChange={(e) => setP('endTime', e.target.value)} className="field" />
              </div>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="btn-outline flex-1">
                <ArrowLeft size={16} /> Back
              </button>
              <button type="submit" disabled={busy} className="btn-primary flex-1">
                {busy ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : <><Check size={16} /> Create account</>}
              </button>
            </div>
          </div>
        )}
      </form>
    </AuthShell>
  );
}

function StepDot({ n, step, label }) {
  const done = step > n;
  const active = step === n;
  return (
    <span className="flex items-center gap-1.5">
      <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold ${
        active ? 'bg-brand-600 text-white' : done ? 'bg-brand-500 text-white' : 'bg-mist text-faint'
      }`}>
        {done ? <Check size={12} /> : n}
      </span>
      <span className={active ? 'text-ink' : ''}>{label}</span>
    </span>
  );
}

function Labeled({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <Icon size={18} className="pointer-events-none absolute left-3 top-3 text-faint" />
        {children}
      </div>
    </div>
  );
}
