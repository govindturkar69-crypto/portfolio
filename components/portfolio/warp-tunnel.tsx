'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';
import { portfolioConfig } from '@/lib/portfolio-config';

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Star = { x: number; y: number; z: number; pz: number };

const DEPTH = 1600;

/**
 * Hyperspace warp: a 2D-canvas starfield (no WebGL needed) inside a CSS sticky stage.
 *
 * Scroll never gets hijacked: ScrollTrigger only reports progress and velocity. Star
 * speed follows scroll velocity (streaks stretch while you scroll, relax when you stop),
 * and each statement flies toward the viewer across its third of the section.
 *
 * Cost control: the loop runs only while the stage is on screen and the tab is visible,
 * DPR is capped at 1.5, and star count drops on smaller screens. Phones and reduced
 * motion get a normal-height section with the statements stacked and one static frame.
 */
export function WarpTunnel() {
  const root = useRef<HTMLElement>(null);
  const { statements, stars: starCount } = portfolioConfig.warp;

  useGSAP(
    () => {
      const section = root.current;
      const canvas = section?.querySelector<HTMLCanvasElement>('canvas');
      const ctx = canvas?.getContext('2d');
      if (!section || !canvas || !ctx) return;
      const lines = gsap.utils.toArray<HTMLElement>('[data-statement]', section);

      const stars: Star[] = [];
      let width = 0;
      let height = 0;
      const seed = (star: Star, far = false) => {
        star.x = (Math.random() - 0.5) * 2 * width;
        star.y = (Math.random() - 0.5) * 2 * height;
        star.z = far ? DEPTH : Math.random() * DEPTH;
        star.pz = star.z;
      };
      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const rect = canvas.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.round(starCount * Math.min(1, (width * height) / (1440 * 900)));
        stars.length = 0;
        for (let i = 0; i < Math.max(count, 120); i++) {
          const star = { x: 0, y: 0, z: 0, pz: 0 };
          seed(star);
          stars.push(star);
        }
      };

      // Star colour follows the theme: the section's own text colour (--color-fg), read
      // again whenever <html class> changes. Paper gets ink streaks at a lower peak alpha.
      const ink = { rgb: '20 19 17', min: 0.16, max: 0.5 };
      const readInk = () => {
        const [r = 20, g = 19, b = 17] = (getComputedStyle(section).color.match(/[\d.]+/g) ?? []).map(Number);
        const dark = document.documentElement.classList.contains('dark');
        ink.rgb = `${r} ${g} ${b}`;
        ink.min = dark ? 0.22 : 0.16;
        ink.max = dark ? 0.85 : 0.5;
      };
      readInk();

      const draw = (speed: number) => {
        const cx = width / 2;
        const cy = height / 2;
        const fov = Math.min(width, height) * 0.9;
        // Fade the previous frame toward transparent (not toward a colour), so short motion
        // trails work on any background and the page colour shows through in both themes.
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgb(0 0 0 / 0.42)';
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineCap = 'round';
        for (const star of stars) {
          star.pz = star.z;
          star.z -= speed;
          if (star.z < 1) {
            seed(star, true);
            continue;
          }
          const sx = cx + (star.x / star.z) * fov;
          const sy = cy + (star.y / star.z) * fov;
          const px = cx + (star.x / star.pz) * fov;
          const py = cy + (star.y / star.pz) * fov;
          if (sx < -50 || sx > width + 50 || sy < -50 || sy > height + 50) {
            seed(star, true);
            continue;
          }
          const near = 1 - star.z / DEPTH;
          ctx.strokeStyle = `rgb(${ink.rgb} / ${(ink.min + near * (ink.max - ink.min)).toFixed(3)})`;
          ctx.lineWidth = 0.6 + near * 2.2;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        }
      };

      const place = (progress: number) => {
        const n = lines.length;
        lines.forEach((line, i) => {
          // Local time for this statement: 0 → 1 across its slice of the section.
          const t = gsap.utils.clamp(0, 1, progress * n - i);
          const fade = t < 0.5 ? gsap.utils.clamp(0, 1, t * 4 - 0.4) : gsap.utils.clamp(0, 1, (1 - t) * 4 - 0.4);
          // A gentle push-in (0.9 → 1.1) instead of a large zoom: the words drift toward
          // the viewer rather than punching through the frame.
          const scale = 0.9 + t * 0.2;
          line.style.opacity = String(fade); // the last line fades too, so the tunnel dissolves into the footer
          line.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(3)})`;
          line.style.filter = fade < 1 ? `blur(${((1 - fade) * 3).toFixed(1)}px)` : 'none';
        });
      };

      const mm = gsap.matchMedia();
      mm.add({ cinematic: '(min-width: 768px) and (prefers-reduced-motion: no-preference)', calm: '(max-width: 767px), (prefers-reduced-motion: reduce)' }, (context) => {
        // The tall sticky layout exists only once JS is driving it; server HTML is the calm one.
        if (context.conditions?.cinematic) section.dataset.live = 'true';
        resize();
        if (context.conditions?.calm) {
          // Static: one long-exposure frame behind stacked statements; redrawn on resize and theme change.
          const still = () => {
            ctx.clearRect(0, 0, width, height);
            for (let i = 0; i < 6; i++) draw(14);
          };
          still();
          const onResize = () => {
            resize();
            still();
          };
          const themeObserver = new MutationObserver(() => {
            readInk();
            still();
          });
          themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
          window.addEventListener('resize', onResize);
          return () => {
            window.removeEventListener('resize', onResize);
            themeObserver.disconnect();
          };
        }

        let velocity = 0;
        let speed = 2;
        let visible = false;
        let frame = 0;
        const loop = () => {
          // Ease toward a speed set by scroll velocity; idle drift keeps it alive.
          velocity *= 0.92;
          speed += (2 + Math.min(Math.abs(velocity) / 55, 46) - speed) * 0.08;
          draw(speed);
          frame = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
        };
        const start = () => {
          if (!frame && visible && !document.hidden) frame = requestAnimationFrame(loop);
        };

        place(0);
        const trigger = ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => {
            velocity = self.getVelocity();
            place(self.progress);
            start();
          },
        });
        // A little wider than the stage so the loop is warm before it scrolls in.
        const viewObserver = new IntersectionObserver(
          (entries) => {
            visible = entries.some((entry) => entry.isIntersecting);
            start();
          },
          { rootMargin: '100px' },
        );
        viewObserver.observe(section);
        const onVisibility = () => start();
        document.addEventListener('visibilitychange', onVisibility);
        const resizeObserver = new ResizeObserver(() => resize());
        resizeObserver.observe(canvas);
        const themeObserver = new MutationObserver(readInk);
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => {
          cancelAnimationFrame(frame);
          trigger.kill();
          themeObserver.disconnect();
          viewObserver.disconnect();
          resizeObserver.disconnect();
          document.removeEventListener('visibilitychange', onVisibility);
          lines.forEach((line) => line.removeAttribute('style'));
          delete section.dataset.live;
        };
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="warp" aria-labelledby="warp-title" className="warp">
      <div className="warp-stage">
        <canvas aria-hidden="true" className="warp-canvas" />
        <h2 id="warp-title" className="sr-only">
          How I work
        </h2>
        <ol className="warp-lines">
          {statements.map((statement) => (
            <li key={statement} data-statement className="warp-line">
              {statement}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
