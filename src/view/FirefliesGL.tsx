/**
 * TASK-048 — the fireflies actually fly.
 *
 * One transparent three.js canvas of GPU points: drift and blink live entirely in the vertex
 * shader, so after upload the CPU cost per frame is a single draw call. The canvas is decoration
 * and nothing else — `aria-hidden`, `pointer-events: none` — every light a hand or a screen
 * reader can reach stays a DOM button in `Forest.tsx`. That is what lets three.js back in
 * without re-fighting TASK-034's accessibility war or NFR-PORT-01: no WebGL, or a lost context,
 * simply hands the stage back to the CSS fireflies that shipped before.
 *
 * Positions are hash-seeded like everything else in the forest: normalised once, scaled to the
 * viewport in the shader, so a resize never reshuffles the swarm.
 *
 * R5: draws, decides nothing, writes nothing.
 */

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { ambientCount, hash } from './forestLayout';

const WARM = ['#ffb45e', '#ffd97a', '#ffca6e', '#9fc4ff'] as const;

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uDim;
  uniform vec2 uRes;
  uniform float uDpr;
  uniform vec2 uLean;
  uniform vec2 uTravel;
  attribute float aSeed;
  attribute float aSize;
  attribute float aDepth;
  attribute float aDrift;
  attribute vec3 aColor;
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec2 p = position.xy * uRes;

    // Each fly is on its own slow current across the meadow — WITHOUT this the wander below
    // is a leash: every firefly orbits one fixed point and the swarm reads as pinned. The
    // travel is wrapped before it is added, so precision holds however long the tab is open.
    p.x += mod(aDrift * uTime, uRes.x);

    // Hover, not fall: wide lazy figure-eights, with far less vertical travel than lateral.
    p.x += sin(uTime * 0.12 + aSeed * 17.0) * 26.0 + sin(uTime * 0.043 + aSeed * 31.0) * 40.0;
    p.y += cos(uTime * 0.10 + aSeed * 23.0) * 13.0 + sin(uTime * 0.05 + aSeed * 13.0) * 17.0;

    // A gust travelling left-to-right across the meadow, very slowly: every fly leans with it
    // as it passes. Change these constants together with hitTest's replica above.
    float gust = 0.5 + 0.5 * sin(uTime * 0.13 - p.x * 0.003 + aSeed * 0.6);
    gust = gust * gust;
    p.x += gust * 22.0;
    p.y -= gust * 6.0;

    // The swarm belongs to the terrain: the same lean-and-travel parallax the light layers
    // ride (LIGHT_PLANES rates), keyed by each fly's depth, so a drag carries the flies too.
    vec2 rate = vec2(44.0, 16.0) + aDepth * vec2(53.0, 16.0);
    p += -uLean * rate + uTravel * (0.85 + aDepth * 0.12);
    // The world is a ring and travel never ends: a fly that leaves one edge re-enters the
    // other, so the swarm is everywhere however far the night is dragged.
    p.x = mod(p.x, uRes.x);

    float blink = 0.25 + 0.75 * pow(0.5 + 0.5 * sin(uTime * (0.6 + aSeed) * 1.4 + aSeed * 40.0), 3.0);
    float bokeh = mix(1.0, 0.35, step(24.0, aSize));
    vAlpha = blink * bokeh * (1.0 - uDim * 0.75);
    vColor = mix(aColor, vec3(0.35, 0.40, 0.38), uDim);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 0.0, 1.0);
    gl_PointSize = aSize * uDpr;
  }
`;

const FRAGMENT = /* glsl */ `
  precision mediump float;
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float glow = smoothstep(0.5, 0.0, d);
    float core = smoothstep(0.16, 0.0, d);
    vec3 colour = vColor * glow + vec3(1.0, 0.97, 0.85) * core;
    gl_FragColor = vec4(colour, glow * vAlpha);
  }
`;

function swarm(count: number): {
  positions: Float32Array;
  seeds: Float32Array;
  sizes: Float32Array;
  depths: Float32Array;
  drifts: Float32Array;
  colours: Float32Array;
} {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const depths = new Float32Array(count);
  const drifts = new Float32Array(count);
  const colours = new Float32Array(count * 3);
  const tone = new THREE.Color();
  for (let i = 0; i < count; i += 1) {
    const key = `gl-fly-${i}`;
    positions[i * 3] = hash(`${key}:x`);
    // The swarm lives in the meadow, never over the mountains: the floor clears the horizon
    // seam (0.56) by the full upward reach of the wander and the gust above.
    positions[i * 3 + 1] = 0.605 + 0.38 * hash(`${key}:y`) ** 0.8;
    positions[i * 3 + 2] = 0;
    seeds[i] = hash(`${key}:seed`) * 6.28318;
    // Bigger than life on purpose (owner's ask): a firefly the size of a pixel is a dead star.
    sizes[i] = hash(`${key}:bokeh`) < 0.16 ? 26 + hash(`${key}:size`) * 16 : 9 + hash(`${key}:size`) * 11;
    depths[i] = Math.floor(hash(`${key}:plane`) * 3);
    // px per second across the meadow. Most go with the wind, a few against it; the nearer
    // the fly, the faster it crosses, which is parallax the eye reads without being told.
    drifts[i] =
      (hash(`${key}:against`) < 0.18 ? -1 : 1) *
      (16 + hash(`${key}:speed`) * 34) *
      (0.7 + depths[i] * 0.25);
    tone.set(WARM[Math.floor(hash(`${key}:tone`) * (hash(`${key}:blue`) < 0.12 ? WARM.length : WARM.length - 1))]);
    colours[i * 3] = tone.r;
    colours[i * 3 + 1] = tone.g;
    colours[i * 3 + 2] = tone.b;
  }
  return { positions, seeds, sizes, depths, drifts, colours };
}

interface FirefliesProps {
  torn: boolean;
  /** Pointer lean, centred on zero — the same value the parallax planes ride. */
  lean: { x: number; y: number };
  /** Accumulated drag travel in px, already clamped by the stage. */
  travel: { x: number; y: number };
  onLost: () => void;
}

/** The one question the swarm answers the view: is there a firefly under this point right now? */
export interface FirefliesHandle {
  hitTest(x: number, y: number): boolean;
}

interface SwarmWorld {
  uniforms: {
    uTime: { value: number };
    uRes: { value: THREE.Vector2 };
    uLean: { value: THREE.Vector2 };
    uTravel: { value: THREE.Vector2 };
  };
  positions: Float32Array;
  seeds: Float32Array;
  sizes: Float32Array;
  depths: Float32Array;
  drifts: Float32Array;
}

export const FirefliesGL = forwardRef<FirefliesHandle, FirefliesProps>(function FirefliesGL(
  { torn, lean, travel, onLost }: FirefliesProps,
  handle,
): JSX.Element {
  const holder = useRef<HTMLDivElement>(null);
  const dimUniform = useRef<{ value: number } | null>(null);
  const leanUniform = useRef<THREE.Vector2 | null>(null);
  const travelUniform = useRef<THREE.Vector2 | null>(null);
  const world = useRef<SwarmWorld | null>(null);

  // The same arithmetic the vertex shader runs, replayed on the CPU for one point — a hit-test
  // against a moving swarm has to move with it, drift, gust, parallax and all.
  useImperativeHandle(handle, () => ({
    hitTest(x: number, y: number): boolean {
      const w = world.current;
      if (!w) return false;
      const t = w.uniforms.uTime.value;
      const res = w.uniforms.uRes.value;
      const ln = w.uniforms.uLean.value;
      const tv = w.uniforms.uTravel.value;
      for (let i = 0; i < w.seeds.length; i += 1) {
        const seed = w.seeds[i];
        let fx = w.positions[i * 3] * res.x;
        let fy = w.positions[i * 3 + 1] * res.y;
        fx += ((w.drifts[i] * t) % res.x + res.x) % res.x;
        fx += Math.sin(t * 0.12 + seed * 17) * 26 + Math.sin(t * 0.043 + seed * 31) * 40;
        fy += Math.cos(t * 0.1 + seed * 23) * 13 + Math.sin(t * 0.05 + seed * 13) * 17;
        const g = 0.5 + 0.5 * Math.sin(t * 0.13 - fx * 0.003 + seed * 0.6);
        const gust = g * g;
        fx += gust * 22;
        fy -= gust * 6;
        const depth = w.depths[i];
        fx += -ln.x * (44 + depth * 53) + tv.x * (0.85 + depth * 0.12);
        fy += -ln.y * (16 + depth * 16) + tv.y * (0.85 + depth * 0.12);
        fx = ((fx % res.x) + res.x) % res.x;
        const r = w.sizes[i] * 0.5 + 8;
        if ((fx - x) ** 2 + (fy - y) ** 2 <= r * r) return true;
      }
      return false;
    },
  }), []);
  // The parent hands a fresh closure every render; going through a ref keeps the ONE renderer
  // effect below on empty-ish deps — rebuilding a WebGL context per pointer-move leaks contexts
  // until the browser starts killing them.
  const lostRef = useRef(onLost);
  lostRef.current = onLost;

  useEffect(() => {
    if (dimUniform.current) dimUniform.current.value = torn ? 1 : 0;
  }, [torn]);

  useEffect(() => {
    leanUniform.current?.set(lean.x, lean.y);
    travelUniform.current?.set(travel.x, travel.y);
  }, [lean.x, lean.y, travel.x, travel.y]);

  useEffect(() => {
    const host = holder.current;
    if (!host) return undefined;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
    } catch {
      lostRef.current();
      return undefined;
    }

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -1, 1);

    // A third of the CSS budget: on the GPU each point costs nothing, but a thousand of them
    // reads as noise where the approved canvas reads as a handful of drifting embers.
    const { positions, seeds, sizes, depths, drifts, colours } = swarm(
      Math.round(ambientCount(host.clientWidth || window.innerWidth) * 0.35),
    );
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aDepth', new THREE.BufferAttribute(depths, 1));
    geometry.setAttribute('aDrift', new THREE.BufferAttribute(drifts, 1));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colours, 3));

    const uniforms = {
      uTime: { value: 0 },
      uDim: { value: torn ? 1 : 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uDpr: { value: dpr },
      uLean: { value: new THREE.Vector2(0, 0) },
      uTravel: { value: new THREE.Vector2(0, 0) },
    };
    dimUniform.current = uniforms.uDim;
    leanUniform.current = uniforms.uLean.value;
    travelUniform.current = uniforms.uTravel.value;
    world.current = { uniforms, positions, seeds, sizes, depths, drifts };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(geometry, material));

    const fit = (): void => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      renderer.setSize(w, h);
      camera.right = w;
      camera.bottom = h;
      camera.updateProjectionMatrix();
      uniforms.uRes.value.set(w, h);
      if (still) renderer.render(scene, camera);
    };
    const watch = new ResizeObserver(fit);
    watch.observe(host);
    fit();

    const born = performance.now();
    const animate = (): void => {
      uniforms.uTime.value = (performance.now() - born) / 1000;
      renderer.render(scene, camera);
    };
    if (!still) renderer.setAnimationLoop(animate);
    else renderer.render(scene, camera);

    // A backgrounded phone tab loses its context; when it does, the CSS fireflies take over.
    const lost = (e: Event): void => {
      e.preventDefault();
      lostRef.current();
    };
    renderer.domElement.addEventListener('webglcontextlost', lost);

    const onVisibility = (): void => {
      if (still) return;
      renderer.setAnimationLoop(document.hidden ? null : animate);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      watch.disconnect();
      renderer.setAnimationLoop(null);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      host.removeChild(renderer.domElement);
      dimUniform.current = null;
      leanUniform.current = null;
      travelUniform.current = null;
      world.current = null;
    };
    // Mounts exactly once: torn rides its own effect through dimUniform, onLost through lostRef.
  }, []);

  return <div ref={holder} className="forest-gl" aria-hidden="true" />;
});
