'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type FocusEvent, type MouseEvent, type PointerEvent } from 'react';
import { soloProjects, type Project } from '@/data/projects';
import { projectFocus } from '@/lib/project-focus';
import { sound } from '@/lib/sound';
import { ArrowLeft, ArrowRight, ArrowUpRight, GitHub } from '../icons';
import { buttonStyles, ExternalLink } from '../ui';
import { coverTheme, ProjectCover } from './project-cover';

const HASH_PREFIX = '#project/';
const slugFromHash = () => (window.location.hash.startsWith(HASH_PREFIX) ? decodeURIComponent(window.location.hash.slice(HASH_PREFIX.length)) : null);

/**
 * Selected work: a uniform two-column grid of project cards with pointer tilt, and an overlay with
 * the project summary. Every card is a real link to its case study, so without JS (or
 * with a modifier-click / middle-click) it simply navigates.
 *
 * Overlay: native <dialog> (focus trap, Esc, top layer). Opening pushes #project/<slug>,
 * so Back closes it and the URL deep-links; focus returns to the card that opened it.
 */
export function WorkGrid({ projects }: { projects: Project[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const project = projects.find((entry) => entry.slug === active) ?? null;

  const show = useCallback((slug: string) => {
    setActive(slug);
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    dialog?.querySelector('[data-scroll]')?.scrollTo({ top: 0 });
  }, []);

  const hide = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    setActive(null);
    const opener = openerRef.current;
    openerRef.current = null;
    opener?.focus({ preventScroll: true });
  }, []);

  // Deep links and Back/Forward.
  useEffect(() => {
    const sync = () => {
      const slug = slugFromHash();
      if (slug && projects.some((entry) => entry.slug === slug)) show(slug);
      else if (dialogRef.current?.open) hide();
    };
    const initial = slugFromHash();
    if (initial && projects.some((entry) => entry.slug === initial)) {
      history.replaceState({ project: initial, deep: true }, '', window.location.href);
      show(initial);
    }
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [projects, show, hide]);

  const open = (event: MouseEvent<HTMLAnchorElement>, slug: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    openerRef.current = event.currentTarget;
    sound.play('click');
    history.pushState({ project: slug }, '', `${HASH_PREFIX}${slug}`);
    show(slug);
  };

  const close = () => {
    const state = history.state as { project?: string; deep?: boolean } | null;
    if (state?.project && !state.deep) {
      history.back(); // popstate → hide()
    } else {
      history.replaceState(null, '', `${window.location.pathname}#work`);
      hide();
    }
  };

  const step = (direction: 1 | -1) => {
    if (!project) return;
    const index = projects.findIndex((entry) => entry.slug === project.slug);
    const next = projects[(index + direction + projects.length) % projects.length];
    history.replaceState({ ...(history.state ?? {}), project: next.slug }, '', `${HASH_PREFIX}${next.slug}`);
    sound.play('tick');
    show(next.slug);
  };

  return (
    <>
      <ul className="grid gap-x-5 gap-y-14 md:grid-cols-2 md:gap-y-20 lg:gap-x-8">
        {projects
          .filter((entry) => entry.featured)
          .map((entry, index) => (
            <li key={entry.slug} data-reveal style={{ '--d': `${(index % 2) * 110}ms` } as CSSProperties}>
              <WorkCard project={entry} index={projects.indexOf(entry)} onOpen={open} />
            </li>
          ))}
      </ul>

      {projects.some((entry) => !entry.featured) ? (
        <div className="mt-24 md:mt-32">
          <div className="flex items-center gap-4" data-reveal>
            <h3 className="about-label">More projects</h3>
            <span aria-hidden="true" className="about-rule" data-reveal="line" />
          </div>
          <ul className="mt-2">
            {projects
              .filter((entry) => !entry.featured)
              .map((entry, i) => (
                <li key={entry.slug} data-reveal style={{ '--d': `${i * 90}ms` } as CSSProperties}>
                  <WorkRow project={entry} index={projects.indexOf(entry)} onOpen={open} />
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      <dialog
        ref={dialogRef}
        aria-labelledby="project-overlay-title"
        className="project-overlay"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        {project ? <ProjectOverlay project={project} onClose={close} onStep={step} /> : null}
      </dialog>
    </>
  );
}

/** Tell the architecture visual which project is under the pointer (mouse) or keyboard focus. */
function focusHandlers(slug: string) {
  return {
    onPointerEnter: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === 'mouse') projectFocus.set(slug);
    },
    onFocus: () => projectFocus.set(slug),
    onBlur: (event: FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) projectFocus.set(null);
    },
  };
}

function unfocus(event: PointerEvent<HTMLElement>) {
  if (event.pointerType === 'mouse') projectFocus.set(null);
}

function WorkCard({
  project,
  index,
  onOpen,
}: {
  project: Project;
  index: number;
  onOpen: (event: MouseEvent<HTMLAnchorElement>, slug: string) => void;
}) {
  const coverRef = useRef<HTMLDivElement>(null);
  const theme = coverTheme(project.slug);

  const tilt = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return;
    const cover = coverRef.current;
    if (!cover || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = cover.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    cover.style.setProperty('--mx', x.toFixed(3));
    cover.style.setProperty('--my', y.toFixed(3));
  };
  const reset = () => {
    coverRef.current?.style.setProperty('--mx', '0');
    coverRef.current?.style.setProperty('--my', '0');
  };

  return (
    <article
      onPointerMove={tilt}
      onPointerLeave={(event) => {
        reset();
        unfocus(event);
      }}
      {...focusHandlers(project.slug)}
      className="work-card group"
      style={{ '--card-accent': theme.accent } as CSSProperties}
    >
      {/* The cover repeats the title link for pointer users; keyboard and screen-reader users get one stop (the title). */}
      <Link
        href={`/work/${project.slug}`}
        onClick={(event) => onOpen(event, project.slug)}
        tabIndex={-1}
        aria-hidden="true"
        className="block"
      >
        <div ref={coverRef} className="work-cover">
          <ProjectCover project={project} />
          <span className="work-open">
            <ArrowUpRight size={18} />
          </span>
        </div>
      </Link>

      <div className="mt-4 flex items-center justify-between gap-4 font-mono text-xs tracking-[0.06em] text-subtle uppercase">
        <span className="truncate">{project.category}</span>
        <span className="shrink-0 tabular-nums">{project.year ?? String(index + 1).padStart(2, '0')}</span>
      </div>

      <h3 className="mt-2 text-[clamp(1.75rem,2.6vw,2.5rem)] leading-none font-semibold tracking-[-0.04em]">
        <Link href={`/work/${project.slug}`} onClick={(event) => onOpen(event, project.slug)} className="work-title-link">
          <span className="work-title">{project.name}</span>
        </Link>
      </h3>

      <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-pretty text-muted">{project.tagline}</p>

      <p className="mt-3 font-mono text-xs leading-relaxed text-subtle">
        <span className="sr-only">Stack: </span>
        {project.stack.slice(0, 5).join(' · ')}
      </p>
      <p className="work-arch mt-3">
        <span className="work-arch-label">Architecture</span>
        {project.architecture.layers.slice(0, 4).map((layer, i) => (
          <span key={layer.name} className="work-arch-step">
            {i > 0 ? <span aria-hidden="true"> → </span> : null}
            {layer.name}
          </span>
        ))}
      </p>
      {soloProjects.has(project.slug) ? (
        <p className="mt-1.5 font-mono text-xs text-subtle">
          <span className="text-fg/80">Solo project</span> · designed and built end to end
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-sm">
        <Link href={`/work/${project.slug}`} className="work-action">
          Case study
          <ArrowRight size={14} className="work-action-arrow" />
        </Link>
        <ExternalLink href={project.links.github} className="work-action">
          Source
          <ArrowUpRight size={14} className="work-action-arrow" />
        </ExternalLink>
        {project.links.live ? (
          <ExternalLink href={project.links.live} className="work-action">
            Live demo
            <ArrowUpRight size={14} className="work-action-arrow" />
          </ExternalLink>
        ) : null}
        {project.links.live && project.liveNote ? <span className="font-mono text-xs text-subtle">{project.liveNote}</span> : null}
      </div>
    </article>
  );
}

/** Compact row for secondary projects: small cover, name, purpose, stack and links. */
function WorkRow({
  project,
  index,
  onOpen,
}: {
  project: Project;
  index: number;
  onOpen: (event: MouseEvent<HTMLAnchorElement>, slug: string) => void;
}) {
  return (
    <article className="work-row group" onPointerLeave={unfocus} {...focusHandlers(project.slug)}>
      <Link href={`/work/${project.slug}`} onClick={(event) => onOpen(event, project.slug)} tabIndex={-1} aria-hidden="true" className="work-row-thumb">
        <ProjectCover project={project} />
      </Link>
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-4 font-mono text-xs tracking-[0.06em] text-subtle uppercase">
          <span className="truncate">{project.category}</span>
          <span className="shrink-0 tabular-nums">{project.year ?? String(index + 1).padStart(2, '0')}</span>
        </div>
        <h4 className="mt-1.5 text-2xl leading-tight font-semibold tracking-[-0.03em]">
          <Link href={`/work/${project.slug}`} onClick={(event) => onOpen(event, project.slug)} className="work-title-link">
            <span className="work-title">{project.name}</span>
          </Link>
        </h4>
        <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-pretty text-muted">{project.tagline}</p>
        <p className="mt-2 font-mono text-xs text-subtle">
          <span className="sr-only">Stack: </span>
          {project.stack.slice(0, 5).join(' · ')}
          {soloProjects.has(project.slug) ? ' · Solo project' : ''}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <Link href={`/work/${project.slug}`} className="work-action">
            Case study
            <ArrowRight size={14} className="work-action-arrow" />
          </Link>
          <ExternalLink href={project.links.github} className="work-action">
            Source
            <ArrowUpRight size={14} className="work-action-arrow" />
          </ExternalLink>
          {project.links.live ? (
            <ExternalLink href={project.links.live} className="work-action">
              Live demo
              <ArrowUpRight size={14} className="work-action-arrow" />
            </ExternalLink>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ProjectOverlay({ project, onClose, onStep }: { project: Project; onClose: () => void; onStep: (direction: 1 | -1) => void }) {
  return (
    <div data-scroll className="project-overlay-scroll">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-bg/85 px-5 py-3 backdrop-blur-md md:px-8">
        <p className="truncate font-mono text-xs tracking-[0.06em] text-subtle uppercase">{project.category}</p>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onStep(-1)} className={buttonStyles.ghost} aria-label="Previous project">
            <ArrowLeft size={16} />
          </button>
          <button type="button" onClick={() => onStep(1)} className={buttonStyles.ghost} aria-label="Next project">
            <ArrowRight size={16} />
          </button>
          <button type="button" onClick={onClose} className={`${buttonStyles.ghost} ml-1`} aria-label="Close project">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-5 pb-10 md:px-8">
        <div className="mt-6 aspect-[16/8] overflow-hidden rounded-2xl">
          <ProjectCover project={project} />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h2 id="project-overlay-title" className="text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
              {project.name}
            </h2>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-pretty text-muted">{project.tagline}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/work/${project.slug}`} className={buttonStyles.primary}>
              Full case study
              <ArrowRight size={16} />
            </Link>
            <ExternalLink href={project.links.github} className={buttonStyles.secondary}>
              <GitHub />
              Source
            </ExternalLink>
            {project.links.live ? (
              <ExternalLink href={project.links.live} className={buttonStyles.secondary}>
                Live
                <ArrowUpRight size={15} />
              </ExternalLink>
            ) : null}
            {project.links.live && project.liveNote ? (
              <p className="w-full font-mono text-xs text-subtle md:text-right">{project.liveNote}</p>
            ) : null}
          </div>
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
          {project.metrics.map((metric) => (
            <div key={metric.label} className="flex flex-col-reverse bg-surface px-5 py-5">
              <dt className="mt-1.5 text-sm leading-snug text-subtle">{metric.label}</dt>
              <dd className="text-3xl font-semibold tracking-tight tabular-nums">{metric.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <section aria-labelledby="overlay-problem">
            <h3 id="overlay-problem" className="eyebrow">
              The problem
            </h3>
            <p className="mt-3 text-base leading-relaxed text-pretty">{project.problem}</p>
          </section>
          <section aria-labelledby="overlay-approach">
            <h3 id="overlay-approach" className="eyebrow">
              The approach
            </h3>
            <p className="mt-3 text-base leading-relaxed text-pretty text-muted">{project.approach}</p>
          </section>
        </div>

        <div className="mt-10 grid gap-10 border-t border-line pt-8 md:grid-cols-[1.4fr_1fr]">
          <section aria-labelledby="overlay-highlights">
            <h3 id="overlay-highlights" className="eyebrow">
              What it does
            </h3>
            <ul className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {project.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-3 text-[15px] text-muted">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                  {highlight}
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="overlay-stack">
            <h3 id="overlay-stack" className="eyebrow">
              Stack
            </h3>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {project.stack.map((tool) => (
                <li key={tool} className="pill">
                  {tool}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
