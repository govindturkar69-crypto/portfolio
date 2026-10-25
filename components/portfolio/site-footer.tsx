import { site } from '@/data/site';
import { CopyEmailButton } from '../copy-email-button';
import { ArrowUpRight, Download, GitHub, LinkedIn } from '../icons';
import { buttonStyles, ExternalLink } from '../ui';
import { container } from './home-sections';
import { LocalClock } from './local-clock';

/**
 * Contact + footer on every page. The email address is the headline: one click to write,
 * one to copy. Links are plain anchors so they work from any route.
 */
export function SiteFooter() {
  const [user, domain] = site.email.split('@');
  return (
    <footer id="contact" aria-labelledby="contact-title" className="site-footer">
      <div className={`${container} pt-24 pb-10 md:pt-36`}>
        <div className="flex items-center justify-between gap-4 border-b border-line pb-4 font-mono text-xs tracking-[0.08em] text-subtle uppercase">
          <span>(04) — Contact</span>
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="size-1.5 animate-pulse-dot rounded-full bg-live" />
            {site.availability}
          </span>
        </div>

        {/* Stacked closing statement: each line steps in, the last one carries the accent. */}
        <h2 id="contact-title" className="closing-stack">
          <span data-reveal style={{ '--d': '0ms' } as React.CSSProperties}>
            Let&apos;s build{' '}
          </span>
          <span data-reveal style={{ '--d': '90ms' } as React.CSSProperties}>
            something{' '}
          </span>
          <span data-reveal style={{ '--d': '180ms' } as React.CSSProperties}>
            that holds up.
          </span>
        </h2>

        <a href={`mailto:${site.email}`} className="footer-email group" data-magnetic>
          <span className="break-all">
            {user}
            <span className="text-muted">@{domain}</span>
          </span>
          <ArrowUpRight size={40} className="footer-email-arrow" />
        </a>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <CopyEmailButton email={site.email} className={buttonStyles.secondary} />
          <a href={site.resume} download className={buttonStyles.secondary}>
            <Download size={15} />
            Résumé (PDF)
          </a>
          <ExternalLink href={site.github} className={buttonStyles.ghost}>
            <GitHub size={15} />
            GitHub
          </ExternalLink>
          <ExternalLink href={site.linkedin} className={buttonStyles.ghost}>
            <LinkedIn size={15} />
            LinkedIn
          </ExternalLink>
        </div>

        <div className="mt-24 grid gap-6 border-t border-line pt-6 font-mono text-xs tracking-[0.04em] text-subtle uppercase sm:grid-cols-3 sm:items-center">
          <p>
            © {new Date().getFullYear()} {site.name}
          </p>
          <p className="sm:text-center">
            <LocalClock />
          </p>
          <p className="sm:text-right">
            <a href="#top" className="transition-colors duration-200 hover:text-fg">
              Back to top ↑
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
