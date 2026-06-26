import { useEffect, useRef } from 'react';

/**
 * Canvas field of soft glowing "healing" particles that drift upward and
 * gently react to the mouse. Lightweight; pauses for reduced-motion.
 */
export default function HealingParticles({ count = 46 }) {
  const ref = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf, w, h, dpr;
    const mouse = { x: -9999, y: -9999 };
    let pts = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const seed = () => {
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: 1 + Math.random() * 2.4,
        vy: -(0.2 + Math.random() * 0.6),
        vx: (Math.random() - 0.5) * 0.3,
        hue: Math.random() > 0.5 ? '16,185,129' : '34,211,238',
        a: 0.2 + Math.random() * 0.5,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        const boost = dm < 120 ? (1 - dm / 120) * 0.6 : 0;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.hue},${Math.min(1, p.a + boost)})`;
        ctx.shadowBlur = 12; ctx.shadowColor = `rgba(${p.hue},0.9)`;
        ctx.arc(p.x, p.y, p.r + boost * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };
    const onMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };

    resize(); seed();
    if (!reduce) draw(); else { /* draw a single static frame */ draw(); cancelAnimationFrame(raf); }
    window.addEventListener('resize', () => { resize(); seed(); });
    window.addEventListener('mousemove', onMove);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMove); };
  }, [count]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}
