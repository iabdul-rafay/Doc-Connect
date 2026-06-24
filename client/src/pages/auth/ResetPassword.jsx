import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import AuthShell from '../../components/AuthShell';
import { Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import api from '../../api/client';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const { setSession } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, password });
      setSession(data.token, data.user);
      toast.success('Password updated. You are signed in.');
      navigate(data.user.role === 'doctor' ? '/doctor' : '/patient', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <AuthShell title="Reset link invalid" subtitle="This link is missing its token.">
        <div className="card p-6 text-center">
          <p className="text-ink-soft">Please request a new password reset link.</p>
          <Link to="/forgot-password" className="btn-primary mt-5">Request new link</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      footer={<Link to="/login" className="font-semibold text-brand-700 hover:underline">Back to sign in</Link>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="password">New password</label>
          <div className="relative">
            <Lock size={18} className="pointer-events-none absolute left-3 top-3 text-faint" />
            <input id="password" type={showPw ? 'text' : 'password'} required minLength={8}
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters" className="field px-10" />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-3 text-faint hover:text-ink"
              aria-label={showPw ? 'Hide password' : 'Show password'}>
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Update password'}
        </button>
      </form>
    </AuthShell>
  );
}
