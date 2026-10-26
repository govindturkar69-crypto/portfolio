import { Fragment } from 'react';
import Link from 'next/link';
import { getProject, projects } from '@/data/projects';
import { experience, site, type TimelineEntry } from '@/data/site';
import { alsoUsed, stackGroups } from '@/data/stack';
import { ArrowUpRight, Download, GitHub, LinkedIn } from '../icons';
import { ExternalLink } from '../ui';
import { DevUniverse } from './dev-universe';
import { SystemArchitecture } from './system-architecture';
import { SystemOrbit } from './system-orbit';
import { WorkGrid } from './work-grid';

export const container = 'mx-auto w-full max-w-[88rem] px-4 sm:px-6 lg:px-10';

/** Shared section opener: numbered mono label, hairline, then a large heading. */
function SectionIntro({
  index,
  label,
  id,
  title,
  aside,
  art,
}: {
  index: string;
  label: string;
  id: string;
  title: React.ReactNode;
  aside?: React.ReactNode;
  /** Decorative visual beside the heading (below it on smaller screens). */
  art?: React.ReactNode;
}) {
  return (
    <header className="reveal relative mb-12 md:mb-20">
      <div className="flex items-center justify-between gap-4 border-b border-line pb-4 font-mono text-xs tracking-[0.08em] text-subtle uppercase">
        <span>
          ({index}) — {label}
        </span>
        {aside ? <span>{aside}</span> : null}
      </div>
      <div className={art ? 'section-intro-art' : undefined}>
        <h2 id={id} className="mt-8 max-w-5xl text-[clamp(2.25rem,5.6vw,5.25rem)] leading-[0.95] font-semibold tracking-[-0.045em] text-balance">
          {title}
        </h2>
        {art}
      </div>
    </header>
  );
}

/** Short statement between the hero and the work, with inline links to current projects. */
export function IntroSection() {
  const link =
    'text-fg underline decoration-line-strong decoration-1 underline-offset-[0.18em] transition-colors duration-200 hover:decoration-accent';
  return (
    <section aria-label="Introduction" className={`${container} py-24 md:py-40`}>
      <div className="intro-grid">
        <p className="reveal font-mono text-xs tracking-[0.08em] text-subtle uppercase md:pt-3 [grid-area:label]">(00) — In short</p>
        {/* System orbit: fills the column under the label (beside the text), below the text on phones. */}
        <div aria-hidden="true" className="intro-orbit" data-reveal="rise">
          <SystemOrbit />
        </div>
        <p className="reveal [grid-area:text] max-w-[22ch] text-[clamp(1.75rem,3.6vw,3.5rem)] leading-[1.08] font-medium tracking-[-0.035em] text-pretty text-muted md:max-w-none">
          <span className="text-fg">I build products the whole way down</span> — interfaces people enjoy, typed APIs that hold up,
          and the storage engine underneath when I want to understand it properly. Lately that means{' '}
          <Link href="/work/scratchdb" className={link}>
            ScratchDB
          </Link>
          , a relational database in Rust, and{' '}
          <Link href="/work/veridoc" className={link}>
            VeriDoc
          </Link>
          , an assistant that would rather say &ldquo;not found&rdquo; than make something up.
        </p>
      </div>
    </section>
  );
}

export function WorkSection() {
  return (
    <section id="work" aria-labelledby="work-title" className={`${container} py-24 md:py-36`}>
      <SectionIntro
        index="01"
        label="Selected work"
        id="work-title"
        aside={`${String(projects.length).padStart(2, '0')} projects`}
        title={
          <>
            Products and systems, <span className="text-muted">built end to end.</span>
          </>
        }
        art={
          <div aria-hidden="true" className="work-system">
            <SystemArchitecture projects={projects} />
          </div>
        }
      />
      <WorkGrid projects={projects} />
    </section>
  );
}

export function CapabilitiesSection() {
  return (
    <section id="capabilities" aria-labelledby="capabilities-title" className="relative">
      <div className={`${container} py-24 md:py-36`}>
        <SectionIntro
          index="02"
          label="Capabilities"
          id="capabilities-title"
          title={
            <>
              Every tool listed here <span className="text-muted">ships in a project you can open.</span>
            </>
          }
        />
        <ol className="border-t border-line">
          {stackGroups.map((group, index) => (
            <li key={group.id} className="capability reveal">
              <span className="font-mono text-xs text-subtle tabular-nums md:pt-3">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="text-3xl font-semibold tracking-[-0.035em] md:text-[2.75rem] md:leading-none">{group.title}</h3>
              <div>
                <p className="text-base leading-relaxed text-pretty text-muted">{group.summary}</p>
                <p className="mt-3 font-mono text-xs leading-relaxed text-fg/80">{group.tools.join(' · ')}</p>
                <p className="mt-4 text-sm text-subtle">
                  Used in{' '}
                  {group.evidence.map((slug, i) => {
                    const project = getProject(slug);
                    if (!project) return null;
                    return (
                      <span key={slug}>
                        {i > 0 ? ', ' : ''}
                        <Link
                          href={`/work/${slug}`}
                          className="text-muted underline decoration-line-strong underline-offset-4 transition-colors duration-200 hover:text-fg hover:decoration-accent"
                        >
                          {project.name}
                        </Link>
                      </span>
                    );
                  })}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="reveal mt-10 font-mono text-xs tracking-[0.06em] text-subtle uppercase">Also comfortable with — {alsoUsed.join(' · ')}</p>
      </div>
    </section>
  );
}

/** Splits text into word spans for a staggered reveal; screen readers still read it as one sentence. */
function RevealWords({ text, offset = 0 }: { text: string; offset?: number }) {
  // The space sits between spans: inside an inline-block it would collapse.
  return text.split(' ').map((word, i) => (
    <Fragment key={i}>
      <span className="reveal-word" style={{ '--i': offset + i } as React.CSSProperties}>
        {word}
      </span>{' '}
    </Fragment>
  ));
}

function TimelineGroup({ label, entries, delay = 0 }: { label: string; entries: TimelineEntry[]; delay?: number }) {
  return (
    <div className="mt-16 first:mt-0">
      <div className="flex items-center gap-4" data-reveal style={{ '--d': `${delay}ms` } as React.CSSProperties}>
        <h3 className="about-label">{label}</h3>
        <span aria-hidden="true" className="about-rule" data-reveal="line" />
      </div>
      <ol className="mt-2">
        {entries.map((entry, i) => (
          <li key={entry.organization} className="about-entry" data-reveal style={{ '--d': `${delay + 120 + i * 90}ms` } as React.CSSProperties}>
            <p className="font-mono text-xs tracking-[0.04em] text-subtle tabular-nums md:pt-1">{entry.period}</p>
            <div className="min-w-0">
              <h4 className="text-xl leading-snug font-semibold tracking-[-0.02em] md:text-[1.375rem]">
                <ExternalLink href={entry.href} className="about-entry-link">
                  {entry.organization}
                  <ArrowUpRight size={16} className="about-entry-arrow" />
                </ExternalLink>
              </h4>
              <p className="mt-1 text-sm text-fg/80">{entry.title}</p>
              <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-pretty text-muted">{entry.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** How I work: each principle points at the project that demonstrates it. */
const principles: { title: string; body: string; proof: { label: string; href: string } }[] = [
  {
    title: 'Build the layer underneath',
    body: 'When I want to understand a system properly, I implement it — storage engines, wire protocols, crawlers.',
    proof: { label: 'ScratchDB', href: '/work/scratchdb' },
  },
  {
    title: 'Prove it with tests',
    body: 'Correctness claims come with automated tests, fuzzing and failure cases, not just a working demo.',
    proof: { label: 'Redis in Java', href: '/work/java-redis' },
  },
  {
    title: 'Ship it end to end',
    body: 'Interfaces, typed APIs, data models and deployment — finished products people can open and use.',
    proof: { label: 'RealtyIQ', href: '/work/realtyiq' },
  },
];

/** Milestones taken from verified project data (test counts were counted in the repositories). */
const milestones: { value: string; label: string; href: string }[] = [
  { value: '58/58', label: 'release-mode tests in ScratchDB, plus 500K-transaction endurance runs', href: '/work/scratchdb' },
  { value: '71', label: 'automated tests in a Redis-compatible server written in plain Java', href: '/work/java-redis' },
  { value: '391', label: 'test cases across the Private Search Engine backend and frontend', href: '/work/private-search' },
  { value: '3', label: 'live deployments: NexusCode, RealtyIQ and Aurora Weather', href: '/#work' },
];

export function AboutSection() {
  const current = experience.find((entry) => entry.kind === 'work');
  const facts: [string, string][] = [
    ['Based in', site.location],
    ['Focus', 'Full-stack products & systems'],
    ...(current ? ([['Currently', `${current.title.split(' · ')[0]}, ${current.organization}`]] as [string, string][]) : []),
    ['Status', site.availability],
  ];
  const intro = [
    'Most of my work is product engineering: React and TypeScript interfaces, typed APIs, auth, real-time channels and data models that hold up in production.',
    'When I want to understand a layer properly, I build it — which is how I ended up writing a relational database engine with its own buffer pool, B+Trees and crash recovery.',
  ];
  const firstWords = intro[0].split(' ').length;
  return (
    <section id="about" aria-labelledby="about-title" className={`${container} py-24 md:py-36`}>
      <SectionIntro
        index="03"
        label="About"
        id="about-title"
        title={
          <>
            I like knowing how the whole thing works — <span className="text-muted">from the button to the bytes on disk.</span>
          </>
        }
      />

      <div className="grid gap-14 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-20">
        {/* Left: the living code lattice, and quick facts. Sticky on large screens, below the fixed HUD. */}
        <aside className="self-start lg:sticky lg:top-28">
          <figure data-reveal="rise">
            <div className="about-universe">
              <DevUniverse />
            </div>
            <figcaption className="mt-4 flex items-baseline justify-between gap-4">
              <span className="text-base font-semibold tracking-[-0.01em]">{site.name}</span>
              <span className="font-mono text-xs tracking-[0.04em] text-subtle uppercase">{site.role}</span>
            </figcaption>
          </figure>

          <dl className="mt-6">
            {facts.map(([term, value], i) => (
              <div key={term} className="about-fact" data-reveal style={{ '--d': `${160 + i * 70}ms` } as React.CSSProperties}>
                <dt className="font-mono text-xs tracking-[0.06em] text-subtle uppercase">{term}</dt>
                <dd className="text-sm">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap gap-2" data-reveal style={{ '--d': '420ms' } as React.CSSProperties}>
            <ExternalLink href={site.github} className="about-chip">
              <GitHub size={14} />
              GitHub
            </ExternalLink>
            <ExternalLink href={site.linkedin} className="about-chip">
              <LinkedIn size={14} />
              LinkedIn
            </ExternalLink>
            <a href={site.resume} download className="about-chip">
              <Download size={14} />
              Résumé
            </a>
          </div>
        </aside>

        {/* Right: introduction, then experience and education. */}
        <div className="min-w-0">
          <div className="flex items-center gap-4" data-reveal>
            <h3 className="about-label">Introduction</h3>
            <span aria-hidden="true" className="about-rule" data-reveal="line" />
          </div>
          <div className="mt-6 max-w-[38ch] space-y-6 text-[clamp(1.25rem,2vw,1.625rem)] leading-[1.5] tracking-[-0.01em] text-pretty md:max-w-[44ch]" data-reveal="words">
            <p>
              <RevealWords text={intro[0]} />
            </p>
            <p className="text-muted">
              <RevealWords text={intro[1]} offset={firstWords} />
            </p>
          </div>

          <div className="mt-16 flex items-center gap-4" data-reveal>
            <h3 className="about-label">How I work</h3>
            <span aria-hidden="true" className="about-rule" data-reveal="line" />
          </div>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {principles.map((item, i) => (
              <li key={item.title} className="about-principle" data-reveal style={{ '--d': `${i * 90}ms` } as React.CSSProperties}>
                <p className="font-mono text-xs text-accent tabular-nums">{String(i + 1).padStart(2, '0')}</p>
                <h4 className="mt-2 text-lg leading-snug font-semibold tracking-[-0.02em]">{item.title}</h4>
                <p className="mt-2 text-[15px] leading-relaxed text-pretty text-muted">{item.body}</p>
                <Link href={item.proof.href} className="work-action mt-3 text-sm">
                  See {item.proof.label}
                  <ArrowUpRight size={14} className="work-action-arrow" />
                </Link>
              </li>
            ))}
          </ol>

          <div className="mt-16">
            <TimelineGroup label="Experience" entries={experience.filter((entry) => entry.kind === 'work')} />
            <TimelineGroup label="Education" entries={experience.filter((entry) => entry.kind === 'education')} delay={80} />
          </div>

          <div className="mt-16 flex items-center gap-4" data-reveal>
            <h3 className="about-label">Selected milestones</h3>
            <span aria-hidden="true" className="about-rule" data-reveal="line" />
          </div>
          <ul className="mt-2 grid sm:grid-cols-2">
            {milestones.map((item, i) => (
              <li key={item.label} data-reveal style={{ '--d': `${i * 80}ms` } as React.CSSProperties}>
                <Link href={item.href} className="about-milestone group">
                  <span className="text-3xl font-semibold tracking-[-0.03em] tabular-nums">{item.value}</span>
                  <span className="text-sm leading-snug text-muted">{item.label}</span>
                  <ArrowUpRight size={14} className="about-entry-arrow mt-1 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
