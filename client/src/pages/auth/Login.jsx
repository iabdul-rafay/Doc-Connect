import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, HeartPulse, Stethoscope } from 'lucide-react';
import AuthShell from '../../components/AuthShell';
import { Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { homeFor } from '../../App';
import SocialAuth from '../../components/SocialAuth';
import { useLoader } from '../../components/loader/LoaderContext';
import api from '../../api/client';

export default function Login() {
  const { login, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const loader = useLoader();
  const [params] = useSearchParams();

  const [role, setRole] = useState('patient'); // which kind of account you're signing into
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);

  useEffect(() => {
    if (params.get('expired')) toast.info('Your session expired. Please sign in again.');
    if (params.get('verified')) toast.success('Email verified. You can sign in now.');
  }, []); // eslint-disable-line

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setNeedsVerify(false);
    try {
      const user = await login(form.email, form.password);

      // Admins can sign in from either toggle and go to their panel.
      if (user.role === 'admin') {
        toast.success('Welcome back, admin.');
        loader.flash(1500, 'Signing you in');
        navigate('/admin', { replace: true });
        return;
      }
      // Otherwise the chosen role must match the account's role.
      if (user.role !== role) {
        logout();
        toast.error(`This email is registered as a ${user.role}. Switch to "${user.role}" to sign in.`);
        setRole(user.role);
        return;
      }
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      loader.flash(1500, 'Signing you in');
      navigate(homeFor(user.role), { replace: true });
    } catch (err) {
      if (/not verified/i.test(err.message)) setNeedsVerify(true);
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await api.post('/auth/resend-verification', { email: form.email });
      toast.success('Verification link sent. Check your inbox.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Choose your account type and enter your details."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <RoleToggle role={role} setRole={setRole} />

        <div>
          <label className="label" htmlFor="email">Email</label>
          <div className="relative">
            <Mail size={18} className="pointer-events-none absolute left-3 top-3 text-faint" />
            <input id="email" name="email" type="email" required value={form.email}
              onChange={onChange} placeholder="you@example.com" className="field pl-10" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">Password</label>
            <Link to="/forgot-password" className="mb-1.5 text-xs font-medium text-brand-700 hover:underline">Forgot?</Link>
          </div>
          <div className="relative">
            <Lock size={18} className="pointer-events-none absolute left-3 top-3 text-faint" />
            <input id="password" name="password" type={showPw ? 'text' : 'password'} required
              value={form.password} onChange={onChange} placeholder="••••••••" className="field px-10" />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-3 text-faint hover:text-ink"
              aria-label={showPw ? 'Hide password' : 'Show password'}>
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {needsVerify && (
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your email isn't verified yet.{' '}
            <button type="button" onClick={resend} className="font-semibold underline">Resend verification link</button>
          </div>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : `Sign in as ${role}`}
        </button>

        <SocialAuth
          role={role}
          onSuccess={(u) => {
            toast.success(`Welcome, ${u.name.split(' ')[0]}!`);
            loader.flash(1500, 'Signing you in');
            navigate(homeFor(u.role), { replace: true });
          }}
        />
      </form>
    </AuthShell>
  );
}

export function RoleToggle({ role, setRole }) {
  const opts = [
    { value: 'patient', icon: HeartPulse, label: 'Patient' },
    { value: 'doctor', icon: Stethoscope, label: 'Doctor' },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-mist p-1.5">
      {opts.map(({ value, icon: Icon, label }) => {
        const active = role === value;
        return (
          <button
            key={value} type="button" onClick={() => setRole(value)} aria-pressed={active}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              active ? 'bg-brand-600 text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.7)]' : 'text-ink-soft hover:text-ink'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        );
      })}
    </div>
  );
}
