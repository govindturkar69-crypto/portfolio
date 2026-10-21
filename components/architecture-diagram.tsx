import type { ArchitectureLayer } from '@/data/projects';

type Props = {
  layers: ArchitectureLayer[];
  /** `compact` shows layer names only (card preview); `full` adds each layer's detail. */
  variant?: 'compact' | 'full';
  label: string;
};

/**
 * A layered architecture diagram rendered as an ordered list, so it reads
 * top-to-bottom for screen readers exactly as it does visually.
 */
export function ArchitectureDiagram({ layers, variant = 'full', label }: Props) {
  const compact = variant === 'compact';

  return (
    <ol aria-label={label} className={compact ? 'flex flex-col gap-2' : 'flex flex-col'}>
      {layers.map((layer, index) => (
        <li key={layer.name} className="relative">
          {!compact && index > 0 ? (
            <span aria-hidden="true" className="ml-[1.375rem] block h-4 w-px bg-gradient-to-b from-line-strong to-accent/40" />
          ) : null}
          <div
            className={
              compact
                ? 'flex items-start gap-3 rounded-lg border border-line bg-bg/70 px-3.5 py-2.5 font-mono text-xs text-muted transition-colors duration-200 group-hover:border-line-strong'
                : 'flex gap-4 rounded-xl border border-line bg-surface px-4 py-3.5'
            }
          >
            <span
              aria-hidden="true"
              className={
                compact
                  ? 'text-subtle tabular-nums'
                  : 'grid size-7 shrink-0 place-items-center rounded-md border border-line-strong bg-surface-2 font-mono text-xs text-accent tabular-nums'
              }
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            {compact ? (
              <span className="min-w-0">
                <span className="block text-fg/90">{layer.name}</span>
                <span className="mt-0.5 block truncate font-sans text-[13px] text-subtle">{layer.detail}</span>
              </span>
            ) : (
              <div>
                <p className="font-mono text-sm text-fg">{layer.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{layer.detail}</p>
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
