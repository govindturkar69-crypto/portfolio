import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArchitectureDiagram } from '@/components/architecture-diagram';
import { ArrowLeft, ArrowRight, ArrowUpRight, GitHub } from '@/components/icons';
import { container } from '@/components/portfolio/home-sections';
import { ProjectCover } from '@/components/portfolio/project-cover';
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

function Section({ id, index, title, children }: { id: string; index: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="reveal grid gap-6 border-t border-line py-14 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-10 md:py-20">
      <h2 id={id} className="font-mono text-xs tracking-[0.08em] text-subtle uppercase md:pt-2">
        ({index}) — {title}
      </h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export default async function CaseStudyPage({ params }: { params: Params }) {
  const project = getProject((await params).slug);
  if (!project) notFound();

  const index = projects.findIndex((entry) => entry.slug === project.slug);
  const next = projects[(index + 1) % projects.length];

  return (
    <article className={container}>
      <header className="pt-28 md:pt-32" /* clears the fixed HUD */>
        <div className="enter flex items-center justify-between gap-4 border-b border-line pb-4 font-mono text-xs tracking-[0.08em] text-subtle uppercase">
          {/* Full navigation on purpose: vinext's client router does not scroll to hash targets. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/#work" className="inline-flex items-center gap-2 transition-colors duration-200 hover:text-fg">
            <ArrowLeft size={14} />
            All work
          </a>
          <span>
            Case study {String(index + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
          </span>
        </div>

        <div className="mt-10 grid gap-8 md:mt-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="enter font-mono text-xs tracking-[0.08em] text-accent uppercase">{project.category}</p>
            <h1 className="enter mt-4 text-[clamp(3rem,10vw,9rem)] leading-[0.85] font-semibold tracking-[-0.055em]">{project.name}</h1>
            <p className="enter mt-6 max-w-2xl text-xl leading-relaxed text-pretty text-muted md:text-2xl">{project.tagline}</p>
          </div>
          <div className="enter flex flex-wrap gap-3">
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
            {project.links.live && project.liveNote ? <p className="w-full font-mono text-xs text-subtle">{project.liveNote}</p> : null}
          </div>
        </div>

        <div className="enter mt-12 aspect-[16/9] overflow-hidden rounded-[clamp(14px,1.6vw,26px)] md:aspect-[16/7]">
          <ProjectCover project={project} priority />
        </div>

        <dl className="enter mt-6 grid grid-cols-2 border-y border-line md:grid-cols-4">
          {project.metrics.map((metric, i) => (
            <div key={metric.label} className={`flex flex-col-reverse px-1 py-6 md:px-6 ${i % 2 ? 'border-l border-line' : ''} ${i > 0 ? 'md:border-l md:border-line' : ''} ${i > 1 ? 'border-t border-line md:border-t-0' : ''}`}>
              <dt className="mt-2 text-sm leading-snug text-subtle">{metric.label}</dt>
              <dd className="text-4xl font-semibold tracking-[-0.03em] tabular-nums md:text-5xl">{metric.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="mt-10">
        <Section id="problem" index="01" title="Problem & approach">
          <p className="max-w-3xl text-2xl leading-snug font-medium tracking-[-0.02em] text-pretty md:text-3xl">{project.problem}</p>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-pretty text-muted">{project.approach}</p>
        </Section>

        <Section id="architecture" index="02" title="Architecture">
          <p className="mb-8 max-w-3xl text-lg leading-relaxed text-muted">{project.architecture.summary}</p>
          <ArchitectureDiagram layers={project.architecture.layers} label={`${project.name} architecture, top to bottom`} />
        </Section>

        <Section id="challenges" index="03" title="Challenges & solutions">
          <ol className="border-t border-line">
            {project.challenges.map((challenge, i) => (
              <li key={challenge.title} className="grid gap-4 border-b border-line py-8 md:grid-cols-[3rem_1fr]">
                <p className="font-mono text-xs text-accent md:pt-2">{String(i + 1).padStart(2, '0')}</p>
                <div>
                  <h3 className="text-2xl font-semibold tracking-[-0.03em]">{challenge.title}</h3>
                  <dl className="mt-5 grid gap-6 text-[15px] leading-relaxed md:grid-cols-2">
                    <div>
                      <dt className="eyebrow mb-2">Challenge</dt>
                      <dd className="text-muted">{challenge.problem}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow mb-2">Solution</dt>
                      <dd className="text-fg/90">{challenge.solution}</dd>
                    </div>
                  </dl>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="capabilities" index="04" title="What it does">
          <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {project.highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-3 text-lg text-muted">
                <span aria-hidden="true" className="mt-3 size-1.5 shrink-0 rounded-full bg-accent" />
                {highlight}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="stack" index="05" title="Stack">
          <ul className="flex flex-wrap gap-2">
            {project.stack.map((tool) => (
              <li key={tool} className="rounded-full border border-line-strong px-4 py-2 text-[15px]">
                {tool}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <nav aria-label="Next case study" className="border-t border-line py-16 md:py-24">
        <Link href={`/work/${next.slug}`} className="work-card group grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
          <div>
            <p className="font-mono text-xs tracking-[0.08em] text-subtle uppercase">Next case study</p>
            <p className="mt-4 text-[clamp(2.5rem,7vw,6rem)] leading-[0.9] font-semibold tracking-[-0.05em]">
              <span className="work-title">{next.name}</span>
            </p>
            <p className="mt-4 max-w-md text-muted">{next.tagline}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium">
              Read case study
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </div>
          <div className="work-cover">
            <ProjectCover project={next} />
          </div>
        </Link>
      </nav>
    </article>
  );
}
