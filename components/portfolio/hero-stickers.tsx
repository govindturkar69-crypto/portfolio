import type { CSSProperties } from 'react';
import { portfolioConfig } from '@/lib/portfolio-config';
import { STICKERS, StickerArt } from './sticker-art';

/**
 * Decorative stickers that fall into the hero from above the screen, land with a small
 * bounce, then drift around their spot. Pure CSS: no JavaScript, no React re-renders.
 *
 * Every motion owns its own element, so no two animations ever write the same `transform`:
 *   .sticker        – absolute position + resting tilt (static)
 *   .sticker-fall   – one-shot gravity drop from above the viewport, landing bounce
 *   .sticker-sway   – endless horizontal sway (8–18px) with a hint of rotation
 *   .sticker-float  – endless vertical float, on a different cycle from the sway
 *   .sticker-hover  – spring-eased lift and tilt on hover; leaves the loops untouched
 * Sway and float start only once the sticker has landed, from their zero point, so there
 * is never a jump; their cycles differ per sticker so the group never moves in step.
 * The drop waits while the first-visit loader is up (html[data-intro]); reduced motion
 * shows stickers settled and still. Touch devices get everything except hover.
 */
export function HeroStickers() {
  const { fall, sway, float, visible } = portfolioConfig.stickers;
  return (
    <div aria-hidden="true" className="sticker-field">
      {STICKERS.map((sticker, index) => {
        // Deterministic variety (stable between server and client, and between visits).
        const fallDuration = fall.duration + (index % 3) * 0.12;
        const fallDelay = fall.delay + index * fall.stagger + (index % 2) * 0.05;
        const landed = fallDelay + fallDuration;
        const travel = sway.min + ((index * 5) % (sway.max - sway.min + 1));
        const motion = {
          '--fall-delay': `${fallDelay.toFixed(2)}s`,
          '--fall-duration': `${fallDuration.toFixed(2)}s`,
          '--fall-spin': `${(index % 2 ? 1 : -1) * (8 + index * 2)}deg`,
          '--bounce': `${10 + (index % 3) * 3}px`,
          '--loop-delay': `${landed.toFixed(2)}s`,
          '--sway-x': `${travel}px`,
          '--sway-rot': `${(index % 2 ? -1 : 1) * (1 + (index % 3) * 0.6)}deg`,
          '--sway-duration': `${(sway.duration + index * 0.85).toFixed(2)}s`,
          '--float-lift': `${float.lift + (index % 3) * 2}px`,
          '--float-duration': `${(float.duration + ((index * 7) % 5) * 0.45).toFixed(2)}s`,
          '--hover-tilt': `${index % 2 ? -7 : 7}deg`,
        } as CSSProperties;
        return (
          <div
            key={sticker.kind}
            className={`sticker ${index >= visible.mobile ? 'max-md:hidden' : ''}`}
            style={{
              ...motion,
              width: `calc(${sticker.size}px * var(--sticker-scale, 1))`,
              left: `${sticker.rest[0] * 100}%`,
              top: `${sticker.rest[1] * 100}%`,
              transform: `translate(-50%, -50%) rotate(${sticker.tilt}deg)`,
            }}
          >
            <div className="sticker-fall">
              <div className="sticker-sway">
                <div className="sticker-float">
                  <div className="sticker-hover">
                    <StickerArt kind={sticker.kind} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
