/**
 * TASK-048 — the approved meadow, painted, and then joined into a ring.
 *
 * The world is SCENE_COUNT scenes of the same night, laid side by side into one continuous
 * strip per parallax layer: sky (far), meadow (ground), foreground (near). Every strip closes
 * its own loop — ridges and hills end exactly where they began, and a `<use>` clone of the
 * whole layer sits one loop to the right — so a horizontal pan can wrap forever without a
 * visible seam. Each scene keeps the shared style but its own character: the moon scene, the
 * left grove, the flower field, the heavy canopy, the lone giant pine.
 *
 * Deterministic (hash-seeded) as ever: a re-render never reshuffles a blade. Height is a fixed
 * 900-unit design space; scene width follows the stage's aspect. Wind is CSS (`fa-*` classes),
 * staggered by x so gusts travel. All of it is `aria-hidden` scenery.
 *
 * Element ids are prefixed per layer because SVG ids are global to the document.
 *
 * R5: paints, decides nothing.
 */

import { useMemo } from 'react';
import { SCENE_COUNT, hash } from './forestLayout';

export const H = 900;
const HY = Math.round(H * 0.56);

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const px = (n: number): number => Number(n.toFixed(1));
const pickOf = (rand: () => number, xs: readonly string[]): string =>
  xs[Math.floor(rand() * xs.length)];

/**
 * The design-space width of ONE scene follows the stage's aspect so each scene is composed for
 * the screen it is on; the world is SCENE_COUNT of these.
 */
export function designWidth(aspect: number): number {
  return Math.round(clamp(H * aspect, 1150, 3600));
}

/**
 * Where the moon hangs, in the strip's design units — scene 0 only, since that is the scene
 * that carries it. `Forest.tsx` puts the door to the machinery here (TASK-048).
 */
export function moonAt(aspect: number): { x: number; y: number; r: number } {
  return { x: designWidth(aspect) * 0.67, y: HY * 0.3, r: H * 0.072 };
}

/** A per-call deterministic stream over the shared hash. */
function stream(seed: string): () => number {
  let i = 0;
  return () => hash(`${seed}:${(i += 1)}`);
}

interface Palette {
  /** Mountain wash, peak → base: the three stops of one continuous gradient. */
  mtn: [string, string, string];
  /** The foothill ridge's deepest tone — the wash keeps darkening into it. */
  foot: string;
  /** The mist that melts the mountain bases into the horizon glow. */
  haze: string;
  pine: string;
  hills: [string, string, string];
  crest: string;
  lit: string[];
  midG: string[];
  dark: string[];
  cloudBody: string;
  cloudRim: string;
  flowerCols: string[];
  nebula: number;
  stars: number;
}

const NIGHT: Palette = {
  mtn: ['#6b8fbc', '#31517c', '#152e52'],
  foot: '#081527',
  haze: '#63b4dd',
  pine: '#020c18',
  hills: ['#123f2d', '#0c2f21', '#07231a'],
  crest: '#8fd4b8',
  lit: ['#4fae7e', '#3d9a70', '#5fc48d'],
  midG: ['#1d5c41', '#14472f'],
  dark: ['#072016', '#08231a', '#051810'],
  cloudBody: '#091a38',
  cloudRim: 'rgba(110,155,215,0.5)',
  flowerCols: ['#5f8ef0', '#7fa8ff', '#4a75e8', '#8fb6ff'],
  nebula: 0.9,
  stars: 1.15,
};

/** The wood while the archive argues with itself: grey, quiet, waiting for a person. */
const TORN: Palette = {
  mtn: ['#2a343d', '#1b232b', '#10161c'],
  foot: '#080e14',
  haze: '#3a4a52',
  pine: '#04080d',
  hills: ['#18231b', '#101913', '#0a110d'],
  crest: '#3d4a42',
  lit: ['#3d4a42'],
  midG: ['#242e28', '#2b362f'],
  dark: ['#101613', '#0b100d'],
  cloudBody: '#0a1119',
  cloudRim: 'rgba(46,62,78,0.35)',
  flowerCols: ['#3a4456', '#2e3745'],
  nebula: 0,
  stars: 0.3,
};

/** Each scene of the ring keeps the style but carries its own furniture. */
interface SceneSpec {
  moon: boolean;
  nebula: boolean;
  canopy: boolean;
  /** Foreground pines as [xFrac, topYFrac, hFrac, widthScale] within the scene. */
  pines: [number, number, number, number][];
  /** Small ridge-line pines as [xFrac, yDropFrac, hFrac]. */
  midPines: [number, number, number][];
  /** Flower density multiplier — the flower-field scene turns it up. */
  flowers: number;
}

const SCENES: SceneSpec[] = [
  {
    moon: true, nebula: true, canopy: true, flowers: 1,
    pines: [[0.05, 0.04, 0.64, 1.05], [0.14, 0.1, 0.58, 1], [0.865, 0.02, 0.72, 1.2], [0.78, 0.24, 0.44, 0.73], [0.945, -0.02, 0.78, 1.15]],
    midPines: [[0.31, 0.01, 0.14], [0.655, 0.03, 0.11]],
  },
  {
    moon: false, nebula: false, canopy: false, flowers: 0.5,
    pines: [[0.06, 0.02, 0.7, 1.1], [0.15, 0.14, 0.54, 0.85], [0.24, 0.38, 0.4, 0.62], [0.9, 0.28, 0.44, 0.72]],
    midPines: [[0.74, 0.02, 0.12]],
  },
  {
    moon: false, nebula: true, canopy: false, flowers: 2.4,
    pines: [[0.93, 0.12, 0.6, 1]],
    midPines: [[0.2, 0.02, 0.1], [0.5, 0.04, 0.09], [0.8, 0.02, 0.11]],
  },
  {
    moon: false, nebula: false, canopy: true, flowers: 0.9,
    pines: [[0.08, 0.28, 0.44, 0.7], [0.83, 0.06, 0.66, 1.1], [0.93, 0.22, 0.5, 0.8]],
    midPines: [[0.42, 0.03, 0.12]],
  },
  {
    moon: false, nebula: false, canopy: false, flowers: 1.3,
    pines: [[0.4, 0.06, 0.66, 1.35]],
    midPines: [[0.12, 0.02, 0.11], [0.86, 0.03, 0.1]],
  },
];

/** Densely overlapped drooping-triangle tiers — the fir silhouette from the approved canvas. */
function pinePaths(rand: () => number, cx: number, topY: number, h: number, w: number, tiers: number): string {
  const parts: string[] = [];
  const n = tiers * 2;
  const span = h * 0.8;
  for (let i = 0; i < n; i += 1) {
    const t = n === 1 ? 1 : i / (n - 1);
    const ty = topY + span * t ** 1.06;
    const half = (w / 2) * (0.12 + 0.88 * t) * (0.86 + rand() * 0.26);
    const drop = (span / (n - 1)) * (2.0 + rand() * 0.5);
    const jx = cx + (rand() - 0.5) * w * 0.04;
    const dipL = ty + drop * (0.92 + rand() * 0.3);
    const dipR = ty + drop * (0.92 + rand() * 0.3);
    parts.push(
      `M${px(jx)} ${px(ty)}` +
        ` Q${px(jx - half * 0.55)} ${px(ty + drop * 0.5)} ${px(jx - half)} ${px(dipL)}` +
        ` Q${px(jx - half * 0.4)} ${px(ty + drop * 0.66)} ${px(jx)} ${px(ty + drop * 0.74)}` +
        ` Q${px(jx + half * 0.4)} ${px(ty + drop * 0.66)} ${px(jx + half)} ${px(dipR)}` +
        ` Q${px(jx + half * 0.55)} ${px(ty + drop * 0.5)} ${px(jx)} ${px(ty)} Z`,
    );
  }
  const tw = Math.max(1.6, w * 0.035);
  parts.push(
    `M${px(cx - tw * 0.6)} ${px(topY + h * 0.2)} L${px(cx - tw)} ${px(topY + h * 1.04)}` +
      ` L${px(cx + tw)} ${px(topY + h * 1.04)} L${px(cx + tw * 0.6)} ${px(topY + h * 0.2)} Z`,
  );
  return parts.join(' ');
}

/** Rim-lit anime cumulus: one thin lit crescent over a flat dark body. */
function cloud(rand: () => number, cx: number, cy: number, w: number, h: number, body: string, rim: string): string {
  const puffs: { x: number; y: number; r: number }[] = [];
  const n = 6 + Math.floor(rand() * 4);
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    const pr = h * (0.5 + rand() * 0.3) * (1 - Math.abs(t - 0.5) * 0.6);
    puffs.push({
      x: cx - w / 2 + w * t + (rand() - 0.5) * w * 0.06,
      y: cy - pr * 0.24 + (rand() - 0.5) * h * 0.18,
      r: pr,
    });
  }
  const rimC = puffs.map((p) => `<circle cx="${px(p.x)}" cy="${px(p.y - p.r * 0.09)}" r="${px(p.r)}"/>`).join('');
  const bodyC = puffs
    .map((p) => `<circle cx="${px(p.x)}" cy="${px(p.y)}" r="${px(p.r)}"/><circle cx="${px(p.x)}" cy="${px(p.y + p.r * 0.5)}" r="${px(p.r * 0.85)}"/>`)
    .join('');
  return `<g><g fill="${rim}" opacity="0.6">${rimC}</g><g fill="${body}">${bodyC}</g></g>`;
}

/**
 * A mountain/hill ridge across the whole strip. `sceneW` shapes the envelope so EVERY scene
 * keeps its open middle, and the walk is forced to land exactly back on the horizon at the far
 * end — that landing is what closes the loop.
 */
function ridge(
  rand: () => number,
  totalW: number,
  sceneW: number,
  hMax: number,
  baseY: number,
  segW: number,
  sharp: boolean,
  envFloor: number,
): string {
  let d = `M-20 ${px(baseY + 10)} L-20 ${px(baseY)}`;
  let x = -20;
  while (x < totalW - segW * 0.5) {
    const step = segW * (0.7 + rand() * 0.6);
    const nx = Math.min(x + step, totalW);
    const mid = (x + nx) / 2;
    const local = ((mid % sceneW) + sceneW) % sceneW;
    const edge = Math.abs(local - sceneW / 2) / (sceneW / 2);
    const env = Math.max(envFloor, 1 - 0.78 * (1 - edge ** 1.5));
    const peakY = baseY - hMax * env * (0.45 + rand() * 0.55);
    const valleyY = baseY - hMax * env * rand() * 0.08;
    d += sharp
      ? ` L${px(mid + (rand() - 0.5) * step * 0.2)} ${px(peakY)} L${px(nx)} ${px(valleyY)}`
      : ` Q${px(mid)} ${px(peakY)} ${px(nx)} ${px(valleyY)}`;
    x = nx;
  }
  d += ` L${px(totalW)} ${px(baseY)}`;
  return `${d} L${px(totalW)} ${px(baseY + 10)} Z`;
}

/** A rolling meadow ridge across the strip whose last point IS its first — a closed loop. */
function hill(rand: () => number, totalW: number, yBase: number, amp: number, fill: string, crest: string, prefix: string): string {
  const n = Math.max(6, Math.round(totalW / 260));
  const ys = Array.from({ length: n + 1 }, () => yBase + (rand() - 0.5) * amp * 2);
  ys[n] = ys[0];
  let edge = `M-20 ${px(ys[0])}`;
  for (let i = 0; i < n; i += 1) {
    const x0 = (totalW / n) * i;
    const x1 = (totalW / n) * (i + 1);
    edge += ` Q${px(x0 + (x1 - x0) * 0.5)} ${px(ys[i] + (rand() - 0.5) * amp)} ${px(x1)} ${px(ys[i + 1])}`;
  }
  return (
    `<path d="${edge}" fill="none" stroke="${crest}" stroke-width="${px(amp * 0.9 + 8)}" opacity="0.16" filter="url(#${prefix}-blur8)"/>` +
    `<path d="${edge} L${px(totalW + 20)} ${H + 20} L-20 ${H + 20} Z" fill="${fill}" opacity="0.85" filter="url(#${prefix}-blur2)"/>`
  );
}

/** Clumped, wind-swayed grass blades, coloured by each scene's own glow centre. */
function tufts(
  rand: () => number,
  o: { totalW: number; sceneW: number; clumps: number; bladesPer: number; y0: number; y1: number; lenMin: number; lenMax: number; lit: string[]; midG: string[]; dark: string[]; widthScale: number },
): string {
  const out: string[] = [];
  for (let c = 0; c < o.clumps; c += 1) {
    const rx = lerp(-10, o.totalW + 10, rand());
    const ry = lerp(o.y0, o.y1, rand() ** 0.85);
    const lean = (rand() - 0.5) * 0.9;
    const depth = clamp((ry - o.y0) / Math.max(1, o.y1 - o.y0), 0, 1);
    const local = ((rx % o.sceneW) + o.sceneW) % o.sceneW;
    const glow = clamp(1 - Math.abs(local - o.sceneW / 2) / (o.sceneW * 0.56), 0, 1) * (1 - depth * 0.8);
    const n = Math.round(o.bladesPer * (0.6 + rand() * 0.8));
    const blades: string[] = [];
    for (let i = 0; i < n; i += 1) {
      const bx = rx + (rand() - 0.5) * o.lenMax * 1.1;
      const by = ry + (rand() - 0.5) * o.lenMax * 0.24;
      const len = lerp(o.lenMin, o.lenMax, rand() ** 1.3);
      const bend = (lean + (rand() - 0.5) * 0.5) * len * 0.55;
      const t = glow * (0.7 + rand() * 0.5);
      const col = t > 0.5 ? pickOf(rand, o.lit) : t > 0.24 ? pickOf(rand, o.midG) : pickOf(rand, o.dark);
      blades.push(
        `<path d="M${px(bx)} ${px(by)} q${px(bend * 0.35)} ${px(-len * 0.6)} ${px(bend)} ${px(-len)}"` +
          ` stroke="${col}" stroke-width="${px((0.7 + rand() * 0.7 + depth * 1.1) * o.widthScale)}"` +
          ` fill="none" stroke-linecap="round" opacity="${(0.5 + rand() * 0.45).toFixed(2)}"/>`,
      );
    }
    out.push(
      `<g class="fa-sway" style="transform-origin:${px(rx)}px ${px(ry + o.lenMax * 0.2)}px;` +
        `animation-delay:-${(((rx % o.sceneW) / o.sceneW) * 4.5 + rand() * 1.5).toFixed(2)}s;` +
        `animation-duration:${(6.5 + rand() * 3.5).toFixed(2)}s">${blades.join('')}</g>`,
    );
  }
  return out.join('');
}

/**
 * One layer strip: the drawing once inside a group, and a `<use>` clone one loop to the right,
 * so the window can cross the seam without ever seeing an edge. The svg keeps its own aspect —
 * height 100% of the stage, width wherever that lands — and the view slides it by translate.
 */
function svgStrip(prefix: string, totalW: number, defs: string, body: string): string {
  return (
    `<svg class="forest-art" viewBox="0 0 ${totalW * 2} ${H}" preserveAspectRatio="xMinYMin slice" aria-hidden="true">` +
    `<defs>` +
    `<filter id="${prefix}-rough" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="8"/></filter>` +
    `<filter id="${prefix}-leafy" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="18"/></filter>` +
    `<filter id="${prefix}-blur1"><feGaussianBlur stdDeviation="1.1"/></filter>` +
    `<filter id="${prefix}-blur2"><feGaussianBlur stdDeviation="2"/></filter>` +
    `<filter id="${prefix}-blur3"><feGaussianBlur stdDeviation="3"/></filter>` +
    `<filter id="${prefix}-blur8"><feGaussianBlur stdDeviation="8"/></filter>` +
    defs +
    `</defs><g id="${prefix}-loop">${body}</g><use href="#${prefix}-loop" x="${totalW}"/></svg>`
  );
}

function skyMarkup(p: Palette, sparse: boolean, sceneW: number): string {
  const rand = stream('sky');
  const totalW = sceneW * SCENE_COUNT;
  const wide = sceneW / 1440;

  const stars: string[] = [];
  const starN = Math.round((sparse ? 70 : 120) * p.stars * wide * SCENE_COUNT);
  for (let i = 0; i < starN; i += 1) {
    stars.push(
      `<circle cx="${px(rand() * totalW)}" cy="${px(rand() ** 1.35 * (HY - 24))}" r="${px(0.4 + rand() ** 2 * 1.5)}" fill="#e8f1ff" opacity="${(0.25 + rand() * 0.7).toFixed(2)}"/>`,
    );
  }
  for (let i = 0; i < Math.round(6 * p.stars * SCENE_COUNT); i += 1) {
    const sx = rand() * totalW;
    const sy = rand() * HY * 0.7;
    const s = px(3 + rand() * 5);
    stars.push(
      `<g transform="translate(${px(sx)} ${px(sy)})" fill="#eef4ff" opacity="0.9">` +
        `<path d="M0 ${-s} L${s * 0.22} 0 L0 ${s} L${-s * 0.22} 0 Z"/>` +
        `<path d="M${-s} 0 L0 ${s * 0.22} L${s} 0 L0 ${-s * 0.22} Z"/><circle r="${px(s * 0.3)}" fill="#fff"/></g>`,
    );
  }

  const pieces: string[] = [];
  SCENES.forEach((scene, s) => {
    const x0 = s * sceneW;

    if (p.nebula > 0 && scene.nebula) {
      pieces.push(
        `<g mask="url(#fa-sky-nebm-${s})" opacity="${p.nebula}"><rect x="${px(x0)}" y="0" width="${sceneW}" height="${HY}" filter="url(#fa-sky-nebf)"/>` +
          `<ellipse cx="${px(x0 + sceneW * 0.6)}" cy="${HY * 0.3}" rx="${sceneW * 0.06}" ry="${HY * 0.09}" fill="#cfe0ff" opacity="0.28" filter="url(#fa-sky-blur8)"/></g>`,
      );
    }

    if (scene.moon && p.nebula > 0) {
      const mx = x0 + sceneW * 0.67;
      const my = HY * 0.3;
      const mr = H * 0.072;
      pieces.push(
        `<g><circle cx="${px(mx)}" cy="${px(my)}" r="${px(mr * 3.1)}" fill="url(#fa-sky-moonhalo)"/>` +
          `<circle cx="${px(mx)}" cy="${px(my)}" r="${px(mr)}" fill="url(#fa-sky-moonface)"/>` +
          `<g fill="#b6c9e6" opacity="0.5">` +
          `<circle cx="${px(mx - mr * 0.3)}" cy="${px(my - mr * 0.18)}" r="${px(mr * 0.2)}"/>` +
          `<circle cx="${px(mx + mr * 0.22)}" cy="${px(my + mr * 0.3)}" r="${px(mr * 0.14)}"/>` +
          `<circle cx="${px(mx + mr * 0.34)}" cy="${px(my - mr * 0.32)}" r="${px(mr * 0.1)}"/></g></g>`,
      );
    }

    const spots: [number, number, number][] = [
      [0.16, 0.1, 0.3], [0.5, -0.04, 0.34], [0.86, 0.14, 0.28], [0.32, 0.34, 0.2],
    ];
    for (const [fx, fy, fw] of spots) {
      const cw = sceneW * fw * (0.85 + rand() * 0.3);
      pieces.push(
        `<g class="fa-drift" style="animation-duration:${(140 + rand() * 120).toFixed(0)}s;animation-delay:-${(rand() * 200).toFixed(0)}s">` +
          `${cloud(rand, x0 + sceneW * fx, HY * fy, cw, cw * (0.2 + rand() * 0.06), p.cloudBody, p.cloudRim)}</g>`,
      );
    }

    if (p.nebula > 0 && s !== 2) {
      const sx = x0 + sceneW * (0.2 + rand() * 0.6);
      const sy = HY * (0.06 + rand() * 0.4);
      const len = sceneW * 0.04;
      pieces.push(
        `<line class="fa-streak" style="animation-delay:${(s * 3.1 + rand() * 2).toFixed(1)}s" x1="${px(sx)}" y1="${px(sy)}" x2="${px(sx + len)}" y2="${px(sy + len * 0.62)}" stroke="#cdddff" stroke-width="1.1"/>`,
      );
    }
  });

  const rows =
    `<g filter="url(#fa-sky-blur2)" opacity="0.9"><path d="${ridge(rand, totalW, sceneW, H * 0.16, HY + 2, sceneW / 9, true, 0.12)}" fill="url(#fa-sky-mtnfar-g)"/></g>` +
    `<g filter="url(#fa-sky-blur1)"><path d="${ridge(rand, totalW, sceneW, H * 0.07, HY + 4, sceneW / 5, false, 0.4)}" fill="url(#fa-sky-mtnnear-g)"/></g>` +
    `<rect x="0" y="${px(HY - H * 0.08)}" width="${totalW}" height="${px(H * 0.09)}" fill="url(#fa-sky-haze-g)"/>`;

  const nebMasks = SCENES.map((scene, s) =>
    scene.nebula
      ? `<mask id="fa-sky-nebm-${s}"><ellipse cx="${px(s * sceneW + sceneW * 0.52)}" cy="${HY * 0.42}" rx="${sceneW * 0.5}" ry="${HY * 0.34}" fill="url(#fa-sky-nebmask)" transform="rotate(-19 ${px(s * sceneW + sceneW * 0.52)} ${HY * 0.42})"/></mask>`
      : '',
  ).join('');

  const defs =
    `<filter id="fa-sky-nebf"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.009" numOctaves="4" seed="11"/><feColorMatrix type="matrix" values="0 0 0 0 0.58  0 0 0 0 0.7  0 0 0 0 1  0 0 0 1.1 -0.42"/></filter>` +
    `<radialGradient id="fa-sky-nebmask"><stop offset="0%" stop-color="#fff"/><stop offset="60%" stop-color="#777"/><stop offset="100%" stop-color="#000"/></radialGradient>` +
    nebMasks +
    `<radialGradient id="fa-sky-moonhalo"><stop offset="0%" stop-color="#e6f0ff" stop-opacity="0.55"/><stop offset="34%" stop-color="#b9d4ff" stop-opacity="0.2"/><stop offset="100%" stop-color="#b9d4ff" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="fa-sky-moonface" cx="0.42" cy="0.38" r="0.75"><stop offset="0%" stop-color="#f4f8ff"/><stop offset="72%" stop-color="#dbe8fa"/><stop offset="100%" stop-color="#bfd3ef"/></radialGradient>` +
    `<linearGradient id="fa-sky-mtnfar-g" gradientUnits="userSpaceOnUse" x1="0" y1="${px(HY - H * 0.18)}" x2="0" y2="${px(HY + 4)}">` +
    `<stop offset="0" stop-color="${p.mtn[0]}" stop-opacity="0.25"/><stop offset="0.45" stop-color="${p.mtn[1]}" stop-opacity="0.72"/><stop offset="1" stop-color="${p.mtn[2]}" stop-opacity="0.96"/></linearGradient>` +
    `<linearGradient id="fa-sky-mtnnear-g" gradientUnits="userSpaceOnUse" x1="0" y1="${px(HY - H * 0.07)}" x2="0" y2="${px(HY + 10)}">` +
    `<stop offset="0" stop-color="${p.mtn[2]}" stop-opacity="0.85"/><stop offset="0.6" stop-color="${p.foot}" stop-opacity="0.75"/><stop offset="1" stop-color="${p.foot}" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="fa-sky-haze-g" gradientUnits="userSpaceOnUse" x1="0" y1="${px(HY - H * 0.08)}" x2="0" y2="${px(HY + H * 0.01)}">` +
    `<stop offset="0" stop-color="${p.haze}" stop-opacity="0"/><stop offset="1" stop-color="${p.haze}" stop-opacity="0.28"/></linearGradient>`;

  return svgStrip('fa-sky', totalW, defs, `<g>${stars.join('')}</g>${pieces.join('')}${rows}`);
}

function meadowMarkup(p: Palette, sparse: boolean, sceneW: number): string {
  const rand = stream('meadow');
  const totalW = sceneW * SCENE_COUNT;
  const hills =
    hill(rand, totalW, HY + H * 0.045, H * 0.012, p.hills[0], p.crest, 'fa-mid') +
    hill(rand, totalW, HY + H * 0.13, H * 0.022, p.hills[1], p.crest, 'fa-mid') +
    hill(rand, totalW, HY + H * 0.24, H * 0.03, p.hills[2], p.crest, 'fa-mid') +
    hill(rand, totalW, HY + H * 0.4, H * 0.038, p.hills[2], p.crest, 'fa-mid');

  const midPines = SCENES.map((scene, s) =>
    scene.midPines
      .map(([fx, fy, fh]) =>
        `<path d="${pinePaths(rand, (s + fx) * sceneW, HY + H * fy, H * fh, H * fh * 0.64, 5)}"/>`,
      )
      .join(''),
  ).join('');

  const speckles: string[] = [];
  for (let i = 0; i < Math.round((sparse ? 140 : 300) * SCENE_COUNT * 0.7); i += 1) {
    const x = rand() * totalW;
    const y = lerp(HY + 4, HY + H * 0.12, rand() ** 0.9);
    const local = ((x % sceneW) + sceneW) % sceneW;
    const t = clamp(1 - Math.abs(local - sceneW / 2) / (sceneW * 0.52), 0, 1);
    speckles.push(
      `<circle cx="${px(x)}" cy="${px(y)}" r="${px(0.6 + rand() * 1.1)}" fill="${t > 0.35 ? pickOf(rand, p.lit) : pickOf(rand, p.midG)}" opacity="${(0.3 + t * 0.6 * rand()).toFixed(2)}"/>`,
    );
  }

  const drift: string[] = [];
  SCENES.forEach((scene, s) => {
    for (let i = 0; i < Math.round((sparse ? 35 : 75) * scene.flowers); i += 1) {
      drift.push(
        `<circle cx="${px((s + rand()) * sceneW)}" cy="${px(lerp(HY + H * 0.06, H * 0.8, rand()))}" r="${px(1 + rand() * 1.8)}" fill="${pickOf(rand, p.flowerCols)}" opacity="${(0.5 + rand() * 0.5).toFixed(2)}"/>`,
      );
    }
  });

  const grass = tufts(rand, {
    totalW, sceneW,
    clumps: Math.round((sparse ? 14 : 26) * SCENE_COUNT),
    bladesPer: 11,
    y0: HY + H * 0.12, y1: H * 0.84, lenMin: 9, lenMax: 30,
    lit: p.lit, midG: p.midG, dark: p.dark, widthScale: 1,
  });

  return svgStrip(
    'fa-mid', totalW, '',
    `${hills}<g fill="#0b2233" filter="url(#fa-mid-blur1)">${midPines}</g><g>${speckles.join('')}</g><g>${drift.join('')}</g>` +
      `<g class="fa-breeze" style="transform-origin:${px(totalW / 2)}px ${H}px"><g>${grass}</g></g>`,
  );
}

function foregroundMarkup(p: Palette, sparse: boolean, sceneW: number): string {
  const rand = stream('fore');
  const totalW = sceneW * SCENE_COUNT;
  const pineW = Math.min(sceneW * 0.13, 210);

  const pieces: string[] = [];
  SCENES.forEach((scene, s) => {
    const x0 = s * sceneW;

    if (scene.canopy) {
      const cw = Math.min(sceneW * 0.3, 450);
      const blobs: string[] = [];
      for (let i = 0; i < 30; i += 1) {
        const bx = x0 - cw * 0.14 + rand() ** 1.25 * cw;
        const by = -H * 0.05 + rand() ** 1.4 * H * 0.26;
        const br = lerp(cw * 0.06, cw * 0.14, rand()) * (1 - (bx - x0 + cw * 0.14) / (cw * 1.8)) + cw * 0.04;
        blobs.push(`<ellipse cx="${px(bx)}" cy="${px(by)}" rx="${px(br)}" ry="${px(br * (0.72 + rand() * 0.25))}"/>`);
      }
      pieces.push(
        `<g class="fa-sway fa-sway-soft" style="transform-origin:${px(x0)}px 0px">` +
          `<g fill="${p.pine}" filter="url(#fa-fore-leafy)">${blobs.join('')}</g></g>`,
      );
    }

    pieces.push(
      `<g fill="${p.pine}" filter="url(#fa-fore-rough)">` +
        scene.pines
          .map(([fx, fy, fh, fw]) => `<path d="${pinePaths(rand, x0 + sceneW * fx, H * fy, H * fh, pineW * fw, 8)}"/>`)
          .join('') +
        `</g>`,
    );

    const clusters = Math.max(2, Math.round(6 * scene.flowers));
    for (let c = 0; c < clusters; c += 1) {
      const cx = x0 + rand() * sceneW;
      const cy = lerp(H * 0.72, H * 0.97, rand());
      const n = 4 + Math.floor(rand() * 5);
      const cluster: string[] = [];
      for (let i = 0; i < n; i += 1) {
        const fx2 = cx + (rand() - 0.5) * Math.min(sceneW * 0.1, 150);
        const fy2 = cy + (rand() - 0.5) * H * 0.05;
        const r = 4.5 + rand() * 4.5;
        const col = pickOf(rand, p.flowerCols);
        const petals = Array.from(
          { length: 5 },
          (_, j) =>
            `<ellipse cx="0" cy="${px(-r * 0.62)}" rx="${px(r * 0.34)}" ry="${px(r * 0.62)}" transform="rotate(${j * 72 + rand() * 14})"/>`,
        ).join('');
        cluster.push(
          `<g transform="translate(${px(fx2)} ${px(fy2)})"><circle r="${px(r * 1.9)}" fill="${col}" opacity="0.22" filter="url(#fa-fore-blur3)"/>` +
            `<g fill="${col}" opacity="0.92">${petals}</g><circle r="${px(r * 0.2)}" fill="#ffe9a8"/></g>`,
        );
      }
      pieces.push(
        `<g class="fa-sway fa-sway-soft" style="transform-origin:${px(cx)}px ${px(cy + 30)}px;` +
          `animation-delay:-${(((cx % sceneW) / sceneW) * 2.4 + rand()).toFixed(2)}s">${cluster.join('')}</g>`,
      );
    }
  });

  const grass = tufts(rand, {
    totalW, sceneW,
    clumps: Math.round((sparse ? 8 : 15) * SCENE_COUNT),
    bladesPer: 12,
    y0: H * 0.86, y1: H + 6, lenMin: 30, lenMax: 92,
    lit: ['#1d6b40', '#2a7d4c'], midG: p.dark, dark: ['#03120a', '#051609'], widthScale: 1.5,
  });

  const rimH = Math.round(H * 0.1);
  let rim = `M-10 ${rimH + 10} L-10 ${rimH}`;
  let x = -10;
  while (x < totalW - 8) {
    const step = 4 + rand() * 10;
    const blade = rimH * (0.25 + rand() ** 2 * 0.7);
    rim += ` L${px(x + step * 0.4)} ${px(rimH - blade)} L${px(x + step)} ${px(rimH - rand() * rimH * 0.14)}`;
    x += step;
  }
  // Land the rim back on its own start, so the loop closes without a step.
  rim += ` L${px(totalW)} ${rimH} L${px(totalW)} ${rimH + 10} Z`;

  return svgStrip(
    'fa-fore', totalW, '',
    `${pieces.join('')}<path d="${rim}" transform="translate(0 ${H - rimH})" fill="#02100a"/>` +
      `<g class="fa-breeze" style="transform-origin:${px(totalW / 2)}px ${H}px"><g>${grass}</g></g>`,
  );
}

interface ArtProps {
  torn: boolean;
  sparse: boolean;
  /** Stage width / height, pre-bucketed by the caller so a 1px resize does not repaint. */
  aspect: number;
}

function ArtLayer({ markup }: { markup: string }): JSX.Element {
  // Self-generated deterministic markup — nothing user- or agent-authored flows in here.
  return <div className="forest-art-holder" aria-hidden="true" dangerouslySetInnerHTML={{ __html: markup }} />;
}

export function SkyArt({ torn, sparse, aspect }: ArtProps): JSX.Element {
  const markup = useMemo(() => skyMarkup(torn ? TORN : NIGHT, sparse, designWidth(aspect)), [torn, sparse, aspect]);
  return <ArtLayer markup={markup} />;
}

export function MeadowArt({ torn, sparse, aspect }: ArtProps): JSX.Element {
  const markup = useMemo(() => meadowMarkup(torn ? TORN : NIGHT, sparse, designWidth(aspect)), [torn, sparse, aspect]);
  return <ArtLayer markup={markup} />;
}

export function ForegroundArt({ torn, sparse, aspect }: ArtProps): JSX.Element {
  const markup = useMemo(() => foregroundMarkup(torn ? TORN : NIGHT, sparse, designWidth(aspect)), [torn, sparse, aspect]);
  return <ArtLayer markup={markup} />;
}
