/**
 * Paper (light) / ink (dark) theme. Plain module (not 'use client') so the
 * server layout can inline the pre-paint script.
 */
export type Theme = 'light' | 'dark';

const THEME_KEY = 'gt-theme';
export const THEME_COLORS: Record<Theme, string> = { light: '#eeece6', dark: '#09090b' };

/*
 * Runs in <head> before first paint: a saved choice wins; with no saved choice the
 * visitor's system preference decides (dark → ink, otherwise paper). No flash either way.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','${THEME_COLORS.dark}')}}catch(e){}})();`;

const listeners = new Set<() => void>();

export const theme = {
  get(): Theme {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  set(next: Theme) {
    let applied = false;
    const apply = () => {
      if (applied) return;
      applied = true;
      theme.apply(next);
    };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    type Transition = { ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void> };
    const doc = document as Document & { startViewTransition?: (update: () => void) => Transition };
    if (reduced) {
      apply();
    } else if (doc.startViewTransition) {
      // A whole-page crossfade: one snapshot of each theme, no per-element repaint storm.
      const transition = doc.startViewTransition(apply);
      // A skipped or timed-out crossfade is harmless (the theme still applies): keep it quiet.
      const ignore = () => {};
      transition.ready.catch(ignore);
      transition.finished.catch(ignore);
      transition.updateCallbackDone.catch(ignore);
      // The transition's update waits for a rendered frame (never comes in a hidden or
      // throttled tab). Never let the switch depend on that: apply directly if it stalls.
      window.setTimeout(apply, 300);
    } else {
      // Fallback: colour transitions for one switch only (never during normal hovers).
      const html = document.documentElement;
      html.classList.add('theme-fading');
      apply();
      window.setTimeout(() => html.classList.remove('theme-fading'), 500);
    }
  },
  apply(next: Theme) {
    const html = document.documentElement;
    html.classList.toggle('dark', next === 'dark');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[next]);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage blocked: the choice simply lasts for this page view.
    }
    listeners.forEach((listener) => listener());
  },
};
