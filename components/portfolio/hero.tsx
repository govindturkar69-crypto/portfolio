import { site } from '@/data/site';
import { portfolioConfig } from '@/lib/portfolio-config';
import { CopyEmailButton } from '../copy-email-button';
import { ArrowRight, Download } from '../icons';
import { buttonStyles } from '../ui';
import { InflatedWord } from './inflated-word';
import { container } from './home-sections';
import { HeroStickers } from './hero-stickers';

/**
 * Editorial hero. Server-rendered: every word of copy is real text in the HTML; the
 * inflated word and the stickers are decorative client islands layered on top.
 * The bottom band is kept clear for the stickers' resting place.
 */
export function Hero() {
  const { kicker, headline, word, closing, intro } = portfolioConfig.hero;
  return (
    <section id="top" aria-labelledby="hero-title" className="hero-editorial relative isolate">
      {/* Ambient light. Extends below the hero and fades out, so there is no edge where the section ends. */}
      <div aria-hidden="true" className="hero-glow" />
      <div className={`${container} relative flex min-h-[100svh] flex-col justify-center pt-28 pb-[calc(var(--sticker-band)+1rem)] md:pt-24`}>
        <p className="enter font-mono text-xs tracking-[0.18em] text-accent uppercase" style={{ '--i': 0 } as React.CSSProperties}>
          {kicker}
        </p>

        <h1
          id="hero-title"
          className="enter mt-5 font-heading text-[clamp(2rem,5.4vw,5.5rem)] leading-[0.9] font-extrabold tracking-[-0.03em] uppercase"
          style={{ '--i': 1 } as React.CSSProperties}
        >
          {headline.map((line, i) => (
            <span key={line} className={`block ${i === 1 ? 'text-accent-strong' : ''}`}>
              {/* Non-breaking hyphens keep compounds like "full-stack" on one line. */}
              {line.replaceAll('-', '‑')}
              {i < headline.length - 1 ? ' ' : ''}
            </span>
          ))}
        </h1>

        <InflatedWord word={word} className="enter mx-auto -my-[2vw] w-full max-w-[780px]" />

        <div className="enter mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end" style={{ '--i': 3 } as React.CSSProperties}>
          <div className="min-w-0">
            <p className="max-w-md text-base leading-relaxed text-pretty text-muted">{intro}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href={site.resume} download className={buttonStyles.primary} data-magnetic>
                <Download size={16} />
                Résumé
              </a>
              <CopyEmailButton email={site.email} className={buttonStyles.secondary} />
              <a href="#work" data-magnetic className={buttonStyles.tertiary}>
                View selected work
                <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </div>
          </div>
          <p className="font-heading text-[clamp(1.5rem,3.2vw,2.75rem)] leading-[0.95] font-bold tracking-[-0.02em] uppercase md:text-right">
            {closing.map((line, i) => (
              <span key={line} className={`block ${i === 1 ? 'text-muted' : ''}`}>
                {line}
                {i < closing.length - 1 ? ' ' : ''}
              </span>
            ))}
          </p>
        </div>
      </div>

      <HeroStickers />
    </section>
  );
}
