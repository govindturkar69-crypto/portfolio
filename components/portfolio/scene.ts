'use client';

import { useEffect, useRef, type RefObject } from 'react';

/*
 * Tiny 3D-on-canvas toolkit shared by the About universe and the Work galaxy.
 *
 * No 3D library: a handful of rotations and a perspective divide on a 2D canvas are enough
 * for rings, particles and wireframes, and cost a few kilobytes instead of a WebGL engine.
 * Canvas 2D is supported everywhere, so there is no separate WebGL fallback to maintain.
 */

export type Vec3 = [number, number, number];

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);

export function rotX([x, y, z]: Vec3, a: number): Vec3 {
  const c = Math.cos(a), s = Math.sin(a);
  return [x, y * c - z * s, y * s + z * c];
}

export function rotY([x, y, z]: Vec3, a: number): Vec3 {
  const c = Math.cos(a), s = Math.sin(a);
  return [x * c + z * s, y, -x * s + z * c];
}

export function rotZ([x, y, z]: Vec3, a: number): Vec3 {
  const c = Math.cos(a), s = Math.sin(a);
  return [x * c - y * s, x * s + y * c, z];
}

/** A camera looking at the origin from -z; `s` is the perspective scale, `z` the view depth. */
export type Camera = { yaw: number; pitch: number; dist: number; scale: number; cx: number; cy: number };
export type Projected = { x: number; y: number; s: number; z: number };

export function view(p: Vec3, cam: Camera): Vec3 {
  return rotX(rotY(p, cam.yaw), cam.pitch);
}

export function project(v: Vec3, cam: Camera): Projected {
  const s = cam.dist / (cam.dist + v[2]);
  return { x: cam.cx + v[0] * s * cam.scale, y: cam.cy + v[1] * s * cam.scale, s, z: v[2] };
}

/** Deterministic PRNG (mulberry32) so particle layouts match on every visit. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Frame = {
  ctx: CanvasRenderingContext2D;
  /** CSS pixels. */
  w: number;
  h: number;
  /** Scene time in seconds; it only advances while the scene is running. */
  t: number;
  dt: number;
  /** Smoothed pointer position relative to the canvas centre, -1…1 (mouse only). */
  px: number;
  py: number;
  /** Smoothed section position: -1 entering from below, 0 centred, 1 leaving at the top. */
  scroll: number;
  /** 0 → 1 entrance, eased, from the first time the scene is visible. */
  enter: number;
  reduced: boolean;
  /** Narrow canvas: recompose rather than shrink. */
  compact: boolean;
  /** Few cores: fewer particles. */
  lowPower: boolean;
};

/**
 * Runs `draw` on a canvas: DPR-aware sizing, a loop that only runs while the canvas is on screen
 * and the tab is visible, a start deferred until after load + idle (never competes with first
 * paint), and a single still frame under prefers-reduced-motion. Returns `invalidate`, which
 * redraws a still scene (reduced motion) after something it shows has changed.
 */
export function useScene(canvasRef: RefObject<HTMLCanvasElement | null>, draw: (frame: Frame) => void) {
  const drawRef = useRef(draw);
  const invalidateRef = useRef<() => void>(() => {});

  useEffect(() => {
    drawRef.current = draw;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const lowPower = (navigator.hardwareConcurrency ?? 8) <= 4;
    const frame: Frame = { ctx, w: 0, h: 0, t: 0, dt: 0, px: 0, py: 0, scroll: 0, enter: 0, reduced: motion.matches, compact: false, lowPower };
    let target = { x: 0, y: 0 };
    let started = false;
    let visible = false;
    let enterAt = -1;
    let raf = 0;
    let last = 0;
    let resizeRaf = 0;
    let idleHandle = 0;

    const sectionPosition = () => {
      const r = canvas.getBoundingClientRect();
      const half = innerHeight / 2 + r.height / 2;
      return clamp((innerHeight / 2 - (r.top + r.height / 2)) / half, -1, 1);
    };

    const render = () => {
      if (!frame.w || !frame.h) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dpr = canvas.width / frame.w;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawRef.current(frame);
    };

    /** A still, well-composed frame (reduced motion, or before the loop starts). */
    const still = () => {
      frame.t = 7;
      frame.enter = 1;
      frame.px = frame.py = 0;
      frame.scroll = 0;
      render();
    };

    const running = () => started && visible && !frame.reduced && !document.hidden;

    const loop = (now: number) => {
      raf = 0;
      if (!running()) return;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      frame.dt = dt;
      frame.t += dt;
      const k = Math.min(1, dt * 3);
      frame.px += (target.x - frame.px) * k;
      frame.py += (target.y - frame.py) * k;
      frame.scroll += (sectionPosition() - frame.scroll) * Math.min(1, dt * 4);
      if (enterAt < 0) enterAt = frame.t;
      frame.enter = easeOut((frame.t - enterAt) / 1.6);
      render();
      raf = requestAnimationFrame(loop);
    };

    const sync = () => {
      if (running()) {
        if (!raf) {
          last = 0;
          raf = requestAnimationFrame(loop);
        }
      } else {
        cancelAnimationFrame(raf);
        raf = 0;
        if (started && frame.reduced) still();
      }
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      frame.w = r.width;
      frame.h = r.height;
      frame.compact = r.width < 560;
      const dpr = Math.min(window.devicePixelRatio || 1, frame.compact || lowPower ? 1.5 : 2);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      if (started && !raf) (frame.reduced ? still : render)();
    };

    // Resize work is deferred to the next frame (avoids ResizeObserver loop errors).
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(resize);
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { rootMargin: '120px 0px' },
    );
    io.observe(canvas);

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !visible) return;
      const r = canvas.getBoundingClientRect();
      target = {
        x: clamp((event.clientX - (r.left + r.width / 2)) / (r.width / 2), -1, 1),
        y: clamp((event.clientY - (r.top + r.height / 2)) / (r.height / 2), -1, 1),
      };
    };
    const onMotion = () => {
      frame.reduced = motion.matches;
      sync();
    };

    const begin = () => {
      started = true;
      resize();
      if (frame.reduced) still();
      sync();
    };
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const schedule = () => {
      if (idle) idleHandle = idle(begin, { timeout: 1500 });
      else idleHandle = window.setTimeout(begin, 200);
    };
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });

    invalidateRef.current = () => {
      if (started && !raf) (frame.reduced ? still : render)();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('visibilitychange', sync);
    motion.addEventListener('change', onMotion);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      window.removeEventListener('load', schedule);
      (window as Window & { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback?.(idleHandle);
      window.clearTimeout(idleHandle);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', sync);
      motion.removeEventListener('change', onMotion);
      invalidateRef.current = () => {};
    };
  }, [canvasRef]);

  return invalidateRef;
}
