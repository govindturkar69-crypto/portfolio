'use client';

import { useEffect, useRef } from 'react';

/** Idle heading: the classic up-left pointer. */
const REST_ANGLE = (-135 * Math.PI) / 180;
const MAGNET_PULL = 0.22;
const MAGNET_MAX = 7;

/**
 * Directional cursor with magnetic snapping.
 *
 * - The arrow sits exactly on the pointer and turns to face the direction of travel
 *   (atan2 of smoothed velocity), easing back to a classic pointer angle when still.
 * - A ring trails behind; over [data-magnetic] it wraps the control's box, and the control
 *   leans toward the pointer via the CSS `translate` property (never `transform`, so the
 *   control's own transforms and :active states are untouched).
 *
 * Mouse and trackpad only (hover + fine pointer), never with reduced motion. Text fields
 * keep the native caret cursor. The loop runs only while something is still moving.
 */
export function CustomCursor() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = root.current;
    if (!layer) return;
    const query = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    if (!query.matches) return;

    const html = document.documentElement;
    const arrow = layer.querySelector<HTMLElement>('[data-arrow]')!;
    const ring = layer.querySelector<HTMLElement>('[data-ring]')!;
    html.classList.add('has-cursor');

    const pointer = { x: -100, y: -100 };
    const trail = { x: -100, y: -100 };
    const velocity = { x: 0, y: 0 };
    const box = { w: 34, h: 34, r: 17 };
    let angle = REST_ANGLE;
    let last = { x: -100, y: -100, t: 0 };
    let magnet: HTMLElement | null = null;
    let pressed = false;
    let frame = 0;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const lerpAngle = (a: number, b: number, t: number) => {
      const delta = Math.atan2(Math.sin(b - a), Math.cos(b - a));
      return a + delta * t;
    };

    const tick = () => {
      let tx = pointer.x;
      let ty = pointer.y;
      let tw = 34;
      let th = 34;
      let tr = 17;
      if (magnet) {
        const rect = magnet.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        tx = cx + (pointer.x - cx) * 0.12;
        ty = cy + (pointer.y - cy) * 0.12;
        tw = rect.width + 10;
        th = rect.height + 10;
        tr = Math.min(parseFloat(getComputedStyle(magnet).borderTopLeftRadius) + 5 || 12, th / 2);
      }
      trail.x = lerp(trail.x, tx, magnet ? 0.3 : 0.2);
      trail.y = lerp(trail.y, ty, magnet ? 0.3 : 0.2);
      box.w = lerp(box.w, tw, 0.25);
      box.h = lerp(box.h, th, 0.25);
      box.r = lerp(box.r, tr, 0.25);

      // Velocity decays toward zero so the arrow relaxes to its rest angle when still.
      velocity.x *= 0.82;
      velocity.y *= 0.82;
      const speed = Math.hypot(velocity.x, velocity.y);
      const heading = speed > 0.35 ? Math.atan2(velocity.y, velocity.x) : REST_ANGLE;
      angle = lerpAngle(angle, heading, speed > 0.35 ? 0.28 : 0.1);

      const scale = pressed ? 0.85 : 1;
      arrow.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) rotate(${angle}rad) scale(${scale})`;
      ring.style.transform = `translate3d(${trail.x - box.w / 2}px, ${trail.y - box.h / 2}px, 0)`;
      ring.style.width = `${box.w}px`;
      ring.style.height = `${box.h}px`;
      ring.style.borderRadius = `${box.r}px`;

      const restDelta = Math.abs(Math.atan2(Math.sin(REST_ANGLE - angle), Math.cos(REST_ANGLE - angle)));
      const settled =
        Math.abs(trail.x - tx) < 0.1 && Math.abs(trail.y - ty) < 0.1 && Math.abs(box.w - tw) < 0.1 && speed < 0.05 && restDelta < 0.002;
      frame = settled ? 0 : requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const release = () => {
      if (!magnet) return;
      magnet.style.removeProperty('translate');
      magnet = null;
      layer.removeAttribute('data-magnet');
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      const now = event.timeStamp;
      const dt = Math.max(now - last.t, 8);
      velocity.x = lerp(velocity.x, ((event.clientX - last.x) / dt) * 16, 0.5);
      velocity.y = lerp(velocity.y, ((event.clientY - last.y) / dt) * 16, 0.5);
      last = { x: event.clientX, y: event.clientY, t: now };
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      layer.dataset.visible = 'true';

      if (magnet) {
        const rect = magnet.getBoundingClientRect();
        const dx = Math.max(-MAGNET_MAX, Math.min(MAGNET_MAX, (event.clientX - (rect.left + rect.width / 2)) * MAGNET_PULL));
        const dy = Math.max(-MAGNET_MAX, Math.min(MAGNET_MAX, (event.clientY - (rect.top + rect.height / 2)) * MAGNET_PULL));
        magnet.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
      }
      wake();
    };

    const onOver = (event: PointerEvent) => {
      const target = event.target as Element;
      const next = target.closest<HTMLElement>('[data-magnetic]');
      if (next !== magnet) {
        release();
        if (next) {
          magnet = next;
          layer.dataset.magnet = 'true';
        }
      }
      // Hide the custom cursor over text fields; the native caret takes over.
      const typing = target.closest('input, textarea, select, [contenteditable="true"]');
      layer.dataset.hidden = typing ? 'true' : 'false';
      layer.dataset.link = !next && target.closest('a, button, [role="button"], summary, label') ? 'true' : 'false';
      wake();
    };

    const onDown = () => {
      pressed = true;
      wake();
    };
    const onUp = () => {
      pressed = false;
      wake();
    };
    const onLeave = () => {
      layer.dataset.visible = 'false';
      release();
    };
    // Scrolling moves content under a still pointer; let the ring catch up.
    const onScroll = () => {
      if (magnet) wake();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      release();
      html.classList.remove('has-cursor');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div ref={root} aria-hidden="true" className="cursor-layer" data-visible="false">
      <div data-ring className="cursor-ring" />
      <div data-arrow className="cursor-arrow">
        {/* Arrow drawn pointing right with its tip at (0,0) of the element, so rotate() turns it about the hotspot. */}
        <svg width="22" height="18" viewBox="-20 -9 22 18">
          <path d="M0 0 L-17 -7.5 L-12.5 0 L-17 7.5 Z" />
        </svg>
      </div>
    </div>
  );
}
