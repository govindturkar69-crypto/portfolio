'use client';

import { useEffect, useRef } from 'react';
import type { Project } from '@/data/projects';
import { projectFocus } from '@/lib/project-focus';
import { clamp, palette, project, rgba, useScene, view, type Camera, type Frame, type Vec3 } from './scene';

/*
 * Work: system architecture. Four floating tiers (one per architecture layer of a real project,
 * named from data/projects.ts) with services on each, wired top to bottom. A request travels down
 * the stack and the response comes back up, tier by tier. It cycles through the featured
 * projects and follows the project card under the pointer (or keyboard focus).
 */

const TIERS = 4;
const TIER_Y = [-0.8, -0.27, 0.27, 0.8];
const HALF_X = 1.05;
const HALF_Z = 0.68;
/** Service positions on each tier (plane coordinates, -1…1). */
const SERVICES: [number, number][][] = [
  [[-0.55, -0.15], [0.15, 0.35], [0.62, -0.3]],
  [[-0.4, 0.3], [0.3, -0.25]],
  [[-0.6, -0.3], [0.05, 0.1], [0.6, 0.35]],
  [[-0.25, 0.25], [0.45, -0.2]],
];
/** Connections between consecutive tiers: [service on tier i, service on tier i + 1]. */
const LINKS: [number, number][][] = [
  [[0, 0], [1, 1], [2, 1]],
  [[0, 0], [0, 1], [1, 2]],
  [[0, 0], [1, 0], [2, 1]],
];

const CYCLE = 6;
const HOP = 0.75;
const MONO = '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

type State = { focus: string | null; current: string; previous: string | null; switchedAt: number };

const smooth = (x: number) => x * x * (3 - 2 * x);

export function SystemArchitecture({ projects }: { projects: Project[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const featured = projects.filter((p) => p.featured);
  const state = useRef<State>({ focus: null, current: featured[0]?.slug ?? '', previous: null, switchedAt: -10 });

  const invalidate = useScene(canvasRef, (f: Frame) => {
    const { ctx, w, h, t, enter } = f;
    const pal = palette();
    const dark = pal.dark;
    const s = state.current;
    if (!featured.length) return;

    // Which project: the focused one, else the cycle.
    const want = s.focus ?? featured[Math.floor(t / CYCLE) % featured.length].slug;
    if (want !== s.current) {
      s.previous = s.current;
      s.current = want;
      s.switchedAt = t;
    }
    const mix = f.reduced ? 1 : smooth(clamp((t - s.switchedAt) / 0.7, 0, 1));
    const byslug = (slug: string | null) => projects.find((p) => p.slug === slug);
    const now = byslug(s.current);
    const before = byslug(s.previous);
    const focused = s.focus !== null;

    const cam: Camera = {
      yaw: -0.55 + 0.16 * Math.sin(t * 0.08) + f.px * 0.15,
      pitch: 0.6 + f.py * 0.08 + f.scroll * 0.06,
      dist: 5.5,
      scale: Math.min(w * 0.235, h * 0.4) * (0.9 + 0.1 * enter),
      cx: w * 0.58,
      cy: h * 0.5,
    };
    const P = (p: Vec3) => project(view(p, cam), cam);
    const tierY = (i: number) => TIER_Y[i] + 0.03 * Math.sin(t * 0.7 + i * 1.3);
    const onTier = (i: number, [x, z]: [number, number]): Vec3 => [x * HALF_X, tierY(i), z * HALF_Z];

    // Request down (hops 0-2), response up (hops 3-5).
    const hopIndex = Math.floor(t / HOP) % 6;
    const hopT = smooth((t % HOP) / HOP);
    const downward = hopIndex < 3;
    const from = downward ? hopIndex : 5 - hopIndex + 1;
    const to = downward ? from + 1 : from - 1;
    const linkTier = Math.min(from, to);
    const reached = (i: number) => (i === to ? hopT : i === from ? 1 - hopT : 0);

    // Soft light behind the stack.
    const glow = ctx.createRadialGradient(cam.cx, cam.cy, 0, cam.cx, cam.cy, Math.min(w, h) * 0.6);
    glow.addColorStop(0, rgba(pal.glow, (dark ? 0.13 : 0.06) * enter));
    glow.addColorStop(1, rgba(pal.glow, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = pal.blend;

    const emphasis = focused ? 1.25 : 1;

    // Tiers, bottom (farthest down the page) first so upper planes draw over lower ones.
    for (let i = TIERS - 1; i >= 0; i--) {
      if (i / TIERS > enter + 0.1) continue;
      const active = reached(i);
      const corners = ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as [number, number][]).map((c) => P(onTier(i, c)));
      ctx.beginPath();
      corners.forEach((c, k) => (k ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y)));
      ctx.closePath();
      ctx.fillStyle = rgba(pal.glow, ((dark ? 0.05 : 0.035) + 0.06 * active) * enter);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(pal.line, ((dark ? 0.32 : 0.36) + 0.4 * active) * enter * emphasis);
      ctx.stroke();
      // Fine inner grid.
      ctx.beginPath();
      for (const g of [-0.33, 0.33]) {
        const a = P(onTier(i, [g, -1])), b = P(onTier(i, [g, 1]));
        const c = P(onTier(i, [-1, g])), d = P(onTier(i, [1, g]));
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(d.x, d.y);
      }
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = rgba(pal.line, (dark ? 0.1 : 0.12) * enter);
      ctx.stroke();

      // Links down to the next tier, with a slow ambient particle on each.
      if (i < TIERS - 1) {
        LINKS[i].forEach(([a, b], k) => {
          const A = onTier(i, SERVICES[i][a]), B = onTier(i + 1, SERVICES[i + 1][b]);
          const pa = P(A), pb = P(B);
          const live = i === linkTier;
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.lineWidth = live ? 1.1 : 0.7;
          ctx.strokeStyle = rgba(pal.line, ((dark ? 0.16 : 0.18) + (live ? 0.3 * Math.sin(Math.PI * hopT) : 0)) * enter * emphasis);
          ctx.stroke();
          const u = live ? (downward ? hopT : 1 - hopT) : ((t * 0.25 + k * 0.37 + i * 0.21) % 1);
          const x = pa.x + (pb.x - pa.x) * u, y = pa.y + (pb.y - pa.y) * u;
          const r = live ? 6 : 3;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, rgba(pal.dot, (live ? 0.95 : 0.35) * enter));
          g.addColorStop(1, rgba(pal.dot, 0));
          ctx.fillStyle = g;
          ctx.fillRect(x - r, y - r, r * 2, r * 2);
        });
      }

      // Services.
      SERVICES[i].forEach((pos, k) => {
        const q = P(onTier(i, pos));
        const pulse = active * (0.6 + 0.4 * Math.sin(t * 6 + k));
        if (pulse > 0.05) {
          const r = 12 * q.s;
          const halo = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
          halo.addColorStop(0, rgba(pal.glow, (dark ? 0.55 : 0.25) * pulse * enter));
          halo.addColorStop(1, rgba(pal.glow, 0));
          ctx.fillStyle = halo;
          ctx.fillRect(q.x - r, q.y - r, r * 2, r * 2);
        }
        ctx.fillStyle = rgba(pal.dot, (0.55 + 0.45 * active) * enter);
        ctx.beginPath();
        ctx.arc(q.x, q.y, 2.4 * q.s, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = rgba(pal.line, (0.35 + 0.4 * active) * enter);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(q.x, q.y, 5 * q.s, 0, Math.PI * 2);
        ctx.stroke();
      });
    }

    // Labels: the project's real layer names on the tiers, and the project's name. Cross-fade on switch.
    ctx.globalCompositeOperation = 'source-over';
    const size = f.compact ? 9 : 10;
    ctx.textBaseline = 'middle';
    const labelSet = (p: Project | undefined, alpha: number) => {
      if (!p || alpha < 0.02) return;
      ctx.font = `500 ${size}px ${MONO}`;
      for (let i = 0; i < TIERS; i++) {
        const name = p.architecture.layers[i]?.name;
        if (!name) continue;
        const corner = P(onTier(i, [-1, -1]));
        const left = P(onTier(i, [-1, 1]));
        const anchor = corner.x < left.x ? corner : left;
        const text = name.toUpperCase();
        const tw = ctx.measureText(text).width;
        const x = clamp(anchor.x - 12 - tw, 4, w - tw - 4);
        const y = clamp(anchor.y, 8, h - 8);
        ctx.fillStyle = rgba(pal.label, alpha * (0.5 + 0.45 * reached(i)) * enter);
        ctx.fillText(text, x, y);
      }
      // Project name under the stack (inside the faded edge, centred on it).
      ctx.font = `600 ${size + 1}px ${MONO}`;
      const title = `${p.name.toUpperCase()} — ARCHITECTURE`;
      const tw = ctx.measureText(title).width;
      ctx.fillStyle = rgba(pal.label, alpha * (focused ? 0.95 : 0.75) * enter);
      ctx.fillText(title, clamp(cam.cx - tw / 2, 4, w - tw - 4), h * 0.88);
    };
    labelSet(before, 1 - mix);
    labelSet(now, mix);
  });

  useEffect(
    () =>
      projectFocus.subscribe(() => {
        state.current.focus = projectFocus.get();
        invalidate.current();
      }),
    [invalidate],
  );

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />;
}

