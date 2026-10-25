'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';
import { site } from '@/data/site';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Must match the delay of the `loader-failsafe` animation in globals.css. */
const FAILSAFE_MS = 2200;
/** Never hold the page longer than this, however slow the network is. */
const MAX_MS = 2400;
/** Below this the counter would flash by unreadably. */
const MIN_MS = 900;

/**
 * First-visit loader: a large counter and a full-width hairline that track real
 * readiness (web fonts + window load), then the sheet wipes upward to reveal the hero.
 *
 * Same contract as before: server-rendered, hidden by CSS unless <html data-intro="play">
 * (decided in <head> by lib/intro), cancels the CSS fail-safe when JS takes over, and is
 * skippable by key, wheel, touch or the button. Reduced motion never plays it.
 */
export function PageLoader() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const html = document.documentElement;
      const overlay = root.current;
      if (!overlay || html.dataset.intro !== 'play') return;

      const q = <T extends Element>(selector: string) => overlay.querySelector<T>(selector)!;
      const count = q<HTMLElement>('[data-count]');
      const bar = q<HTMLElement>('[data-bar]');
      const panel = q<HTMLElement>('[data-panel]');
      const backdrop = q<HTMLElement>('[data-backdrop]');
      const skip = q<HTMLButtonElement>('[data-skip]');

      // Too late to play (visitor scrolled, or the CSS fail-safe may already be fading it).
      if (window.scrollY > 4 || performance.now() > FAILSAFE_MS - 200) {
        html.removeAttribute('data-intro');
        return;
      }

      overlay.style.animation = 'none';
      window.clearTimeout((window as Window & { __introFailsafe?: number }).__introFailsafe);
      html.style.overflow = 'hidden';
      html.style.scrollbarGutter = 'stable';

      // Real readiness signals, each worth half of the bar.
      const ready = { fonts: false, load: document.readyState === 'complete' };
      document.fonts.ready.then(() => (ready.fonts = true)).catch(() => (ready.fonts = true));
      const onLoad = () => (ready.load = true);
      window.addEventListener('load', onLoad, { once: true });

      const shown = { value: 0 };
      const start = performance.now();
      let finished = false;
      let exiting: gsap.core.Timeline | null = null;

      const render = () => {
        const pct = Math.round(shown.value * 100);
        count.textContent = String(pct).padStart(3, '0');
        bar.style.transform = `scaleX(${shown.value})`;
      };

      const finish = () => {
        if (finished) return;
        finished = true;
        teardown();
        const hadFocus = overlay.contains(document.activeElement);
        html.removeAttribute('data-intro');
        html.style.removeProperty('overflow');
        html.style.removeProperty('scrollbar-gutter');
        gsap.set([backdrop, panel], { clearProps: 'all' });
        if (hadFocus) document.getElementById('main')?.focus({ preventScroll: true });
        ScrollTrigger.refresh();
      };

      const exit = (speed = 1) => {
        if (exiting) return;
        gsap.ticker.remove(update);
        exiting = gsap
          .timeline({ onComplete: finish })
          .to(shown, { value: 1, duration: 0.25 / speed, ease: 'power2.out', onUpdate: render })
          .to(panel, { yPercent: -12, autoAlpha: 0, duration: 0.35 / speed, ease: 'power2.in' })
          .to(backdrop, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.6 / speed, ease: 'power3.inOut' }, '<0.05');
      };

      // Ease the shown value toward the real target; exit once both signals are in.
      function update() {
        const elapsed = performance.now() - start;
        const target = (ready.fonts ? 0.5 : 0.2) + (ready.load ? 0.45 : 0.15);
        // Time-capped floor so a slow network still finishes by MAX_MS.
        const floor = Math.min(elapsed / MAX_MS, 1) * 0.95;
        shown.value += (Math.max(target, floor) - shown.value) * 0.12;
        render();
        if ((ready.fonts && ready.load && elapsed > MIN_MS) || elapsed > MAX_MS) exit();
      }
      gsap.ticker.add(update);

      const skipNow = () => exit(1.8);
      const onKey = (event: KeyboardEvent) => {
        if (['Escape', 'Enter', ' ', 'ArrowDown', 'PageDown', 'End', 'Tab'].includes(event.key)) {
          if (event.key !== 'Tab') event.preventDefault();
          skipNow();
        }
      };
      window.addEventListener('keydown', onKey);
      window.addEventListener('wheel', skipNow, { passive: true });
      window.addEventListener('touchmove', skipNow, { passive: true });
      skip.addEventListener('click', skipNow);
      skip.focus({ preventScroll: true });

      function teardown() {
        gsap.ticker.remove(update);
        window.removeEventListener('load', onLoad);
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('wheel', skipNow);
        window.removeEventListener('touchmove', skipNow);
        skip.removeEventListener('click', skipNow);
      }

      // Unmount mid-load (route change, Fast Refresh): never leave the page locked.
      return () => {
        teardown();
        if (!finished) {
          html.removeAttribute('data-intro');
          html.style.removeProperty('overflow');
          html.style.removeProperty('scrollbar-gutter');
        }
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} className="page-loader" role="region" aria-label="Loading">
      <div data-backdrop aria-hidden="true" className="absolute inset-0 bg-bg" />

      <div
        data-panel
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 px-[calc(var(--hud-pad)+0.75rem)] pb-[max(var(--hud-pad),env(safe-area-inset-bottom))]"
      >
        <div className="flex items-end justify-between gap-4 font-mono text-xs tracking-[0.08em] text-muted uppercase">
          <span>{site.name}</span>
          <span>Portfolio — loading</span>
        </div>
        <p
          data-count
          className="mt-2 font-heading text-[clamp(5.5rem,22vw,18rem)] leading-[0.8] font-extrabold tracking-[-0.05em] text-fg tabular-nums"
        >
          000
        </p>
        <div className="mt-4 h-px w-full bg-line-strong">
          <div data-bar className="h-full w-full origin-left scale-x-0 bg-fg" />
        </div>
      </div>

      <button
        data-skip
        type="button"
        className="absolute top-[max(var(--hud-pad),env(safe-area-inset-top))] right-[calc(var(--hud-pad)+0.75rem)] inline-flex h-9 items-center gap-2 rounded-full border border-line-strong px-4 font-mono text-xs tracking-[0.06em] text-muted uppercase transition-colors duration-200 hover:text-fg"
      >
        Skip
        <kbd className="rounded border border-line px-1.5 text-[10px] text-subtle [@media(pointer:coarse)]:hidden">Esc</kbd>
      </button>
    </div>
  );
}
