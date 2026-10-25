'use client';

import { useEffect, useRef } from 'react';

/*
 * "Inflated glass" lettering without Three.js.
 *
 * 1. The word is drawn into an offscreen canvas and turned into a height field with an
 *    exact Euclidean distance transform (Felzenszwalb & Huttenlocher), shaped by a
 *    quarter-circle profile so every stroke puffs up like a balloon.
 * 2. Normals are computed once on the CPU in float precision and uploaded as an RGBA8
 *    texture (alpha = antialiased coverage). Works on WebGL1, no extensions needed.
 * 3. A fragment shader lights it: Fresnel rim, two studio softbox reflections, a fake
 *    "transmitted" background with RGB-split refraction (chromatic aberration), and a
 *    roughness control. This is a stylised simulation of glass, not physically based
 *    transmission.
 *
 * Render on demand only: a frame is drawn when the tilt changes or the canvas resizes,
 * never in a continuous loop. Pointer tilt runs only for fine pointers while visible.
 */

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAGMENT = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uMap;
uniform vec2 uTilt;
uniform float uRoughness;
uniform vec3 uBackA;
uniform vec3 uBackB;
uniform vec3 uTint;
uniform vec3 uSkyLow;
uniform vec3 uSkyHigh;

vec3 studio(vec3 r) {
  // Procedural environment: floor-to-ceiling gradient plus two soft rectangular lights.
  float sky = smoothstep(-0.4, 0.9, r.y);
  vec3 col = mix(uSkyLow, uSkyHigh, sky);
  float soft = 0.08 + uRoughness * 0.25;
  float boxA = smoothstep(soft, 0.0, abs(r.x + 0.45) - 0.18) * smoothstep(soft, 0.0, abs(r.y - 0.55) - 0.22);
  float boxB = smoothstep(soft, 0.0, abs(r.x - 0.55) - 0.1) * smoothstep(soft, 0.0, abs(r.y - 0.15) - 0.35);
  col += vec3(1.0) * boxA * 1.6 + vec3(0.8, 0.85, 1.0) * boxB * 0.9;
  return col;
}

vec3 behind(vec2 uv) {
  // What the "glass" refracts: a gradient matched to the hero backdrop, with soft bands.
  vec3 base = mix(uBackA, uBackB, uv.y);
  return base + 0.06 * sin(uv.x * 18.0 + uv.y * 6.0);
}

void main() {
  vec4 map = texture2D(uMap, vUv);
  float coverage = map.a;
  if (coverage < 0.01) discard;

  vec3 n = normalize(map.rgb * 2.0 - 1.0);
  n = normalize(vec3(n.xy + uTilt * 0.35, n.z));
  vec3 v = vec3(0.0, 0.0, 1.0);
  float ndv = max(dot(n, v), 0.0);
  float fresnel = 0.04 + 0.96 * pow(1.0 - ndv, 3.0);

  vec3 reflected = studio(reflect(-v, n));

  // Chromatic refraction: each channel bends a little differently.
  vec2 bend = n.xy * 0.09;
  vec3 transmitted = vec3(
    behind(vUv - bend * 0.94).r,
    behind(vUv - bend * 1.00).g,
    behind(vUv - bend * 1.07).b
  );
  vec3 body = transmitted * uTint * mix(0.75, 1.15, n.z);

  vec3 light = normalize(vec3(-0.45 - uTilt.x * 0.6, 0.6 + uTilt.y * 0.6, 0.8));
  vec3 h = normalize(light + v);
  float shininess = mix(140.0, 24.0, uRoughness);
  float spec = pow(max(dot(n, h), 0.0), shininess) * 1.4;
  float rim = pow(1.0 - ndv, 6.0) * 0.6;

  vec3 color = mix(body, reflected, fresnel) + spec + rim * vec3(0.75, 0.7, 1.0);
  float alpha = coverage * mix(0.82, 1.0, fresnel);
  gl_FragColor = vec4(color * alpha, alpha);
}`;

/** 1D squared Euclidean distance transform (Felzenszwalb & Huttenlocher). */
function edt1d(f: Float32Array, n: number, d: Float32Array, v: Int32Array, z: Float32Array) {
  let k = 0;
  v[0] = 0;
  z[0] = -Infinity;
  z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
}

/** Builds the RGBA normal map (alpha = coverage) for `word` at w×h texels. */
function buildNormalMap(word: string, w: number, h: number, fontFamily: string) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  let size = h * 0.78;
  ctx.font = `800 ${size}px ${fontFamily}`;
  const width = ctx.measureText(word).width;
  if (width > w * 0.9) size *= (w * 0.9) / width;
  ctx.font = `800 ${size}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(word, w / 2, h * 0.53);
  const pixels = ctx.getImageData(0, 0, w, h).data;

  // Distance from each inside pixel to the nearest outside pixel.
  const INF = 1e20;
  const grid = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) grid[i] = pixels[i * 4 + 3] > 127 ? INF : 0;
  const longest = Math.max(w, h);
  const f = new Float32Array(longest);
  const d = new Float32Array(longest);
  const v = new Int32Array(longest);
  const z = new Float32Array(longest + 1);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = grid[y * w + x];
    edt1d(f, h, d, v, z);
    for (let y = 0; y < h; y++) grid[y * w + x] = d[y];
  }
  let maxDist = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = grid[y * w + x];
    edt1d(f, w, d, v, z);
    for (let x = 0; x < w; x++) {
      const dist = Math.sqrt(d[x]);
      grid[y * w + x] = dist;
      if (dist > maxDist) maxDist = dist;
    }
  }

  // Quarter-circle profile: rounded, balloon-like strokes.
  const radius = Math.max(1, maxDist * 0.95);
  const height = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const t = Math.min(grid[i] / radius, 1);
    height[i] = Math.sqrt(1 - (1 - t) * (1 - t)) * radius;
  }

  const out = new Uint8Array(w * h * 4);
  const at = (x: number, y: number) => height[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 0.5;
      // Canvas rows go down; texture v goes up after the flip below, so invert dy.
      const dy = (at(x, y - 1) - at(x, y + 1)) * 0.5;
      const len = Math.hypot(dx, dy, 1);
      const o = ((h - 1 - y) * w + x) * 4; // flip vertically for WebGL
      out[o] = ((-dx / len) * 0.5 + 0.5) * 255;
      out[o + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      out[o + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      out[o + 3] = pixels[(y * w + x) * 4 + 3];
    }
  }
  return out;
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'shader');
  return shader;
}

type Props = { word: string; roughness?: number; className?: string };

export function InflatedWord({ word, roughness = 0.25, className = '' }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = wrap.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: true, alpha: true });
    if (!gl) return; // No WebGL: the CSS fallback simply stays.

    let disposed = false;
    let frame = 0;
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const program = gl.createProgram()!;
    try {
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    } catch {
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const uTilt = gl.getUniformLocation(program, 'uTilt');
    const uRoughness = gl.getUniformLocation(program, 'uRoughness');
    gl.uniform1f(uRoughness, roughness);

    // Theme colours come from CSS tokens (--glass-*), re-read whenever <html class> changes.
    const palette = () => {
      const style = getComputedStyle(host);
      const read = (name: string) => style.getPropertyValue(name).trim().split(/\s+/).map(Number);
      const set = (uniform: string, token: string) => {
        const [r = 0, g = 0, b = 0] = read(token);
        gl.uniform3f(gl.getUniformLocation(program, uniform), r, g, b);
      };
      set('uBackA', '--glass-back-a');
      set('uBackB', '--glass-back-b');
      set('uTint', '--glass-tint');
      set('uSkyLow', '--glass-sky-low');
      set('uSkyHigh', '--glass-sky-high');
    };
    palette();
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const texture = gl.createTexture();
    let ready = false;

    const draw = () => {
      if (!ready) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uTilt, tilt.x, tilt.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = host.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      draw();
    };

    // Build the texture off the critical path: after fonts load, in idle time.
    const build = async () => {
      const family = getComputedStyle(host).fontFamily || 'sans-serif';
      try {
        await document.fonts.load(`800 120px ${family}`);
      } catch {
        // Fall back to whatever font is available.
      }
      if (disposed) return;
      const small = window.innerWidth < 768;
      const w = small ? 720 : 1200;
      const h = Math.round(w * 0.36);
      const pixels = buildNormalMap(word, w, h, family);
      if (disposed) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      ready = true;
      resize();
      host.dataset.ready = 'true'; // CSS crossfades from the fallback to the canvas
    };
    // The texture build (a distance transform over the whole word) is a long CPU task, so it
    // waits until the page has loaded and the main thread is idle; the CSS lettering shows
    // until then, exactly as it does without WebGL.
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const schedule = () => {
      if (disposed) return;
      if (idle) idle(() => void build(), { timeout: 2000 });
      else window.setTimeout(() => void build(), 200);
    };
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });

    // Pointer tilt: lerp toward the target, render only while it is still moving.
    const tick = () => {
      tilt.x += (tilt.tx - tilt.x) * 0.1;
      tilt.y += (tilt.ty - tilt.y) * 0.1;
      host.style.setProperty('--tilt-x', tilt.x.toFixed(4));
      host.style.setProperty('--tilt-y', tilt.y.toFixed(4));
      draw();
      frame = Math.abs(tilt.tx - tilt.x) + Math.abs(tilt.ty - tilt.y) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    let visible = true;
    const onMove = (event: PointerEvent) => {
      if (!visible) return;
      const rect = host.getBoundingClientRect();
      tilt.tx = Math.max(-1, Math.min(1, (event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2)));
      tilt.ty = Math.max(-1, Math.min(1, -(event.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2)));
      if (!frame) frame = requestAnimationFrame(tick);
    };
    if (fine && !reduced) window.addEventListener('pointermove', onMove, { passive: true });

    // Resize on the next frame, not inside the observer callback: changing the canvas size
    // there re-triggers layout and raises "ResizeObserver loop completed with undelivered notifications".
    let resizeFrame = 0;
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(resize);
    });
    resizeObserver.observe(host);
    const viewObserver = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
    });
    viewObserver.observe(host);

    const onLost = (event: Event) => {
      event.preventDefault();
      ready = false;
      delete host.dataset.ready; // show the CSS fallback again
    };
    canvas.addEventListener('webglcontextlost', onLost);

    const themeObserver = new MutationObserver(() => {
      palette();
      draw();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      disposed = true;
      cancelAnimationFrame(resizeFrame);
      window.removeEventListener('load', schedule);
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('webglcontextlost', onLost);
      resizeObserver.disconnect();
      viewObserver.disconnect();
      themeObserver.disconnect();
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [word, roughness]);

  return (
    <div ref={wrap} aria-hidden="true" className={`inflated-word ${className}`}>
      {/* CSS fallback: visible until WebGL is ready, and permanently without WebGL. */}
      <span className="inflated-fallback">{word}</span>
      <canvas ref={canvasRef} className="inflated-canvas" />
    </div>
  );
}
