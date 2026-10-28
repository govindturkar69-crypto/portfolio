'use client';

import Link from 'next/link';
import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { soloProjects, type Project } from '@/data/projects';
import { projectFocus } from '@/lib/project-focus';
import { sound } from '@/lib/sound';
import { ArrowLeft, ArrowRight, ArrowUpRight } from '../icons';
import { buttonStyles, ExternalLink } from '../ui';
import { coverTheme, ProjectCover } from './project-cover';

/*
 * Featured work as a cinematic showcase: one project at a time, with everything a reviewer needs
 * on the slide (what it does, the problem, what was built, the key decision, verified numbers,
 * architecture, stack, links). Every slide shares one grid cell, so the section never changes
 * height between projects. Transitions use the Web Animations API (transform + opacity only):
 * the cover glides in with a little depth, the text follows in a short stagger.
 *
 * Controls: previous/next buttons, a project switcher, ←/→ while the showcase has focus, and a
 * horizontal swipe on touch screens (vertical scrolling is left to the browser).
 */

type Props = { projects: Project[]; onOpen: (event: MouseEvent<HTMLAnchorElement>, slug: string) => void };
type Transition = { active: number; from: number | null; dir: 1 | -1 };

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Finishes the animations after `ms` even if frames stall (content must never stay invisible),
 * and returns the cleanup that cancels them when the next change starts or on unmount.
 */
function settle(animations: Animation[], ms: number) {
  const timer = window.setTimeout(() => animations.forEach((a) => a.finish()), ms);
  return () => {
    window.clearTimeout(timer);
    animations.forEach((a) => a.cancel());
  };
}

export function ProjectShowcase({ projects, onOpen }: Props) {
  const [state, setState] = useState<Transition>({ active: 0, from: null, dir: 1 });
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const rootRef = useRef<HTMLElement>(null);
  const tabsRef = useRef<HTMLUListElement>(null);
  const pointerInside = useRef(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const count = projects.length;
  const current = projects[state.active];

  const go = useCallback(
    (index: number, dir: 1 | -1) => {
      setState((s) => {
        const next = (index + count) % count;
        if (next === s.active) return s;
        return { active: next, from: s.active, dir };
      });
      sound.play('tick');
    },
    [count],
  );

  // Animate the change before paint, so the incoming slide never flashes in its final place.
  useLayoutEffect(() => {
    if (pointerInside.current) projectFocus.set(projects[state.active].slug);
    // Keep the active name visible in the switcher (it scrolls sideways on narrow screens).
    const tabs = tabsRef.current;
    const tab = tabs?.children[state.active] as HTMLElement | undefined;
    if (tabs && tab && tabs.scrollWidth > tabs.clientWidth) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      tabs.scrollTo({ left: tab.offsetLeft - (tabs.clientWidth - tab.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
    }
    if (state.from === null) return;
    const incoming = slideRefs.current[state.active];
    const outgoing = slideRefs.current[state.from];
    if (!incoming || !outgoing || typeof incoming.animate !== 'function') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const fade = incoming.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180 });
      const out = outgoing.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: 'forwards' });
      return settle([fade, out], 400);
    }
    const { dir } = state;
    const compact = window.innerWidth < 768;
    const shift = compact ? 36 : 72;
    const animations: Animation[] = [
      outgoing.animate(
        [
          { opacity: 1, transform: 'none' },
          { opacity: 0, transform: `translateX(${-dir * shift * 0.6}px) scale(0.985)` },
        ],
        { duration: 380, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' },
      ),
    ];
    const visual = incoming.querySelector<HTMLElement>('[data-visual]');
    if (visual) {
      animations.push(
        visual.animate(
          [
            { opacity: 0, transform: `perspective(1400px) translateX(${dir * shift}px) rotateY(${compact ? 0 : -dir * 9}deg) scale(0.94)` },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 900, delay: 80, easing: EASE, fill: 'backwards' },
        ),
      );
    }
    incoming.querySelectorAll<HTMLElement>('[data-stagger]').forEach((el, i) => {
      animations.push(
        el.animate(
          [
            { opacity: 0, transform: `translateX(${dir * 24}px)` },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 650, delay: 160 + Math.min(i, 8) * 55, easing: EASE, fill: 'backwards' },
        ),
      );
    });
    return settle(animations, 1700);
  }, [state, projects]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(state.active + 1, 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(state.active - 1, -1);
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse') return;
    swipe.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    // A deliberate horizontal swipe only; anything vertical-ish is page scrolling.
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) go(state.active + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  };

  if (!current) return null;

  return (
    <section
      ref={rootRef}
      aria-roledescription="carousel"
      aria-label="Featured projects"
      className="showcase"
      onKeyDown={onKeyDown}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse') return;
        pointerInside.current = true;
        projectFocus.set(current.slug);
      }}
      onPointerLeave={() => {
        pointerInside.current = false;
        projectFocus.set(null);
      }}
    >
      {/* Counter, progress and controls. */}
      <div className="showcase-bar">
        <p className="showcase-count" aria-hidden="true">
          <span className="text-fg">{pad(state.active + 1)}</span> / {pad(count)}
        </p>
        <div className="showcase-progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${(state.active + 1) / count})` }} />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" className="showcase-arrow" aria-label="Previous project" onClick={() => go(state.active - 1, -1)}>
            <ArrowLeft size={18} />
          </button>
          <button type="button" className="showcase-arrow" aria-label="Next project" onClick={() => go(state.active + 1, 1)}>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <ul ref={tabsRef} className="showcase-tabs" aria-label="Choose a featured project">
        {projects.map((p, i) => (
          <li key={p.slug}>
            <button
              type="button"
              aria-current={i === state.active ? 'true' : undefined}
              onClick={() => go(i, i > state.active ? 1 : -1)}
              style={{ '--tab-accent': coverTheme(p.slug).accent } as CSSProperties}
            >
              <span className="tabular-nums text-subtle">{pad(i + 1)}</span> {p.name}
            </button>
          </li>
        ))}
      </ul>

      <p className="sr-only" aria-live="polite">
        Project {state.active + 1} of {count}: {current.name}
      </p>

      <div
        className="showcase-slides"
        tabIndex={0}
        aria-label="Featured project details. Use the left and right arrow keys to change project."
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          swipe.current = null;
        }}
      >
        {projects.map((p, i) => (
          <Slide
            key={p.slug}
            project={p}
            index={i}
            count={count}
            active={i === state.active}
            leaving={i === state.from}
            onOpen={onOpen}
            nextName={projects[(i + 1) % count].name}
            onNext={() => {
              go(i + 1, 1);
              // From the end of a long slide (phones), bring the new one into view from its top.
              const top = rootRef.current?.getBoundingClientRect().top ?? 0;
              if (top < 0) rootRef.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
            }}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
          />
        ))}
      </div>
    </section>
  );
}

function Slide({
  project,
  index,
  count,
  active,
  leaving,
  onOpen,
  nextName,
  onNext,
  ref,
}: {
  project: Project;
  index: number;
  count: number;
  active: boolean;
  leaving: boolean;
  onOpen: Props['onOpen'];
  nextName: string;
  onNext: () => void;
  ref: (el: HTMLElement | null) => void;
}) {
  const coverRef = useRef<HTMLDivElement>(null);
  const theme = coverTheme(project.slug);
  const decision = project.challenges[0];
  const solo = soloProjects.has(project.slug);

  const tilt = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return;
    const cover = coverRef.current;
    if (!cover || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = cover.getBoundingClientRect();
    cover.style.setProperty('--mx', (((event.clientX - rect.left) / rect.width) * 2 - 1).toFixed(3));
    cover.style.setProperty('--my', (((event.clientY - rect.top) / rect.height) * 2 - 1).toFixed(3));
  };
  const untilt = () => {
    coverRef.current?.style.setProperty('--mx', '0');
    coverRef.current?.style.setProperty('--my', '0');
  };

  return (
    <article
      ref={ref}
      className="showcase-slide"
      data-active={active ? '' : undefined}
      data-leaving={leaving ? '' : undefined}
      inert={!active}
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${count}: ${project.name}`}
      style={{ '--card-accent': theme.accent } as CSSProperties}
    >
      {/* Left: the cover, then the numbers and the shape of the system. */}
      <div className="min-w-0">
        <div data-visual className="showcase-visual" onPointerMove={tilt} onPointerLeave={untilt}>
          <Link href={`/work/${project.slug}`} onClick={(event) => onOpen(event, project.slug)} tabIndex={-1} aria-hidden="true" className="block">
            <div ref={coverRef} className="work-cover showcase-cover">
              <ProjectCover project={project} priority={index === 0} />
            </div>
          </Link>
        </div>

        {project.metrics.length ? (
          <dl className="showcase-metrics" data-stagger>
            {project.metrics.slice(0, 4).map((metric) => (
              <div key={metric.label}>
                <dt>{metric.label}</dt>
                <dd>{metric.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="mt-6" data-stagger>
          <p className="showcase-eyebrow">Architecture</p>
          <ol className="showcase-flow">
            {project.architecture.layers.map((layer) => (
              <li key={layer.name}>{layer.name}</li>
            ))}
          </ol>
        </div>

        <div className="mt-5" data-stagger>
          <p className="showcase-eyebrow">Stack</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {project.stack.map((tool) => (
              <li key={tool} className="pill">
                {tool}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right: what it is, why it exists, what was built and how to go deeper. */}
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tracking-[0.06em] text-subtle uppercase" data-stagger>
          <span>{project.category}</span>
          {solo ? <span className="showcase-solo">Solo project</span> : null}
          {project.year ? <span className="tabular-nums">{project.year}</span> : null}
        </p>
        <h3 className="mt-3 text-[clamp(2.25rem,4.4vw,4rem)] leading-[0.95] font-semibold tracking-[-0.045em]" data-stagger>
          <Link href={`/work/${project.slug}`} className="work-title-link">
            <span className="work-title">{project.name}</span>
          </Link>
        </h3>
        <p className="mt-4 max-w-[46ch] text-lg leading-relaxed text-pretty text-fg/90" data-stagger>
          {project.tagline}
        </p>

        <div className="mt-7 grid gap-6 sm:grid-cols-2" data-stagger>
          <div>
            <p className="showcase-eyebrow">The problem</p>
            <p className="mt-2 text-[15px] leading-relaxed text-pretty text-muted">{project.problem}</p>
          </div>
          <div>
            <p className="showcase-eyebrow">What I built</p>
            <p className="mt-2 text-[15px] leading-relaxed text-pretty text-muted">{project.approach}</p>
          </div>
        </div>

        {decision ? (
          <div className="showcase-decision" data-stagger>
            <p className="showcase-eyebrow">Key engineering decision</p>
            <p className="mt-2 text-[15px] leading-snug font-medium text-fg">{decision.title}</p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-pretty text-muted">{decision.solution}</p>
          </div>
        ) : null}

        <div className="mt-6" data-stagger>
          <p className="showcase-eyebrow">Highlights</p>
          <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {project.highlights.slice(0, 6).map((highlight) => (
              <li key={highlight} className="flex items-start gap-2.5 text-[15px] text-muted">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full" style={{ background: theme.accent }} />
                {highlight}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2" data-stagger>
          {project.links.live ? (
            <ExternalLink href={project.links.live} className={buttonStyles.primary}>
              Live demo
              <ArrowUpRight size={15} />
            </ExternalLink>
          ) : null}
          <ExternalLink href={project.links.github} className={project.links.live ? buttonStyles.secondary : buttonStyles.primary}>
            Source code
            <ArrowUpRight size={15} />
          </ExternalLink>
          <Link href={`/work/${project.slug}`} className={buttonStyles.secondary}>
            Full case study
            <ArrowRight size={15} />
          </Link>
          <Link href={`/work/${project.slug}`} onClick={(event) => onOpen(event, project.slug)} className="work-action ml-2 text-sm">
            Quick overview
            <ArrowRight size={14} className="work-action-arrow" />
          </Link>
        </div>
        {project.links.live && project.liveNote ? <p className="mt-3 font-mono text-xs text-subtle">{project.liveNote}</p> : null}

        {count > 1 ? (
          <button type="button" className="showcase-next" onClick={onNext}>
            <span className="showcase-eyebrow">Up next</span>
            <span className="flex items-center gap-2 text-base font-medium text-fg">
              {nextName}
              <ArrowRight size={16} />
            </span>
          </button>
        ) : null}
      </div>
    </article>
  );
}
