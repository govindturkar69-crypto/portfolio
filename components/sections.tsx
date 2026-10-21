import Image from 'next/image';
import Link from 'next/link';
import { getProject, projects } from '@/data/projects';
import { experience, site } from '@/data/site';
import { alsoUsed, stackGroups, type StackGroup } from '@/data/stack';
import { CopyEmailButton } from './copy-email-button';
import { ArrowRight, ArrowUpRight, Download, GitHub, LinkedIn } from './icons';
import { buttonStyles, ExternalLink, SectionHeading } from './ui';

const container = 'mx-auto max-w-6xl px-4 sm:px-6';

/** Bedrock: every project on one screen, for readers who skip the descent. */
export function IndexSection() {
  return (
    <section id="index" aria-labelledby="index-title" className={`${container} py-20 md:py-28`}>
      <SectionHeading
        id="index-title"
        eyebrow="06 · Bedrock"
        title="The whole stack, at a glance."
        description="Every project, the number that matters most, and a link to its full case study."
      />
      <ol className="reveal divide-y divide-line border-y border-line">
        {projects.map((project, index) => (
          <li key={project.slug}>
            <Link
              href={`/work/${project.slug}`}
              className="group grid grid-cols-[2.25rem_1fr_auto] items-center gap-4 py-5 transition-colors duration-200 hover:bg-white/[0.02] md:grid-cols-[3rem_1.1fr_1.6fr_9rem_auto] md:gap-6 md:px-3"
            >
              <span className="font-mono text-xs text-subtle tabular-nums">{String(index + 1).padStart(2, '0')}</span>
              <span>
                <span className="block text-lg font-semibold tracking-[-0.02em]">{project.name}</span>
                <span className="block font-mono text-xs text-subtle">{project.category}</span>
              </span>
              <span className="col-span-2 col-start-2 text-sm leading-relaxed text-muted md:col-span-1 md:col-start-auto">
                {project.tagline}
              </span>
              <span className="hidden flex-col md:flex">
                <span className="text-lg font-semibold tabular-nums">{project.metrics[0].value}</span>
                <span className="text-xs leading-snug text-subtle">{project.metrics[0].label}</span>
              </span>
              <ArrowRight
                size={18}
                className="col-start-3 row-start-1 justify-self-end text-subtle transition duration-200 group-hover:translate-x-1 group-hover:text-fg md:col-start-auto md:row-start-auto"
              />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

const spanClass: Record<StackGroup['span'], string> = {
  wide: 'md:col-span-2',
  base: '',
};

export function StackSection() {
  return (
    <section id="stack" aria-labelledby="stack-title" className="border-y border-line bg-surface/40">
      <div className={`${container} py-20 md:py-28`}>
        <SectionHeading
          id="stack-title"
          eyebrow="Stack"
          title="Every tool here ships in a project you can open."
          description="Grouped by engineering layer, with links to the work that uses it."
        />

        <ul className="grid gap-4 md:grid-cols-3">
          {stackGroups.map((group) => (
            <li
              key={group.id}
              className={`reveal group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-bg p-6 transition duration-300 ease-out hover:border-line-strong ${spanClass[group.span]}`}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 -right-24 size-48 rounded-full bg-accent/10 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
              />
              <h3 className="text-lg font-semibold tracking-[-0.02em]">{group.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{group.summary}</p>
              <ul className="mt-5 flex flex-wrap gap-1.5" aria-label={`${group.title} tools`}>
                {group.tools.map((tool) => (
                  <li key={tool} className="pill text-fg/90">
                    {tool}
                  </li>
                ))}
              </ul>
              <p className="mt-auto pt-6 text-xs text-subtle">
                <span className="font-mono">Used in </span>
                {group.evidence.map((slug, index) => {
                  const project = getProject(slug);
                  if (!project) return null;
                  return (
                    <span key={slug}>
                      {index > 0 ? ', ' : ''}
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
            </li>
          ))}
          <li className="reveal flex flex-col justify-center rounded-2xl border border-dashed border-line-strong p-6">
            <h3 className="eyebrow">Also comfortable with</h3>
            <p className="mt-3 text-base leading-relaxed text-muted">{alsoUsed.join(' · ')}</p>
          </li>
        </ul>
      </div>
    </section>
  );
}

export function AboutSection() {
  return (
    <section id="about" aria-labelledby="about-title" className={`${container} py-20 md:py-28`}>
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <div className="reveal">
          <p className="eyebrow mb-3">About</p>
          <h2 id="about-title" className="text-3xl font-semibold tracking-[-0.03em] text-balance md:text-4xl">
            I like knowing how the whole thing works.
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-muted">
            <p>
              Most of my work is product engineering: React and TypeScript interfaces, typed APIs, auth, real-time
              channels and data models that hold up in production.
            </p>
            <p>
              I build the layer underneath when I want to understand it properly — which is how I ended up writing a
              database engine with its own buffer pool, B+Trees and crash recovery.
            </p>
          </div>
          <div className="mt-8 flex items-center gap-4">
            <Image
              src="/govind-3d-avatar.webp"
              alt=""
              width={1000}
              height={929}
              sizes="56px"
              className="size-14 rounded-full border border-line-strong bg-surface-2 object-cover"
            />
            <div className="text-sm">
              <p className="font-medium text-fg">{site.name}</p>
              <p className="text-subtle">
                {site.location} · {site.timezone}
              </p>
            </div>
          </div>
        </div>

        <ol className="relative space-y-4" aria-label="Experience and education">
          {experience.map((entry) => (
            <li key={entry.organization} className="reveal rounded-2xl border border-line bg-surface/60 p-6">
              <p className="font-mono text-xs text-subtle">{entry.period}</p>
              <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em]">
                <ExternalLink
                  href={entry.href}
                  className="group inline-flex items-center gap-1.5 transition-colors duration-200 hover:text-accent-strong"
                >
                  {entry.organization}
                  <ArrowUpRight size={15} className="text-subtle transition-colors group-hover:text-accent" />
                </ExternalLink>
              </h3>
              <p className="mt-1 text-sm text-fg/85">{entry.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{entry.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function ContactSection() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative isolate overflow-hidden border-t border-line">
      <div aria-hidden="true" className="mesh absolute inset-0 -z-10 opacity-70" />
      <div className={`${container} py-24 text-center md:py-32`}>
        <p className="eyebrow reveal mb-4">Contact · end of the stack</p>
        <h2
          id="contact-title"
          className="reveal mx-auto max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-balance md:text-6xl"
        >
          Hiring for a role where depth matters?
        </h2>
        <p className="reveal mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
          I&apos;m open to full-stack, backend and systems roles. The fastest way to reach me is email.
        </p>

        <div className="reveal mt-10 flex flex-wrap items-center justify-center gap-3">
          <a href={`mailto:${site.email}`} className={buttonStyles.primary}>
            Email me
          </a>
          <CopyEmailButton email={site.email} showAddress className={buttonStyles.secondary} />
        </div>
        <div className="reveal mt-4 flex flex-wrap items-center justify-center gap-2">
          <a href={site.resume} download className={buttonStyles.ghost}>
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
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className={`${container} flex flex-col items-center justify-between gap-3 py-8 text-xs text-subtle sm:flex-row`}>
        <p>
          © {new Date().getFullYear()} {site.name}. Built with Next.js, TypeScript and Tailwind CSS.
        </p>
        <p className="font-mono">
          Press <kbd className="rounded border border-line px-1.5 py-0.5">⌘K</kbd> to navigate
        </p>
      </div>
    </footer>
  );
}
