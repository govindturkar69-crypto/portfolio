'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { heroMotion } from '@/data/hero';
import { EMERGE } from './mind-character';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Vertical centre of each skull layer, used as its rotation origin. */
const STRATA_PIVOTS = [226, 178, 112];
/** Small sideways drift per layer when open, so the stack reads as an exploded view, not a lift. */
const STRATA_DRIFT = [-6, 9, -12];

/**
 * Adds the head-opening sequence to `tl` starting at `at`: skull layers separate with
 * staggered lift and counter-rotation, cut surfaces and guides appear, the interior
 * glows, then the stack glyphs rise out on individual curves.
 */
function addOpening(tl: gsap.core.Timeline, section: HTMLElement, at: number) {
  const q = gsap.utils.selector(section);
  const strata = q('[data-stratum]');

  // The seam guard must vanish before any layer moves, or a second skull would show through.
  tl.to(q('[data-skull-base]'), { opacity: 0, duration: 0.005 }, at);

  strata.forEach((layer, i) => {
    tl.to(
      layer,
      {
        y: -heroMotion.strataLift[i],
        x: STRATA_DRIFT[i],
        rotation: heroMotion.strataTilt[i],
        svgOrigin: `300 ${STRATA_PIVOTS[i]}`,
        duration: 0.34,
        ease: 'power2.inOut',
      },
      at + i * 0.05,
    );
  });
  tl.to(q('[data-cavity]'), { opacity: 1, duration: 0.16 }, at + 0.02)
    .to(q('[data-slice]'), { opacity: 1, duration: 0.16, stagger: 0.04 }, at + 0.05)
    .to(q('[data-guide]'), { opacity: 0.55, duration: 0.22 }, at + 0.08);

  q('[data-emerge]').forEach((element, i) => {
    const target = EMERGE[i];
    const start = at + 0.14 + i * 0.026;
    // x and y on different eases give every glyph its own curved path.
    tl.fromTo(
      element,
      { x: 300, scale: 0.2, rotation: 0 },
      { x: target.x, scale: target.s, rotation: target.r, duration: 0.3, ease: i % 2 ? 'sine.out' : 'power1.inOut' },
      start,
    ).fromTo(
      element,
      { y: 244, opacity: 0 },
      { y: target.y, opacity: 1, duration: 0.3, ease: i % 3 ? 'power3.out' : 'back.out(1.3)' },
      start,
    );
  });
}

/**
 * Owns the hero's scroll story. One timeline per layout, created in a single
 * gsap.matchMedia so breakpoints, route changes and reduced motion revert cleanly.
 *  - ≥768px, motion OK: scrubbed over the sticky hero; head opens, the headline
 *    hands over to the reveal copy, glyphs drift up before the descent begins.
 *  - Phones: the head opens as it scrolls through the viewport; copy stays static.
 *  - Reduced motion: no scroll animation; a still composition with the head open.
 */
export function HeroTimeline() {
  useGSAP(() => {
    const section = document.getElementById('top');
    if (!section) return;
    const q = gsap.utils.selector(section);
    const figure = q('.mind-character')[0];
    const mm = gsap.matchMedia();

    mm.add(
      {
        cinematic: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
        compact: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
        reduce: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { cinematic, compact } = context.conditions as Record<string, boolean>;

        if (cinematic) {
          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: heroMotion.scrub },
          });
          tl.to({}, { duration: 1 }, 0); // normalise: positions below are fractions of the hero's scroll
          addOpening(tl, section, 0.08);
          tl.to(q('[data-hero-text]'), { autoAlpha: 0, y: -48, duration: 0.14, ease: 'power2.in' }, 0.34)
            .fromTo(q('[data-hero-reveal]'), { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 0.14, ease: 'power2.out' }, 0.5)
            .to(q('.mc-emerge-layer'), { y: -26, duration: 0.3, ease: 'sine.inOut' }, 0.7)
            .to(q('[data-hero-reveal]'), { y: -24, autoAlpha: 0.0, duration: 0.12, ease: 'power1.in' }, 0.88);
          return;
        }

        if (compact && figure) {
          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: figure, start: 'top 80%', end: 'center 20%', scrub: heroMotion.scrub },
          });
          tl.to({}, { duration: 1 }, 0);
          addOpening(tl, section, 0);
          return;
        }

        // Reduced motion: the finished composition, no scroll coupling.
        const still = gsap.timeline({ paused: true });
        addOpening(still, section, 0);
        still.progress(1);
      },
    );

    return () => mm.revert();
  });

  return null;
}
