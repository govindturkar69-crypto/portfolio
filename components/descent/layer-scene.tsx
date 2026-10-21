import Link from 'next/link';
import type { DescentLayer } from '@/data/descent';
import { getProject } from '@/data/projects';
import { ArrowRight, ArrowUpRight, GitHub } from '../icons';
import { ExternalLink } from '../ui';
import { LayerVisualFor } from './layer-visuals';

/**
 * One pinned layer of the descent. While pinned, the giant layer word slides
 * across, copy enters, the visual builds up from --v, and everything lifts
 * away before the next layer arrives.
 */
export function LayerScene({ layer, total }: { layer: DescentLayer; total: number }) {
  const project = getProject(layer.slug);
  if (!project) throw new Error(`Unknown project for layer ${layer.id}: ${layer.slug}`);
  const titleId = `${layer.id}-title`;

  return (
    <section id={layer.id} data-scene aria-labelledby={titleId} className="scene border-t border-line/60">
      <div className="scene-sticky flex items-center">
        {/* Oversized layer word drifting across the scene. */}
        <p
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 font-semibold whitespace-nowrap text-transparent select-none [-webkit-text-stroke:1px_rgb(255_255_255/0.07)]"
          style={{
            fontSize: 'clamp(6rem, 22vw, 22rem)',
            letterSpacing: '-0.06em',
            // Drifts across the whole pass: approach, pin and departure read as one camera move.
            transform: 'translate(calc(24vw - var(--enter) * 16vw - var(--p) * 40vw - var(--leave) * 16vw), -50%)',
          }}
        >
          {layer.name}
        </p>

        <div
          className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-20 sm:px-6 md:py-0 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:pr-28"
          style={{
            // Depth: arriving layers grow out of the distance, departing ones swell past the camera.
            opacity: 'calc(var(--in) * (1 - var(--out)))',
            transform:
              'translateY(calc((1 - var(--in)) * 48px - var(--out) * 32px)) scale(calc(0.94 + var(--in) * 0.06 + var(--out) * 0.07))',
          }}
        >
          <div className="min-w-0">
            <p className="eyebrow flex items-center gap-3">
              <span className="text-accent tabular-nums">{String(layer.index).padStart(2, '0')}</span>
              {layer.name}
              <span aria-hidden="true" className="h-px w-10 bg-line-strong" />
              <span className="tabular-nums">
                {layer.index}/{total}
              </span>
            </p>
            <p className="mt-5 max-w-md text-base leading-relaxed text-pretty text-muted">{layer.thesis}</p>

            <h2 id={titleId} className="mt-8 text-4xl font-semibold tracking-[-0.045em] md:text-5xl">
              {project.name}
            </h2>
            <p className="mt-3 max-w-lg text-lg leading-snug text-pretty text-fg/85">{project.tagline}</p>

            <dl className="mt-7 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
              {project.metrics.slice(0, 3).map((metric) => (
                <div key={metric.label} className="flex flex-col-reverse bg-bg/90 px-3.5 py-3">
                  <dt className="mt-1 text-xs leading-snug text-subtle">{metric.label}</dt>
                  <dd className="text-xl font-semibold tracking-tight tabular-nums">{metric.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              <Link href={`/work/${project.slug}`} className="group inline-flex items-center gap-1.5 py-2 font-medium text-fg">
                Case study<span className="sr-only">: {project.name}</span>
                <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <ExternalLink
                href={project.links.github}
                className="inline-flex items-center gap-1.5 py-2 text-muted transition-colors duration-200 hover:text-fg"
              >
                <GitHub size={15} />
                Source<span className="sr-only"> code for {project.name}</span>
              </ExternalLink>
              {project.links.live ? (
                <ExternalLink
                  href={project.links.live}
                  className="inline-flex items-center gap-1.5 py-2 text-muted transition-colors duration-200 hover:text-fg"
                >
                  Live demo<span className="sr-only"> of {project.name}</span>
                  <ArrowUpRight size={15} />
                </ExternalLink>
              ) : null}
            </div>
          </div>

          <div className="min-w-0">
            <LayerVisualFor kind={layer.visual} />
          </div>
        </div>
      </div>
    </section>
  );
}
