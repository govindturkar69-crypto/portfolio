'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';
import { site } from '@/data/site';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const QUERY = 'SELECT name, role, focus FROM portfolio.engineer LIMIT 1;';
const RECORD: [string, string][] = [
  ['name', site.name],
  ['role', site.role],
  ['focus', 'Full-stack products. Down to the storage engine.'],
];
const GLYPHS = '01{}[]<>/_#$%*+=';
/** Must match the delay of the `intro-failsafe` animation in globals.css. */
const FAILSAFE_MS = 2200;

/**
 * First-visit intro: a fictional console types one query, the record resolves into my
 * name, then the console lifts away and the hero is revealed underneath. Pure
 * storytelling; nothing here talks to a network or a database.
 *
 * The markup is server-rendered but hidden by CSS unless <html data-intro="play">, so
 * there is no hydration mismatch and no flash of the overlay on other visits.
 */
export function SqlIntro() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const html = document.documentElement;
      const overlay = root.current;
      if (!overlay || html.dataset.intro !== 'play') return;

      const q = <T extends Element>(selector: string) => overlay.querySelector<T>(selector)!;
      const typed = q<HTMLElement>('[data-typed]');
      const caret = q<HTMLElement>('[data-caret]');
      const rows = overlay.querySelectorAll<HTMLElement>('[data-row]');
      const nameValue = q<HTMLElement>('[data-name]');
      const backdrop = q<HTMLElement>('[data-backdrop]');
      const panel = q<HTMLElement>('[data-panel]');
      const skip = q<HTMLButtonElement>('[data-skip]');

      // Too late to play: the visitor already scrolled, or hydration was slow enough that
      // the CSS fail-safe (starts fading at FAILSAFE_MS) may already be hiding the overlay.
      // Taking over now would make the console reappear over a page they are reading.
      if (window.scrollY > 4 || performance.now() > FAILSAFE_MS - 200) {
        html.removeAttribute('data-intro');
        return;
      }

      // JS has taken over: cancel the CSS fail-safe fade and lock scrolling under the overlay.
      overlay.style.animation = 'none';
      window.clearTimeout((window as Window & { __introFailsafe?: number }).__introFailsafe);
      html.style.overflow = 'hidden';
      html.style.scrollbarGutter = 'stable';

      let finished = false;
      let exitTimeline: gsap.core.Timeline | null = null;
      const finish = () => {
        if (finished) return;
        finished = true;
        teardown();
        const hadFocus = overlay.contains(document.activeElement);
        html.removeAttribute('data-intro');
        html.style.removeProperty('overflow');
        html.style.removeProperty('scrollbar-gutter');
        gsap.set([backdrop, panel], { clearProps: 'all' });
        if (hadFocus) document.getElementById('main')?.focus({ preventScroll: true });
        // Scroll was locked; re-measure every descent trigger now that the page is live.
        ScrollTrigger.refresh();
      };

      // Exit: the console lifts away while the backdrop wipes upward to reveal the hero.
      const exit = (speed = 1) =>
        gsap
          .timeline({ onComplete: finish })
          .to(panel, { y: -28, autoAlpha: 0, duration: 0.4 / speed, ease: 'power2.in' }, 0)
          .to(backdrop, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.55 / speed, ease: 'power3.inOut' }, 0.08 / speed);

      const typing = { chars: 0 };
      const decode = { progress: 0 };
      const name = site.name;
      const scramble = () => {
        const shown = Math.floor(decode.progress * name.length);
        let out = name.slice(0, shown);
        for (let i = shown; i < name.length; i++) {
          out += name[i] === ' ' ? ' ' : GLYPHS[(i * 7 + Math.floor(decode.progress * 40)) % GLYPHS.length];
        }
        nameValue.textContent = out;
      };

      const intro = gsap
        .timeline({ delay: 0.1 })
        .fromTo(panel, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: 'power3.out' })
        .to(typing, {
          chars: QUERY.length,
          duration: 0.7,
          ease: 'none',
          onUpdate: () => {
            typed.textContent = QUERY.slice(0, Math.round(typing.chars));
          },
        })
        .set(caret, { autoAlpha: 0 })
        .fromTo(rows, { x: -10, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.3, stagger: 0.08, ease: 'power2.out' }, '+=0.08')
        .to(decode, { progress: 1, duration: 0.55, ease: 'power1.inOut', onUpdate: scramble }, '<')
        .add(() => {
          exitTimeline = exit();
        }, '+=0.35');

      const skipNow = () => {
        if (finished || exitTimeline) return;
        intro.kill();
        exitTimeline = exit(1.6);
      };

      const onKey = (event: KeyboardEvent) => {
        if (['Escape', 'Enter', ' ', 'ArrowDown', 'PageDown', 'End', 'Tab'].includes(event.key)) {
          if (event.key !== 'Tab') event.preventDefault();
          skipNow();
        }
      };
      window.addEventListener('keydown', onKey);
      window.addEventListener('wheel', skipNow, { passive: true });
      window.addEventListener('touchmove', skipNow, { passive: true });
      skip.addEventListener('click', skipNow);
      skip.focus({ preventScroll: true });

      function teardown() {
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('wheel', skipNow);
        window.removeEventListener('touchmove', skipNow);
        skip.removeEventListener('click', skipNow);
      }

      // Unmount mid-intro (route change, Fast Refresh): never leave the page locked.
      return () => {
        teardown();
        if (!finished) {
          html.removeAttribute('data-intro');
          html.style.removeProperty('overflow');
          html.style.removeProperty('scrollbar-gutter');
        }
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} className="sql-intro" role="region" aria-label="Introduction">
      <div data-backdrop aria-hidden="true" className="absolute inset-0 bg-bg">
        <div className="mesh absolute inset-0 opacity-60" />
      </div>

      <div data-panel aria-hidden="true" className="relative w-[min(92vw,40rem)] font-mono text-sm">
        <div className="overflow-hidden rounded-2xl border border-line-strong bg-surface/90 shadow-2xl shadow-black/60 backdrop-blur">
          <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-xs text-subtle">
            <span className="flex gap-1.5">
              <i className="size-2 rounded-full bg-white/15" />
              <i className="size-2 rounded-full bg-white/15" />
              <i className="size-2 rounded-full bg-white/15" />
            </span>
            <span className="ml-1">profile.db</span>
          </div>

          <div className="space-y-4 px-4 py-5 sm:px-6 sm:py-6">
            <p className="leading-relaxed break-words text-fg">
              <span className="text-accent">gt=# </span>
              <span data-typed />
              <span data-caret className="ml-0.5 inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] animate-pulse bg-accent/80" />
            </p>

            <div className="text-muted">
              <p data-row className="text-subtle">-[ RECORD 1 ]---------</p>
              {RECORD.map(([key, value]) => (
                <p key={key} data-row className="grid grid-cols-[3.5rem_1fr] gap-2 py-0.5">
                  <span className="text-subtle">{key}</span>
                  {key === 'name' ? (
                    <span data-name className="font-sans text-xl font-semibold tracking-[-0.02em] text-fg sm:text-2xl">
                      {value}
                    </span>
                  ) : (
                    <span className={key === 'focus' ? 'text-accent' : 'text-fg/90'}>{value}</span>
                  )}
                </p>
              ))}
              <p data-row className="pt-1 text-subtle">(1 row)</p>
            </div>
          </div>
        </div>
      </div>

      <button
        data-skip
        type="button"
        className="absolute right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-surface/80 px-4 text-sm text-muted backdrop-blur transition-colors duration-200 hover:text-fg sm:right-6 sm:bottom-6"
      >
        Skip intro
        <kbd className="rounded border border-line px-1.5 font-mono text-xs text-subtle [@media(pointer:coarse)]:hidden">Esc</kbd>
      </button>
    </div>
  );
}
