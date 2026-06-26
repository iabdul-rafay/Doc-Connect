import { useEffect, useMemo, useRef } from 'react';

/**
 * Futuristic animated backdrop used across the whole app.
 *   variant="full"   → vivid: aurora + grid + orbs + particle network + mouse glow
 *   variant="subtle" → calm: faint aurora + soft grid + a few particles
 * Pure decoration, pointer-events-none. Skips the canvas when the user prefers
 * reduced motion.
 */
export default function AnimatedBackground({ variant = 'full' }) {
  const subtle = variant === 'subtle';
  const canvasRef = useRef(null);

  const orbs = useMemo(
    () => Array.from({ length: subtle ? 0 : 6 }, (_, i) => ({
      left: `${8 + i * 15}%`, size: 8 + ((i * 7) % 16),
      delay: `${i * 3.5}s`, duration: `${16 + (i % 4) * 4}s`,
    })),
    [subtle]
  );

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    if (reduce || !canvas) return;

    const ctx = canvas.getContext('2d');
    let raf, w, h, dpr;
    const mouse = { x: -9999, y: -9999 };
    const COUNT = subtle ? 26 : 52;
    const LINK = subtle ? 120 : 150;
    let pts = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const seed = () => {
      pts = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      }));
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      // links
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(16,185,129,${(1 - d / LINK) * (subtle ? 0.12 : 0.22)})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        // mouse glow link
        const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (dm < 160) {
          ctx.strokeStyle = `rgba(34,211,238,${(1 - dm / 160) * 0.4})`;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      // nodes
      for (const p of pts) {
        ctx.fillStyle = 'rgba(34,211,238,0.55)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };

    resize(); seed(); tick();
    window.addEventListener('resize', () => { resize(); seed(); });
    if (!subtle) { window.addEventListener('mousemove', onMove); window.addEventListener('mouseout', onLeave); }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseout', onLeave);
    };
  }, [subtle]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-canvas">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-canvas to-cyan-500/5 dark:from-brand-900/50 dark:via-canvas dark:to-cyan-600/10" />

      <div className={`aurora aurora-a -left-32 -top-24 h-[34rem] w-[34rem] ${subtle ? 'bg-brand-400/20' : 'bg-brand-400/50'}`} />
      <div className={`aurora aurora-b -right-32 top-10 h-[32rem] w-[32rem] ${subtle ? 'bg-cyan-400/15' : 'bg-cyan-400/45'}`} />
      <div className={`aurora aurora-c bottom-[-12rem] left-1/3 h-[36rem] w-[36rem] ${subtle ? 'bg-brand-600/15' : 'bg-brand-500/40'}`} />

      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className={`bg-grid absolute inset-0 ${subtle ? 'opacity-40' : ''}`} />

      {orbs.map((o, i) => (
        <span key={i} className="floating-orb bg-cyan-400/30"
          style={{ left: o.left, width: o.size, height: o.size, animationDelay: o.delay, animationDuration: o.duration }} />
      ))}
    </div>
  );
}
