/**
 * TASK-048 — the approved meadow, painted.
 *
 * The whole scene is deterministic inline SVG in a fixed 1440×900 design space, seeded from
 * `hash` so a re-render never reshuffles a single blade of grass. Three components, one per
 * parallax plane: sky (far), meadow (mid), foreground (near). All of it is `aria-hidden`
 * scenery — nothing here is knowable only by looking (TASK-034's rule still holds).
 *
 * Element ids are prefixed per layer because SVG ids are global to the document.
 *
 * R5: paints, decides nothing.
 */

import { useMemo } from 'react';
import { hash } from './forestLayout';

const W = 1440;
const H = 900;
const HY = Math.round(H * 0.56);

/** A per-call deterministic stream over the shared hash. */
function stream(seed: string): () => number {
  let i = 0;
  return () => hash(`${seed}:${(i += 1)}`);
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const px = (n: number): number => Number(n.toFixed(1));
const pickOf = (rand: () => number, xs: readonly string[]): string =>
  xs[Math.floor(rand() * xs.length)];

interface Palette {
  treeFar: string;
  treeNear: string;
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
  treeFar: '#0f2b47',
  treeNear: '#061527',
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
  treeFar: '#101b23',
  treeNear: '#080f15',
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

/** A rolling ridge: a readable dark band under a wide, faint moonlit crest. */
function hill(rand: () => number, yBase: number, amp: number, fill: string, crest: string, prefix: string): string {
  const n = 6;
  const ys = Array.from({ length: n + 1 }, () => yBase + (rand() - 0.5) * amp * 2);
  let edge = `M-20 ${px(ys[0])}`;
  for (let i = 0; i < n; i += 1) {
    const x0 = (W / n) * i;
    const x1 = (W / n) * (i + 1);
    edge += ` Q${px(x0 + (x1 - x0) * 0.5)} ${px(ys[i] + (rand() - 0.5) * amp)} ${px(x1)} ${px(ys[i + 1])}`;
  }
  return (
    `<path d="${edge}" fill="none" stroke="${crest}" stroke-width="${px(amp * 0.9 + 8)}" opacity="0.16" filter="url(#${prefix}-blur8)"/>` +
    `<path d="${edge} L${W + 20} ${H + 20} L-20 ${H + 20} Z" fill="${fill}" opacity="0.85" filter="url(#${prefix}-blur2)"/>`
  );
}

/** Clumped grass blades sharing a root and a lean, coloured by distance from the glow. */
function tufts(
  rand: () => number,
  o: { clumps: number; bladesPer: number; y0: number; y1: number; lenMin: number; lenMax: number; lit: string[]; midG: string[]; dark: string[]; widthScale: number },
): string {
  const out: string[] = [];
  const glowX = W * 0.5;
  const glowR = W * 0.56;
  for (let c = 0; c < o.clumps; c += 1) {
    const rx = lerp(-10, W + 10, rand());
    const ry = lerp(o.y0, o.y1, rand() ** 0.85);
    const lean = (rand() - 0.5) * 0.9;
    const depth = clamp((ry - o.y0) / Math.max(1, o.y1 - o.y0), 0, 1);
    const glow = clamp(1 - Math.abs(rx - glowX) / glowR, 0, 1) * (1 - depth * 0.8);
    const n = Math.round(o.bladesPer * (0.6 + rand() * 0.8));
    for (let i = 0; i < n; i += 1) {
      const bx = rx + (rand() - 0.5) * o.lenMax * 1.1;
      const by = ry + (rand() - 0.5) * o.lenMax * 0.24;
      const len = lerp(o.lenMin, o.lenMax, rand() ** 1.3);
      const bend = (lean + (rand() - 0.5) * 0.5) * len * 0.55;
      const t = glow * (0.7 + rand() * 0.5);
      const col = t > 0.5 ? pickOf(rand, o.lit) : t > 0.24 ? pickOf(rand, o.midG) : pickOf(rand, o.dark);
      out.push(
        `<path d="M${px(bx)} ${px(by)} q${px(bend * 0.35)} ${px(-len * 0.6)} ${px(bend)} ${px(-len)}"` +
          ` stroke="${col}" stroke-width="${px((0.7 + rand() * 0.7 + depth * 1.1) * o.widthScale)}"` +
          ` fill="none" stroke-linecap="round" opacity="${(0.5 + rand() * 0.45).toFixed(2)}"/>`,
      );
    }
  }
  return out.join('');
}

function svgOf(prefix: string, defs: string, body: string): string {
  return (
    `<svg class="forest-art" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">` +
    `<defs>` +
    `<filter id="${prefix}-rough" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5"/></filter>` +
    `<filter id="${prefix}-leafy" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="18"/></filter>` +
    `<filter id="${prefix}-blur1"><feGaussianBlur stdDeviation="1.1"/></filter>` +
    `<filter id="${prefix}-blur2"><feGaussianBlur stdDeviation="2"/></filter>` +
    `<filter id="${prefix}-blur3"><feGaussianBlur stdDeviation="3"/></filter>` +
    `<filter id="${prefix}-blur8"><feGaussianBlur stdDeviation="8"/></filter>` +
    defs +
    `</defs>${body}</svg>`
  );
}

function skyMarkup(p: Palette, sparse: boolean): string {
  const rand = stream('sky');
  const stars: string[] = [];
  const starN = Math.round((sparse ? 90 : 150) * p.stars);
  for (let i = 0; i < starN; i += 1) {
    const onBand = rand() < 0.4;
    const bx = rand() * W;
    const by = onBand
      ? clamp(HY * 0.42 + (bx - W * 0.52) * -0.34 + (rand() - 0.5) * HY * 0.3, 0, HY - 20)
      : rand() ** 1.35 * (HY - 24);
    stars.push(
      `<circle cx="${px(bx)}" cy="${px(by)}" r="${px(0.4 + rand() ** 2 * 1.5)}" fill="#e8f1ff" opacity="${(0.25 + rand() * 0.7).toFixed(2)}"/>`,
    );
  }
  for (let i = 0; i < Math.round(7 * p.stars); i += 1) {
    const sx = rand() * W;
    const sy = rand() * HY * 0.7;
    const s = px(3 + rand() * 5);
    stars.push(
      `<g transform="translate(${px(sx)} ${px(sy)})" fill="#eef4ff" opacity="0.9">` +
        `<path d="M0 ${-s} L${s * 0.22} 0 L0 ${s} L${-s * 0.22} 0 Z"/>` +
        `<path d="M${-s} 0 L0 ${s * 0.22} L${s} 0 L0 ${-s * 0.22} Z"/><circle r="${px(s * 0.3)}" fill="#fff"/></g>`,
    );
  }

  const nebula = p.nebula
    ? `<g mask="url(#fa-sky-nebm)" opacity="${p.nebula}"><rect x="0" y="0" width="${W}" height="${HY}" filter="url(#fa-sky-nebf)"/>` +
      `<ellipse cx="${W * 0.6}" cy="${HY * 0.3}" rx="${W * 0.06}" ry="${HY * 0.09}" fill="#cfe0ff" opacity="0.28" filter="url(#fa-sky-blur8)"/>` +
      `<ellipse cx="${W * 0.42}" cy="${HY * 0.52}" rx="${W * 0.045}" ry="${HY * 0.07}" fill="#bcd4ff" opacity="0.22" filter="url(#fa-sky-blur8)"/></g>`
    : '';

  const mx = W * 0.67;
  const my = HY * 0.3;
  const mr = H * 0.072;
  const moon = p.nebula
    ? `<g><circle cx="${px(mx)}" cy="${px(my)}" r="${px(mr * 3.1)}" fill="url(#fa-sky-moonhalo)"/>` +
      `<circle cx="${px(mx)}" cy="${px(my)}" r="${px(mr)}" fill="url(#fa-sky-moonface)"/>` +
      `<g fill="#b6c9e6" opacity="0.5">` +
      `<circle cx="${px(mx - mr * 0.3)}" cy="${px(my - mr * 0.18)}" r="${px(mr * 0.2)}"/>` +
      `<circle cx="${px(mx + mr * 0.22)}" cy="${px(my + mr * 0.3)}" r="${px(mr * 0.14)}"/>` +
      `<circle cx="${px(mx + mr * 0.34)}" cy="${px(my - mr * 0.32)}" r="${px(mr * 0.1)}"/></g></g>`
    : '';

  const shooting: string[] = [];
  if (p.nebula) {
    for (let i = 0; i < 3; i += 1) {
      const sx = W * (0.18 + rand() * 0.64);
      const sy = HY * (0.06 + rand() * 0.42);
      const len = W * (0.035 + rand() * 0.03);
      shooting.push(
        `<line x1="${px(sx)}" y1="${px(sy)}" x2="${px(sx + len)}" y2="${px(sy + len * 0.62)}" stroke="#cdddff" stroke-width="1.1" opacity="0.35"/>`,
      );
    }
  }

  const spots: [number, number, number][] = [
    [W * 0.16, HY * 0.1, W * 0.3],
    [W * 0.5, HY * -0.04, W * 0.34],
    [W * 0.86, HY * 0.14, W * 0.28],
    [W * 0.32, HY * 0.34, W * 0.2],
    [W * 0.7, HY * 0.4, W * 0.17],
  ];
  const clouds = spots.map(([cx, cy, cw]) => cloud(rand, cx, cy, cw, cw * (0.2 + rand() * 0.06), p.cloudBody, p.cloudRim));

  // The horizon opens in the middle: the rows sink and thin toward the centre (approved rev).
  const rows: string[] = [];
  const DIP = 0.82;
  for (const [depth, fill, hMax, blurred] of [
    [0, p.treeFar, H * 0.075, true],
    [1, p.treeNear, H * 0.11, false],
  ] as const) {
    const row: string[] = [];
    let x = -20;
    while (x < W + 20) {
      const edge = Math.abs(x - W / 2) / (W / 2);
      const env = 1 - DIP * (1 - edge ** 1.6);
      const th = hMax * env * (0.45 + rand() * 0.55) * (rand() < 0.12 && env > 0.6 ? 1.5 : 1);
      const step = Math.max(6, th * (0.36 + rand() * 0.3));
      if (env < 0.4 && rand() < 0.55) {
        x += step + 10;
        continue;
      }
      row.push(pinePaths(rand, x, HY - th + depth * 4, th, th * 0.62, 2));
      x += step;
    }
    rows.push(`<g${blurred ? ` filter="url(#fa-sky-blur1)"` : ''}><path d="${row.join(' ')}" fill="${fill}"/></g>`);
  }

  const defs =
    `<filter id="fa-sky-nebf"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.009" numOctaves="4" seed="11"/><feColorMatrix type="matrix" values="0 0 0 0 0.58  0 0 0 0 0.7  0 0 0 0 1  0 0 0 1.1 -0.42"/></filter>` +
    `<radialGradient id="fa-sky-nebmask"><stop offset="0%" stop-color="#fff"/><stop offset="60%" stop-color="#777"/><stop offset="100%" stop-color="#000"/></radialGradient>` +
    `<mask id="fa-sky-nebm"><ellipse cx="${W * 0.52}" cy="${HY * 0.42}" rx="${W * 0.52}" ry="${HY * 0.34}" fill="url(#fa-sky-nebmask)" transform="rotate(-19 ${W * 0.52} ${HY * 0.42})"/></mask>` +
    `<radialGradient id="fa-sky-moonhalo"><stop offset="0%" stop-color="#e6f0ff" stop-opacity="0.55"/><stop offset="34%" stop-color="#b9d4ff" stop-opacity="0.2"/><stop offset="100%" stop-color="#b9d4ff" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="fa-sky-moonface" cx="0.42" cy="0.38" r="0.75"><stop offset="0%" stop-color="#f4f8ff"/><stop offset="72%" stop-color="#dbe8fa"/><stop offset="100%" stop-color="#bfd3ef"/></radialGradient>`;

  return svgOf(
    'fa-sky',
    defs,
    `<g>${stars.join('')}</g>${nebula}${moon}${shooting.join('')}` +
      `<g filter="url(#fa-sky-blur1)" opacity="0.95">${clouds.join('')}</g>${rows.join('')}`,
  );
}

function meadowMarkup(p: Palette, sparse: boolean): string {
  const rand = stream('meadow');
  const hills =
    hill(rand, HY + H * 0.045, H * 0.012, p.hills[0], p.crest, 'fa-mid') +
    hill(rand, HY + H * 0.13, H * 0.022, p.hills[1], p.crest, 'fa-mid') +
    hill(rand, HY + H * 0.24, H * 0.03, p.hills[2], p.crest, 'fa-mid') +
    hill(rand, HY + H * 0.4, H * 0.038, p.hills[2], p.crest, 'fa-mid');

  const speckles: string[] = [];
  const glowX = W * 0.5;
  for (let i = 0; i < (sparse ? 260 : 520); i += 1) {
    const x = rand() * W;
    const y = lerp(HY + 4, HY + H * 0.12, rand() ** 0.9);
    const t = clamp(1 - Math.abs(x - glowX) / (W * 0.52), 0, 1);
    speckles.push(
      `<circle cx="${px(x)}" cy="${px(y)}" r="${px(0.6 + rand() * 1.1)}" fill="${t > 0.35 ? pickOf(rand, p.lit) : pickOf(rand, p.midG)}" opacity="${(0.3 + t * 0.6 * rand()).toFixed(2)}"/>`,
    );
  }

  const drift: string[] = [];
  for (let i = 0; i < (sparse ? 60 : 130); i += 1) {
    drift.push(
      `<circle cx="${px(rand() * W)}" cy="${px(lerp(HY + H * 0.06, H * 0.8, rand()))}" r="${px(1 + rand() * 1.8)}" fill="${pickOf(rand, p.flowerCols)}" opacity="${(0.5 + rand() * 0.5).toFixed(2)}"/>`,
    );
  }

  const grass = tufts(rand, {
    clumps: sparse ? 24 : 48,
    bladesPer: 11,
    y0: HY + H * 0.12,
    y1: H * 0.84,
    lenMin: 9,
    lenMax: 30,
    lit: p.lit,
    midG: p.midG,
    dark: p.dark,
    widthScale: 1,
  });

  return svgOf('fa-mid', '', `${hills}<g>${speckles.join('')}</g><g>${drift.join('')}</g><g>${grass}</g>`);
}

function foregroundMarkup(p: Palette, sparse: boolean): string {
  const rand = stream('fore');

  const canopyBlobs: string[] = [];
  for (let i = 0; i < 30; i += 1) {
    const bx = -W * 0.04 + rand() ** 1.25 * W * 0.3;
    const by = -H * 0.05 + rand() ** 1.4 * H * 0.26;
    const br = lerp(W * 0.018, W * 0.042, rand()) * (1 - (bx + W * 0.04) / (W * 0.54)) + W * 0.012;
    canopyBlobs.push(`<ellipse cx="${px(bx)}" cy="${px(by)}" rx="${px(br)}" ry="${px(br * (0.72 + rand() * 0.25))}"/>`);
  }

  // Inward of the outer 12%: the plane overscan crops that band off-screen at rest.
  const pines =
    `<g fill="${p.pine}" filter="url(#fa-fore-rough)">` +
    `<path d="${pinePaths(rand, W * 0.14, H * 0.1, H * 0.58, W * 0.13, 8)}"/>` +
    `<path d="${pinePaths(rand, W * 0.865, H * 0.02, H * 0.72, W * 0.155, 9)}"/>` +
    `<path d="${pinePaths(rand, W * 0.78, H * 0.24, H * 0.44, W * 0.095, 7)}"/></g>`;

  const flowers: string[] = [];
  for (let c = 0; c < 8; c += 1) {
    const cx = rand() * W;
    const cy = lerp(H * 0.72, H * 0.97, rand());
    const n = 4 + Math.floor(rand() * 5);
    for (let i = 0; i < n; i += 1) {
      const fx = cx + (rand() - 0.5) * W * 0.1;
      const fy = cy + (rand() - 0.5) * H * 0.05;
      const r = 4.5 + rand() * 4.5;
      const col = pickOf(rand, p.flowerCols);
      const petals = Array.from(
        { length: 5 },
        (_, j) =>
          `<ellipse cx="0" cy="${px(-r * 0.62)}" rx="${px(r * 0.34)}" ry="${px(r * 0.62)}" transform="rotate(${j * 72 + rand() * 14})"/>`,
      ).join('');
      flowers.push(
        `<g transform="translate(${px(fx)} ${px(fy)})"><circle r="${px(r * 1.9)}" fill="${col}" opacity="0.22" filter="url(#fa-fore-blur3)"/>` +
          `<g fill="${col}" opacity="0.92">${petals}</g><circle r="${px(r * 0.2)}" fill="#ffe9a8"/></g>`,
      );
    }
  }

  const grass = tufts(rand, {
    clumps: sparse ? 14 : 26,
    bladesPer: 12,
    y0: H * 0.86,
    y1: H + 6,
    lenMin: 30,
    lenMax: 92,
    lit: ['#1d6b40', '#2a7d4c'],
    midG: p.dark,
    dark: ['#03120a', '#051609'],
    widthScale: 1.5,
  });

  const rimH = Math.round(H * 0.1);
  let rim = `M-10 ${rimH + 10}`;
  let x = -10;
  while (x < W + 10) {
    const step = 4 + rand() * 10;
    const blade = rimH * (0.25 + rand() ** 2 * 0.7);
    rim += ` L${px(x + step * 0.4)} ${px(rimH - blade)} L${px(x + step)} ${px(rimH - rand() * rimH * 0.14)}`;
    x += step;
  }
  rim += ` L${W + 10} ${rimH + 10} Z`;

  return svgOf(
    'fa-fore',
    '',
    `<g fill="${p.pine}" filter="url(#fa-fore-leafy)">${canopyBlobs.join('')}</g>${pines}` +
      `<g>${flowers.join('')}</g><path d="${rim}" transform="translate(0 ${H - rimH})" fill="#02100a"/><g>${grass}</g>`,
  );
}

interface ArtProps {
  torn: boolean;
  sparse: boolean;
}

function ArtLayer({ markup }: { markup: string }): JSX.Element {
  // Self-generated deterministic markup — nothing user- or agent-authored flows in here.
  return <div className="forest-art-holder" aria-hidden="true" dangerouslySetInnerHTML={{ __html: markup }} />;
}

export function SkyArt({ torn, sparse }: ArtProps): JSX.Element {
  const markup = useMemo(() => skyMarkup(torn ? TORN : NIGHT, sparse), [torn, sparse]);
  return <ArtLayer markup={markup} />;
}

export function MeadowArt({ torn, sparse }: ArtProps): JSX.Element {
  const markup = useMemo(() => meadowMarkup(torn ? TORN : NIGHT, sparse), [torn, sparse]);
  return <ArtLayer markup={markup} />;
}

export function ForegroundArt({ torn, sparse }: ArtProps): JSX.Element {
  const markup = useMemo(() => foregroundMarkup(torn ? TORN : NIGHT, sparse), [torn, sparse]);
  return <ArtLayer markup={markup} />;
}
