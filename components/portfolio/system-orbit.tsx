'use client';

import { useEffect, useRef } from 'react';
import { theme } from '@/lib/theme';
import { clamp, project, rotX, rotZ, useScene, view, type Camera, type Frame, type Vec3 } from './scene';

/*
 * "In short": system orbit. A glass core (the application) breathes inside three thin orbits;
 * data points travel the orbits, and the services riding them (UI, API, auth, database, cache)
 * light up in sequence as a request moves through the system. Drawn on a transparent canvas
 * so it sits in the page's own background, in both themes.
 */

type Ring = { r: number; tiltX: number; tiltZ: number; speed: number };

const RINGS: Ring[] = [
  { r: 0.82, tiltX: 1.18, tiltZ: 0.3, speed: 0.18 },
  { r: 1.1, tiltX: -0.42, tiltZ: -0.5, speed: -0.12 },
  { r: 1.38, tiltX: 0.16, tiltZ: 0.1, speed: 0.07 },
];

const SERVICES = [
  { id: 'ui', label: 'UI', ring: 1, phase: 0 },
  { id: 'api', label: 'API', ring: 0, phase: 1.2 },
  { id: 'auth', label: 'AUTH', ring: 2, phase: 2.4 },
  { id: 'db', label: 'DB', ring: 1, phase: 3.5 },
  { id: 'cache', label: 'CACHE', ring: 2, phase: 5.1 },
];

/** A request's path through the services, lit one hop at a time. */
const HOPS: [string, string][] = [
  ['ui', 'api'],
  ['api', 'auth'],
  ['api', 'cache'],
  ['api', 'db'],
  ['db', 'cache'],
  ['api', 'ui'],
];
const HOP_SECONDS = 1.1;

const MONO = '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

const ringPoint = (ring: Ring, angle: number): Vec3 => rotX(rotZ([ring.r * Math.cos(angle), 0, ring.r * Math.sin(angle)], ring.tiltZ), ring.tiltX);

const smooth = (x: number) => x * x * (3 - 2 * x);

/** Colours per theme: additive light on Ink, ink-on-paper strokes on Paper. */
const PALETTES = {
  dark: { line: '150,180,255', glow: '90,130,255', dot: '205,222,255', label: '220,230,255', blend: 'lighter' as GlobalCompositeOperation },
  light: { line: '42,79,214', glow: '42,79,214', dot: '29,58,166', label: '20,19,17', blend: 'source-over' as GlobalCompositeOperation },
};

function draw(f: Frame) {
  const { ctx, w, h, t, enter } = f;
  const dark = document.documentElement.classList.contains('dark');
  const pal = dark ? PALETTES.dark : PALETTES.light;
  const ink = (rgb: string, a: number) => `rgba(${rgb},${clamp(a, 0, 1).toFixed(3)})`;

  const cam: Camera = {
    yaw: 0.3 * Math.sin(t * 0.06) + f.px * 0.22,
    pitch: 0.38 + f.py * 0.1 + f.scroll * 0.08,
    dist: 5,
    // Narrow columns (tablet) leave room for the labels inside the faded edge.
    scale: Math.min(w, h) * (w < 260 ? 0.25 : 0.31) * (0.9 + 0.1 * enter),
    cx: w / 2,
    cy: h / 2,
  };
  const P = (p: Vec3) => project(view(p, cam), cam);

  // Ambient glow, drifting very slowly.
  const gx = cam.cx + w * 0.08 * Math.sin(t * 0.05);
  const gy = cam.cy + h * 0.06 * Math.cos(t * 0.04);
  const ambient = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(w, h) * 0.6);
  ambient.addColorStop(0, ink(pal.glow, (dark ? 0.16 : 0.07) * enter));
  ambient.addColorStop(1, ink(pal.glow, 0));
  ctx.fillStyle = ambient;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = pal.blend;

  // Technical floor: a dot grid under the core, fading out radially, with the core's soft reflection.
  const step = f.compact ? 0.26 : 0.2;
  for (let x = -1.6; x <= 1.601; x += step) {
    for (let z = -1.6; z <= 1.601; z += step) {
      const d = Math.hypot(x, z);
      if (d > 1.6) continue;
      const q = P([x, 1.05, z]);
      const a = (1 - d / 1.6) * (dark ? 0.3 : 0.22) * enter;
      ctx.fillStyle = ink(pal.dot, a);
      ctx.fillRect(q.x - 0.6, q.y - 0.6, 1.2, 1.2);
    }
  }
  const floor = P([0, 1.05, 0]);
  const fr = cam.scale * 0.75;
  ctx.save();
  ctx.translate(floor.x, floor.y);
  ctx.scale(1, 0.32);
  const reflection = ctx.createRadialGradient(0, 0, 0, 0, 0, fr);
  reflection.addColorStop(0, dark ? ink(pal.glow, 0.22 * enter) : `rgba(20,30,80,${(0.1 * enter).toFixed(3)})`);
  reflection.addColorStop(1, dark ? ink(pal.glow, 0) : 'rgba(20,30,80,0)');
  ctx.fillStyle = reflection;
  ctx.fillRect(-fr, -fr, fr * 2, fr * 2);
  ctx.restore();

  const items: { z: number; paint: () => void }[] = [];

  // Orbits, in depth-sorted chunks so they pass behind and in front of the core.
  RINGS.forEach((ring) => {
    const steps = 90;
    const chunk = 10;
    const spin = t * ring.speed;
    const pts = Array.from({ length: steps + 1 }, (_, k) => {
      const v = view(ringPoint(ring, (k / steps) * Math.PI * 2 + spin), cam);
      return { v, q: project(v, cam) };
    });
    for (let c = 0; c < steps / chunk; c++) {
      if (c / (steps / chunk) > enter) break;
      const seg = pts.slice(c * chunk, c * chunk + chunk + 1);
      const z = seg[Math.floor(seg.length / 2)].v[2];
      const depth = clamp((ring.r - z) / (ring.r * 2), 0, 1);
      items.push({
        z,
        paint: () => {
          ctx.beginPath();
          seg.forEach(({ q }, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
          ctx.lineWidth = 1;
          ctx.strokeStyle = ink(pal.line, (dark ? 0.14 : 0.22) + (dark ? 0.42 : 0.48) * depth);
          ctx.stroke();
        },
      });
    }

    // Data points travelling the orbit, each with a short fading tail.
    for (let k = 0; k < 3; k++) {
      const dir = ring.speed >= 0 ? 1 : -1;
      const base = (k / 3) * Math.PI * 2 + spin + dir * t * (0.45 + 0.12 * k);
      const head = view(ringPoint(ring, base), cam);
      items.push({
        z: head[2],
        paint: () => {
          for (let s = 5; s >= 0; s--) {
            const q = project(view(ringPoint(ring, base - dir * s * 0.035), cam), cam);
            const a = enter * (1 - s / 6) * (0.35 + 0.55 * clamp((ring.r - head[2]) / (ring.r * 2), 0, 1));
            const r = (s ? 1.3 : 2.2) * q.s;
            ctx.fillStyle = ink(pal.dot, a);
            ctx.beginPath();
            ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
            ctx.fill();
          }
        },
      });
    }
  });

  // Services riding the orbits, and the request lighting them up hop by hop.
  const nodes = new Map(
    SERVICES.map((s) => {
      const ring = RINGS[s.ring];
      const v = view(ringPoint(ring, s.phase + t * ring.speed), cam);
      return [s.id, { s, v, q: project(v, cam) }];
    }),
  );
  const hopIndex = Math.floor(t / HOP_SECONDS) % HOPS.length;
  const hopT = smooth((t % HOP_SECONDS) / HOP_SECONDS);
  const lit = new Map<string, number>();
  HOPS.forEach(([from, to], i) => {
    const a = nodes.get(from), b = nodes.get(to);
    if (!a || !b) return;
    const active = i === hopIndex;
    const z = (a.v[2] + b.v[2]) / 2;
    if (active) {
      lit.set(from, Math.max(lit.get(from) ?? 0, 1 - hopT));
      lit.set(to, Math.max(lit.get(to) ?? 0, hopT));
    }
    items.push({
      z: z + 0.001,
      paint: () => {
        ctx.beginPath();
        ctx.moveTo(a.q.x, a.q.y);
        ctx.lineTo(b.q.x, b.q.y);
        ctx.lineWidth = active ? 1.1 : 0.7;
        ctx.strokeStyle = ink(pal.line, enter * (active ? 0.3 + 0.35 * Math.sin(Math.PI * hopT) : dark ? 0.08 : 0.14));
        ctx.stroke();
        if (!active) return;
        const x = a.q.x + (b.q.x - a.q.x) * hopT, y = a.q.y + (b.q.y - a.q.y) * hopT;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 7);
        g.addColorStop(0, ink(pal.dot, 0.95 * enter));
        g.addColorStop(1, ink(pal.dot, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x - 7, y - 7, 14, 14);
      },
    });
  });

  for (const { s, v, q } of nodes.values()) {
    items.push({
      z: v[2],
      paint: () => {
        const glow = lit.get(s.id) ?? 0;
        const depth = clamp((1.4 - v[2]) / 2.8, 0, 1);
        const a = enter * (0.45 + 0.55 * depth);
        const r = (3 + 1.5 * glow) * q.s;
        if (glow > 0.02) {
          const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r * 4);
          g.addColorStop(0, ink(pal.glow, 0.45 * glow * enter));
          g.addColorStop(1, ink(pal.glow, 0));
          ctx.fillStyle = g;
          ctx.fillRect(q.x - r * 4, q.y - r * 4, r * 8, r * 8);
        }
        ctx.beginPath();
        ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
        ctx.fillStyle = ink(pal.dot, a * (0.6 + 0.4 * glow));
        ctx.fill();
        ctx.beginPath();
        ctx.arc(q.x, q.y, r + 3, 0, Math.PI * 2);
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = ink(pal.line, a * (0.3 + 0.5 * glow));
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
        ctx.font = `500 ${f.compact ? 9 : 10}px ${MONO}`;
        ctx.textBaseline = 'middle';
        const tw = ctx.measureText(s.label).width;
        const lx = clamp(q.x + r + 7, 4, w - tw - 4);
        ctx.fillStyle = ink(pal.label, a * (0.55 + 0.45 * glow));
        ctx.fillText(s.label, lx, clamp(q.y, 8, h - 8));
        ctx.globalCompositeOperation = pal.blend;
      },
    });
  }

  // The glass core: breathing inner light, rim light, specular highlight; bobs gently in depth.
  const bob = 0.04 * Math.sin(t * 0.6);
  items.push({
    z: 0.02 * Math.sin(t * 0.45),
    paint: () => {
      const c = P([0, bob, 0.08 * Math.sin(t * 0.45)]);
      const R = cam.scale * 0.36 * c.s * (0.7 + 0.3 * enter) * (1 + 0.02 * Math.sin(t * 1.2));
      const breathe = 0.75 + 0.25 * Math.sin(t * 1.2);
      ctx.globalAlpha = enter;

      const halo = ctx.createRadialGradient(c.x, c.y, R * 0.6, c.x, c.y, R * 2.3);
      halo.addColorStop(0, ink(pal.glow, (dark ? 0.32 : 0.12) * breathe));
      halo.addColorStop(1, ink(pal.glow, 0));
      ctx.fillStyle = halo;
      ctx.fillRect(c.x - R * 2.3, c.y - R * 2.3, R * 4.6, R * 4.6);

      ctx.globalCompositeOperation = 'source-over';
      const body = ctx.createRadialGradient(c.x - R * 0.25, c.y - R * 0.3, R * 0.1, c.x, c.y, R);
      if (dark) {
        body.addColorStop(0, 'rgba(70,95,190,0.28)');
        body.addColorStop(0.7, 'rgba(25,40,110,0.42)');
        body.addColorStop(0.93, 'rgba(120,160,255,0.55)');
        body.addColorStop(1, 'rgba(190,212,255,0.75)');
      } else {
        body.addColorStop(0, 'rgba(255,255,255,0.55)');
        body.addColorStop(0.7, 'rgba(220,228,250,0.45)');
        body.addColorStop(0.93, 'rgba(42,79,214,0.32)');
        body.addColorStop(1, 'rgba(29,58,166,0.6)');
      }
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(c.x, c.y, R, 0, Math.PI * 2);
      ctx.fill();

      // Energy inside the glass.
      ctx.globalCompositeOperation = pal.blend;
      const inner = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, R * 0.55);
      inner.addColorStop(0, dark ? `rgba(235,242,255,${(0.95 * breathe).toFixed(3)})` : `rgba(42,79,214,${(0.85 * breathe).toFixed(3)})`);
      inner.addColorStop(0.35, ink(pal.glow, 0.45 * breathe));
      inner.addColorStop(1, ink(pal.glow, 0));
      ctx.fillStyle = inner;
      ctx.beginPath();
      ctx.arc(c.x, c.y, R * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Equator band, turning, to give the glass volume.
      ctx.beginPath();
      for (let k = 0; k <= 48; k++) {
        const a = (k / 48) * Math.PI * 2 + t * 0.4;
        const v = view([0.36 * Math.cos(a) * 0.98, bob, 0.36 * Math.sin(a) * 0.98], cam);
        const q = project(v, cam);
        if (k) ctx.lineTo(q.x, q.y);
        else ctx.moveTo(q.x, q.y);
      }
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = ink(pal.line, dark ? 0.35 : 0.3);
      ctx.stroke();

      // Specular highlight and a caustic on the lower rim.
      ctx.globalCompositeOperation = 'source-over';
      const spec = ctx.createRadialGradient(c.x - R * 0.38, c.y - R * 0.42, 0, c.x - R * 0.38, c.y - R * 0.42, R * 0.38);
      spec.addColorStop(0, 'rgba(255,255,255,0.85)');
      spec.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = spec;
      ctx.beginPath();
      ctx.arc(c.x - R * 0.38, c.y - R * 0.42, R * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(c.x, c.y, R * 0.86, Math.PI * 0.15, Math.PI * 0.7);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = dark ? 'rgba(170,205,255,0.45)' : 'rgba(42,79,214,0.35)';
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = pal.blend;
    },
  });

  items.sort((a, b) => b.z - a.z);
  for (const item of items) item.paint();
  ctx.globalCompositeOperation = 'source-over';
}

export function SystemOrbit() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const invalidate = useScene(canvasRef, draw);
  // A still frame (reduced motion) must follow theme switches too.
  useEffect(() => {
    const off = theme.subscribe(() => invalidate.current());
    return () => void off();
  }, [invalidate]);
  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />;
}
