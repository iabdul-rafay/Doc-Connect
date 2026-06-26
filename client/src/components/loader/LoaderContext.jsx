import { createContext, useCallback, useContext, useRef, useState } from 'react';
import LoadingScreen from './LoadingScreen';

const LoaderContext = createContext(null);

/**
 * Global loading-screen controller.
 *   begin(label)   → show the loader until end() is called
 *   end()          → hide it
 *   flash(ms,label)→ show, then auto-hide after ms (returns a promise)
 */
export function LoaderProvider({ children }) {
  const [active, setActive] = useState(false);
  const [label, setLabel] = useState('Loading');
  const timer = useRef(null);

  const begin = useCallback((lbl = 'Loading') => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    setLabel(lbl); setActive(true);
  }, []);

  const end = useCallback(() => setActive(false), []);

  const flash = useCallback((ms = 1600, lbl = 'Loading') => {
    setLabel(lbl); setActive(true);
    if (timer.current) clearTimeout(timer.current);
    return new Promise((resolve) => {
      timer.current = setTimeout(() => { setActive(false); timer.current = null; resolve(); }, ms);
    });
  }, []);

  return (
    <LoaderContext.Provider value={{ active, begin, end, flash }}>
      {children}
      <LoadingScreen active={active} label={label} />
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  const ctx = useContext(LoaderContext);
  if (!ctx) return { begin: () => {}, end: () => {}, flash: () => Promise.resolve() };
  return ctx;
}
