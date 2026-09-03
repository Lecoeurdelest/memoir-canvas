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

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ambientCount, hash } from './forestLayout';

const WARM = ['#ffb45e', '#ffd97a', '#ffca6e', '#9fc4ff'] as const;

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uDim;
  uniform vec2 uRes;
  uniform float uDpr;
  attribute float aSeed;
  attribute float aSize;
  attribute vec3 aColor;
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec2 p = position.xy * uRes;
    p.x += sin(uTime * 0.12 + aSeed * 17.0) * 26.0 + sin(uTime * 0.043 + aSeed * 31.0) * 40.0;
    p.y += cos(uTime * 0.10 + aSeed * 23.0) * 18.0 + sin(uTime * 0.037 + aSeed * 13.0) * 28.0;

    float blink = 0.25 + 0.75 * pow(0.5 + 0.5 * sin(uTime * (0.6 + aSeed) * 1.4 + aSeed * 40.0), 3.0);
    float bokeh = mix(1.0, 0.35, step(18.0, aSize));
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

function swarm(count: number): { positions: Float32Array; seeds: Float32Array; sizes: Float32Array; colours: Float32Array } {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const colours = new Float32Array(count * 3);
  const tone = new THREE.Color();
  for (let i = 0; i < count; i += 1) {
    const key = `gl-fly-${i}`;
    positions[i * 3] = hash(`${key}:x`);
    // The swarm lives in the meadow: below the horizon seam, denser toward the ground.
    positions[i * 3 + 1] = 0.57 + 0.41 * hash(`${key}:y`) ** 0.8;
    positions[i * 3 + 2] = 0;
    seeds[i] = hash(`${key}:seed`) * 6.28318;
    sizes[i] = hash(`${key}:bokeh`) < 0.16 ? 18 + hash(`${key}:size`) * 12 : 5 + hash(`${key}:size`) * 8;
    tone.set(WARM[Math.floor(hash(`${key}:tone`) * (hash(`${key}:blue`) < 0.12 ? WARM.length : WARM.length - 1))]);
    colours[i * 3] = tone.r;
    colours[i * 3 + 1] = tone.g;
    colours[i * 3 + 2] = tone.b;
  }
  return { positions, seeds, sizes, colours };
}

export function FirefliesGL({ torn, onLost }: { torn: boolean; onLost: () => void }): JSX.Element {
  const holder = useRef<HTMLDivElement>(null);
  const dimUniform = useRef<{ value: number } | null>(null);
  // The parent hands a fresh closure every render; going through a ref keeps the ONE renderer
  // effect below on empty-ish deps — rebuilding a WebGL context per pointer-move leaks contexts
  // until the browser starts killing them.
  const lostRef = useRef(onLost);
  lostRef.current = onLost;

  useEffect(() => {
    if (dimUniform.current) dimUniform.current.value = torn ? 1 : 0;
  }, [torn]);

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
    const { positions, seeds, sizes, colours } = swarm(
      Math.round(ambientCount(host.clientWidth || window.innerWidth) * 0.35),
    );
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colours, 3));

    const uniforms = {
      uTime: { value: 0 },
      uDim: { value: torn ? 1 : 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uDpr: { value: dpr },
    };
    dimUniform.current = uniforms.uDim;

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
    };
    // Mounts exactly once: torn rides its own effect through dimUniform, onLost through lostRef.
  }, []);

  return <div ref={holder} className="forest-gl" aria-hidden="true" />;
}
