import full from '../assets/logo-full.png';
import mark from '../assets/logo-mark.png';

// Full lockup (DC monogram + "DocConnect" wordmark) — for light backgrounds.
export function LogoFull({ className = 'h-12' }) {
  return <img src={full} alt="DocConnect" className={className} draggable="false" />;
}

// Compact DC monogram — for tight spaces (sidebar, favicon-like chips).
export function LogoMark({ className = 'h-9' }) {
  return <img src={mark} alt="DocConnect" className={className} draggable="false" />;
}
