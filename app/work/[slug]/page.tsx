import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArchitectureDiagram } from '@/components/architecture-diagram';
import { ArrowLeft, ArrowRight, ArrowUpRight, GitHub } from '@/components/icons';
import { StackPills } from '@/components/stack-pills';
import { ProjectPreview } from '@/components/project-preview';
import { buttonStyles, ExternalLink } from '@/components/ui';
import { getProject, projects } from '@/data/projects';

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const project = getProject((await params).slug);
  if (!project) return {};
  return {
    title: `${project.name} case study`,
    description: project.tagline,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: { title: `${project.name} — case study`, description: project.tagline, url: `/work/${project.slug}` },
  };
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="reveal border-t border-line py-12 md:grid md:grid-cols-[14rem_1fr] md:gap-10">
      <h2 id={id} className="eyebrow mb-5 md:mb-0 md:pt-1">
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}

export default async function CaseStudyPage({ params }: { params: Params }) {
  const project = getProject((await params).slug);
  if (!project) notFound();

  const index = projects.findIndex((entry) => entry.slug === project.slug);
  const next = projects[(index + 1) % projects.length];

  return (
    <article className="mx-auto max-w-6xl px-4 sm:px-6">
      <header className="relative pt-10 pb-12 md:pt-16">
        {/* Full navigation on purpose: vinext's client router does not scroll to hash targets. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/#work"
          className="enter inline-flex items-center gap-2 text-sm text-muted transition-colors duration-200 hover:text-fg"
        >
          <ArrowLeft size={15} />
          All work
        </a>
        <p className="eyebrow enter mt-10">{project.category}</p>
        <h1 className="enter mt-3 text-4xl font-semibold tracking-[-0.045em] md:text-6xl">{project.name}</h1>
        <p className="enter mt-4 max-w-2xl text-lg leading-relaxed text-pretty text-muted md:text-xl">
          {project.tagline}
        </p>
        <div className="enter mt-8 flex flex-wrap gap-3">
          <ExternalLink href={project.links.github} className={buttonStyles.primary}>
            <GitHub />
            View source
          </ExternalLink>
          {project.links.live ? (
            <ExternalLink href={project.links.live} className={buttonStyles.secondary}>
              Open live demo
              <ArrowUpRight size={16} />
            </ExternalLink>
          ) : null}
        </div>

        <dl className="enter mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
          {project.metrics.map((metric) => (
            <div key={metric.label} className="flex flex-col-reverse bg-surface px-5 py-5">
              <dt className="mt-1.5 text-sm leading-snug text-subtle">{metric.label}</dt>
              <dd className="text-3xl font-semibold tracking-tight tabular-nums">{metric.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <Section id="problem" title="Problem">
        <p className="max-w-3xl text-lg leading-relaxed text-pretty text-fg/90">{project.problem}</p>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted">{project.approach}</p>
      </Section>

      <Section id="architecture" title="Architecture">
        <p className="mb-8 max-w-3xl text-base leading-relaxed text-muted">{project.architecture.summary}</p>
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <ArchitectureDiagram layers={project.architecture.layers} label={`${project.name} architecture, top to bottom`} />
          {project.image ? <ProjectPreview project={project} priority /> : null}
        </div>
      </Section>

      <Section id="challenges" title="Challenges & solutions">
        <ol className="grid gap-4 md:grid-cols-2">
          {project.challenges.map((challenge, i) => (
            <li key={challenge.title} className="rounded-2xl border border-line bg-surface/60 p-6">
              <p className="font-mono text-xs text-accent">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em]">{challenge.title}</h3>
              <dl className="mt-4 space-y-3 text-sm leading-relaxed">
                <div>
                  <dt className="eyebrow mb-1">Challenge</dt>
                  <dd className="text-muted">{challenge.problem}</dd>
                </div>
                <div>
                  <dt className="eyebrow mb-1">Solution</dt>
                  <dd className="text-fg/90">{challenge.solution}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="capabilities" title="What it does">
        <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {project.highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-3 text-base text-muted">
              <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
              {highlight}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="stack" title="Stack">
        <StackPills stack={project.stack} />
      </Section>

      <nav aria-label="Next case study" className="border-t border-line py-14">
        <Link
          href={`/work/${next.slug}`}
          className="group flex items-center justify-between gap-6 rounded-2xl border border-line bg-surface/60 p-6 transition duration-300 ease-out hover:border-line-strong hover:bg-surface md:p-8"
        >
          <div>
            <p className="eyebrow">Next case study</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] md:text-3xl">{next.name}</p>
            <p className="mt-1 text-sm text-muted">{next.tagline}</p>
          </div>
          <ArrowRight size={24} className="shrink-0 text-subtle transition duration-200 group-hover:translate-x-1 group-hover:text-fg" />
        </Link>
      </nav>
    </article>
  );
}
