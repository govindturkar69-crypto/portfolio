import type { CSSProperties } from 'react';
import { portfolioConfig } from '@/lib/portfolio-config';
import { STICKERS, StickerArt, type StickerKind } from './sticker-art';

/**
 * Per-sticker motion variables. Deterministic (no randomness), so server and client
 * agree and every visit looks the same. `index` only seeds the variety.
 */
function stickerMotion(index: number, delayOffset = 0): CSSProperties {
  const { fall, sway, float } = portfolioConfig.stickers;
  const fallDuration = fall.duration + (index % 3) * 0.12;
  const fallDelay = delayOffset + fall.delay + index * fall.stagger + (index % 2) * 0.05;
  const travel = sway.min + ((index * 5) % (sway.max - sway.min + 1));
  return {
    '--fall-delay': `${fallDelay.toFixed(2)}s`,
    '--fall-duration': `${fallDuration.toFixed(2)}s`,
    '--fall-spin': `${(index % 2 ? 1 : -1) * (8 + index * 2)}deg`,
    '--bounce': `${10 + (index % 3) * 3}px`,
    '--loop-delay': `${(fallDelay + fallDuration).toFixed(2)}s`,
    '--sway-x': `${travel}px`,
    '--sway-rot': `${(index % 2 ? -1 : 1) * (1 + (index % 3) * 0.6)}deg`,
    '--sway-duration': `${(sway.duration + index * 0.85).toFixed(2)}s`,
    '--float-lift': `${float.lift + (index % 3) * 2}px`,
    '--float-duration': `${(float.duration + ((index * 7) % 5) * 0.45).toFixed(2)}s`,
    '--hover-tilt': `${index % 2 ? -7 : 7}deg`,
  } as CSSProperties;
}

/**
 * The four motion layers, each owning its own `transform` so nothing overwrites anything:
 *   .sticker-fall   – one-shot gravity drop from above the viewport, landing bounce
 *   .sticker-sway   – endless horizontal sway (8–18px) with a hint of rotation
 *   .sticker-float  – endless vertical float, on a different cycle from the sway
 *   .sticker-tilt   – the sticker's static resting angle
 *   .sticker-hover  – spring-eased lift and tilt on hover (the loops pause while hovered)
 * The resting tilt sits inside the motion layers on purpose: on an outer wrapper it would
 * rotate the fall direction too, so stickers would drop in at an angle (and off the page).
 */
function StickerLayers({ kind, tilt }: { kind: StickerKind; tilt: number }) {
  return (
    <div className="sticker-fall">
      <div className="sticker-sway">
        <div className="sticker-float">
          <div className="sticker-tilt" style={{ transform: `rotate(${tilt}deg)` }}>
            <div className="sticker-hover">
              <StickerArt kind={kind} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hero stickers: fall into the hero on load, then drift
 * around their spots in a band reserved at the bottom of the hero. Pure CSS.
 * Reduced motion: settled and still. Touch: everything except hover.
 */
export function HeroStickers() {
  const { visible } = portfolioConfig.stickers;
  return (
    <div aria-hidden="true" className="sticker-field">
      {STICKERS.map((sticker, index) => (
        <div
          key={sticker.kind}
          className={`sticker ${index >= visible.mobile ? 'max-md:hidden' : ''}`}
          style={{
            ...stickerMotion(index),
            width: `calc(${sticker.size}px * var(--sticker-scale, 1))`,
            left: `${sticker.rest[0] * 100}%`,
            top: `${sticker.rest[1] * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <StickerLayers kind={sticker.kind} tilt={sticker.tilt} />
        </div>
      ))}
    </div>
  );
}

/**
 * One sticker for a section's open space (beside its large heading). It waits above the
 * screen until the section first scrolls into view (ScrollReveal sets [data-revealed]),
 * then falls into place and keeps drifting. Wide screens only, where that space exists.
 * Position it with `className` (absolute offsets) inside a relatively positioned parent.
 */
export function SectionSticker({ kind, seed, className = '' }: { kind: StickerKind; seed: number; className?: string }) {
  const sticker = STICKERS.find((entry) => entry.kind === kind)!;
  return (
    <div aria-hidden="true" data-reveal="drop" className={`section-sticker pointer-events-none absolute hidden xl:block ${className}`}>
      <div
        className="sticker"
        style={{
          ...stickerMotion(seed, -portfolioConfig.stickers.fall.delay),
          width: `${Math.round(sticker.size * 0.82)}px`,
        }}
      >
        <StickerLayers kind={kind} tilt={sticker.tilt} />
      </div>
    </div>
  );
}
