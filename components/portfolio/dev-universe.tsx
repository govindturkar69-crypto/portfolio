'use client';

import { useRef } from 'react';
import { stackGroups } from '@/data/stack';
import { clamp, palette, project, rgba, rotX, rotY, rotZ, seeded, useScene, view, type Camera, type Frame, type Vec3 } from './scene';

/*
 * About: living code lattice. A geodesic wireframe (the system) turns slowly on several axes
 * around a counter-rotating inner core. Data particles leave trails along curved arcs over its
 * surface and light the node they reach; a light sweep passes across the lattice in sequence.
 * The six capability groups from data/stack.ts are pinned to nodes. Transparent canvas: the page
 * background is the scene's background, in both themes.
 */

type Solid = { vertices: Vec3[]; edges: [number, number][] };

const norm = (v: Vec3): Vec3 => {
  const n = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / n, v[1] / n, v[2] / n];
};
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function shortestEdges(vertices: Vec3[]): [number, number][] {
  let min = Infinity;
  for (let i = 0; i < vertices.length; i++) for (let j = i + 1; j < vertices.length; j++) min = Math.min(min, dist(vertices[i], vertices[j]));
  const edges: [number, number][] = [];
  for (let i = 0; i < vertices.length; i++) for (let j = i + 1; j < vertices.length; j++) if (dist(vertices[i], vertices[j]) < min * 1.01) edges.push([i, j]);
  return edges;
}

/** Icosahedron subdivided once (42 nodes, 120 edges), on the unit sphere. */
function geodesic(): Solid & { neighbours: number[][] } {
  const g = (1 + Math.sqrt(5)) / 2;
  const base = ([[-1, g, 0], [1, g, 0], [-1, -g, 0], [1, -g, 0], [0, -1, g], [0, 1, g], [0, -1, -g], [0, 1, -g], [g, 0, -1], [g, 0, 1], [-g, 0, -1], [-g, 0, 1]] as Vec3[]).map(norm);
  const baseEdges = shortestEdges(base);
  const adjacent = (a: number, b: number) => baseEdges.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const faces: [number, number, number][] = [];
  for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) for (let k = j + 1; k < 12; k++) if (adjacent(i, j) && adjacent(j, k) && adjacent(i, k)) faces.push([i, j, k]);

  const vertices = [...base];
  const mids = new Map<string, number>();
  const mid = (a: number, b: number) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    let i = mids.get(key);
    if (i === undefined) {
      const va = vertices[a], vb = vertices[b];
      i = vertices.push(norm([(va[0] + vb[0]) / 2, (va[1] + vb[1]) / 2, (va[2] + vb[2]) / 2])) - 1;
      mids.set(key, i);
    }
    return i;
  };
  const edgeSet = new Set<string>();
  const edges: [number, number][] = [];
  const add = (a: number, b: number) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    edges.push([a, b]);
  };
  for (const [a, b, c] of faces) {
    const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
    for (const [x, y, z] of [[a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]]) {
      add(x, y);
      add(y, z);
      add(z, x);
    }
  }
  const neighbours = vertices.map((_, i) => edges.flatMap(([a, b]) => (a === i ? [b] : b === i ? [a] : [])));
  return { vertices, edges, neighbours };
}

const LATTICE = geodesic();
const CORE: Solid = (() => {
  const vertices: Vec3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  return { vertices, edges: shortestEdges(vertices) };
})();

/** Capability labels on six well-spread original icosahedron nodes. */
const LABELS = stackGroups.map((group, i) => ({ text: group.title.toUpperCase(), node: [1, 4, 8, 2, 11, 6][i % 6] }));

const MONO = '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

/** A particle's hop for a given cycle: pure function of (particle, cycle), so no state to keep. */
function hop(k: number, cycle: number) {
  const rand = seeded(k * 7919 + cycle * 104729);
  const a = Math.floor(rand() * LATTICE.vertices.length);
  const first = LATTICE.neighbours[a][Math.floor(rand() * LATTICE.neighbours[a].length)];
  const b = LATTICE.neighbours[first][Math.floor(rand() * LATTICE.neighbours[first].length)];
  return { a, b: b === a ? first : b };
}

/** Point on the arc from a to b (slerp), lifted off the surface so the path curves. */
function arc(a: Vec3, b: Vec3, u: number): Vec3 {
  const dot = clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1);
  const omega = Math.acos(dot) || 1e-6;
  const sa = Math.sin((1 - u) * omega) / Math.sin(omega), sb = Math.sin(u * omega) / Math.sin(omega);
  const lift = 1 + 0.16 * Math.sin(Math.PI * u);
  return [(a[0] * sa + b[0] * sb) * lift, (a[1] * sa + b[1] * sb) * lift, (a[2] * sa + b[2] * sb) * lift];
}

const HOP = 2.6;

function draw(f: Frame) {
  const { ctx, w, h, t, enter } = f;
  const pal = palette();
  const dark = pal.dark;
  const breathe = 0.92 + 0.08 * Math.sin(t * 0.4);

  const cam: Camera = {
    yaw: f.px * 0.3,
    pitch: 0.22 + f.py * 0.14 + f.scroll * 0.1,
    dist: 5,
    scale: Math.min(w, h) * (f.compact ? 0.33 : 0.36) * (0.85 + 0.15 * enter),
    cx: w / 2,
    cy: h / 2,
  };
  // Multi-axis turn of the lattice; the core turns the other way on different axes.
  const model = (p: Vec3): Vec3 => rotZ(rotX(rotY(p, t * 0.11), 0.2 + 0.35 * Math.sin(t * 0.05)), 0.15 * Math.sin(t * 0.03));
  const coreModel = (p: Vec3): Vec3 => rotZ(rotX(p, -t * 0.4), t * 0.27);
  const toView = (p: Vec3) => view(p, cam);

  // Soft light behind the lattice, drifting.
  const gx = cam.cx + w * 0.06 * Math.sin(t * 0.05), gy = cam.cy + h * 0.05 * Math.cos(t * 0.04);
  const ambient = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.min(w, h) * 0.55);
  ambient.addColorStop(0, rgba(pal.glow, (dark ? 0.16 : 0.07) * enter * breathe));
  ambient.addColorStop(1, rgba(pal.glow, 0));
  ctx.fillStyle = ambient;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = pal.blend;

  const V = LATTICE.vertices.map((v) => toView(model(v)));
  const Q = V.map((v) => project(v, cam));

  // Light sweep: a band moving across the lattice (in its own frame), node by node.
  const axis = norm(rotY([Math.cos(0.5), Math.sin(0.5), 0], t * 0.3));
  const sweep = -1.3 + 2.6 * ((t / 4.8) % 1);
  const lit = LATTICE.vertices.map((v) => {
    const d = v[0] * axis[0] + v[1] * axis[1] + v[2] * axis[2];
    return Math.exp(-(((d - sweep) / 0.16) ** 2));
  });

  // Particles: arrivals light their node.
  const count = f.lowPower ? 7 : f.compact ? 9 : 14;
  const particles = Array.from({ length: count }, (_, k) => {
    const local = t + k * (HOP / count) * 1.7;
    const cycle = Math.floor(local / HOP);
    const u = (local % HOP) / HOP;
    const { a, b } = hop(k, cycle);
    lit[b] = Math.max(lit[b], u > 0.8 ? (u - 0.8) / 0.2 : 0);
    return { a, b, u };
  });

  // Edges, depth-faded; edges near lit nodes brighten.
  const front = (z: number) => clamp((1.2 - z) / 2.4, 0, 1);
  const edgeAlpha = dark ? 0.12 : 0.14;
  const shown = Math.ceil(LATTICE.edges.length * enter);
  const strokeEdges = (wantFront: boolean) => {
    for (let e = 0; e < shown; e++) {
      const [a, b] = LATTICE.edges[e];
      const z = (V[a][2] + V[b][2]) / 2;
      if (z < 0 !== wantFront) continue;
      const glow = (lit[a] + lit[b]) / 2;
      ctx.beginPath();
      ctx.moveTo(Q[a].x, Q[a].y);
      ctx.lineTo(Q[b].x, Q[b].y);
      ctx.lineWidth = 0.8 + glow * 0.6;
      ctx.strokeStyle = rgba(pal.line, (edgeAlpha + (dark ? 0.5 : 0.5) * front(z) * breathe + 0.45 * glow) * enter);
      ctx.stroke();
    }
  };
  strokeEdges(false);

  // Inner core: counter-rotating octahedron, spokes to the lattice, and a quiet glow.
  const C = CORE.vertices.map((v) => toView(coreModel([v[0] * 0.4, v[1] * 0.4, v[2] * 0.4])));
  const CQ = C.map((v) => project(v, cam));
  const centre = project(toView([0, 0, 0]), cam);
  const cr = cam.scale * 0.55;
  const core = ctx.createRadialGradient(centre.x, centre.y, 0, centre.x, centre.y, cr);
  core.addColorStop(0, rgba(pal.glow, (dark ? 0.45 : 0.16) * enter * breathe));
  core.addColorStop(1, rgba(pal.glow, 0));
  ctx.fillStyle = core;
  ctx.fillRect(centre.x - cr, centre.y - cr, cr * 2, cr * 2);
  ctx.beginPath();
  for (const [a, b] of CORE.edges) {
    ctx.moveTo(CQ[a].x, CQ[a].y);
    ctx.lineTo(CQ[b].x, CQ[b].y);
  }
  ctx.lineWidth = 1;
  ctx.strokeStyle = rgba(pal.line, (dark ? 0.7 : 0.6) * enter);
  ctx.stroke();
  ctx.beginPath();
  C.forEach((cv, i) => {
    // Spoke from each core vertex to its nearest lattice node.
    let best = 0, bestD = Infinity;
    V.forEach((v, j) => {
      const d = dist(cv, v);
      if (d < bestD) {
        bestD = d;
        best = j;
      }
    });
    ctx.moveTo(CQ[i].x, CQ[i].y);
    ctx.lineTo(Q[best].x, Q[best].y);
  });
  ctx.lineWidth = 0.6;
  ctx.setLineDash([2, 4]);
  ctx.strokeStyle = rgba(pal.line, (dark ? 0.22 : 0.2) * enter);
  ctx.stroke();
  ctx.setLineDash([]);

  strokeEdges(true);

  // Nodes.
  V.forEach((v, i) => {
    const q = Q[i];
    const d = front(v[2]);
    const g = lit[i];
    if (g > 0.05) {
      const r = 9 * q.s * (0.6 + g);
      const halo = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
      halo.addColorStop(0, rgba(pal.glow, (dark ? 0.6 : 0.3) * g * enter));
      halo.addColorStop(1, rgba(pal.glow, 0));
      ctx.fillStyle = halo;
      ctx.fillRect(q.x - r, q.y - r, r * 2, r * 2);
    }
    ctx.fillStyle = rgba(pal.dot, (0.25 + 0.6 * d + 0.4 * g) * enter);
    ctx.beginPath();
    ctx.arc(q.x, q.y, (1.1 + 1.2 * g) * q.s, 0, Math.PI * 2);
    ctx.fill();
  });

  // Particles with trails along their arcs.
  for (const p of particles) {
    const A = LATTICE.vertices[p.a], B = LATTICE.vertices[p.b];
    for (let s = 7; s >= 0; s--) {
      const u = p.u - s * 0.025;
      if (u < 0) continue;
      const v = toView(model(arc(A, B, u)));
      const q = project(v, cam);
      const a = (1 - s / 8) * (0.35 + 0.6 * front(v[2])) * Math.sin(Math.PI * clamp(p.u * 1.1, 0, 1)) * enter;
      ctx.fillStyle = rgba(pal.dot, a);
      ctx.beginPath();
      ctx.arc(q.x, q.y, (s ? 1 : 1.9) * q.s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Capability labels on front-facing nodes.
  ctx.globalCompositeOperation = 'source-over';
  ctx.font = `500 ${f.compact ? 9 : 10}px ${MONO}`;
  ctx.textBaseline = 'middle';
  for (const label of LABELS) {
    const v = V[label.node], q = Q[label.node];
    const a = clamp((0.35 - v[2]) / 0.7, 0, 1) * enter * (0.55 + 0.4 * lit[label.node]);
    if (a < 0.03) continue;
    const tw = ctx.measureText(label.text).width;
    const right = q.x < cam.cx;
    const x = clamp(right ? q.x - 14 - tw : q.x + 14, 6, w - tw - 6);
    const y = clamp(q.y, 10, h - 10);
    ctx.strokeStyle = rgba(pal.line, a * 0.6);
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(q.x, q.y);
    ctx.lineTo(right ? x + tw + 4 : x - 4, y);
    ctx.stroke();
    ctx.fillStyle = rgba(pal.label, a);
    ctx.fillText(label.text, x, y);
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
      aria-label={`Animated illustration: a turning wireframe lattice with data moving across it, its nodes labelled ${stackGroups.map((g) => g.title).join(', ')}.`}
      className="absolute inset-0 block h-full w-full"
    />
  );
}
