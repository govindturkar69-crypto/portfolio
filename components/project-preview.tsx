import Image from 'next/image';
import type { Project } from '@/data/projects';
import { ArchitectureDiagram } from './architecture-diagram';

/**
 * Card visual. Uses a real screenshot when `project.image` is set, otherwise an
 * architecture preview generated from the project's own layer data.
 */
export function ProjectPreview({ project, priority = false }: { project: Project; priority?: boolean }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface-2">
      <div className="flex items-center gap-2 border-b border-line px-3.5 py-2.5">
        <span aria-hidden="true" className="flex gap-1.5">
          <i className="size-2 rounded-full bg-white/15" />
          <i className="size-2 rounded-full bg-white/15" />
          <i className="size-2 rounded-full bg-white/15" />
        </span>
        <span className="ml-1 truncate font-mono text-xs text-subtle">
          {project.image ? project.links.live?.replace(/^https?:\/\//, '') : `${project.slug}/architecture`}
        </span>
      </div>

      {project.image ? (
        <Image
          src={project.image.src}
          alt={project.image.alt}
          width={project.image.width}
          height={project.image.height}
          priority={priority}
          sizes="(min-width: 1024px) 560px, 100vw"
          className="aspect-[16/10] w-full object-cover object-top transition-transform duration-300 ease-out group-hover:scale-[1.02]"
        />
      ) : (
        <div className="grid-fade-soft relative flex flex-1 flex-col justify-center p-4 sm:p-5">
          <ArchitectureDiagram layers={project.architecture.layers} variant="compact" label={`${project.name} architecture layers`} />
        </div>
      )}
    </div>
  );
}
