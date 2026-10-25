'use client';

import { useEffect, useRef } from 'react';

/**
 * Live pointer coordinates for the HUD ("X 0412 · Y 0233"). Mouse and trackpad only;
 * hidden on touch. Writes text directly, at most once per frame, so React never re-renders.
 */
export function PointerReadout() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    element.hidden = false;
    let frame = 0;
    let x = 0;
    let y = 0;
    const pad = (n: number) => String(Math.max(0, Math.round(n))).padStart(4, '0');
    const write = () => {
      frame = 0;
      element.textContent = `X ${pad(x)} · Y ${pad(y)}`;
    };
    const onMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = requestAnimationFrame(write);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  // Hidden until JS confirms a fine pointer; aria-hidden because it is pure decoration.
  return (
    <span ref={ref} aria-hidden="true" hidden className="tabular-nums">
      X 0000 · Y 0000
    </span>
  );
}
