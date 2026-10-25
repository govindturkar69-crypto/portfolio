import type { ReactNode } from 'react';

/*
 * Original sticker artwork: self-contained SVG, no external assets. Each sticker has a
 * white die-cut border and a soft drop shadow so it reads as a physical sticker.
 * `rest` is [x as a fraction of the hero width, y as a fraction of the sticker band].
 */
export type StickerKind = 'star' | 'badge' | 'flame' | 'heart' | 'seal' | 'braces';

export const STICKERS: { kind: StickerKind; label: string; size: number; shape: 'circle' | 'box'; rest: [number, number]; tilt: number }[] = [
  { kind: 'star', label: 'Smiling star sticker', size: 112, shape: 'circle', rest: [0.12, 0.5], tilt: -12 },
  { kind: 'badge', label: 'Retro full-stack badge sticker', size: 128, shape: 'circle', rest: [0.3, 0.54], tilt: 8 },
  { kind: 'flame', label: 'Flame sticker', size: 96, shape: 'box', rest: [0.52, 0.5], tilt: -6 },
  { kind: 'heart', label: 'Glossy heart sticker', size: 104, shape: 'circle', rest: [0.68, 0.55], tilt: 10 },
  { kind: 'seal', label: 'Shipped seal sticker', size: 108, shape: 'circle', rest: [0.84, 0.48], tilt: -9 },
  { kind: 'braces', label: 'Curly braces sticker', size: 120, shape: 'box', rest: [0.95, 0.56], tilt: 14 },
];

const DIE_CUT = { fill: 'none', stroke: '#fff', strokeWidth: 10, strokeLinejoin: 'round' as const };

function Defs({ id, children }: { id: string; children: ReactNode }) {
  return (
    <defs>
      <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#05040d" floodOpacity="0.45" />
      </filter>
      {children}
    </defs>
  );
}

export function StickerArt({ kind }: { kind: StickerKind }) {
  switch (kind) {
    case 'star':
      return (
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <Defs id="st">
            <radialGradient id="st-fill" cx="0.4" cy="0.35" r="0.75">
              <stop offset="0" stopColor="#fff6b8" />
              <stop offset="0.55" stopColor="#ffd23f" />
              <stop offset="1" stopColor="#f59e0b" />
            </radialGradient>
          </Defs>
          <g filter="url(#st-shadow)">
            <path {...DIE_CUT} d="M60 8 L74 42 L111 45 L83 69 L92 106 L60 86 L28 106 L37 69 L9 45 L46 42 Z" />
            <path fill="url(#st-fill)" stroke="#b45309" strokeWidth="3" strokeLinejoin="round" d="M60 8 L74 42 L111 45 L83 69 L92 106 L60 86 L28 106 L37 69 L9 45 L46 42 Z" />
            <ellipse cx="49" cy="58" rx="4.5" ry="6" fill="#3b2508" />
            <ellipse cx="71" cy="58" rx="4.5" ry="6" fill="#3b2508" />
            <circle cx="50.5" cy="56" r="1.6" fill="#fff" />
            <circle cx="72.5" cy="56" r="1.6" fill="#fff" />
            <path d="M47 71 Q60 83 73 71" fill="none" stroke="#3b2508" strokeWidth="4" strokeLinecap="round" />
            <ellipse cx="41" cy="69" rx="5" ry="3" fill="#fb7185" opacity="0.55" />
            <ellipse cx="79" cy="69" rx="5" ry="3" fill="#fb7185" opacity="0.55" />
            <path d="M44 28 Q50 20 58 18" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
          </g>
        </svg>
      );
    case 'badge':
      return (
        <svg viewBox="0 0 140 140" aria-hidden="true">
          <Defs id="bd">
            <linearGradient id="bd-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7c6cf2" />
              <stop offset="1" stopColor="#3f2fa6" />
            </linearGradient>
            <path id="bd-arc-top" d="M27 72 A43 43 0 0 1 113 72" />
            <path id="bd-arc-bottom" d="M28 72 A42 42 0 0 0 112 72" />
          </Defs>
          <g filter="url(#bd-shadow)">
            <circle cx="70" cy="70" r="62" fill="#fff" />
            <circle cx="70" cy="70" r="56" fill="url(#bd-fill)" />
            <circle cx="70" cy="70" r="49" fill="none" stroke="#f4f1ff" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.7" />
            <text fill="#f4f1ff" fontFamily="TikTok Sans, sans-serif" fontWeight="800" fontSize="10" letterSpacing="1.5">
              <textPath href="#bd-arc-top" startOffset="50%" textAnchor="middle">FULL · STACK</textPath>
            </text>
            <text fill="#c7d2fe" fontFamily="Geist Mono, monospace" fontWeight="600" fontSize="9" letterSpacing="2">
              <textPath href="#bd-arc-bottom" startOffset="50%" textAnchor="middle" dominantBaseline="hanging">
                DOWN TO THE DISK
              </textPath>
            </text>
            <text x="70" y="80" textAnchor="middle" fill="#fff" fontFamily="TikTok Sans, sans-serif" fontWeight="800" fontSize="30" letterSpacing="-1">
              GT
            </text>
            <path d="M44 92 h52" stroke="#ffd23f" strokeWidth="3" strokeLinecap="round" />
          </g>
        </svg>
      );
    case 'flame':
      return (
        <svg viewBox="0 0 100 130" aria-hidden="true">
          <Defs id="fl">
            <linearGradient id="fl-outer" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#ef4444" />
              <stop offset="0.6" stopColor="#f97316" />
              <stop offset="1" stopColor="#fbbf24" />
            </linearGradient>
            <linearGradient id="fl-inner" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#fde68a" />
              <stop offset="1" stopColor="#fff7d6" />
            </linearGradient>
          </Defs>
          <g filter="url(#fl-shadow)">
            <path {...DIE_CUT} d="M50 8 C58 30 82 40 82 76 C82 102 66 120 50 120 C30 120 16 104 16 82 C16 62 30 52 32 34 C42 44 44 52 44 52 C48 36 46 22 50 8 Z" />
            <path fill="url(#fl-outer)" stroke="#9a2a12" strokeWidth="3" strokeLinejoin="round" d="M50 8 C58 30 82 40 82 76 C82 102 66 120 50 120 C30 120 16 104 16 82 C16 62 30 52 32 34 C42 44 44 52 44 52 C48 36 46 22 50 8 Z" />
            <path fill="url(#fl-inner)" d="M50 56 C56 70 68 78 66 94 C64 108 56 114 50 114 C40 114 33 106 34 94 C35 82 44 78 46 66 C48 72 50 74 50 74 C52 66 50 62 50 56 Z" />
            <path d="M62 40 Q70 52 70 64" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />
          </g>
        </svg>
      );
    case 'heart':
      return (
        <svg viewBox="0 0 120 110" aria-hidden="true">
          <Defs id="ht">
            <radialGradient id="ht-fill" cx="0.35" cy="0.3" r="0.85">
              <stop offset="0" stopColor="#ffb3c7" />
              <stop offset="0.45" stopColor="#f43f5e" />
              <stop offset="1" stopColor="#9f1239" />
            </radialGradient>
          </Defs>
          <g filter="url(#ht-shadow)">
            <path {...DIE_CUT} d="M60 100 C30 80 10 62 10 38 C10 20 24 8 40 8 C50 8 56 14 60 22 C64 14 70 8 80 8 C96 8 110 20 110 38 C110 62 90 80 60 100 Z" />
            <path fill="url(#ht-fill)" d="M60 100 C30 80 10 62 10 38 C10 20 24 8 40 8 C50 8 56 14 60 22 C64 14 70 8 80 8 C96 8 110 20 110 38 C110 62 90 80 60 100 Z" />
            <ellipse cx="36" cy="30" rx="11" ry="7" fill="#fff" opacity="0.75" transform="rotate(-30 36 30)" />
            <circle cx="50" cy="22" r="3" fill="#fff" opacity="0.8" />
            <path d="M88 64 Q80 78 66 86" fill="none" stroke="#4c0519" strokeWidth="4" strokeLinecap="round" opacity="0.35" />
          </g>
        </svg>
      );
    case 'seal':
      return (
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <Defs id="sl">
            <linearGradient id="sl-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#34d399" />
              <stop offset="1" stopColor="#0f766e" />
            </linearGradient>
          </Defs>
          <g filter="url(#sl-shadow)">
            {/* 12-point scalloped seal: an original "shipped" mark, not any platform's verified badge */}
            <path
              {...DIE_CUT}
              d="M60 6 L70 16 L84 12 L88 26 L102 30 L98 44 L108 54 L98 64 L102 78 L88 82 L84 96 L70 92 L60 102 L50 92 L36 96 L32 82 L18 78 L22 64 L12 54 L22 44 L18 30 L32 26 L36 12 L50 16 Z"
              transform="translate(0 6)"
            />
            <path
              fill="url(#sl-fill)"
              d="M60 6 L70 16 L84 12 L88 26 L102 30 L98 44 L108 54 L98 64 L102 78 L88 82 L84 96 L70 92 L60 102 L50 92 L36 96 L32 82 L18 78 L22 64 L12 54 L22 44 L18 30 L32 26 L36 12 L50 16 Z"
              transform="translate(0 6)"
            />
            <path d="M40 60 L54 74 L82 46" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            <text x="60" y="98" textAnchor="middle" fill="#ecfdf5" fontFamily="Geist Mono, monospace" fontWeight="700" fontSize="9" letterSpacing="2">
              SHIPPED
            </text>
          </g>
        </svg>
      );
    case 'braces':
      return (
        <svg viewBox="0 0 140 90" aria-hidden="true">
          <Defs id="br">
            <linearGradient id="br-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#a5b4fc" />
              <stop offset="1" stopColor="#6366f1" />
            </linearGradient>
          </Defs>
          <g filter="url(#br-shadow)">
            <rect x="6" y="6" width="128" height="78" rx="39" fill="#fff" />
            <rect x="12" y="12" width="116" height="66" rx="33" fill="url(#br-fill)" />
            <text x="70" y="58" textAnchor="middle" fill="#0b0a1c" fontFamily="Geist Mono, monospace" fontWeight="700" fontSize="30">
              {'{ }'}
            </text>
            <path d="M30 24 Q44 18 58 20" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
          </g>
        </svg>
      );
  }
}
