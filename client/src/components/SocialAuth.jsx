import { useEffect, useRef, useState } from 'react';
import { useToast } from './Toast';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function loadGsi() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.getElementById('gsi-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.id = 'gsi-script';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google script'));
    document.head.appendChild(s);
  });
}

/**
 * "Continue with Google / Apple" buttons.
 * - Google works once VITE_GOOGLE_CLIENT_ID (client) and GOOGLE_CLIENT_ID
 *   (server) are set. The chosen role is used when creating a brand-new account.
 * - Apple is shown for completeness; wiring it requires an Apple Developer
 *   account, so it explains that when tapped.
 */
export default function SocialAuth({ role = 'patient', onSuccess }) {
  const toast = useToast();
  const { googleLogin } = useAuth();
  const googleDivRef = useRef(null);
  const roleRef = useRef(role);
  const [ready, setReady] = useState(false);
  roleRef.current = role;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    loadGsi()
      .then(() => {
        if (cancelled || !googleDivRef.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async ({ credential }) => {
            try {
              const user = await googleLogin(credential, roleRef.current);
              onSuccess?.(user);
            } catch (err) {
              toast.error(err.message);
            }
          },
        });
        const width = Math.min(400, googleDivRef.current.offsetWidth || 360);
        const dark = document.documentElement.classList.contains('dark');
        window.google.accounts.id.renderButton(googleDivRef.current, {
          type: 'standard',
          theme: dark ? 'filled_black' : 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'center',
          width,
        });
        setReady(true);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []); // eslint-disable-line

  const googleUnconfigured = () =>
    toast.info('Google sign-in isn’t configured yet. Add a Google Client ID — see SOCIAL_LOGIN.md.');
  const appleUnavailable = () =>
    toast.info('Apple sign-in needs an Apple Developer account to enable. See SOCIAL_LOGIN.md.');

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs font-medium text-faint">
        <span className="h-px flex-1 bg-line" /> or continue with <span className="h-px flex-1 bg-line" />
      </div>

      {/* Google */}
      {GOOGLE_CLIENT_ID ? (
        <div className="flex justify-center [color-scheme:light]">
          <div ref={googleDivRef} className="w-full" />
          {!ready && <SocialButton onClick={() => {}} label="Loading Google…" icon={<GoogleIcon />} />}
        </div>
      ) : (
        <SocialButton onClick={googleUnconfigured} label="Continue with Google" icon={<GoogleIcon />} />
      )}

      {/* Apple */}
      <SocialButton onClick={appleUnavailable} label="Continue with Apple" icon={<AppleIcon />} />
    </div>
  );
}

function SocialButton({ onClick, label, icon }) {
  return (
    <button type="button" onClick={onClick}
      className="flex w-full items-center justify-center gap-2.5 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-all hover:bg-mist active:scale-[0.98]">
      {icon} {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 0-24c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C39.9 41.4 44 36.4 44 28c0-1.3-.1-2.5-.4-3.7z" />
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.36 1.43c.04 1.06-.36 2.1-1.05 2.86-.7.78-1.85 1.38-2.9 1.3-.07-1.02.4-2.1 1.06-2.78.74-.77 1.97-1.34 2.89-1.38zM20.5 17.1c-.5 1.15-.74 1.66-1.38 2.68-.9 1.42-2.16 3.2-3.74 3.21-1.4.02-1.76-.92-3.66-.9-1.9 0-2.3.92-3.7.9-1.58-.02-2.78-1.62-3.68-3.04-2.5-3.96-2.77-8.6-1.22-11.07 1.1-1.75 2.83-2.78 4.46-2.78 1.66 0 2.7.92 4.07.92 1.33 0 2.14-.92 4.06-.92 1.45 0 2.99.79 4.08 2.16-3.59 1.97-3 7.1.41 8.84z" />
    </svg>
  );
}
