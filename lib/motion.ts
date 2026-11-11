/*
 * Motion preference: reduced when the system asks for it (prefers-reduced-motion) or when the
 * visitor switches Motion off in the header. The visitor's choice persists (localStorage) and is
 * applied before first paint as html[data-motion="off"], which also stills every CSS animation.
 * Plain module (no React), so the server layout can inline the pre-paint script; the hooks
 * live in use-motion.ts.
 */

const KEY = 'gt-motion';
const listeners = new Set<() => void>();
let query: MediaQueryList | null = null;
const system = () => (query ??= window.matchMedia('(prefers-reduced-motion: reduce)'));
const emit = () => listeners.forEach((listener) => listener());

export const motionScript = `(function(){try{if(localStorage.getItem('${KEY}')==='off')document.documentElement.dataset.motion='off'}catch(e){}})();`;

export const motion = {
  /** The visitor's own switch. */
  enabled: () => document.documentElement.dataset.motion !== 'off',
  /** Whether non-essential motion should be reduced right now. */
  reduced: () => system().matches || !motion.enabled(),
  set(on: boolean) {
    if (on) delete document.documentElement.dataset.motion;
    else document.documentElement.dataset.motion = 'off';
    try {
      localStorage.setItem(KEY, on ? 'on' : 'off');
    } catch {}
    emit();
  },
  subscribe(listener: () => void) {
    if (!listeners.size) system().addEventListener('change', emit);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (!listeners.size) system().removeEventListener('change', emit);
    };
  },
};
