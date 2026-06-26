/**
 * Glowing green→cyan progress bar with a live percentage and a shimmer sweep.
 */
export default function AnimatedProgressBar({ value = 0 }) {
  const pct = Math.round(value);
  return (
    <div className="w-72 max-w-[80vw]">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-ink-soft">
        <span>Preparing your dashboard</span>
        <span className="tabular-nums font-semibold text-brand-600">{pct}%</span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-mist">
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, var(--color-brand-500), var(--color-cyan-400))',
            boxShadow: '0 0 14px rgba(34,211,238,0.7)',
          }}
        >
          <span className="bar-shimmer absolute top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
      </div>
    </div>
  );
}
