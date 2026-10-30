'use client';

import { useEffect, useRef } from 'react';
import { portfolioConfig } from '@/lib/portfolio-config';

const CINEMATIC = '(min-width: 768px) and (prefers-reduced-motion: no-preference)';

/**
 * Hyperspace warp: a 2D-canvas starfield (no WebGL needed) inside a CSS sticky stage.
 *
 * Scroll never gets hijacked: ScrollTrigger only reports progress and velocity. Star
 * speed follows scroll velocity (streaks stretch while you scroll, relax when you stop),
 * and each statement flies toward the viewer across its third of the section.
 *
 * Cost control: the engine (GSAP + ScrollTrigger, warp-engine.ts) is imported only when the
 * browser is idle after load or the section comes near, so it never competes with the first
 * render. The tall layout is set at hydration, so the page height is final early (anchor links
 * land correctly). The loop runs only while the stage is on screen and the tab is visible.
 * Phones and reduced motion get a normal-height section with the statements stacked and one
 * static frame.
 */
export function WarpTunnel() {
  const root = useRef<HTMLElement>(null);
  const { statements, stars: starCount } = portfolioConfig.warp;

  useEffect(() => {
    const section = root.current;
    if (!section) return;
    // The tall sticky layout exists only once JS drives it; server HTML is the calm one.
    if (window.matchMedia(CINEMATIC).matches) section.dataset.live = 'true';

    let stop: (() => void) | null = null;
    let cancelled = false;
    let idleHandle = 0;
    const load = () => {
      if (stop || cancelled) return;
      stop = () => {};
      void import('./warp-engine').then(({ startWarp }) => {
        if (!cancelled) stop = startWarp(section, starCount);
      });
    };
    const near = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && load(), { rootMargin: '1200px 0px' });
    near.observe(section);
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const schedule = () => {
      if (idle) idleHandle = idle(load, { timeout: 4000 });
      else idleHandle = window.setTimeout(load, 2000);
    };
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });

    return () => {
      cancelled = true;
      near.disconnect();
      window.removeEventListener('load', schedule);
      (window as Window & { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback?.(idleHandle);
      window.clearTimeout(idleHandle);
      stop?.();
      delete section.dataset.live;
    };
  }, [starCount]);

  return (
    <section ref={root} id="warp" aria-labelledby="warp-title" className="warp">
      <div className="warp-stage">
        <canvas aria-hidden="true" className="warp-canvas" />
        <h2 id="warp-title" className="sr-only">
          What I care about
        </h2>
        <ol className="warp-lines">
          {statements.map((statement) => (
            <li key={statement} data-statement className="warp-line">
              {statement}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
