import type { ArchitectureLayer } from '@/data/projects';

type Props = {
  layers: ArchitectureLayer[];
  label: string;
};

/**
 * A layered architecture diagram rendered as an ordered list, so it reads
 * top-to-bottom for screen readers exactly as it does visually.
 */
export function ArchitectureDiagram({ layers, label }: Props) {
  return (
    <ol aria-label={label} className="flex flex-col">
      {layers.map((layer, index) => (
        <li key={layer.name} className="relative">
          {index > 0 ? (
            <span aria-hidden="true" className="ml-[1.375rem] block h-4 w-px bg-gradient-to-b from-line-strong to-accent/40" />
          ) : null}
          <div className="flex gap-4 rounded-xl border border-line bg-surface px-4 py-3.5">
            <span
              aria-hidden="true"
              className="grid size-7 shrink-0 place-items-center rounded-md border border-line-strong bg-surface-2 font-mono text-xs text-accent tabular-nums"
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <p className="font-mono text-sm text-fg">{layer.name}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{layer.detail}</p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
