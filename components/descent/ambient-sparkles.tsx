import type { CSSProperties } from 'react';

type Sparkle = { x: number; y: number; size: number; d: number; dl: number; dx: number; dy: number; min: number; max: number; star: boolean };

/** Deterministic pseudo-random sequence, so server and client markup are identical (no hydration mismatch). */
function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

const COUNT = 22;
const SPARKLES: Sparkle[] = (() => {
  const rand = seeded(20261021);
  return Array.from({ length: COUNT }, (_, i) => {
    const star = i % 5 === 0;
    return {
      x: rand() * 100,
      y: rand() * 100,
      size: star ? 7 + rand() * 5 : 1.5 + rand() * 2,
      d: 7 + rand() * 9,
      dl: -rand() * 12,
      dx: (rand() - 0.5) * 18,
      dy: -6 - rand() * 18,
      min: 0.08 + rand() * 0.12,
      max: 0.35 + rand() * 0.45,
      star,
    };
  });
})();

/**
 * Sparse ambient stars behind the page. Pure CSS animation of transform and opacity
 * (no JavaScript loop); browsers stop it in hidden tabs, and it is static under
 * prefers-reduced-motion. Decorative only: hidden from assistive technology and
 * transparent to pointer events.
 */
export function AmbientSparkles() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className="sparkle"
          data-shape={s.star ? 'star' : undefined}
          style={
            {
              left: `${s.x.toFixed(2)}%`,
              top: `${s.y.toFixed(2)}%`,
              '--size': `${s.size.toFixed(1)}px`,
              '--d': `${s.d.toFixed(1)}s`,
              '--dl': `${s.dl.toFixed(1)}s`,
              '--dx': `${s.dx.toFixed(1)}px`,
              '--dy': `${s.dy.toFixed(1)}px`,
              '--min': s.min.toFixed(2),
              '--max': s.max.toFixed(2),
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
