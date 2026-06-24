import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MailCheck } from 'lucide-react';
import AuthShell from '../../components/AuthShell';
import { Spinner } from '../../components/ui';
import { useToast } from '../../components/Toast';
import api from '../../api/client';

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to choose a new password."
      footer={<Link to="/login" className="font-semibold text-brand-700 hover:underline">Back to sign in</Link>}
    >
      {sent ? (
        <div className="card border-brand-100 bg-brand-50/60 p-6 text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white">
            <MailCheck size={28} />
          </span>
          <p className="text-ink">If <span className="font-semibold">{email}</span> is registered, a reset link is on its way.</p>
          <p className="mt-2 text-sm text-ink-soft">The link expires in one hour.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <div className="relative">
              <Mail size={18} className="pointer-events-none absolute left-3 top-3 text-faint" />
              <input id="email" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field pl-10" />
            </div>
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
