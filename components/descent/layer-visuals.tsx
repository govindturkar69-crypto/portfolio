import type { CSSProperties, ReactNode } from 'react';
import type { LayerVisual } from '@/data/descent';

/** `--at` is the point (0–1) of the scene's visual build-up where an element appears. */
const at = (value: number, extra: Record<string, string | number | undefined> = {}) => ({ '--at': value, ...extra }) as CSSProperties;

function Frame({ label, caption, children }: { label: string; caption?: string; children: ReactNode }) {
  return (
    <figure className="relative w-full">
      <div className="overflow-hidden rounded-2xl border border-line-strong bg-surface/80 shadow-2xl shadow-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <span aria-hidden="true" className="flex gap-1.5">
            <i className="size-2 rounded-full bg-white/15" />
            <i className="size-2 rounded-full bg-white/15" />
            <i className="size-2 rounded-full bg-white/15" />
          </span>
          <span className="ml-1 font-mono text-xs text-subtle">{label}</span>
        </div>
        <div className="relative p-4 sm:p-5">{children}</div>
      </div>
      {caption ? <figcaption className="mt-2.5 text-right font-mono text-xs text-subtle">{caption}</figcaption> : null}
    </figure>
  );
}

/* 01 · NexusCode — editor, board and a collaborator assembling into one workspace. */
function InterfaceVisual() {
  const code = [
    [0, 38, 'bg-accent/70'],
    [1, 62, 'bg-white/25'],
    [1, 48, 'bg-sky-300/60'],
    [2, 70, 'bg-white/20'],
    [2, 34, 'bg-white/25'],
    [1, 56, 'bg-accent/50'],
    [0, 24, 'bg-white/20'],
  ] as const;
  return (
    <Frame label="nexuscode — workspace" caption="Illustrative">
      <div className="grid grid-cols-[1.5fr_1fr] gap-3">
        <div className="build rounded-lg border border-line bg-bg/70 p-3" style={at(0)}>
          <p className="mb-2 font-mono text-xs text-subtle">board.tsx</p>
          <div className="relative space-y-2">
            {code.map(([indent, width, color], i) => (
              <div key={i} className="build flex items-center gap-2" style={at(0.05 + i * 0.05)}>
                <span className="w-4 text-right font-mono text-xs text-subtle/70 tabular-nums">{i + 1}</span>
                <span className={`h-1.5 rounded-full ${color}`} style={{ width: `${width}%`, marginLeft: indent * 12 }} />
              </div>
            ))}
            <span
              className="build absolute flex items-center gap-1 font-mono text-xs text-sky-300"
              style={at(0.45, { top: 'calc(18px + var(--v) * 46px)', left: 'calc(30% + var(--v) * 22%)' })}
            >
              <span className="h-4 w-0.5 bg-sky-300" />
              teammate
            </span>
          </div>
          <p className="build mt-3 rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-xs text-accent-strong" style={at(0.7)}>
            AI review: possible null access on line 4
          </p>
        </div>
        <div className="build space-y-2 rounded-lg border border-line bg-bg/70 p-3" style={at(0.15)}>
          {['To do', 'Doing', 'Done'].map((column, c) => (
            <div key={column}>
              <p className="mb-1 font-mono text-xs text-subtle">{column}</p>
              <div className="h-5 rounded border border-line bg-white/[0.04]" />
              {c === 2 ? (
                <div
                  className="mt-1 h-5 rounded border border-live/40 bg-live/10"
                  style={{ opacity: 'clamp(0, calc((var(--v) - 0.55) * 6), 1)' }}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className="build mt-3 flex items-center gap-2 font-mono text-xs text-subtle" style={at(0.85)}>
        <span className="size-1.5 rounded-full bg-live" aria-hidden="true" />
        2 collaborators · synced over WebSocket
      </div>
    </Frame>
  );
}

/* 02 · Aurora — request path: cache miss, primary times out, fallback answers. */
function ApiVisual() {
  const node = (x: number, y: number, label: string, appear: number, tone = 'text-fg') => (
    <g className="build" style={at(appear)}>
      <rect x={x - 46} y={y - 17} width={92} height={34} rx={8} className="fill-bg stroke-line-strong" strokeWidth={1} />
      <text x={x} y={y + 4} textAnchor="middle" className={`fill-current font-mono text-[11px] ${tone}`}>
        {label}
      </text>
    </g>
  );
  return (
    <Frame label="aurora — GET /weather?city=nagpur" caption="Illustrative request">
      <svg viewBox="0 0 420 250" className="h-auto w-full" role="img" aria-label="Request flows from client to API, misses the Redis cache, times out on the primary provider and is served by the fallback provider.">
        <path d="M96 125 H164" pathLength={1} className="draw fill-none stroke-accent" strokeWidth={1.5} style={at(0.05)} />
        <path d="M256 125 C 290 125, 290 45, 318 45" pathLength={1} className="draw fill-none stroke-sky-300" strokeWidth={1.5} style={at(0.2)} />
        <path d="M256 125 H318" pathLength={1} className="draw fill-none stroke-accent" strokeWidth={1.5} style={at(0.38)} />
        <path
          d="M256 125 H318"
          className="fill-none stroke-red-400"
          strokeWidth={2}
          style={{ opacity: 'clamp(0, calc((var(--v) - 0.55) * 8), 1)' }}
        />
        <path d="M256 125 C 290 125, 290 205, 318 205" pathLength={1} className="draw fill-none stroke-live" strokeWidth={1.5} style={at(0.62)} />
        {node(50, 125, 'client', 0)}
        {node(210, 125, 'typed API', 0.04)}
        {node(364, 45, 'redis', 0.18)}
        {node(364, 125, 'tomorrow.io', 0.34)}
        {node(364, 205, 'open-meteo', 0.6)}
        <text x={290} y={30} className="build fill-sky-300 font-mono text-[10px]" style={at(0.3)}>cache miss</text>
        <text x={268} y={115} className="build fill-red-400 font-mono text-[10px]" style={at(0.56)}>timeout</text>
        <text x={262} y={232} className="build fill-live font-mono text-[10px]" style={at(0.78)}>fallback · 200 OK</text>
      </svg>
      <div className="build mt-2 grid grid-cols-3 gap-2 font-mono text-xs" style={at(0.85)}>
        <span className="rounded-md border border-line px-2 py-1.5 text-subtle">ttl weather <b className="font-normal text-fg">10m</b></span>
        <span className="rounded-md border border-line px-2 py-1.5 text-subtle">ttl geo <b className="font-normal text-fg">24h</b></span>
        <span className="rounded-md border border-line px-2 py-1.5 text-subtle">shape <b className="font-normal text-fg">1 contract</b></span>
      </div>
    </Frame>
  );
}

/* 03 · RealtyIQ — an estimate that explains itself. */
function ModelVisual() {
  const factors = [
    ['Location', 0.92, true],
    ['Built-up area', 0.58, true],
    ['Bedrooms', 0.28, true],
    ['Property age', 0.4, false],
    ['Floor', 0.16, false],
  ] as const;
  return (
    <Frame label="realtyiq — prediction" caption="Illustrative output">
      <div className="build flex items-end justify-between gap-4" style={at(0)}>
        <div>
          <p className="font-mono text-xs text-subtle">Estimated price</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">₹ 84.2 L</p>
        </div>
        <p className="font-mono text-xs text-subtle">range ₹ 78 L – ₹ 91 L</p>
      </div>
      <div className="build relative mt-3 h-2 rounded-full bg-white/[0.06]" style={at(0.1)}>
        <span className="absolute inset-y-0 left-[38%] right-[30%] rounded-full bg-accent/40" />
        <span className="absolute inset-y-[-3px] left-[52%] w-0.5 rounded-full bg-fg" />
      </div>
      <p className="build mt-5 mb-2 font-mono text-xs text-subtle" style={at(0.2)}>
        Why this price · SHAP contribution
      </p>
      <ul className="space-y-2">
        {factors.map(([label, size, positive], i) => (
          <li key={label} className="build grid grid-cols-[7.5rem_1fr] items-center gap-3 text-xs" style={at(0.25 + i * 0.1)}>
            <span className="truncate text-muted">{label}</span>
            <span className="relative h-3">
              <span className="absolute inset-y-0 left-1/2 w-px bg-line-strong" />
              <span
                className={`absolute inset-y-0 rounded-sm ${positive ? 'left-1/2 origin-left bg-live/70' : 'right-1/2 origin-right bg-red-400/70'}`}
                style={{ width: `${size * 50}%`, transform: `scaleX(clamp(0, calc((var(--v) - ${0.3 + i * 0.1}) * 4), 1))` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

/* 04 · VeriDoc — retrieve, gate, cite; then refuse when the evidence is not there. */
function RetrievalVisual() {
  const chunks = [
    ['scholarship-policy.pdf §3', 0.82, true],
    ['fee-structure.pdf §1', 0.41, false],
    ['scholarship-policy.pdf §5', 0.77, true],
    ['hostel-rules.docx §2', 0.18, false],
  ] as const;
  return (
    <Frame label="veridoc — ask the documents" caption="Illustrative run">
      <p className="build rounded-lg border border-line bg-bg/70 px-3 py-2 text-sm" style={at(0)}>
        <span className="font-mono text-xs text-subtle">Q · </span>When is the scholarship application deadline?
      </p>
      <ul className="mt-3 space-y-1.5">
        {chunks.map(([source, score, kept], i) => (
          <li
            key={source}
            className="build flex items-center justify-between gap-3 rounded-md border px-3 py-1.5 font-mono text-xs"
            style={at(0.1 + i * 0.06, {
              borderColor: kept ? 'rgb(165 180 252 / calc(0.15 + var(--v) * 0.4))' : 'var(--color-line)',
              opacity: kept ? undefined : 'calc(var(--b) * (1 - clamp(0, calc((var(--v) - 0.45) * 3), 0.65)))',
            })}
          >
            <span className={kept ? 'text-fg' : 'text-subtle'}>{source}</span>
            <span className={`tabular-nums ${kept ? 'text-accent' : 'text-subtle'}`}>{score.toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <p className="build mt-2 flex items-center gap-2 font-mono text-xs text-subtle" style={at(0.42)}>
        <span className="h-px flex-1 bg-accent/50" /> relevance gate ≥ threshold <span className="h-px flex-1 bg-accent/50" />
      </p>
      <p className="build mt-2 rounded-lg border border-accent/30 bg-accent/[0.07] px-3 py-2 text-sm text-fg/90" style={at(0.55)}>
        Answer grounded in the cited sections
        <span className="ml-1.5 rounded bg-accent/20 px-1 font-mono text-xs text-accent-strong">§3</span>
        <span className="ml-1 rounded bg-accent/20 px-1 font-mono text-xs text-accent-strong">§5</span>
      </p>
      <div className="build mt-3 border-t border-line pt-3 text-sm" style={at(0.75)}>
        <p>
          <span className="font-mono text-xs text-subtle">Q · </span>What is on the cafeteria menu today?
        </p>
        <p className="mt-1.5 font-mono text-xs text-red-300">No supporting passage found — not answering.</p>
      </div>
    </Frame>
  );
}

/* 05 · ScratchDB — index, buffer pool and log building up together. */
function StorageVisual() {
  const leaves = [52, 132, 212, 292];
  const frames = Array.from({ length: 16 }, (_, i) => i);
  const dirty = new Set([2, 5, 9, 14]);
  const wal = [
    ['0x01A0', 'BEGIN', 'txn 41'],
    ['0x01A4', 'UPDATE', 'page 12 · slot 3'],
    ['0x01B8', 'INSERT', 'btree leaf 7'],
    ['0x01CC', 'COMMIT', 'txn 41'],
  ];
  return (
    <Frame label="scratchdb — inside the engine" caption="Illustrative state">
      <svg viewBox="0 0 344 118" className="h-auto w-full" role="img" aria-label="B+Tree with a root, two internal nodes and four linked leaf pages.">
        {[
          ['M172 26 L92 58', 0.05],
          ['M172 26 L252 58', 0.05],
          ['M92 74 L52 92', 0.15],
          ['M92 74 L132 92', 0.15],
          ['M252 74 L212 92', 0.15],
          ['M252 74 L292 92', 0.15],
        ].map(([d, start]) => (
          <path key={d as string} d={d as string} pathLength={1} className="draw fill-none stroke-line-strong" strokeWidth={1} style={at(start as number)} />
        ))}
        <g className="build" style={at(0)}>
          <rect x={142} y={6} width={60} height={20} rx={4} className="fill-accent/15 stroke-accent/60" />
          <text x={172} y={20} textAnchor="middle" className="fill-accent-strong font-mono text-[10px]">root</text>
        </g>
        {[92, 252].map((x) => (
          <g key={x} className="build" style={at(0.1)}>
            <rect x={x - 28} y={58} width={56} height={16} rx={4} className="fill-bg stroke-line-strong" />
            <text x={x} y={70} textAnchor="middle" className="fill-muted font-mono text-[9px]">internal</text>
          </g>
        ))}
        {leaves.map((x, i) => (
          <g key={x} className="build" style={at(0.2 + i * 0.04)}>
            <rect x={x - 26} y={92} width={52} height={18} rx={4} className="fill-bg stroke-line-strong" />
            <text x={x} y={105} textAnchor="middle" className="fill-subtle font-mono text-[9px]">leaf</text>
            {i < leaves.length - 1 ? <path d={`M${x + 26} 101 H${leaves[i + 1] - 26}`} className="stroke-accent/50" strokeDasharray="2 3" /> : null}
          </g>
        ))}
      </svg>

      <div className="mt-4 grid grid-cols-[1fr_1.35fr] gap-4">
        <div>
          <p className="build mb-2 font-mono text-xs text-subtle" style={at(0.3)}>buffer pool · 2Q</p>
          <div className="grid grid-cols-4 gap-1.5">
            {frames.map((i) => (
              <span
                key={i}
                className={`build aspect-square rounded-sm border ${dirty.has(i) ? 'border-accent/70 bg-accent/25' : 'border-line bg-white/[0.06]'}`}
                style={at(0.32 + i * 0.022)}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="build mb-2 font-mono text-xs text-subtle" style={at(0.45)}>write-ahead log</p>
          <ol className="space-y-1 font-mono text-xs">
            {wal.map(([lsn, op, target], i) => (
              <li key={lsn} className="build flex gap-2" style={at(0.5 + i * 0.08)}>
                <span className="text-subtle tabular-nums">{lsn}</span>
                <span className={op === 'COMMIT' ? 'text-live' : 'text-accent'}>{op}</span>
                <span className="truncate text-muted">{target}</span>
              </li>
            ))}
            <li className="build text-live" style={at(0.85)}>
              ✓ fsync · group commit
            </li>
          </ol>
        </div>
      </div>
    </Frame>
  );
}

const visuals: Record<LayerVisual, () => ReactNode> = {
  interface: InterfaceVisual,
  api: ApiVisual,
  model: ModelVisual,
  retrieval: RetrievalVisual,
  storage: StorageVisual,
};

export function LayerVisualFor({ kind }: { kind: LayerVisual }) {
  const Visual = visuals[kind];
  return <Visual />;
}
