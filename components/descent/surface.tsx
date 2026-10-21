import type { CSSProperties } from 'react';
import { heroCopy, heroMotion } from '@/data/hero';
import { site } from '@/data/site';
import { CopyEmailButton } from '../copy-email-button';
import { ArrowRight, Download } from '../icons';
import { buttonStyles } from '../ui';
import { HeroTimeline } from './hero-timeline';
import { MindCharacter } from './mind-character';

const style = (vars: Record<string, string | number>) => vars as CSSProperties;

/**
 * Layer 00: the editorial hero. The character's head opens as you scroll (owned by
 * HeroTimeline), the headline hands over to the reveal copy, and the descent begins.
 * Server-rendered and fully readable without JavaScript; on phones and with reduced
 * motion every block is shown in normal reading order.
 *
 * --fig-h sizes the character; the text column reserves its width (600/640 aspect).
 */
export function Surface() {
  return (
    <section
      id="top"
      data-scene
      aria-labelledby="hero-title"
      className="scene scene-surface hero-tokens"
      style={style({ '--scene-length': heroMotion.sceneLength })}
    >
      <div
        className="scene-sticky hero-stage flex flex-col justify-center md:block"
        style={style({ '--fig-h': 'min(64svh, 40vw)' })}
      >
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-14 sm:px-6 md:flex md:h-full md:items-center md:pt-0">
          <div data-hero-text className="relative z-10 md:max-w-[calc(100%-var(--fig-h)*0.9375+3rem)]">
            <p aria-hidden="true" className="enter font-mono text-sm tracking-[0.18em] text-accent" style={style({ '--i': 0 })}>
              {heroCopy.kicker}
            </p>

            <h1
              id="hero-title"
              className="enter mt-3 font-display text-[clamp(4.25rem,15vw,11.5rem)] leading-[0.84] tracking-[-0.025em] text-balance"
              style={style({ '--i': 1 })}
            >
              <span className="block">{heroCopy.nameLines[0]}</span>{' '}
              <span className="block pl-[0.4em] text-accent-strong italic">{heroCopy.nameLines[1]}</span>
            </h1>

            <p
              className="enter mt-7 max-w-md text-lg leading-snug font-medium tracking-[-0.01em] text-fg/90 md:text-xl"
              style={style({ '--i': 2 })}
            >
              {heroCopy.tagline}
            </p>

            <p className="enter mt-5 inline-flex items-center gap-2 font-mono text-xs text-muted" style={style({ '--i': 2 })}>
              <span className="size-1.5 animate-pulse-dot rounded-full bg-live" aria-hidden="true" />
              {site.availability}
            </p>

            <div className="enter mt-8 flex flex-wrap gap-3" style={style({ '--i': 3 })}>
              <a href={site.resume} download className={buttonStyles.primary}>
                <Download size={16} />
                Résumé
              </a>
              <CopyEmailButton email={site.email} className={buttonStyles.secondary} />
            </div>

            <a
              href="#index"
              className="enter group mt-8 inline-flex items-center gap-1.5 py-2 font-mono text-xs text-muted transition-colors hover:text-fg"
              style={style({ '--i': 4 })}
            >
              Skip to the project index
              <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </div>

          {/* Reveal copy: crossfades in over the headline on desktop; in flow elsewhere. */}
          <div className="hero-reveal-slot">
            <div data-hero-reveal className="hero-reveal">
              <p className="font-mono text-xs tracking-[0.18em] text-muted uppercase">{heroCopy.reveal.eyebrow}</p>
              <h2 className="mt-4 font-display text-[clamp(3rem,8vw,7rem)] leading-[0.9] tracking-[-0.02em]">
                {heroCopy.reveal.heading}
              </h2>
              <p className="mt-4 font-display text-[clamp(1.75rem,3.6vw,3rem)] leading-tight text-accent-strong italic">
                {heroCopy.reveal.body}
              </p>
            </div>
          </div>
        </div>

        {/* Phones: the top margin reserves room for the lifted skull layers so they never cover the reveal copy. */}
        <div className="pointer-events-none relative mx-auto mt-[clamp(6rem,34vw,9rem)] w-[min(88vw,420px)] md:absolute md:right-[max(0.5rem,calc((100%-72rem)/2))] md:bottom-0 md:mt-0 md:h-[var(--fig-h)] md:w-auto">
          <MindCharacter className="h-auto w-full md:h-full md:w-auto" />
        </div>

        <HeroTimeline />
      </div>
    </section>
  );
}
