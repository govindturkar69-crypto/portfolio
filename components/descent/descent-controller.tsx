'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCallback, useEffect, useRef, useState } from 'react';
import { gaugeStops } from '@/data/descent';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Soft drone plus a tick on every layer change. Created only after a user gesture. */
class Ambience {
  private ctx: AudioContext;
  private master: GainNode;

  constructor() {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.connect(this.master);
    this.master.connect(this.ctx.destination);
    for (const [frequency, type, level] of [
      [55, 'sine', 0.9],
      [82.4, 'triangle', 0.35],
      [110.6, 'sine', 0.2],
    ] as const) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.value = level;
      osc.connect(gain).connect(filter);
      osc.start();
    }
  }

  async on() {
    await this.ctx.resume();
    this.master.gain.setTargetAtTime(0.035, this.ctx.currentTime, 0.6);
  }

  off() {
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
  }

  tick(depth: number) {
    if (this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    // Each layer down sounds a little lower.
    osc.frequency.value = 880 / Math.pow(1.12, depth);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }
}

/** Scrub lag in seconds: enough to smooth wheel steps, short enough to feel attached to the finger. */
const SCRUB = 0.5;

const hex = (depth: number) => `0x${Math.round(depth * 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;

/**
 * The one owner of scroll animation on the home page. Everything is created inside
 * a single useGSAP context, so a route change, Fast Refresh or a breakpoint change
 * reverts every tween and ScrollTrigger at once: there are never duplicates.
 *
 * - Per layer scene: scrubbed tweens of --enter, --p and --leave (CSS derives the rest).
 *   The hero is excluded: HeroTimeline owns it.
 * - Master timeline over the whole descent: --depth on <html> for the backdrop tint,
 *   plus the hex readout and meter in the gauge.
 * - Gauge: one trigger per stop, updating React state only when the layer changes.
 *
 * Phones and reduced motion get no scrubbed tweens; CSS shows static stacked sections.
 */
export function DescentController() {
  const [active, setActive] = useState(0);
  const [sound, setSound] = useState(false);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const meterRef = useRef<HTMLSpanElement>(null);
  const ambience = useRef<Ambience | null>(null);
  const activeRef = useRef(0);

  useGSAP(() => {
    const scenes = gsap.utils.toArray<HTMLElement>('[data-scene]');
    const descent = document.getElementById('descent');
    const select = (index: number) => {
      if (index === activeRef.current) return;
      activeRef.current = index;
      setActive(index);
      ambience.current?.tick(index);
    };

    // Gauge: works in every mode (it only reads position, it does not animate).
    gaugeStops.forEach((stop, index) => {
      const element = document.getElementById(stop.id);
      if (!element) return;
      ScrollTrigger.create({
        trigger: element,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => select(index),
        onEnterBack: () => select(index),
      });
    });

    const writeDepth = (depth: number) => {
      if (readoutRef.current) readoutRef.current.textContent = hex(depth);
      meterRef.current?.style.setProperty('transform', `scaleY(${depth})`);
    };

    const mm = gsap.matchMedia();
    // Both conditions are listed because gsap.matchMedia only runs the callback when at
    // least one matches; the static branch must run too (it drives the depth readout).
    mm.add(
      {
        cinematic: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
        calm: '(max-width: 767px), (prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { cinematic } = context.conditions as { cinematic: boolean };

        if (!cinematic || !descent) {
          // Static layout: keep the readout honest without animating anything.
          if (descent) {
            ScrollTrigger.create({
              trigger: descent,
              start: 'top top',
              end: 'bottom bottom',
              onUpdate: (self) => writeDepth(self.progress),
            });
          }
          return;
        }

        for (const scene of scenes) {
          // The hero (Layer 00) is owned by HeroTimeline; one owner per element, no duplicate triggers.
          if (scene.classList.contains('scene-surface')) continue;
          gsap.fromTo(
            scene,
            { '--enter': 0 },
            { '--enter': 1, ease: 'none', scrollTrigger: { trigger: scene, start: 'top bottom', end: 'top top', scrub: SCRUB } },
          );
          gsap.fromTo(
            scene,
            { '--p': 0 },
            { '--p': 1, ease: 'none', scrollTrigger: { trigger: scene, start: 'top top', end: 'bottom bottom', scrub: SCRUB } },
          );
          gsap.fromTo(
            scene,
            { '--leave': 0 },
            { '--leave': 1, ease: 'none', scrollTrigger: { trigger: scene, start: 'bottom bottom', end: 'bottom top', scrub: SCRUB } },
          );
        }

        // Master timeline: the whole descent as one continuous camera move.
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: descent,
              start: 'top top',
              end: 'bottom bottom',
              scrub: SCRUB + 0.3,
              onUpdate: (self) => writeDepth(self.progress),
            },
          })
          .fromTo(document.documentElement, { '--depth': 0 }, { '--depth': 1, duration: 1 });

        return () => document.documentElement.style.removeProperty('--depth');
      },
    );

    // Fonts and images change section heights after first layout.
    let cancelled = false;
    document.fonts?.ready.then(() => !cancelled && ScrollTrigger.refresh());

    return () => {
      cancelled = true;
      mm.revert();
    };
  });

  useEffect(() => () => ambience.current?.off(), []);

  const toggleSound = useCallback(async () => {
    if (sound) {
      ambience.current?.off();
      setSound(false);
      return;
    }
    try {
      ambience.current ??= new Ambience();
      await ambience.current.on();
      setSound(true);
    } catch {
      setSound(false);
    }
  }, [sound]);

  return (
    <aside
      aria-label="Descent depth"
      className="pointer-events-none fixed top-1/2 right-5 z-30 hidden -translate-y-1/2 lg:block"
    >
      <div className="pointer-events-auto flex flex-col items-end gap-5">
        <div className="text-right font-mono text-xs text-subtle">
          <span className="block">depth</span>
          <span ref={readoutRef} className="block text-fg tabular-nums">
            0x0000
          </span>
        </div>

        <div className="flex gap-3">
          <nav aria-label="Layers">
            <ol className="flex flex-col items-end gap-2.5">
              {gaugeStops.map((stop, index) => {
                const isActive = index === active;
                return (
                  <li key={stop.id}>
                    <a
                      href={`#${stop.id}`}
                      aria-current={isActive ? 'location' : undefined}
                      className={`group flex items-center gap-2 py-0.5 font-mono text-xs transition-colors duration-200 ${
                        isActive ? 'text-fg' : 'text-subtle hover:text-muted'
                      }`}
                    >
                      <span
                        className={`transition duration-300 ease-out ${
                          isActive ? 'translate-x-0 opacity-100' : 'translate-x-1 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {stop.label}
                      </span>
                      <span className="tabular-nums">{String(index).padStart(2, '0')}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
          <span aria-hidden="true" className="relative w-px overflow-hidden bg-line-strong">
            <span ref={meterRef} className="absolute inset-0 origin-top scale-y-0 bg-accent" />
          </span>
        </div>

        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={sound}
          className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-xs text-subtle transition-colors duration-200 hover:border-line-strong hover:text-fg"
        >
          <span aria-hidden="true" className="flex h-3 items-end gap-[2px]">
            {[0.5, 1, 0.7].map((height, i) => (
              <i
                key={i}
                className={`w-[2px] rounded-full bg-current transition-transform duration-300 ${sound ? 'animate-pulse' : ''}`}
                style={{ height: '100%', transform: `scaleY(${sound ? height : 0.25})`, transformOrigin: 'bottom' }}
              />
            ))}
          </span>
          Sound {sound ? 'on' : 'off'}
        </button>
      </div>
    </aside>
  );
}
