import { useEffect, useRef, useState } from 'react';
import PulseBackground from './PulseBackground';
import AnimatedProgressBar from './AnimatedProgressBar';
import { LogoMark } from '../Logo';
import './loading.css';

/**
 * Fullscreen futuristic loading overlay. Driven by `active`:
 *  - while active, progress eases toward ~92%
 *  - when active flips false, it snaps to 100%, fades out, then unmounts
 */
export default function LoadingScreen({ active, label = 'Loading' }) {
  const [mounted, setMounted] = useState(active);
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const raf = useRef(null);
  const startedAt = useRef(0);

  // mount/unmount with fade-out
  useEffect(() => {
    if (active) {
      setMounted(true); setLeaving(false); setProgress(0); startedAt.current = performance.now();
    } else if (mounted) {
      setProgress(100);
      setLeaving(true);
      const t = setTimeout(() => setMounted(false), 500);
      return () => clearTimeout(t);
    }
  }, [active]); // eslint-disable-line

  // ease progress toward ~92% while active
  useEffect(() => {
    if (!mounted || leaving) return;
    const tick = () => {
      setProgress((p) => (p < 92 ? p + (92 - p) * 0.045 + 0.4 : p));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [mounted, leaving]);

  if (!mounted) return null;

  return (
    <div className={`loader-root fixed inset-0 z-[100] grid place-items-center ${leaving ? 'is-leaving' : ''}`}>
      <PulseBackground />

      <div className="relative flex flex-col items-center gap-8 px-6 text-center">
        {/* Core: logo + scanner rings + pulse rings */}
        <div className="relative grid h-32 w-32 place-items-center">
          <span className="pulse-ring" />
          <span className="pulse-ring" style={{ animationDelay: '0.8s' }} />
          <span className="pulse-ring" style={{ animationDelay: '1.6s' }} />
          <span className="scan-ring" />
          <span className="scan-ring reverse" />
          <span className="loader-core grid h-20 w-20 place-items-center rounded-full bg-surface shadow-[var(--shadow-glow)]">
            <LogoMark className="h-12 w-12 object-contain" />
          </span>
        </div>

        {/* ECG heartbeat line */}
        <svg viewBox="0 0 300 80" className="h-12 w-64 text-brand-500" fill="none" aria-hidden="true">
          <path d="M0 40 H110 L122 40 L132 16 L143 64 L154 8 L165 40 L300 40" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" />
          <path className="ecg-line" d="M0 40 H110 L122 40 L132 16 L143 64 L154 8 L165 40 L300 40"
            stroke="url(#ecgGrad)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <defs>
            <linearGradient id="ecgGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-brand-500)" />
              <stop offset="100%" stopColor="var(--color-cyan-400)" />
            </linearGradient>
          </defs>
        </svg>

        <div>
          <p className="text-lg font-semibold text-gradient">DocConnect</p>
          <p className="mt-0.5 text-sm text-ink-soft">{label}…</p>
        </div>

        <AnimatedProgressBar value={progress} />
      </div>
    </div>
  );
}
