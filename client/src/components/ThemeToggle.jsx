import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className={`relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-line bg-surface text-ink-soft transition-colors hover:text-brand-600 ${className}`}
    >
      <Sun
        size={18}
        className={`absolute transition-all duration-300 ${dark ? 'translate-y-6 rotate-90 opacity-0' : 'translate-y-0 rotate-0 opacity-100'}`}
      />
      <Moon
        size={18}
        className={`absolute transition-all duration-300 ${dark ? 'translate-y-0 rotate-0 opacity-100' : '-translate-y-6 -rotate-90 opacity-0'}`}
      />
    </button>
  );
}
