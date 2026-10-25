/**
 * Paper (light, default) / ink (dark) theme. Plain module (not 'use client') so the
 * server layout can inline the pre-paint script.
 */
export type Theme = 'light' | 'dark';

export const THEME_KEY = 'gt-theme';
export const THEME_COLORS: Record<Theme, string> = { light: '#eeece6', dark: '#09090b' };

/*
 * Runs in <head> before first paint: applies the stored choice, otherwise light.
 * The visitor's OS preference is deliberately not followed: paper is the site's identity,
 * and ink is one click away in the dock.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t==='dark'){document.documentElement.classList.add('dark');var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','${THEME_COLORS.dark}')}}catch(e){}})();`;

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
    const apply = () => theme.apply(next);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const doc = document as Document & { startViewTransition?: (update: () => void) => unknown };
    if (reduced) {
      apply();
    } else if (doc.startViewTransition) {
      // A whole-page crossfade: one snapshot of each theme, no per-element repaint storm.
      doc.startViewTransition(apply);
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
