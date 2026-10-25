import Image from 'next/image';
import type { Project } from '@/data/projects';

/*
 * Original cover art for each project: a small illustration of what the project actually
 * does (no fake screenshots, no invented numbers). When a real screenshot is added to the
 * project data (`image`), it replaces the illustration automatically.
 *
 * Every cover is drawn on an 800×500 canvas. Layers marked `data-depth` drift slightly
 * against the card tilt (--mx/--my, set by WorkGrid) for a parallax feel.
 */

export type CoverTheme = { bg: string; ink: string; accent: string };

export const coverThemes: Record<string, CoverTheme> = {
  scratchdb: { bg: '#101a3a', ink: '#e9edff', accent: '#ff8a3d' },
  veridoc: { bg: '#f1e6d2', ink: '#2a2118', accent: '#e2b93b' },
  nexuscode: { bg: '#0f1419', ink: '#d7dde6', accent: '#7ee0b5' },
  realtyiq: { bg: '#0f3a2c', ink: '#e6f2ea', accent: '#c8f560' },
  'aurora-weather': { bg: '#171344', ink: '#eaf6ff', accent: '#7cf0d4' },
  talentai: { bg: '#e9e3ff', ink: '#231a4a', accent: '#6b4df5' },
  'java-redis': { bg: '#1a0f0e', ink: '#f6e9e4', accent: '#ff5a43' },
  'private-search': { bg: '#eef3f1', ink: '#10231d', accent: '#0f9d75' },
};

const fallbackTheme: CoverTheme = { bg: '#1b1b20', ink: '#ededef', accent: '#a5b4fc' };

export function coverTheme(slug: string) {
  return coverThemes[slug] ?? fallbackTheme;
}

function Layer({ depth, children }: { depth: number; children: React.ReactNode }) {
  return (
    <g data-depth={depth} style={{ transform: `translate(calc(var(--mx, 0) * ${depth * 14}px), calc(var(--my, 0) * ${depth * 10}px))` }}>
      {children}
    </g>
  );
}

function ScratchDB({ t }: { t: CoverTheme }) {
  const leaf = (x: number, keys: string[], hot = -1) => (
    <g transform={`translate(${x} 300)`}>
      <rect width="150" height="44" rx="8" fill="#16234d" stroke={t.ink} strokeOpacity="0.35" />
      {keys.map((k, i) => (
        <g key={k} transform={`translate(${8 + i * 46} 8)`}>
          <rect width="40" height="28" rx="5" fill={i === hot ? t.accent : '#22325f'} />
          <text x="20" y="19" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="13" fill={i === hot ? '#101a3a' : t.ink}>
            {k}
          </text>
        </g>
      ))}
    </g>
  );
  return (
    <>
      <Layer depth={0.4}>
        <g stroke={t.ink} strokeOpacity="0.06">
          {Array.from({ length: 21 }, (_, i) => (
            <path key={`v${i}`} d={`M${i * 40} 0V500`} />
          ))}
          {Array.from({ length: 13 }, (_, i) => (
            <path key={`h${i}`} d={`M0 ${i * 40}H800`} />
          ))}
        </g>
      </Layer>
      <Layer depth={1}>
        <g fill="none" stroke={t.ink} strokeOpacity="0.45" strokeWidth="1.5">
          <path d="M400 168 C400 230 175 230 175 300" />
          <path d="M400 168 C400 230 400 240 400 300" />
          <path d="M400 168 C400 230 625 230 625 300" />
        </g>
        <g transform="translate(325 112)">
          <rect width="150" height="56" rx="10" fill="#1c2a58" stroke={t.accent} strokeWidth="1.5" />
          <text x="75" y="24" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="11" letterSpacing="2" fill={t.accent}>
            ROOT
          </text>
          <text x="75" y="43" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="14" fill={t.ink}>
            17 · 42
          </text>
        </g>
        {leaf(100, ['03', '09', '12'])}
        {leaf(325, ['17', '28', '35'], 1)}
        {leaf(550, ['42', '57', '61'])}
        <g fill="none" stroke={t.ink} strokeOpacity="0.3" strokeDasharray="4 5">
          <path d="M250 322H325M475 322H550" />
        </g>
      </Layer>
      <Layer depth={1.6}>
        <g transform="translate(70 404)">
          <text y="-10" fontFamily="Geist Mono, monospace" fontSize="11" letterSpacing="2" fill={t.ink} fillOpacity="0.6">
            WRITE-AHEAD LOG
          </text>
          {Array.from({ length: 11 }, (_, i) => (
            <rect key={i} x={i * 60} y="0" width="54" height="22" rx="4" fill={i === 7 ? t.accent : t.ink} fillOpacity={i === 7 ? 1 : 0.12 + i * 0.03} />
          ))}
        </g>
      </Layer>
    </>
  );
}

function VeriDoc({ t }: { t: CoverTheme }) {
  const lines = [300, 340, 280, 320, 210, 330, 300, 260, 315, 190];
  return (
    <>
      <Layer depth={0.6}>
        <g transform="translate(90 60) rotate(-4)">
          <rect width="400" height="430" rx="10" fill="#fffaf0" stroke={t.ink} strokeOpacity="0.15" />
          <rect x="34" y="34" width="180" height="16" rx="4" fill={t.ink} fillOpacity="0.85" />
          {lines.map((w, i) => (
            <g key={i}>
              {(i === 3 || i === 7) && <rect x="30" y={80 + i * 30} width={w + 8} height="20" rx="3" fill={t.accent} fillOpacity="0.55" />}
              <rect x="34" y={86 + i * 30} width={w} height="8" rx="4" fill={t.ink} fillOpacity="0.28" />
            </g>
          ))}
          <g fontFamily="Geist Mono, monospace" fontSize="12" fontWeight="700">
            <rect x="350" y="168" width="30" height="22" rx="11" fill={t.ink} />
            <text x="365" y="183" textAnchor="middle" fill="#fffaf0">1</text>
            <rect x="350" y="288" width="30" height="22" rx="11" fill={t.ink} />
            <text x="365" y="303" textAnchor="middle" fill="#fffaf0">2</text>
          </g>
        </g>
      </Layer>
      <Layer depth={1.4}>
        <g transform="translate(470 150)">
          <rect width="270" height="150" rx="18" fill={t.ink} />
          <rect x="24" y="28" width="200" height="9" rx="4.5" fill="#fffaf0" fillOpacity="0.85" />
          <rect x="24" y="48" width="220" height="9" rx="4.5" fill="#fffaf0" fillOpacity="0.85" />
          <rect x="24" y="68" width="150" height="9" rx="4.5" fill="#fffaf0" fillOpacity="0.85" />
          <g fontFamily="Geist Mono, monospace" fontSize="11" fontWeight="700">
            <rect x="24" y="100" width="44" height="24" rx="12" fill={t.accent} />
            <text x="46" y="116" textAnchor="middle" fill={t.ink}>[1]</text>
            <rect x="76" y="100" width="44" height="24" rx="12" fill={t.accent} />
            <text x="98" y="116" textAnchor="middle" fill={t.ink}>[2]</text>
          </g>
        </g>
        <g transform="translate(520 330)">
          <rect width="220" height="56" rx="16" fill="#fffaf0" stroke={t.ink} strokeOpacity="0.2" />
          <circle cx="30" cy="28" r="10" fill="none" stroke="#b4532a" strokeWidth="2.5" />
          <path d="M23 35l14-14" stroke="#b4532a" strokeWidth="2.5" />
          <rect x="54" y="18" width="130" height="8" rx="4" fill={t.ink} fillOpacity="0.5" />
          <rect x="54" y="32" width="90" height="8" rx="4" fill={t.ink} fillOpacity="0.25" />
        </g>
      </Layer>
    </>
  );
}

function NexusCode({ t }: { t: CoverTheme }) {
  const code: [number, number, string][] = [
    [0, 90, '#8ab4ff'], [100, 120, t.ink], [0, 60, '#c792ea'], [70, 160, t.accent], [0, 40, t.ink],
    [24, 140, '#f78c6c'], [24, 90, t.ink], [48, 180, t.accent], [48, 70, '#8ab4ff'], [24, 50, t.ink], [0, 30, t.ink],
  ];
  return (
    <>
      <Layer depth={0.5}>
        <g transform="translate(60 56)">
          <rect width="680" height="390" rx="14" fill="#161d25" stroke={t.ink} strokeOpacity="0.12" />
          <path d="M0 40H680" stroke={t.ink} strokeOpacity="0.1" />
          <circle cx="22" cy="20" r="5" fill="#ff5f57" />
          <circle cx="40" cy="20" r="5" fill="#febc2e" />
          <circle cx="58" cy="20" r="5" fill="#28c840" />
          <rect x="0" y="40" width="150" height="350" fill="#121820" />
          {['', '', '', ''].map((_, i) => (
            <rect key={i} x="18" y={64 + i * 30} width={90 - i * 12} height="8" rx="4" fill={t.ink} fillOpacity={i === 1 ? 0.7 : 0.25} />
          ))}
        </g>
      </Layer>
      <Layer depth={1}>
        <g transform="translate(240 126)" fontFamily="Geist Mono, monospace" fontSize="11" fill={t.ink} fillOpacity="0.35">
          {code.map(([x, w, c], i) => (
            <g key={i}>
              <text x="-30" y={i * 26 + 9}>{String(i + 1).padStart(2, '0')}</text>
              <rect x={x} y={i * 26} width={w} height="10" rx="5" fill={c} fillOpacity="0.85" />
            </g>
          ))}
        </g>
      </Layer>
      <Layer depth={1.8}>
        <g transform="translate(410 270)">
          <rect x="0" y="-4" width="2.5" height="20" fill="#f78c6c" />
          <rect x="2" y="-26" width="52" height="20" rx="5" fill="#f78c6c" />
          <text x="28" y="-12" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="11" fontWeight="700" fill="#0f1419">peer</text>
        </g>
        <g transform="translate(336 152)">
          <rect x="0" y="-4" width="2.5" height="20" fill={t.accent} />
          <rect x="2" y="-26" width="44" height="20" rx="5" fill={t.accent} />
          <text x="24" y="-12" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="11" fontWeight="700" fill="#0f1419">you</text>
        </g>
        <g transform="translate(560 330)">
          <rect width="200" height="92" rx="14" fill="#1d2630" stroke={t.accent} strokeOpacity="0.6" />
          <path d="M20 26l6-10 6 10-6 10z" fill={t.accent} />
          <rect x="44" y="20" width="130" height="8" rx="4" fill={t.ink} fillOpacity="0.7" />
          <rect x="20" y="48" width="160" height="8" rx="4" fill={t.ink} fillOpacity="0.3" />
          <rect x="20" y="64" width="110" height="8" rx="4" fill={t.ink} fillOpacity="0.3" />
        </g>
      </Layer>
    </>
  );
}

function RealtyIQ({ t }: { t: CoverTheme }) {
  const pts = [
    [0, 210], [60, 196], [120, 204], [180, 170], [240, 176], [300, 140], [360, 150], [420, 112],
  ];
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  const upper = pts.map(([x, y]) => `${x} ${y - 18 - x * 0.06}`).join(' L');
  const lower = [...pts].reverse().map(([x, y]) => `${x} ${y + 18 + x * 0.06}`).join(' L');
  const shap: [string, number][] = [['area', 150], ['location', 118], ['age', -64], ['floor', 52], ['parking', -30]];
  return (
    <>
      <Layer depth={0.5}>
        <g transform="translate(70 90)" stroke={t.ink} strokeOpacity="0.1">
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M0 ${i * 70}H440`} />
          ))}
        </g>
      </Layer>
      <Layer depth={1}>
        <g transform="translate(70 90)">
          <path d={`M${upper} L${lower} Z`} fill={t.accent} fillOpacity="0.18" />
          <path d={line} fill="none" stroke={t.accent} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx="420" cy="112" r="8" fill={t.accent} />
          <circle cx="420" cy="112" r="16" fill="none" stroke={t.accent} strokeOpacity="0.5" strokeWidth="2" />
          <g transform="translate(0 260)" fill="none" stroke={t.ink} strokeWidth="3" strokeLinejoin="round">
            <path d="M0 40V14L22 0l22 14v26z" />
            <path d="M16 40V24h12v16" />
          </g>
        </g>
      </Layer>
      <Layer depth={1.6}>
        <g transform="translate(560 120)">
          <rect x="-24" y="-30" width="210" height="300" rx="16" fill="#0b2c22" stroke={t.ink} strokeOpacity="0.12" />
          <text x="0" y="-6" fontFamily="Geist Mono, monospace" fontSize="11" letterSpacing="2" fill={t.ink} fillOpacity="0.6">
            SHAP
          </text>
          <path d="M80 10V250" stroke={t.ink} strokeOpacity="0.25" />
          {shap.map(([label, v], i) => (
            <g key={label} transform={`translate(0 ${24 + i * 46})`}>
              <rect x={v > 0 ? 80 : 80 + v * 0.55} y="0" width={Math.abs(v) * 0.55} height="22" rx="4" fill={v > 0 ? t.accent : '#ff8a80'} />
              <text x={v > 0 ? 74 : 86 + 2} y="15" textAnchor={v > 0 ? 'end' : 'start'} fontFamily="Geist Mono, monospace" fontSize="10.5" fill={t.ink} fillOpacity="0.75">
                {v > 0 ? label : ''}
              </text>
              {v < 0 && (
                <text x="86" y="15" fontFamily="Geist Mono, monospace" fontSize="10.5" fill={t.ink} fillOpacity="0.75">
                  {label}
                </text>
              )}
            </g>
          ))}
        </g>
      </Layer>
    </>
  );
}

function Aurora({ t }: { t: CoverTheme }) {
  return (
    <>
      <defs>
        <linearGradient id="au-sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#171344" />
          <stop offset="0.55" stopColor="#1b2f6b" />
          <stop offset="1" stopColor="#0d4d5c" />
        </linearGradient>
        <linearGradient id="au-band" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={t.accent} stopOpacity="0" />
          <stop offset="0.5" stopColor={t.accent} stopOpacity="0.7" />
          <stop offset="1" stopColor="#b388ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="-400" y="-300" width="1600" height="1100" fill="url(#au-sky)" />
      <Layer depth={0.4}>
        <path d="M-20 170 C150 90 300 230 480 130 S760 110 840 60" fill="none" stroke="url(#au-band)" strokeWidth="46" strokeLinecap="round" opacity="0.55" />
        <path d="M-20 230 C180 150 330 270 520 190 S760 170 840 130" fill="none" stroke="url(#au-band)" strokeWidth="22" strokeLinecap="round" opacity="0.35" />
      </Layer>
      <Layer depth={1.2}>
        <g transform="translate(0 300)" fontFamily="Geist Mono, monospace" fontSize="11" letterSpacing="1.5">
          {[['Provider A', 130, 1], ['Provider B', 290, 0.45]].map(([name, x, o]) => (
            <g key={name as string} transform={`translate(${x} 0)`} opacity={o as number}>
              <rect x="-70" y="-26" width="140" height="52" rx="12" fill="#0f1b3d" stroke={t.ink} strokeOpacity="0.3" />
              <text y="5" textAnchor="middle" fill={t.ink}>{name as string}</text>
            </g>
          ))}
          <path d="M200 0H330" stroke={t.ink} strokeOpacity="0.35" strokeDasharray="5 6" />
          <path d="M360 0H440" stroke={t.accent} strokeWidth="2" />
          <g transform="translate(520 0)">
            <rect x="-80" y="-34" width="160" height="68" rx="14" fill={t.accent} />
            <text y="-4" textAnchor="middle" fill="#0d1636" fontWeight="700">TYPED API</text>
            <text y="14" textAnchor="middle" fill="#0d1636" fillOpacity="0.7">/v1/weather</text>
          </g>
          <path d="M520 34V90" stroke={t.ink} strokeOpacity="0.4" />
          <g transform="translate(520 120)">
            <rect x="-62" y="-26" width="124" height="52" rx="26" fill="#0f1b3d" stroke={t.accent} strokeOpacity="0.7" />
            <text y="5" textAnchor="middle" fill={t.accent}>REDIS</text>
          </g>
        </g>
      </Layer>
    </>
  );
}

function TalentAI({ t }: { t: CoverTheme }) {
  const cards: [number, number][] = [[0.92, 0], [0.78, 1], [0.61, 2]];
  return (
    <>
      <Layer depth={0.5}>
        <circle cx="660" cy="110" r="140" fill={t.accent} fillOpacity="0.12" />
        <circle cx="120" cy="430" r="100" fill={t.accent} fillOpacity="0.08" />
      </Layer>
      <Layer depth={1.2}>
        {cards.map(([score, i]) => (
          <g key={i} transform={`translate(${160 + i * 22} ${90 + i * 120})`}>
            <rect width="480" height="100" rx="18" fill="#fff" stroke={t.ink} strokeOpacity="0.1" />
            <circle cx="50" cy="50" r="24" fill={t.accent} fillOpacity={0.9 - i * 0.25} />
            <text x="50" y="56" textAnchor="middle" fontFamily="TikTok Sans, sans-serif" fontWeight="800" fontSize="17" fill="#fff">
              {i + 1}
            </text>
            <rect x="94" y="28" width={150 - i * 20} height="10" rx="5" fill={t.ink} fillOpacity="0.8" />
            <g transform="translate(94 50)">
              {['', '', ''].map((_, k) => (
                <rect key={k} x={k * 62} y="0" width="54" height="18" rx="9" fill={t.accent} fillOpacity={0.18} />
              ))}
            </g>
            <rect x="300" y="30" width="150" height="10" rx="5" fill={t.ink} fillOpacity="0.08" />
            <rect x="300" y="30" width={150 * score} height="10" rx="5" fill={t.accent} />
            <rect x="300" y="52" width="110" height="8" rx="4" fill={t.ink} fillOpacity="0.15" />
          </g>
        ))}
      </Layer>
    </>
  );
}

/** Redis in Java: RESP frames stream in, land in a skip list (sorted set), and are appended to the AOF. */
function JavaRedis({ t }: { t: CoverTheme }) {
  const levels = [
    [0, 1, 2, 3, 4, 5, 6],
    [0, 2, 3, 5, 6],
    [0, 3, 6],
    [0, 6],
  ];
  const keys = ['H', '7', '12', '19', '24', '31', 'T'];
  return (
    <>
      <Layer depth={0.5}>
        <g transform="translate(70 70)" fontFamily="Geist Mono, monospace" fontSize="13">
          {['*3', '$3', 'SET', '$4', 'user', '$5', 'alice'].map((frame, i) => (
            <g key={i} transform={`translate(0 ${i * 30})`}>
              <rect width="96" height="22" rx="5" fill={t.ink} fillOpacity={i === 2 ? 0.14 : 0.06} stroke={t.ink} strokeOpacity="0.15" />
              <text x="10" y="15" fill={i === 2 ? t.accent : t.ink} fillOpacity={i === 2 ? 1 : 0.7}>
                {frame}
              </text>
            </g>
          ))}
          <text y="-14" fontSize="11" letterSpacing="2" fill={t.ink} fillOpacity="0.55">
            RESP
          </text>
          <path d="M108 100 H160" stroke={t.accent} strokeWidth="2" strokeDasharray="4 5" />
        </g>
      </Layer>
      <Layer depth={1.1}>
        <g transform="translate(250 90)">
          <text y="-16" fontFamily="Geist Mono, monospace" fontSize="11" letterSpacing="2" fill={t.ink} fillOpacity="0.55">
            ZSET · SKIP LIST
          </text>
          {levels.map((row, level) => {
            const y = (3 - level) * 54;
            return (
              <g key={level}>
                {row.slice(0, -1).map((col, i) => (
                  <path key={i} d={`M${col * 70 + 44} ${y + 15} H${row[i + 1] * 70}`} stroke={t.ink} strokeOpacity="0.4" strokeWidth="1.5" />
                ))}
                {row.map((col) => (
                  <g key={col} transform={`translate(${col * 70} ${y})`}>
                    <rect width="44" height="30" rx="6" fill={col === 3 && level === 2 ? t.accent : '#2a1715'} stroke={t.ink} strokeOpacity="0.25" />
                    {level === 0 ? (
                      <text x="22" y="20" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="12" fill={t.ink}>
                        {keys[col]}
                      </text>
                    ) : null}
                  </g>
                ))}
              </g>
            );
          })}
        </g>
      </Layer>
      <Layer depth={1.6}>
        <g transform="translate(250 380)">
          <text y="-10" fontFamily="Geist Mono, monospace" fontSize="11" letterSpacing="2" fill={t.ink} fillOpacity="0.55">
            APPEND-ONLY FILE
          </text>
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x={i * 58} width="52" height="20" rx="4" fill={i === 7 ? t.accent : t.ink} fillOpacity={i === 7 ? 1 : 0.1 + i * 0.03} />
          ))}
        </g>
      </Layer>
    </>
  );
}

/** Private Search Engine: crawl graph on the left, a query and BM25-ranked results on the right. */
function PrivateSearch({ t }: { t: CoverTheme }) {
  const nodes: [number, number][] = [[60, 250], [140, 170], [150, 320], [230, 230], [220, 390], [290, 140]];
  const edges: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [1, 5], [3, 5]];
  const results = [0.92, 0.74, 0.58, 0.41];
  return (
    <>
      <Layer depth={0.6}>
        <g transform="translate(20 0)">
          {edges.map(([a, b], i) => (
            <path key={i} d={`M${nodes[a][0]} ${nodes[a][1]} L${nodes[b][0]} ${nodes[b][1]}`} stroke={t.ink} strokeOpacity="0.22" strokeWidth="1.5" />
          ))}
          {nodes.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === 0 ? 11 : 8} fill={i === 0 ? t.accent : '#fff'} stroke={t.ink} strokeOpacity="0.35" strokeWidth="1.5" />
          ))}
          <text x="40" y="450" fontFamily="Geist Mono, monospace" fontSize="11" letterSpacing="2" fill={t.ink} fillOpacity="0.55">
            CRAWL · ROBOTS.TXT
          </text>
        </g>
      </Layer>
      <Layer depth={1.3}>
        <g transform="translate(380 70)">
          <rect width="360" height="48" rx="24" fill="#fff" stroke={t.ink} strokeOpacity="0.18" />
          <circle cx="28" cy="24" r="8" fill="none" stroke={t.ink} strokeWidth="2" />
          <path d="M34 30 l7 7" stroke={t.ink} strokeWidth="2" strokeLinecap="round" />
          <rect x="52" y="19" width="150" height="10" rx="5" fill={t.ink} fillOpacity="0.75" />
          {results.map((score, i) => (
            <g key={i} transform={`translate(0 ${78 + i * 78})`}>
              <rect width="360" height="64" rx="12" fill="#fff" stroke={t.ink} strokeOpacity="0.1" />
              <rect x="18" y="14" width={170 - i * 18} height="9" rx="4.5" fill={t.accent} fillOpacity={0.95 - i * 0.12} />
              <rect x="18" y="32" width="240" height="7" rx="3.5" fill={t.ink} fillOpacity="0.2" />
              <rect x="18" y="45" width="180" height="7" rx="3.5" fill={t.ink} fillOpacity="0.12" />
              <rect x="292" y="22" width="50" height="8" rx="4" fill={t.ink} fillOpacity="0.08" />
              <rect x="292" y="22" width={50 * score} height="8" rx="4" fill={t.accent} />
              <text x="292" y="48" fontFamily="Geist Mono, monospace" fontSize="10" fill={t.ink} fillOpacity="0.55">
                BM25
              </text>
            </g>
          ))}
        </g>
      </Layer>
    </>
  );
}

const art: Record<string, (props: { t: CoverTheme }) => React.ReactNode> = {
  scratchdb: ScratchDB,
  veridoc: VeriDoc,
  nexuscode: NexusCode,
  realtyiq: RealtyIQ,
  'aurora-weather': Aurora,
  talentai: TalentAI,
  'java-redis': JavaRedis,
  'private-search': PrivateSearch,
};

export function ProjectCover({ project, className = '', priority = false }: { project: Project; className?: string; priority?: boolean }) {
  const t = coverTheme(project.slug);
  if (project.image) {
    return (
      <Image
        src={project.image.src}
        alt={project.image.alt}
        width={project.image.width}
        height={project.image.height}
        priority={priority}
        sizes="(min-width: 1024px) 60vw, 100vw"
        className={`h-full w-full object-cover object-top ${className}`}
      />
    );
  }
  const Art = art[project.slug];
  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" aria-hidden="true" className={`block h-full w-full ${className}`} style={{ background: t.bg }}>
      {Art ? <Art t={t} /> : null}
    </svg>
  );
}
