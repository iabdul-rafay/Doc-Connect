import HealingParticles from './HealingParticles';

/**
 * Immersive loader backdrop: deep gradient wash, drifting neon mesh blobs,
 * faint medical-cross watermark, and the HealingParticles canvas on top.
 */
export default function PulseBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-canvas">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-canvas to-cyan-500/10 dark:from-brand-900/60 dark:via-canvas dark:to-cyan-600/15" />

      {/* drifting mesh blobs */}
      <div className="mesh-blob absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-400/30 blur-3xl" />
      <div className="mesh-blob absolute -bottom-32 right-[-6rem] h-[28rem] w-[28rem] rounded-full bg-cyan-400/25 blur-3xl" style={{ animationDelay: '2s' }} />

      {/* faint medical cross watermark */}
      <svg className="absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 opacity-[0.04]" viewBox="0 0 100 100" aria-hidden="true">
        <path fill="currentColor" className="text-brand-600" d="M40 10h20v30h30v20H60v30H40V60H10V40h30z" />
      </svg>

      <HealingParticles />
    </div>
  );
}
