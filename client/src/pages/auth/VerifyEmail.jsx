import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import AuthShell from '../../components/AuthShell';
import { Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');
  const ran = useRef(false); // guard against StrictMode double-run

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = params.get('token');
    if (!token) {
      setState('error');
      setMessage('No verification token was provided.');
      return;
    }

    api
      .get('/auth/verify-email', { params: { token } })
      .then(({ data }) => {
        setState('success');
        // Log the user straight in, then bounce to their dashboard.
        setSession(data.token, data.user);
        setTimeout(() => navigate(data.user.role === 'doctor' ? '/doctor' : '/patient', { replace: true }), 1400);
      })
      .catch((err) => {
        setState('error');
        setMessage(err.message);
      });
  }, []); // eslint-disable-line

  return (
    <AuthShell title="Email verification">
      <div className="card p-8 text-center">
        {state === 'verifying' && (
          <>
            <Spinner className="mx-auto h-9 w-9" />
            <p className="mt-4 text-ink-soft">Verifying your email…</p>
          </>
        )}

        {state === 'success' && (
          <>
            <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={30} />
            </span>
            <h2 className="text-lg font-semibold text-ink">You're verified!</h2>
            <p className="mt-1 text-sm text-ink-soft">Taking you to your dashboard…</p>
          </>
        )}

        {state === 'error' && (
          <>
            <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-rose-600">
              <XCircle size={30} />
            </span>
            <h2 className="text-lg font-semibold text-ink">Verification failed</h2>
            <p className="mt-1 text-sm text-ink-soft">{message}</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link to="/login" className="btn-outline">Go to sign in</Link>
              <Link to="/register" className="btn-primary">Register again</Link>
            </div>
          </>
        )}
      </div>
    </AuthShell>
  );
}
