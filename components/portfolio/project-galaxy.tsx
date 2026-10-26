'use client';

import Link from 'next/link';
import { useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { soloProjects, type Project } from '@/data/projects';
import { ArrowRight, ArrowUpRight } from '../icons';
import { ExternalLink } from '../ui';
import { coverTheme } from './project-cover';
import { clamp, project as toScreen, seeded, useScene, view, type Camera, type Frame, type Vec3 } from './scene';

/*
 * Work: "project galaxy". Every project is a glass panel on a slowly turning disc of dust, with a
 * small drawing of what it actually does (B+Tree pages for ScratchDB, in-memory slots for the
 * Redis server, retrieved documents for VeriDoc…). Faint lines join projects that share a
 * technology. The nodes are real links: hover (mouse), tap (touch) or focus (keyboard) selects
 * a project and fills the panel beside the stage; click, a second tap, or Enter opens the
 * project overview. Without JavaScript they are plain links to the case studies.
 */

type Props = { projects: Project[]; onOpen: (slug: string, opener: HTMLElement) => void };

const TAU = Math.PI * 2;

function nodePosition(i: number, n: number, rot: number, t: number): Vec3 {
  const a = (i / n) * TAU + rot + Math.PI / 2;
  const r = i % 2 ? 1.06 : 0.94;
  return [r * Math.cos(a), 0.1 * Math.sin(i * 1.7) + 0.03 * Math.sin(t * 0.7 + i), r * Math.sin(a)];
}

function camera(w: number, h: number, compact: boolean, px = 0, py = 0, scroll = 0): Camera {
  return {
    yaw: px * 0.2,
    pitch: 0.75 + py * 0.08 - scroll * 0.08,
    dist: 4,
    scale: compact ? Math.min(w * 0.34, h * 0.46) : Math.min(w * 0.3, h * 0.46),
    cx: w / 2,
    cy: h * 0.46,
  };
}

/** Server-rendered resting positions (percent of the stage), so nodes are placed before JS runs. */
function restingPositions(n: number) {
  const w = 1000, h = 625;
  const cam = camera(w, h, false);
  return Array.from({ length: n }, (_, i) => {
    const q = toScreen(view(nodePosition(i, n, 0, 0), cam), cam);
    return { left: (q.x / w) * 100, top: (q.y / h) * 100 };
  });
}

/* Spiral dust: two arms, brighter toward the centre. */
function dust(count: number) {
  const rand = seeded(11);
  return Array.from({ length: count }, (_, k) => {
    const u = Math.pow(rand(), 0.75);
    const r = 0.12 + u * 1.45;
    const a = (k % 2) * Math.PI + u * 3.4 + (rand() - 0.5) * 0.55;
    return { r, a, y: (rand() - 0.5) * 0.1 * (1.2 - u), size: 0.6 + rand() * 1.2, warm: rand() < 0.3, phase: rand() * TAU };
  });
}
const DUST = { full: dust(420), compact: dust(220), low: dust(160) };

type Ctx = CanvasRenderingContext2D;
type Glyph = (ctx: Ctx, x: number, y: number, u: number, accent: string, t: number) => void;

const ink = (a: number) => `rgba(232,238,255,${a})`;

function box(ctx: Ctx, x: number, y: number, w: number, h: number, r = 2) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

/* One small drawing per project, of what the project really does. */
const GLYPHS: Record<string, Glyph> = {
  // B+Tree: a root page over leaf pages, a scan moving across the leaves.
  scratchdb(ctx, x, y, u, accent, t) {
    const hot = Math.floor(t * 1.2) % 3;
    ctx.strokeStyle = ink(0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const lx of [-0.9, 0, 0.9]) {
      ctx.moveTo(x, y - 0.42 * u);
      ctx.lineTo(x + lx * u, y + 0.12 * u);
    }
    ctx.stroke();
    box(ctx, x - 0.42 * u, y - 0.78 * u, 0.84 * u, 0.36 * u);
    ctx.fillStyle = ink(0.85);
    ctx.fill();
    [-0.9, 0, 0.9].forEach((lx, i) => {
      box(ctx, x + (lx - 0.32) * u, y + 0.12 * u, 0.64 * u, 0.32 * u);
      ctx.fillStyle = i === hot ? accent : ink(0.35);
      ctx.fill();
    });
    ctx.fillStyle = ink(0.25);
    for (let i = 0; i < 3; i++) ctx.fillRect(x + (-0.9 + i * 0.6) * u, y + 0.62 * u, 0.5 * u, 0.1 * u);
  },
  // In-memory keyspace: slots on a ring, one value racing around it.
  'java-redis'(ctx, x, y, u, accent, t) {
    ctx.strokeStyle = ink(0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 0.72 * u, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      ctx.fillStyle = ink(0.6);
      ctx.fillRect(x + Math.cos(a) * 0.72 * u - 1.5, y + Math.sin(a) * 0.72 * u - 1.5, 3, 3);
    }
    const a = t * 3.2;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 0.72 * u, y + Math.sin(a) * 0.72 * u, 0.13 * u, 0, TAU);
    ctx.fill();
    box(ctx, x - 0.2 * u, y - 0.2 * u, 0.4 * u, 0.4 * u);
    ctx.fill();
  },
  // Retrieval: three source documents, one passage passing the relevance gate to the answer.
  veridoc(ctx, x, y, u, accent, t) {
    const hit = Math.floor(t * 0.8) % 3;
    [-0.5, 0, 0.5].forEach((dy, i) => {
      box(ctx, x - 1.1 * u, y + (dy - 0.17) * u, 0.5 * u, 0.34 * u);
      ctx.fillStyle = i === hit ? accent : ink(0.4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 0.6 * u, y + dy * u);
      ctx.lineTo(x + 0.1 * u, y);
      ctx.strokeStyle = i === hit ? accent : ink(0.18);
      ctx.lineWidth = i === hit ? 1.4 : 1;
      ctx.stroke();
    });
    ctx.fillStyle = ink(0.7);
    ctx.fillRect(x + 0.1 * u, y - 0.42 * u, 0.08 * u, 0.84 * u);
    ctx.beginPath();
    ctx.arc(x + 0.75 * u, y, 0.22 * u, 0, TAU);
    ctx.fillStyle = ink(0.9);
    ctx.fill();
  },
  // Crawler web around a magnifier.
  'private-search'(ctx, x, y, u, accent, t) {
    ctx.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + 0.3;
      const pulse = 0.5 + 0.5 * Math.sin(t * 2 - i);
      ctx.strokeStyle = ink(0.15 + 0.3 * pulse);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * 0.38 * u, y + Math.sin(a) * 0.38 * u);
      ctx.lineTo(x + Math.cos(a) * 0.95 * u, y + Math.sin(a) * 0.7 * u);
      ctx.stroke();
      ctx.fillStyle = ink(0.6);
      ctx.fillRect(x + Math.cos(a) * 0.95 * u - 1.5, y + Math.sin(a) * 0.7 * u - 1.5, 3, 3);
    }
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x - 0.05 * u, y - 0.05 * u, 0.26 * u, 0, TAU);
    ctx.moveTo(x + 0.14 * u, y + 0.14 * u);
    ctx.lineTo(x + 0.34 * u, y + 0.34 * u);
    ctx.stroke();
  },
  // Layered app: interface over API over data, with real-time events moving between them.
  nexuscode(ctx, x, y, u, accent, t) {
    [-0.5, 0, 0.5].forEach((dy, i) => {
      ctx.beginPath();
      ctx.moveTo(x - 0.85 * u + 0.15 * u, y + (dy - 0.14) * u);
      ctx.lineTo(x + 0.85 * u + 0.15 * u, y + (dy - 0.14) * u);
      ctx.lineTo(x + 0.85 * u - 0.15 * u, y + (dy + 0.14) * u);
      ctx.lineTo(x - 0.85 * u - 0.15 * u, y + (dy + 0.14) * u);
      ctx.closePath();
      ctx.fillStyle = i === 0 ? accent : ink(0.22 + i * 0.1);
      ctx.fill();
    });
    const k = (t * 0.9) % 1;
    ctx.fillStyle = ink(0.95);
    ctx.beginPath();
    ctx.arc(x + 0.45 * u, y + (-0.5 + k) * u, 0.08 * u, 0, TAU);
    ctx.arc(x - 0.45 * u, y + (0.5 - k) * u, 0.08 * u, 0, TAU);
    ctx.fill();
  },
  // A price estimate with its confidence range.
  realtyiq(ctx, x, y, u, accent, t) {
    const heights = [0.35, 0.55, 0.45, 0.75, 0.9];
    heights.forEach((bh, i) => {
      const grow = bh * (0.85 + 0.15 * Math.sin(t * 1.2 + i));
      ctx.fillStyle = i === 4 ? accent : ink(0.35);
      ctx.fillRect(x + (-0.95 + i * 0.4) * u, y + (0.6 - grow) * u, 0.26 * u, grow * u);
    });
    ctx.strokeStyle = ink(0.85);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const rx = x + 0.73 * u;
    ctx.moveTo(rx, y - 0.6 * u);
    ctx.lineTo(rx, y - 0.1 * u);
    ctx.moveTo(rx - 0.12 * u, y - 0.6 * u);
    ctx.lineTo(rx + 0.12 * u, y - 0.6 * u);
    ctx.moveTo(rx - 0.12 * u, y - 0.1 * u);
    ctx.lineTo(rx + 0.12 * u, y - 0.1 * u);
    ctx.stroke();
  },
  // Two providers merging into one contract (fallback), under the sun's arc.
  'aurora-weather'(ctx, x, y, u, accent, t) {
    ctx.strokeStyle = ink(0.3);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y + 0.2 * u, 0.8 * u, Math.PI, TAU);
    ctx.stroke();
    const a = Math.PI + ((t * 0.25) % 1) * Math.PI;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 0.8 * u, y + 0.2 * u + Math.sin(a) * 0.8 * u, 0.13 * u, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = ink(0.75);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x - 0.7 * u, y + 0.45 * u);
    ctx.quadraticCurveTo(x - 0.1 * u, y + 0.45 * u, x + 0.15 * u, y + 0.62 * u);
    ctx.moveTo(x - 0.7 * u, y + 0.8 * u);
    ctx.quadraticCurveTo(x - 0.1 * u, y + 0.8 * u, x + 0.15 * u, y + 0.62 * u);
    ctx.lineTo(x + 0.75 * u, y + 0.62 * u);
    ctx.stroke();
  },
  // Ranked candidates: weighted scores, best first.
  talentai(ctx, x, y, u, accent) {
    [0.95, 0.75, 0.55, 0.38].forEach((len, i) => {
      const ry = y + (-0.55 + i * 0.37) * u;
      ctx.fillStyle = ink(0.7);
      ctx.beginPath();
      ctx.arc(x - 0.85 * u, ry, 0.1 * u, 0, TAU);
      ctx.fill();
      ctx.fillStyle = i === 0 ? accent : ink(0.3);
      ctx.fillRect(x - 0.62 * u, ry - 0.08 * u, len * 1.5 * u, 0.16 * u);
    });
  },
};

const fallbackGlyph: Glyph = (ctx, x, y, u, accent) => {
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(x, y, 0.3 * u, 0, TAU);
  ctx.fill();
};

/** Pairs of projects that share at least one technology. */
function sharedLinks(projects: Project[]) {
  const links: [number, number][] = [];
  const stacks = projects.map((p) => new Set(p.stack.map((s) => s.toLowerCase())));
  for (let i = 0; i < projects.length; i++)
    for (let j = i + 1; j < projects.length; j++) if ([...stacks[i]].some((s) => stacks[j].has(s))) links.push([i, j]);
  return links;
}

export function ProjectGalaxy({ projects, onOpen }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodeRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [selected, setSelected] = useState(projects[0]?.slug ?? '');
  const state = useRef({ selected, pause: false, rot: 0, speed: 0.05, emph: new Map<string, number>(), labelSize: new Map<number, { w: number; h: number; node: number }>(), w: 0 });
  const pointerType = useRef('');
  const resting = useMemo(() => restingPositions(projects.length), [projects.length]);
  const links = useMemo(() => sharedLinks(projects), [projects]);
  const accents = useMemo(() => projects.map((p) => coverTheme(p.slug).accent), [projects]);

  const invalidate = useScene(canvasRef, (f: Frame) => {
    const { ctx, w, h, t, dt, enter } = f;
    const s = state.current;
    if (s.w !== w) {
      s.labelSize.clear();
      s.w = w;
    }
    if (!f.reduced) {
      s.speed += ((s.pause ? 0 : 0.05) - s.speed) * Math.min(1, dt * 2);
      s.rot += s.speed * dt;
    }
    const cam = camera(w, h, f.compact, f.px, f.py, f.scroll);

    // Backdrop.
    const bg = ctx.createRadialGradient(cam.cx, cam.cy, 0, cam.cx, cam.cy, Math.max(w, h) * 0.75);
    bg.addColorStop(0, '#141a3c');
    bg.addColorStop(0.5, '#090c20');
    bg.addColorStop(1, '#04050c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'lighter';

    // Spiral dust, turning with the disc.
    const motes = f.lowPower ? DUST.low : f.compact ? DUST.compact : DUST.full;
    for (const m of motes) {
      const a = m.a + s.rot * 1.15;
      const q = toScreen(view([m.r * Math.cos(a), m.y, m.r * Math.sin(a)], cam), cam);
      const alpha = enter * (0.1 + 0.45 * (1 - m.r / 1.6)) * (0.7 + 0.3 * Math.sin(t * 1.1 + m.phase));
      ctx.fillStyle = m.warm ? `rgba(190,150,255,${alpha.toFixed(3)})` : `rgba(160,190,255,${alpha.toFixed(3)})`;
      const size = m.size * q.s;
      ctx.fillRect(q.x - size / 2, q.y - size / 2, size, size);
    }

    // Hub.
    const hub = toScreen(view([0, 0, 0], cam), cam);
    const R = cam.scale * 0.32 * (1 + 0.05 * Math.sin(t * 1.4));
    const glow = ctx.createRadialGradient(hub.x, hub.y, 0, hub.x, hub.y, R);
    glow.addColorStop(0, `rgba(205,218,255,${(0.85 * enter).toFixed(3)})`);
    glow.addColorStop(0.25, `rgba(120,135,255,${(0.35 * enter).toFixed(3)})`);
    glow.addColorStop(1, 'rgba(110,80,240,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(hub.x - R, hub.y - R, R * 2, R * 2);

    // Nodes in view space; the selected one comes forward.
    const nodes = projects.map((p, i) => {
      const current = s.emph.get(p.slug) ?? 0;
      const goal = p.slug === s.selected ? 1 : 0;
      const e = f.reduced ? goal : current + (goal - current) * Math.min(1, dt * 6);
      s.emph.set(p.slug, e);
      const v = view(nodePosition(i, projects.length, s.rot, f.reduced ? 0 : t), cam);
      const forward: Vec3 = [v[0] * (1 + 0.06 * e), v[1] - 0.08 * e, v[2] - 0.45 * e];
      return { p, i, e, v: forward, q: toScreen(forward, cam) };
    });

    // Links: hub spokes, and shared-technology threads (lit up for the selected project).
    ctx.lineWidth = 0.8;
    for (const n of nodes) {
      ctx.beginPath();
      ctx.moveTo(hub.x, hub.y);
      ctx.lineTo(n.q.x, n.q.y);
      ctx.strokeStyle = `rgba(150,170,255,${(enter * (0.08 + 0.3 * n.e)).toFixed(3)})`;
      ctx.stroke();
      const k = (t * 0.3 + n.i * 0.13) % 1;
      const px = hub.x + (n.q.x - hub.x) * k, py = hub.y + (n.q.y - hub.y) * k;
      ctx.fillStyle = `rgba(190,210,255,${(enter * Math.sin(Math.PI * k) * (0.35 + 0.5 * n.e)).toFixed(3)})`;
      ctx.fillRect(px - 1.2, py - 1.2, 2.4, 2.4);
    }
    for (const [a, b] of links) {
      const na = nodes[a], nb = nodes[b];
      const lit = Math.max(na.e, nb.e);
      const mx = (na.q.x + nb.q.x) / 2, my = (na.q.y + nb.q.y) / 2;
      ctx.beginPath();
      ctx.moveTo(na.q.x, na.q.y);
      ctx.quadraticCurveTo(mx + (hub.x - mx) * 0.35, my + (hub.y - my) * 0.35, nb.q.x, nb.q.y);
      ctx.strokeStyle = lit > 0.05 ? hexA(accents[na.e > nb.e ? a : b], enter * (0.05 + 0.4 * lit)) : `rgba(150,170,255,${(enter * 0.05).toFixed(3)})`;
      ctx.stroke();
    }

    // Glass panels, far first.
    ctx.globalCompositeOperation = 'source-over';
    for (const n of [...nodes].sort((a, b) => b.v[2] - a.v[2])) {
      const depth = clamp((1.2 - n.v[2]) / 2.4, 0, 1);
      const u = (f.compact ? 13 : 18) * n.q.s * (1 + 0.3 * n.e) * (0.4 + 0.6 * enter);
      const accent = accents[n.i];
      const x = n.q.x, y = n.q.y;
      ctx.globalAlpha = enter * (0.55 + 0.45 * Math.max(depth, n.e));
      if (n.e > 0.02) {
        const halo = ctx.createRadialGradient(x, y, 0, x, y, u * 3.2);
        halo.addColorStop(0, hexA(accent, 0.35 * n.e));
        halo.addColorStop(1, hexA(accent, 0));
        ctx.fillStyle = halo;
        ctx.fillRect(x - u * 3.2, y - u * 3.2, u * 6.4, u * 6.4);
      }
      box(ctx, x - 1.6 * u, y - 1.25 * u, 3.2 * u, 2.5 * u, 0.35 * u);
      const glass = ctx.createLinearGradient(x, y - 1.25 * u, x, y + 1.25 * u);
      glass.addColorStop(0, 'rgba(40,50,96,0.78)');
      glass.addColorStop(1, 'rgba(12,16,38,0.86)');
      ctx.fillStyle = glass;
      ctx.fill();
      ctx.lineWidth = 1 + n.e;
      ctx.strokeStyle = hexA(accent, 0.35 + 0.6 * n.e);
      ctx.stroke();
      (GLYPHS[n.p.slug] ?? fallbackGlyph)(ctx, x, y, u, accent, f.reduced ? 2 : t);
      ctx.globalAlpha = 1;
    }

    // Move the real links onto their panels (transform only; no layout).
    nodes.forEach((n) => {
      const el = nodeRefs.current[n.i];
      if (!el) return;
      const base = resting[n.i];
      el.style.transform = `translate(${(n.q.x - (base.left / 100) * w).toFixed(1)}px, ${(n.q.y - (base.top / 100) * h).toFixed(1)}px)`;
      el.style.zIndex = String(Math.round(50 - n.v[2] * 10 + n.e * 20));
      const label = el.lastElementChild as HTMLElement | null;
      if (!label) return;
      // Sizes are measured once per stage width (reading them every frame would force style work).
      let size = s.labelSize.get(n.i);
      if (!size) {
        size = { w: label.offsetWidth, h: label.offsetHeight, node: el.offsetHeight };
        if (size.w) s.labelSize.set(n.i, size);
      }
      const shift = size.w ? clamp(n.q.x, size.w / 2 + 8, w - size.w / 2 - 8) - n.q.x : 0;
      // Keep the label inside the stage: below the panel, nudged up near the bottom edge.
      const bottom = n.q.y + size.node / 2 + size.h + 4;
      label.style.setProperty('--shift', `${shift.toFixed(1)}px`);
      label.style.setProperty('--shift-y', `${Math.min(0, h - 8 - bottom).toFixed(1)}px`);
    });
  });

  const select = (slug: string) => {
    state.current.selected = slug;
    setSelected(slug);
    invalidate.current();
  };

  const onNodeClick = (event: MouseEvent<HTMLAnchorElement>, slug: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    const touch = pointerType.current === 'touch' || pointerType.current === 'pen';
    pointerType.current = '';
    // Touch: the first tap selects (there is no hover), the second opens.
    if (touch && state.current.selected !== slug) select(slug);
    else onOpen(slug, event.currentTarget);
  };

  const current = projects.find((p) => p.slug === selected) ?? projects[0];
  if (!current) return null;

  return (
    <div className="galaxy" data-reveal>
      <div
        className="galaxy-stage"
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') state.current.pause = true;
        }}
        onPointerLeave={() => {
          state.current.pause = false;
        }}
        onFocus={() => {
          state.current.pause = true;
        }}
        onBlur={() => {
          state.current.pause = false;
        }}
      >
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
        <p aria-hidden="true" className="galaxy-hint">
          Hover, tap or tab through the projects
        </p>
        <ul aria-label="Projects">
          {projects.map((p, i) => (
            <li key={p.slug}>
              <Link
                ref={(el) => {
                  nodeRefs.current[i] = el;
                }}
                href={`/work/${p.slug}`}
                className="galaxy-node"
                data-active={p.slug === selected ? '' : undefined}
                style={{ left: `${resting[i].left}%`, top: `${resting[i].top}%`, '--node-accent': accents[i] } as CSSProperties}
                onPointerDown={(e) => {
                  pointerType.current = e.pointerType;
                }}
                onPointerEnter={(e) => {
                  if (e.pointerType === 'mouse') select(p.slug);
                }}
                onFocus={() => select(p.slug)}
                onClick={(e) => onNodeClick(e, p.slug)}
              >
                <span className="galaxy-label">{p.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="galaxy-panel" role="group" aria-label={`Selected project: ${current.name}`}>
        <div className="flex items-center justify-between gap-4 font-mono text-xs tracking-[0.06em] text-subtle uppercase">
          <span className="truncate">{current.category}</span>
          <span className="shrink-0 tabular-nums">
            {String(projects.indexOf(current) + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
          </span>
        </div>
        <p className="mt-3 text-[clamp(1.75rem,2.4vw,2.25rem)] leading-none font-semibold tracking-[-0.04em]">
          <span aria-hidden="true" className="galaxy-swatch" style={{ background: coverTheme(current.slug).accent }} />
          {current.name}
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-pretty text-muted">{current.tagline}</p>

        <p className="galaxy-eyebrow">Architecture</p>
        <ol className="galaxy-flow">
          {current.architecture.layers.map((layer) => (
            <li key={layer.name}>{layer.name}</li>
          ))}
        </ol>

        <p className="galaxy-eyebrow">Stack</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {current.stack.slice(0, 7).map((tool) => (
            <li key={tool} className="pill">
              {tool}
            </li>
          ))}
        </ul>
        {soloProjects.has(current.slug) ? <p className="mt-3 font-mono text-xs text-subtle">Solo project · designed and built end to end</p> : null}

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-sm">
          <button type="button" className="work-action" onClick={(e) => onOpen(current.slug, e.currentTarget)}>
            Overview
            <ArrowRight size={14} className="work-action-arrow" />
          </button>
          <Link href={`/work/${current.slug}`} className="work-action">
            Case study
            <ArrowRight size={14} className="work-action-arrow" />
          </Link>
          <ExternalLink href={current.links.github} className="work-action">
            Source
            <ArrowUpRight size={14} className="work-action-arrow" />
          </ExternalLink>
          {current.links.live ? (
            <ExternalLink href={current.links.live} className="work-action">
              Live demo
              <ArrowUpRight size={14} className="work-action-arrow" />
            </ExternalLink>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function hexA(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(alpha, 0, 1).toFixed(3)})`;
}
