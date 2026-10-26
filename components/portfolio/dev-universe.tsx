'use client';

import { useRef } from 'react';
import { stackGroups } from '@/data/stack';
import { clamp, project, rotX, rotY, rotZ, seeded, useScene, view, type Camera, type Frame, type Vec3 } from './scene';

/*
 * About: "developer universe". A luminous core (the engineering) inside three tilted rings that
 * spin at their own speeds. The six capability groups from data/stack.ts ride the rings, wired
 * to the core and to each other the way the layers talk in a real product (interface → API →
 * data → storage, plus AI and delivery). The first tool of each group drifts on an outer ring.
 * Every label comes from the stack data; nothing is invented.
 */

type Ring = { r: number; tiltX: number; tiltZ: number; speed: number; rgb: string; dashed?: boolean };

const RINGS: Ring[] = [
  { r: 0.74, tiltX: 0.95, tiltZ: 0.25, speed: 0.24, rgb: '128,156,255' },
  { r: 1.02, tiltX: -0.9, tiltZ: -0.35, speed: -0.15, rgb: '168,128,255', dashed: true },
  { r: 1.3, tiltX: 0.3, tiltZ: 0.55, speed: 0.1, rgb: '112,214,255' },
];
const TOOL_RING: Ring = { r: 1.6, tiltX: 0.18, tiltZ: -0.06, speed: 0.045, rgb: '150,166,225' };

const NODES = stackGroups.map((group, i) => ({ id: group.id, label: group.title, ring: RINGS[Math.floor(i / 2) % RINGS.length], phase: (i % 2) * Math.PI + i * 0.7 }));
const TOOLS = stackGroups.map((group) => group.tools[0]);

/** How the layers talk: drawn as dashed links with data moving along them. */
const FLOWS: [string, string][] = [
  ['frontend', 'backend'],
  ['backend', 'data'],
  ['backend', 'ai'],
  ['data', 'systems'],
  ['delivery', 'backend'],
];

const ringPoint = (ring: Ring, angle: number, radius = ring.r): Vec3 =>
  rotX(rotZ([radius * Math.cos(angle), 0, radius * Math.sin(angle)], ring.tiltZ), ring.tiltX);

/* Wireframe solids: vertices + edges (pairs at the shortest distance). */
function solid(vertices: Vec3[]) {
  let min = Infinity;
  const d = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  for (let i = 0; i < vertices.length; i++) for (let j = i + 1; j < vertices.length; j++) min = Math.min(min, d(vertices[i], vertices[j]));
  const edges: [number, number][] = [];
  for (let i = 0; i < vertices.length; i++) for (let j = i + 1; j < vertices.length; j++) if (d(vertices[i], vertices[j]) < min * 1.01) edges.push([i, j]);
  return { vertices, edges };
}
const G = (1 + Math.sqrt(5)) / 2;
const ICOSA = solid(
  [[-1, G, 0], [1, G, 0], [-1, -G, 0], [1, -G, 0], [0, -1, G], [0, 1, G], [0, -1, -G], [0, 1, -G], [G, 0, -1], [G, 0, 1], [-G, 0, -1], [-G, 0, 1]].map(
    ([x, y, z]) => [x / 1.902, y / 1.902, z / 1.902] as Vec3,
  ),
);
const CUBE = solid([-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [x * 0.58, y * 0.58, z * 0.58] as Vec3))));
const OCTA = solid([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]);
const TETRA = solid([[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(([x, y, z]) => [x * 0.58, y * 0.58, z * 0.58] as Vec3));

const FLOATERS = [
  { shape: CUBE, at: [-1.38, -0.98, 0.5] as Vec3, size: 0.13, spin: 0.5 },
  { shape: OCTA, at: [1.42, 0.98, -0.2] as Vec3, size: 0.15, spin: -0.4 },
  { shape: TETRA, at: [1.08, -1.18, 0.9] as Vec3, size: 0.15, spin: 0.35 },
];

/* Holographic surfaces: an interface panel and a table, at the back of the scene. */
const PANELS = [
  { kind: 'ui' as const, at: [-1.18, 0.5, 0.75] as Vec3, w: 0.62, h: 0.42, yaw: 0.42 },
  { kind: 'table' as const, at: [1.22, -0.38, 0.95] as Vec3, w: 0.58, h: 0.4, yaw: -0.46 },
];

const LIGHT: Vec3 = (() => {
  const l: Vec3 = [-0.45, -0.75, -0.5];
  const n = Math.hypot(...l);
  return [l[0] / n, l[1] / n, l[2] / n];
})();

const MONO = '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

function particles(count: number) {
  const rand = seeded(7);
  return Array.from({ length: count }, () => {
    const u = rand() * 2 - 1;
    const a = rand() * Math.PI * 2;
    const r = 0.55 + Math.pow(rand(), 0.8) * 1.8;
    const k = Math.sqrt(1 - u * u);
    return { p: [r * k * Math.cos(a), r * u * 0.8, r * k * Math.sin(a)] as Vec3, size: 0.5 + rand() * 1.1, phase: rand() * 6.28 };
  });
}
const DUST = { full: particles(120), compact: particles(70), low: particles(50) };

/** Depth factor: 1 at the front of the scene, 0 at the back. */
const front = (z: number, span = 1.6) => clamp((span - z) / (span * 2), 0, 1);

function draw(f: Frame) {
  const { ctx, w, h, t, enter } = f;
  const base = Math.min(w, h) * (f.compact ? 0.28 : 0.285);
  const cam: Camera = {
    yaw: 0.35 * Math.sin(t * 0.07) + f.px * 0.35,
    pitch: 0.28 + f.py * 0.16 + f.scroll * 0.14,
    dist: 5,
    scale: base * (0.86 + 0.14 * enter) * (0.95 + 0.05 * (1 - Math.abs(f.scroll))),
    cx: w / 2,
    cy: h / 2,
  };
  const P = (p: Vec3) => project(view(p, cam), cam);

  // Backdrop: deep navy with a soft violet bloom behind the core.
  const bg = ctx.createRadialGradient(cam.cx, cam.cy * 0.95, 0, cam.cx, cam.cy, Math.max(w, h) * 0.8);
  bg.addColorStop(0, '#151d45');
  bg.addColorStop(0.45, '#0a0e24');
  bg.addColorStop(1, '#04060e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = 'lighter';

  // Dust, rotating slowly with the scene.
  const dust = f.lowPower ? DUST.low : f.compact ? DUST.compact : DUST.full;
  for (const d of dust) {
    const q = P(rotY(d.p, t * 0.025));
    const a = enter * (0.12 + 0.5 * front(q.z, 2.3)) * (0.65 + 0.35 * Math.sin(t * 1.3 + d.phase));
    ctx.fillStyle = `rgba(190,205,255,${a.toFixed(3)})`;
    const s = d.size * q.s;
    ctx.fillRect(q.x - s / 2, q.y - s / 2, s, s);
  }

  // Everything else is depth-sorted: far first.
  const items: { z: number; paint: () => void }[] = [];

  for (const ring of RINGS) ringItems(ring, false);
  ringItems(TOOL_RING, true);

  function ringItems(ring: Ring, faint: boolean) {
    const steps = f.compact ? 72 : 96;
    const chunk = f.compact ? 9 : 12;
    const spin = t * ring.speed;
    const pts = Array.from({ length: steps + 1 }, (_, k) => {
      const v = view(ringPoint(ring, (k / steps) * Math.PI * 2 + spin), cam);
      return { v, q: project(v, cam) };
    });
    const drawn = Math.ceil((steps / chunk) * enter);
    for (let c = 0; c < Math.min(drawn, steps / chunk); c++) {
      const seg = pts.slice(c * chunk, c * chunk + chunk + 1);
      const mid = seg[Math.floor(seg.length / 2)].v;
      const n = Math.hypot(...mid) || 1;
      const spec = Math.pow(Math.max(0, (mid[0] * LIGHT[0] + mid[1] * LIGHT[1] + mid[2] * LIGHT[2]) / n), 5);
      const d = front(mid[2], ring.r);
      items.push({
        z: mid[2],
        paint: () => {
          ctx.beginPath();
          seg.forEach(({ q }, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
          if (!faint) {
            ctx.setLineDash([]);
            ctx.lineWidth = 4 * seg[0].q.s;
            ctx.strokeStyle = `rgba(${ring.rgb},${(0.05 + 0.09 * d).toFixed(3)})`;
            ctx.stroke();
          }
          ctx.setLineDash(ring.dashed ? [2, 6] : faint ? [1, 7] : []);
          ctx.lineWidth = faint ? 0.8 : 1.1;
          ctx.strokeStyle = `rgba(${ring.rgb},${((faint ? 0.12 : 0.22) + (faint ? 0.25 : 0.6) * d).toFixed(3)})`;
          ctx.stroke();
          if (spec > 0.05 && !faint) {
            ctx.setLineDash([]);
            ctx.lineWidth = 1.6;
            ctx.strokeStyle = `rgba(255,255,255,${(spec * 0.85).toFixed(3)})`;
            ctx.stroke();
          }
          ctx.setLineDash([]);
        },
      });
    }
  }

  // The core.
  const pulsePhase = (t % 4.5) / 4.5;
  const flash = Math.max(0, 1 - pulsePhase * 6) * 0.25;
  items.push({
    z: 0,
    paint: () => {
      const c = P([0, 0, 0]);
      const R = cam.scale * 0.62 * (1 + 0.04 * Math.sin(t * 1.7) + flash) * enter;
      if (R <= 0) return;
      const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, R);
      glow.addColorStop(0, 'rgba(200,216,255,0.95)');
      glow.addColorStop(0.16, 'rgba(112,134,255,0.5)');
      glow.addColorStop(0.42, 'rgba(132,92,255,0.16)');
      glow.addColorStop(1, 'rgba(80,60,200,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(c.x - R, c.y - R, R * 2, R * 2);
      wire(ICOSA, [0, 0, 0], 0.3, t * 0.35, t * 0.21, 'rgba(220,230,255,0.55)', 0.8);
      const inner = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, cam.scale * 0.14);
      inner.addColorStop(0, 'rgba(255,255,255,0.95)');
      inner.addColorStop(1, 'rgba(160,180,255,0)');
      ctx.fillStyle = inner;
      ctx.beginPath();
      ctx.arc(c.x, c.y, cam.scale * 0.14, 0, Math.PI * 2);
      ctx.fill();
    },
  });

  function wire(shape: typeof ICOSA, at: Vec3, size: number, ay: number, ax: number, stroke: string, width: number) {
    const q = shape.vertices.map((v) => P(rotX(rotY([v[0] * size, v[1] * size, v[2] * size], ay), ax).map((n, i) => n + at[i]) as Vec3));
    ctx.beginPath();
    for (const [a, b] of shape.edges) {
      ctx.moveTo(q[a].x, q[a].y);
      ctx.lineTo(q[b].x, q[b].y);
    }
    ctx.lineWidth = width;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }

  // Floating solids, bobbing in place (bounded: they never leave their anchor).
  FLOATERS.forEach((fl, i) => {
    const at: Vec3 = [fl.at[0], fl.at[1] + 0.05 * Math.sin(t * 0.8 + i * 2), fl.at[2]];
    const z = view(at, cam)[2];
    items.push({ z, paint: () => wire(fl.shape, at, fl.size, t * fl.spin, t * fl.spin * 0.6, `rgba(170,190,255,${(enter * (0.25 + 0.4 * front(z))).toFixed(3)})`, 0.9) });
  });

  // Holographic panels.
  PANELS.forEach((panel, i) => {
    const bob = 0.04 * Math.sin(t * 0.6 + i * 1.7);
    const at: Vec3 = [panel.at[0], panel.at[1] + bob, panel.at[2]];
    const point = (u: number, v: number) => {
      const local = rotY([(u - 0.5) * panel.w, (v - 0.5) * panel.h, 0], panel.yaw);
      return P([local[0] + at[0], local[1] + at[1], local[2] + at[2]]);
    };
    const line = (u0: number, v0: number, u1: number, v1: number) => {
      const a = point(u0, v0), b = point(u1, v1);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    };
    items.push({
      z: view(at, cam)[2],
      paint: () => {
        const a = enter * 0.9;
        const corners = [point(0, 0), point(1, 0), point(1, 1), point(0, 1)];
        ctx.beginPath();
        corners.forEach((c, k) => (k ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y)));
        ctx.closePath();
        ctx.fillStyle = `rgba(110,140,255,${(0.07 * a).toFixed(3)})`;
        ctx.fill();
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = `rgba(150,175,255,${(0.32 * a).toFixed(3)})`;
        ctx.stroke();
        ctx.beginPath();
        if (panel.kind === 'ui') {
          line(0, 0.2, 1, 0.2);
          line(0.08, 0.38, 0.62, 0.38);
          line(0.08, 0.52, 0.8, 0.52);
          line(0.08, 0.66, 0.5, 0.66);
          line(0.62, 0.8, 0.9, 0.8);
        } else {
          for (const v of [0.22, 0.42, 0.62, 0.82]) line(0, v, 1, v);
          for (const u of [0.3, 0.62]) line(u, 0, u, 1);
        }
        ctx.strokeStyle = `rgba(150,175,255,${(0.22 * a).toFixed(3)})`;
        ctx.stroke();
      },
    });
  });

  // Capability nodes, their links to the core, and the flows between them.
  const nodes = new Map(
    NODES.map((node) => {
      const v = view(ringPoint(node.ring, node.phase + t * node.ring.speed), cam);
      return [node.id, { node, v, q: project(v, cam) }];
    }),
  );
  const core = P([0, 0, 0]);
  items.push({
    z: 0.01,
    paint: () => {
      let i = 0;
      for (const { q, v } of nodes.values()) {
        const d = front(v[2]);
        ctx.beginPath();
        ctx.moveTo(core.x, core.y);
        ctx.lineTo(q.x, q.y);
        ctx.lineWidth = 0.7;
        ctx.strokeStyle = `rgba(150,170,255,${(enter * (0.06 + 0.1 * d)).toFixed(3)})`;
        ctx.stroke();
        const u = (t * 0.32 + i * 0.17) % 1;
        packet(core.x + (q.x - core.x) * u, core.y + (q.y - core.y) * u, Math.sin(Math.PI * u) * enter * (0.4 + 0.5 * d), '170,200,255');
        i++;
      }
      ctx.setLineDash([3, 5]);
      ctx.lineDashOffset = -t * 18;
      FLOWS.forEach(([from, to], k) => {
        const a = nodes.get(from), b = nodes.get(to);
        if (!a || !b) return;
        ctx.beginPath();
        ctx.moveTo(a.q.x, a.q.y);
        ctx.lineTo(b.q.x, b.q.y);
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = `rgba(120,225,255,${(enter * 0.2).toFixed(3)})`;
        ctx.stroke();
        const u = (t * 0.22 + k * 0.29) % 1;
        packet(a.q.x + (b.q.x - a.q.x) * u, a.q.y + (b.q.y - a.q.y) * u, Math.sin(Math.PI * u) * enter * 0.8, '120,235,255');
      });
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
    },
  });

  function packet(x: number, y: number, alpha: number, rgb: string) {
    if (alpha <= 0.01) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 6);
    g.addColorStop(0, `rgba(${rgb},${alpha.toFixed(3)})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - 6, y - 6, 12, 12);
  }

  for (const { node, v, q } of nodes.values()) {
    items.push({
      z: v[2],
      paint: () => {
        const d = front(v[2]);
        const r = 11 * q.s;
        const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
        g.addColorStop(0, `rgba(${node.ring.rgb},${(0.9 * enter).toFixed(3)})`);
        g.addColorStop(1, `rgba(${node.ring.rgb},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(q.x - r, q.y - r, r * 2, r * 2);
        ctx.fillStyle = `rgba(240,244,255,${(enter * (0.6 + 0.4 * d)).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(q.x, q.y, 2.6 * q.s, 0, Math.PI * 2);
        ctx.fill();
        label(node.label.toUpperCase(), q.x, q.y, enter * (0.45 + 0.55 * d), f.compact ? 9.5 : 10.5, true);
      },
    });
  }

  // Tools on the outer ring.
  TOOLS.forEach((tool, i) => {
    const v = view(ringPoint(TOOL_RING, (i / TOOLS.length) * Math.PI * 2 + t * TOOL_RING.speed), cam);
    const q = project(v, cam);
    items.push({
      z: v[2],
      paint: () => {
        const a = enter * (0.3 + 0.5 * front(v[2], TOOL_RING.r));
        ctx.fillStyle = `rgba(190,205,255,${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(q.x, q.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
        label(tool, q.x, q.y, a, f.compact ? 9 : 10, false);
      },
    });
  });

  function label(text: string, x: number, y: number, alpha: number, size: number, pill: boolean) {
    if (alpha <= 0.02) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.font = `500 ${size}px ${MONO}`;
    const tw = ctx.measureText(text).width;
    const padX = pill ? 7 : 0;
    const bw = tw + padX * 2;
    const bh = size + 8;
    let lx = x + 12;
    if (lx + bw > w - 8) lx = x - 12 - bw;
    lx = clamp(lx, 8, w - 8 - bw);
    const ly = clamp(y - bh / 2, 8, h - 8 - bh);
    if (pill) {
      ctx.fillStyle = `rgba(8,11,28,${(0.72 * alpha).toFixed(3)})`;
      ctx.strokeStyle = `rgba(150,175,255,${(0.4 * alpha).toFixed(3)})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(lx, ly, bw, bh, bh / 2);
      else ctx.rect(lx, ly, bw, bh);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(230,236,255,${alpha.toFixed(3)})`;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, lx + padX, ly + bh / 2 + 0.5);
    ctx.globalCompositeOperation = 'lighter';
  }

  items.sort((a, b) => b.z - a.z);
  for (const item of items) item.paint();

  // Light pulse: a wave leaving the core every few seconds, in the inner ring's plane.
  if (enter > 0.5) {
    const ring = RINGS[0];
    const radius = 0.25 + pulsePhase * 1.5;
    ctx.beginPath();
    for (let k = 0; k <= 64; k++) {
      const q = P(ringPoint(ring, (k / 64) * Math.PI * 2, radius));
      if (k) ctx.lineTo(q.x, q.y);
      else ctx.moveTo(q.x, q.y);
    }
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = `rgba(160,190,255,${(Math.pow(1 - pulsePhase, 2) * 0.32).toFixed(3)})`;
    ctx.stroke();
  }

  ctx.globalCompositeOperation = 'source-over';
}

export function DevUniverse() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useScene(canvasRef, draw);
  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`Animated illustration: a glowing core inside orbiting rings labelled ${stackGroups.map((g) => g.title).join(', ')}, connected the way a product's layers talk to each other.`}
      className="absolute inset-0 block h-full w-full"
    />
  );
}
