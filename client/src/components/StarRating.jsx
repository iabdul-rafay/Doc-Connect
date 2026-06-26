import { useState } from 'react';
import { Star } from 'lucide-react';

export function Stars({ value = 0, size = 16 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size}
          className={i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-faint'} />
      ))}
    </span>
  );
}

export function StarInput({ value, onChange, size = 26 }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="inline-flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onMouseEnter={() => setHover(i)} onClick={() => onChange(i)}
          aria-label={`${i} star${i > 1 ? 's' : ''}`} className="transition-transform hover:scale-110">
          <Star size={size}
            className={i <= (hover || value) ? 'fill-amber-400 text-amber-400' : 'text-faint'} />
        </button>
      ))}
    </span>
  );
}
