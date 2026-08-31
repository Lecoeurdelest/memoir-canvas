/**
 * TASK-021 — the certainty ladder, pinned against the two things that silently rot:
 * the glossary translations, and the contrast ratios.
 *
 * NFR-A11Y-05 explains why contrast is asserted in a unit test rather than by an axe run: the
 * 3D page background is a WebGL material no DOM contrast checker can resolve, so ink and paper
 * are shared constants and the ratio between them is checked here.
 */
import { describe, expect, it } from 'vitest';
import { CERTAINTY_ORDER } from '../src/domain/types';
import {
  LABELS,
  LEAF,
  LEAF_INK,
  LEAF_LABEL,
  NIGHT,
  NIGHT_PALETTE,
  NIGHT_UNLIT,
  PALETTE,
  PAPER,
} from '../src/panels/CertaintyBadge';
// ?raw, the same way db.ts loads schema.sql — the glossary IS the fixture here.
import glossary from '../.agent/context/glossary.md?raw';

/** WCAG 2.1 relative luminance. */
function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('TASK-021 — certainty badges', () => {
  it('has a label for every rung of the ladder, in ladder order', () => {
    for (const certainty of CERTAINTY_ORDER) {
      expect(LABELS[certainty], certainty).toBeDefined();
    }
  });

  it('matches the glossary word for word', () => {
    // The glossary is the source of truth: `| `oral` | Lời kể | Oral recollection | …`
    for (const certainty of CERTAINTY_ORDER) {
      const row = glossary
        .split('\n')
        .find((l: string) => l.includes(`\`${certainty}\``) && l.split('|').length > 3);
      expect(row, `glossary has no row for ${certainty}`).toBeDefined();

      const [, , vi, en] = row!.split('|').map((c: string) => c.trim());
      expect(LABELS[certainty].vi, `${certainty} vi`).toBe(vi);
      expect(LABELS[certainty].en, `${certainty} en`).toBe(en);
    }
  });

  it('does not rely on colour alone — every label carries a word and a distinct glyph', () => {
    const glyphs = CERTAINTY_ORDER.map((c) => LABELS[c].glyph);
    expect(glyphs).toHaveLength(CERTAINTY_ORDER.length);
    expect(new Set(glyphs).size, 'glyphs must be distinct').toBe(glyphs.length);
  });

  it('meets WCAG AA against its own background and against the page', () => {
    for (const certainty of CERTAINTY_ORDER) {
      const { ink, bg } = PALETTE[certainty];
      expect(contrast(ink, bg), `${certainty} on its badge`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(ink, PAPER), `${certainty} on the page`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps the ladder distinguishable without colour, by luminance order', () => {
    // Greyscale is the real test of "not colour alone": if two rungs collapse to the same grey,
    // the glyph is doing all the work. They should still separate.
    const greys = CERTAINTY_ORDER.map((c) => luminance(PALETTE[c].ink));
    expect(new Set(greys.map((g) => g.toFixed(3))).size).toBe(CERTAINTY_ORDER.length);
  });
});

describe('TASK-034 — the same ladder after dark', () => {
  it('meets WCAG AA against the forest ground', () => {
    for (const certainty of CERTAINTY_ORDER) {
      const light = NIGHT_PALETTE[certainty];
      expect(light, certainty).toBeDefined();
      expect(contrast(light, NIGHT), `${certainty} on the forest`).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(NIGHT_UNLIT, NIGHT), 'an unlit ring').toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the rungs apart in greyscale here too', () => {
    // A firefly has no room for a glyph, so in the forest colour is doing more work than it does
    // on a badge. If two rungs collapse to the same grey the forest lies to a colour-blind reader
    // even with the legend beside it.
    const greys = CERTAINTY_ORDER.map((c) => luminance(NIGHT_PALETTE[c]));
    expect(new Set(greys.map((g) => g.toFixed(3))).size).toBe(CERTAINTY_ORDER.length);
  });

  it('covers the same five rungs as the light palette, and no more', () => {
    expect(Object.keys(NIGHT_PALETTE).sort()).toEqual(Object.keys(PALETTE).sort());
  });
});

describe('TASK-041 — the paper the book is printed on', () => {
  it('carries its own ink at WCAG AA, because cream is not the app’s white', () => {
    expect(contrast(LEAF_INK, LEAF), 'body ink on the leaf').toBeGreaterThanOrEqual(4.5);
  });

  it('keeps even the quiet label legible', () => {
    // The page labels are small and grey-gold. They are the first thing to fail on warm paper,
    // so they get the 4.5 bar rather than the 3.0 one large text would allow.
    expect(contrast(LEAF_LABEL, LEAF), 'page label on the leaf').toBeGreaterThanOrEqual(4.5);
  });

  it('still meets AA for every certainty badge printed on it', () => {
    for (const certainty of CERTAINTY_ORDER) {
      const { ink } = PALETTE[certainty];
      expect(contrast(ink, LEAF), `${certainty} on the leaf`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
