'use client';

import { useEffect, useRef } from 'react';
import { portfolioConfig } from '@/lib/portfolio-config';
import { STICKERS, StickerArt } from './sticker-art';

type Body = {
  el: HTMLElement;
  r: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  speed: number;
  angle: number;
  tilt: number;
  /** 'wait' until its entrance delay, then 'fall' under gravity, then 'drift'. */
  phase: 'wait' | 'fall' | 'drift';
  /** Current opacity: stickers fade while they pass behind text. */
  alpha: number;
  /** Hover lift: grows slightly as the cursor comes close. */
  scale: number;
  rand: () => number;
  startAt: number;
  landY: number;
};

type Rect = { l: number; t: number; r: number; b: number };

/** Small seeded PRNG (mulberry32): deterministic, so every visit plays the same paths. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Text (and the see-through glass word) that stickers may drift behind: they fade there, so
 * it stays readable. Nothing is avoided outright: that traps stickers in the gaps between
 * blocks. Opaque content (project covers, buttons, the portrait) simply hides them, as depth.
 */
const TEXT = 'h1, h2, h3, h4, p, li, .closing-stack, .inflated-word';

/** Static spots near the screen edges for reduced motion (fractions of the viewport). */
const STILL_SPOTS: [number, number][] = [
  [0.06, 0.3],
  [0.94, 0.34],
  [0.05, 0.78],
  [0.95, 0.8],
  [0.5, 0.95],
  [0.92, 0.6],
];

/**
 * A fixed, full-viewport layer of decorative stickers that drift around the whole page.
 *
 * - Entrance: each sticker drops in from above the screen with its own delay and spin.
 * - Drift: a smooth wander (heading random-walk + steering), soft bounce off the screen
 *   edges and separation between stickers. Passing behind text, they fade so it stays
 *   readable. The cursor pushes nearby stickers away, tilts them and lifts them slightly.
 * - The layer sits behind the page content and ignores the pointer, so it can never block
 *   clicks, text selection or scrolling. Because it is fixed, stickers stay with you while
 *   you scroll, and nothing resets on scroll or theme change.
 * - Paths come from a seeded generator, so they are the same on every visit; the loop starts
 *   only after the page has loaded and the browser is idle.
 * - One rAF loop for all stickers, transforms only; paused while the tab is hidden.
 *   Phones get fewer, smaller, slower stickers. Reduced motion: still, at the screen edges.
 */
export function StickerField() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = root.current;
    if (!layer) return;
    const { field } = portfolioConfig.stickers;
    const small = window.innerWidth < 768;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const els = [...layer.querySelectorAll<HTMLElement>('[data-sticker]')];
    const count = small ? field.mobile : field.desktop;
    els.forEach((el, i) => (el.hidden = i >= count));
    const active = els.slice(0, count);
    let W = window.innerWidth;
    let H = window.innerHeight;
    layer.dataset.live = '';

    const render = (b: Body) => {
      b.el.style.transform = `translate3d(${(b.x - b.r).toFixed(1)}px, ${(b.y - b.r).toFixed(1)}px, 0) rotate(${b.angle.toFixed(2)}deg) scale(${(b.scale ?? 1).toFixed(3)})`;
      if (b.alpha !== undefined) b.el.style.opacity = b.alpha.toFixed(2);
    };

    if (reduced) {
      active.forEach((el, i) => {
        const r = el.offsetWidth / 2;
        const [fx, fy] = STILL_SPOTS[i % STILL_SPOTS.length];
        render({ el, r, x: fx * W, y: fy * H, angle: STICKERS[i].tilt } as Body);
      });
      return () => {
        delete layer.dataset.live;
      };
    }

    const bodies: Body[] = active.map((el, i) => {
      const r = el.offsetWidth / 2;
      const rand = seeded(0x9e3779b9 ^ ((i + 1) * 2654435761));
      return {
        el,
        r,
        rand,
        // Spread the drop points across the width so they don't arrive in a clump.
        x: ((i + 0.5) / active.length) * W + (rand() - 0.5) * (W / active.length) * 0.6,
        y: -r - 40 - rand() * 160,
        vx: (rand() - 0.5) * 0.6,
        vy: 0,
        heading: rand() * Math.PI * 2,
        speed: (small ? 0.35 : 0.55) + rand() * (small ? 0.25 : 0.45),
        angle: STICKERS[i].tilt + (rand() - 0.5) * 30,
        tilt: STICKERS[i].tilt,
        phase: 'wait',
        alpha: 1,
        scale: 1,
        startAt: Infinity, // set when the loop starts (after load + idle)
        landY: H * (0.25 + rand() * 0.5),
      };
    });
    bodies.forEach(render);

    // Content rectangles in view, refreshed on a timer and on scroll (throttled).
    let textRects: Rect[] = [];
    let lastScan = 0;
    const collect = (selector: string, pad: number) => {
      const rects: Rect[] = [];
      document.querySelectorAll<HTMLElement>(selector).forEach((node) => {
        if (node.closest('[data-sticker-field], .hud-top, .cursor-layer, dialog')) return;
        const rc = node.getBoundingClientRect();
        if (rc.width < 8 || rc.height < 8 || rc.bottom < -50 || rc.top > H + 50) return;
        rects.push({ l: rc.left - pad, t: rc.top - pad, r: rc.right + pad, b: rc.bottom + pad });
      });
      return rects;
    };
    const scan = () => {
      lastScan = performance.now();
      textRects = collect(TEXT, 4);
    };
    const overlaps = (b: Body, o: Rect) => !(b.x + b.r < o.l || b.x - b.r > o.r || b.y + b.r < o.t || b.y - b.r > o.b);
    const onScroll = () => {
      if (performance.now() - lastScan > 250) scan();
    };

    const pointer = { x: -9999, y: -9999 };
    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };
    const onLeave = () => {
      pointer.x = pointer.y = -9999;
    };

    let frame = 0;
    let last = 0;
    const step = (t: number) => {
      const dt = Math.min((t - (last || t)) / 16.67, 3);
      last = t;
      if (t - lastScan > 600) scan();
      const top = 84; // keep clear of the HUD row
      for (const b of bodies) {
        if (b.phase === 'wait') {
          if (t < b.startAt) continue;
          b.phase = 'fall';
        }
        if (b.phase === 'fall') {
          // Light object in air: gravity with drag, a little sideways sway, spinning down.
          b.vy = (b.vy + 0.32 * dt) * Math.pow(0.985, dt);
          b.vx += Math.sin(t / 380 + b.r) * 0.03 * dt;
          b.angle += b.vx * 1.2 * dt;
          if (b.y >= b.landY) {
            b.phase = 'drift';
            b.heading = Math.atan2(b.vy * 0.2, b.vx || 0.01);
            b.vy *= 0.25;
          }
        } else {
          // Wander: the heading takes a smooth random walk; velocity eases toward it.
          b.heading += (b.rand() - 0.5) * 0.18 * dt;
          let ax = (Math.cos(b.heading) * b.speed - b.vx) * 0.02;
          let ay = (Math.sin(b.heading) * b.speed - b.vy) * 0.02;

          // Screen edges: a soft spring inward, and the heading turns back toward the middle.
          const m = 16;
          if (b.x < b.r + m) ax += (b.r + m - b.x) * 0.004;
          if (b.x > W - b.r - m) ax -= (b.x - (W - b.r - m)) * 0.004;
          if (b.y < top + b.r) ay += (top + b.r - b.y) * 0.004;
          if (b.y > H - b.r - m) ay -= (b.y - (H - b.r - m)) * 0.004;
          if (b.x < b.r + m || b.x > W - b.r - m || b.y < top + b.r || b.y > H - b.r - m) {
            b.heading = Math.atan2(H / 2 - b.y, W / 2 - b.x) + (b.rand() - 0.5);
          }

          // Cursor: an eased push away from the pointer, a tilt, and a slight lift.
          let near = 0;
          if (finePointer) {
            const dx = b.x - pointer.x;
            const dy = b.y - pointer.y;
            const d = Math.hypot(dx, dy);
            const reach = field.cursorRadius + b.r;
            if (d > 0 && d < reach) {
              near = 1 - d / reach;
              const f = near ** 2 * 0.6;
              ax += (dx / d) * f;
              ay += (dy / d) * f;
            }
          }
          b.scale += (1 + near * 0.1 - b.scale) * 0.12 * dt;

          b.vx += ax * dt;
          b.vy += ay * dt;
          // Cap speed so a push never flings a sticker across the screen.
          const sp = Math.hypot(b.vx, b.vy);
          const max = b.speed * 4;
          if (sp > max) {
            b.vx *= max / sp;
            b.vy *= max / sp;
          }
          b.angle += ((b.tilt + b.vx * 6) - b.angle) * 0.04 * dt;
        }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        // Fade behind text so it stays readable; ease back to full opacity in open space.
        const behindText = b.phase === 'drift' && textRects.some((o) => overlaps(b, o));
        b.alpha += ((behindText ? 0.25 : 1) - b.alpha) * 0.08 * dt;
      }

      // Separation: stickers nudge apart instead of stacking.
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i];
          const c = bodies[j];
          if (a.phase === 'wait' || c.phase === 'wait') continue;
          const dx = c.x - a.x;
          const dy = c.y - a.y;
          const d = Math.hypot(dx, dy) || 1;
          const gap = a.r + c.r + 24;
          if (d < gap) {
            const push = ((gap - d) / gap) * 0.12 * dt;
            a.vx -= (dx / d) * push;
            a.vy -= (dy / d) * push;
            c.vx += (dx / d) * push;
            c.vy += (dy / d) * push;
          }
        }
      }

      bodies.forEach(render);
      frame = document.hidden ? 0 : requestAnimationFrame(step);
    };
    const start = () => {
      if (!frame && !document.hidden) {
        last = 0;
        frame = requestAnimationFrame(step);
      }
    };
    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      scan();
    };

    let idleHandle = 0;
    const begin = () => {
      const t0 = performance.now();
      bodies.forEach((b, i) => (b.startAt = t0 + field.delay * 1000 + i * field.stagger * 1000));
      scan();
      start();
    };
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const schedule = () => {
      if (idle) idleHandle = idle(begin, { timeout: 1500 });
      else idleHandle = window.setTimeout(begin, 200);
    };
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', start);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('load', schedule);
      (window as Window & { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback?.(idleHandle);
      window.clearTimeout(idleHandle);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', start);
      delete layer.dataset.live;
    };
  }, []);

  return (
    <div ref={root} aria-hidden="true" data-sticker-field className="sticker-layer">
      {STICKERS.map((sticker) => (
        <div key={sticker.kind} data-sticker className="sticker-drift" style={{ width: `calc(${sticker.size}px * var(--sticker-scale, 1))` }}>
          <StickerArt kind={sticker.kind} />
        </div>
      ))}
    </div>
  );
}
