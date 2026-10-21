'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';
import { heroCopy, heroMotion } from '@/data/hero';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/*
 * Original vector character (drawn from the traits of my own avatar: swept hair, beard,
 * dark crewneck, crossed arms). Every part that moves is its own group:
 *
 *   [data-head]        tilts toward the pointer (pivot: middle of the neck)
 *   [data-eye]         whites + pupils, blinks (scaleY), pupils clipped to the white
 *   [data-pupil]       follows the pointer (this component)
 *   [data-stratum]     three skull layers, cut horizontally, lifted by the hero timeline
 *   [data-skull-base]  unclipped skull under the layers (hides anti-aliased seams at rest)
 *   [data-slice]       cut-surface outline on each layer ("exploded view")
 *   [data-cavity]      interior shown as the layers separate (hidden at rest)
 *   [data-guide]       dotted assembly guides
 *   [data-emerge]      stack glyphs that rise out of the head
 *
 * The scroll-driven opening lives in hero-timeline.tsx; this component only owns the
 * pointer, idle and blink behaviour, so no two systems write the same transform.
 */

// Eye centres in SVG units, used for clamping and as the pupil rest position.
const EYES = [
  { cx: 258, cy: 297 },
  { cx: 342, cy: 297 },
] as const;

// Skull layers: [top, bottom] of each band. Bands overlap by 3 units: clip edges are
// anti-aliased, and a 1-unit overlap still let the background show through as a hairline.
const STRATA = [
  { id: 'a', y0: 201, y1: 249, slice: { cy: 248, rx: 110 } },
  { id: 'b', y0: 150, y1: 204, slice: { cy: 203, rx: 108 } },
  { id: 'c', y0: 50, y1: 153, slice: { cy: 152, rx: 92 } },
] as const;

/** Elements that emerge from the head: final position, rotation and scale (start: inside the head). */
export const EMERGE = [
  { kind: 'core', x: 300, y: 222, r: 0, s: 1 },
  { kind: 'braces', x: 150, y: 176, r: -12, s: 1 },
  { kind: 'tag', x: 454, y: 150, r: 10, s: 1 },
  { kind: 'tree', x: 104, y: 258, r: -6, s: 1 },
  { kind: 'db', x: 498, y: 246, r: 8, s: 1 },
  { kind: 'star', x: 212, y: 92, r: 15, s: 1 },
  { kind: 'star-sm', x: 404, y: 66, r: -20, s: 0.7 },
  { kind: 'sphere', x: 168, y: 112, r: 0, s: 1 },
  { kind: 'sphere-accent', x: 472, y: 92, r: 0, s: 0.8 },
  { kind: 'hex', x: 526, y: 176, r: -8, s: 1 },
] as const;

function Cranium() {
  return (
    <>
      {/* Forehead */}
      <path className="mc-skin" d="M190 249 L190 200 C190 150 236 120 300 120 C364 120 410 150 410 200 L410 249 Z" />
      {/* Swept hair */}
      <path
        className="mc-hair"
        d="M186 252 C176 196 182 140 222 106 C254 80 302 66 350 78 C400 90 432 132 423 196 C421 222 415 240 412 252 C406 230 398 212 386 200 C374 184 362 170 348 158 C330 176 300 186 268 190 C246 193 228 196 216 204 C204 218 196 234 186 252 Z"
      />
      <path className="mc-hair-rim" d="M246 98 C284 80 332 78 372 96" />
    </>
  );
}

function Emergent({ kind }: { kind: (typeof EMERGE)[number]['kind'] }) {
  switch (kind) {
    case 'core':
      return <circle r="15" fill="url(#mc-core)" />;
    case 'braces':
      return (
        <text className="mc-glyph" textAnchor="middle" dominantBaseline="central" fontSize="34">
          {'{ }'}
        </text>
      );
    case 'tag':
      return (
        <text className="mc-glyph" textAnchor="middle" dominantBaseline="central" fontSize="30">
          {'</>'}
        </text>
      );
    case 'hex':
      return (
        <g>
          <rect x="-24" y="-14" width="48" height="28" rx="7" className="mc-chip" />
          <text className="mc-glyph-sm" textAnchor="middle" dominantBaseline="central" fontSize="15">
            0x2A
          </text>
        </g>
      );
    case 'tree':
      return (
        <g className="mc-line">
          <path d="M0 -16 L-16 10 M0 -16 L16 10" />
          <circle cy="-16" r="6" className="mc-node" />
          <circle cx="-16" cy="10" r="6" className="mc-node" />
          <circle cx="16" cy="10" r="6" className="mc-node" />
        </g>
      );
    case 'db':
      return (
        <g className="mc-line">
          <path d="M-16 -12 L-16 12 C-16 18 16 18 16 12 L16 -12" className="mc-db" />
          <ellipse rx="16" ry="6" cy="-12" className="mc-db" />
          <path d="M-16 0 C-16 6 16 6 16 0" />
        </g>
      );
    case 'star':
    case 'star-sm':
      return <path className="mc-star" d="M0 -16 Q2 -2 16 0 Q2 2 0 16 Q-2 2 -16 0 Q-2 -2 0 -16 Z" />;
    case 'sphere':
      return <circle r="9" fill="url(#mc-sphere-violet)" />;
    case 'sphere-accent':
      return <circle r="9" fill="url(#mc-sphere-indigo)" />;
  }
}

export function MindCharacter({ className = '' }: { className?: string }) {
  const root = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const svg = root.current;
      if (!svg) return;
      const mm = gsap.matchMedia();

      mm.add(
        { motion: '(prefers-reduced-motion: no-preference)', fine: '(hover: hover) and (pointer: fine)' },
        (context) => {
          const { motion, fine } = context.conditions as Record<string, boolean>;
          if (!motion) return;

          const head = svg.querySelector<SVGGElement>('[data-head]')!;
          const pupils = [...svg.querySelectorAll<SVGGElement>('[data-pupil]')];
          const eyeGroups = [...svg.querySelectorAll<SVGGElement>('[data-eye]')];
          const { reach, ease, fullReachAt } = heroMotion.eyes;

          // Pupil state lives in plain objects; transforms are written straight to the DOM.
          const current = EYES.map(() => ({ x: 0, y: 0 }));
          const target = EYES.map(() => ({ x: 0, y: 0 }));
          let tilt = 0;
          let tiltTarget = 0;
          let pointer: { x: number; y: number } | null = null;
          let ticking = false;
          let onScreen = true;

          const aimAt = (px: number, py: number) => {
            // Eye centres in screen space from the SVG's current transform matrix.
            const matrix = svg.getScreenCTM();
            if (!matrix) return;
            EYES.forEach((eye, i) => {
              const sx = matrix.a * eye.cx + matrix.c * eye.cy + matrix.e;
              const sy = matrix.b * eye.cx + matrix.d * eye.cy + matrix.f;
              const angle = Math.atan2(py - sy, px - sx);
              const distance = Math.min(1, Math.hypot(px - sx, py - sy) / (window.innerWidth * fullReachAt));
              // Elliptical clamp: the pupil stays inside the almond-shaped white.
              target[i].x = Math.cos(angle) * reach[0] * distance;
              target[i].y = Math.sin(angle) * reach[1] * distance;
            });
            const box = svg.getBoundingClientRect();
            tiltTarget = gsap.utils.clamp(-1, 1, (px - (box.left + box.width / 2)) / (window.innerWidth / 2)) * heroMotion.head.tilt;
          };

          const centre = () => {
            target.forEach((t) => {
              t.x = 0;
              t.y = 0;
            });
            tiltTarget = 0;
          };

          // One ticker callback; it removes itself once everything has settled.
          const step = () => {
            const k = 1 - Math.pow(1 - ease, gsap.ticker.deltaRatio(60));
            if (pointer) {
              aimAt(pointer.x, pointer.y);
              pointer = null;
            }
            let moving = false;
            pupils.forEach((pupil, i) => {
              const c = current[i];
              const t = target[i];
              c.x += (t.x - c.x) * k;
              c.y += (t.y - c.y) * k;
              if (Math.abs(t.x - c.x) + Math.abs(t.y - c.y) > 0.02) moving = true;
              pupil.setAttribute('transform', `translate(${c.x.toFixed(2)} ${c.y.toFixed(2)})`);
            });
            tilt += (tiltTarget - tilt) * k * 0.6;
            if (Math.abs(tiltTarget - tilt) > 0.01) moving = true;
            head.setAttribute('transform', `rotate(${tilt.toFixed(3)} 300 400)`);
            if (!moving) {
              gsap.ticker.remove(step);
              ticking = false;
            }
          };
          const wake = () => {
            if (!ticking && onScreen) {
              ticking = true;
              gsap.ticker.add(step);
            }
          };

          const onMove = (event: PointerEvent) => {
            if (!onScreen) return;
            pointer = { x: event.clientX, y: event.clientY };
            wake();
          };
          const onLeave = () => {
            centre();
            wake();
          };

          // Touch and idle: occasional, unhurried glances instead of tracking.
          const glance = () => {
            const angle = gsap.utils.random(0, Math.PI * 2);
            const amount = gsap.utils.random(0.3, 0.85);
            target.forEach((t) => {
              t.x = Math.cos(angle) * reach[0] * amount;
              t.y = Math.sin(angle) * reach[1] * amount;
            });
            wake();
            idleCall = gsap.delayedCall(gsap.utils.random(1.8, 3.6), glance);
          };
          let idleCall: gsap.core.Tween | null = fine ? null : gsap.delayedCall(1.2, glance);

          // Blink: quick close-open on both eyes at irregular intervals.
          let blinkCall: gsap.core.Tween | null = null;
          const blink = () => {
            if (onScreen) {
              gsap
                .timeline()
                .to(eyeGroups, { scaleY: 0.08, duration: 0.07, ease: 'power2.in', transformOrigin: '50% 50%' })
                .to(eyeGroups, { scaleY: 1, duration: 0.12, ease: 'power2.out' });
            }
            blinkCall = gsap.delayedCall(gsap.utils.random(heroMotion.blink.minGap, heroMotion.blink.maxGap), blink);
          };
          blinkCall = gsap.delayedCall(2.4, blink);

          if (fine) {
            window.addEventListener('pointermove', onMove, { passive: true });
            document.documentElement.addEventListener('pointerleave', onLeave);
          }

          // Only work while the character can be seen.
          const visibility = ScrollTrigger.create({
            trigger: svg,
            start: 'top bottom',
            end: 'bottom top',
            onToggle: (self) => {
              onScreen = self.isActive;
              if (onScreen) {
                blinkCall?.resume();
                idleCall?.resume();
              } else {
                blinkCall?.pause();
                idleCall?.pause();
              }
            },
          });

          return () => {
            window.removeEventListener('pointermove', onMove);
            document.documentElement.removeEventListener('pointerleave', onLeave);
            gsap.ticker.remove(step);
            blinkCall?.kill();
            idleCall?.kill();
            visibility.kill();
          };
        },
      );

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <svg
      ref={root}
      viewBox="0 0 600 640"
      role="img"
      aria-labelledby="mc-title"
      className={`mind-character overflow-visible ${className}`}
    >
      <title id="mc-title">{heroCopy.characterLabel}</title>
      <defs>
        <linearGradient id="mc-sweater-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--mc-sweater-top)" />
          <stop offset="1" stopColor="var(--mc-sweater-bottom)" />
        </linearGradient>
        <radialGradient id="mc-cavity-fill" cx="0.5" cy="0.35" r="0.7">
          <stop offset="0" stopColor="var(--mc-glow)" stopOpacity="0.75" />
          <stop offset="0.45" stopColor="var(--mc-interior)" />
          <stop offset="1" stopColor="var(--mc-interior)" />
        </radialGradient>
        <radialGradient id="mc-core">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="var(--mc-glow)" />
          <stop offset="1" stopColor="var(--mc-glow)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mc-sphere-violet" cx="0.35" cy="0.35">
          <stop offset="0" stopColor="#f5f3ff" />
          <stop offset="1" stopColor="var(--mc-violet)" />
        </radialGradient>
        <radialGradient id="mc-sphere-indigo" cx="0.35" cy="0.35">
          <stop offset="0" stopColor="#eef2ff" />
          <stop offset="1" stopColor="var(--mc-glow)" />
        </radialGradient>
        {STRATA.map((s) => (
          <clipPath key={s.id} id={`mc-band-${s.id}`}>
            <rect x="140" y={s.y0} width="320" height={s.y1 - s.y0} />
          </clipPath>
        ))}
        {EYES.map((eye, i) => (
          <clipPath key={i} id={`mc-eye-${i}`}>
            <ellipse cx={eye.cx} cy={eye.cy} rx="21" ry="14" />
          </clipPath>
        ))}
      </defs>

      {/* Body: sweater, crewneck, neck */}
      <path className="mc-sweater" d="M30 640 C38 552 108 494 214 478 L386 478 C492 494 562 552 570 640 Z" />
      <path className="mc-sweater-rim" d="M44 600 C60 540 120 500 214 486 M556 600 C540 540 480 500 386 486" />
      <path className="mc-skin-shade" d="M262 368 L338 368 L344 470 C330 494 270 494 256 470 Z" />
      <path className="mc-collar" d="M242 466 C262 502 338 502 358 466 L372 476 C348 522 252 522 228 476 Z" />

      {/* Crossed arms: back arm, hands, front arm */}
      <path className="mc-sleeve-back" d="M118 596 C150 564 420 550 478 564 C502 570 506 602 482 610 C420 624 170 638 132 634 C110 630 106 610 118 596 Z" />
      <path className="mc-skin" d="M452 566 C470 556 494 560 500 574 C504 586 494 596 480 596 C468 596 456 586 452 566 Z" />
      <path className="mc-sleeve" d="M94 620 C120 590 382 582 472 596 C500 600 508 632 488 642 L100 642 C86 638 84 628 94 620 Z" />
      <path className="mc-skin" d="M126 600 C108 592 90 598 88 612 C86 624 98 632 112 630 C124 628 132 616 126 600 Z" />
      <path className="mc-cuff" d="M140 596 C146 610 146 624 140 636 M454 572 C448 584 448 596 452 606" />

      <g data-head>
        {/* Ears and face (everything below the cut line) */}
        <ellipse className="mc-skin-shade" cx="184" cy="298" rx="15" ry="26" />
        <ellipse className="mc-skin-shade" cx="416" cy="298" rx="15" ry="26" />
        <path className="mc-skin" d="M190 248 L410 248 L410 300 C410 360 372 420 300 426 C228 420 190 360 190 300 Z" />
        <path className="mc-cheek" d="M398 296 C398 348 374 394 332 418 C372 406 404 362 408 296 Z" />
        <path
          className="mc-beard"
          d="M193 292 C194 350 220 404 266 420 C286 428 314 428 334 420 C380 404 406 350 407 292 C398 330 384 346 366 352 C350 340 330 344 300 346 C270 344 250 340 234 352 C216 346 202 330 193 292 Z"
        />
        <path className="mc-beard" d="M262 352 C276 339 291 341 300 348 C309 341 324 339 338 352 C325 353 312 355 300 360 C288 355 275 353 262 352 Z" />
        <path className="mc-lips" d="M284 367 C294 373 306 373 316 367 C306 378 294 378 284 367 Z" />
        <path className="mc-nose" d="M300 300 C297 316 290 326 292 332 C296 337 304 337 309 332" />
        <path className="mc-brow" d="M232 273 C246 263 266 263 281 269 M319 269 C334 263 354 263 368 273" />

        {EYES.map((eye, i) => (
          <g key={i} data-eye>
            <ellipse className="mc-eye-white" cx={eye.cx} cy={eye.cy} rx="21" ry="14" />
            <g clipPath={`url(#mc-eye-${i})`}>
              <g data-pupil>
                <circle className="mc-iris" cx={eye.cx} cy={eye.cy} r="9" />
                <circle className="mc-pupil" cx={eye.cx} cy={eye.cy} r="4.6" />
                <circle className="mc-catchlight" cx={eye.cx + 3} cy={eye.cy - 3} r="1.9" />
              </g>
            </g>
            <path className="mc-lid" d={`M${eye.cx - 22} ${eye.cy - 2} C${eye.cx - 12} ${eye.cy - 16} ${eye.cx + 12} ${eye.cy - 16} ${eye.cx + 22} ${eye.cy - 2}`} />
          </g>
        ))}

        {/* Interior: invisible until the skull layers lift */}
        <ellipse data-cavity className="mc-cavity" cx="300" cy="248" rx="110" ry="13" opacity="0" />
        <g data-guide opacity="0" className="mc-guide">
          <path d="M188 248 L188 70 M412 248 L412 70" />
        </g>

        {/* Emerging stack glyphs: start inside the head, hidden */}
        <g className="mc-emerge-layer">
          {EMERGE.map((e, i) => (
            <g key={i} data-emerge={i} transform="translate(300 244)" opacity="0">
              <Emergent kind={e.kind} />
            </g>
          ))}
        </g>

        {/* Seam guard: one unclipped skull under the layers so anti-aliased band edges never show
            the background at rest. HeroTimeline hides it the moment the layers start to lift. */}
        <g data-skull-base>
          <Cranium />
        </g>

        {/* Skull layers, top drawn last so lower layers sit underneath when they overlap */}
        {STRATA.map((s) => (
          <g key={s.id} data-stratum={s.id}>
            <g clipPath={`url(#mc-band-${s.id})`}>
              <Cranium />
            </g>
            <ellipse data-slice className="mc-slice" cx="300" cy={s.slice.cy} rx={s.slice.rx} ry="9" opacity="0" />
          </g>
        ))}
      </g>
    </svg>
  );
}
