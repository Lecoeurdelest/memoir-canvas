/**
 * TASK-021 — the five certainty labels, bilingual, never relying on colour alone.
 *
 * NFR-A11Y-02: each label carries a word AND a distinct glyph, so the ladder survives greyscale,
 * colour blindness, and a screen reader that reports none of the styling. The glyph is decorative
 * — the accessible name is the word.
 *
 * R5: pure presentation, no store access, no writes.
 */

import { resources } from '../i18n';
import type { Certainty } from '../domain/types';

type Lang = 'vi' | 'en';

/**
 * Ordered weakest to strongest, matching CERTAINTY_ORDER and the SQL enum. The glyphs are a
 * filling scale rather than five unrelated icons, so the ranking reads without the colour.
 */
/**
 * The glyph is NOT a translation — it is the redundant channel that keeps the ladder legible in
 * greyscale (NFR-A11Y-02), so it stays in code beside the palette. Only the word moves to i18n.
 */
export const GLYPH: Record<Certainty, string> = {
  uncertain: '○',
  oral: '◔',
  document_supported: '◑',
  conflicting: '◈',
  confirmed: '●',
};

/** The five words, in both languages, resolved without React — the contrast test reads this. */
export const LABELS: Record<Certainty, { vi: string; en: string; glyph: string }> = Object.freeze(
  Object.fromEntries(
    (Object.keys(GLYPH) as Certainty[]).map((c) => [
      c,
      {
        vi: resources.vi.translation.certainty[c],
        en: resources.en.translation.certainty[c],
        glyph: GLYPH[c],
      },
    ]),
  ) as Record<Certainty, { vi: string; en: string; glyph: string }>,
);

/**
 * The palette lives here, not in app.css, because NFR-A11Y-05 asks for the ratio to be asserted
 * in a test — and no DOM contrast checker can resolve a WebGL page background. tests/certainty
 * imports these same constants, so the check cannot drift from what renders.
 */
export const PAPER = '#f2f1ec';

export const PALETTE: Record<Certainty, { ink: string; bg: string }> = {
  uncertain: { ink: '#404542', bg: '#eceded' },
  oral: { ink: '#6a5410', bg: '#f5efdd' },
  document_supported: { ink: '#2a5566', bg: '#e2edf2' },
  conflicting: { ink: '#8c2f22', bg: '#f6e3e0' },
  confirmed: { ink: '#2f6b4f', bg: '#e2eee7' },
};

/**
 * The same ladder after dark. The forest is a night scene and the light badge palette is
 * unreadable on it, so the rungs get a second set of colours — measured against NIGHT, not
 * eyeballed, and asserted in tests/certainty.spec.ts exactly like the light one.
 *
 * The forest keeps the full certainty in each target's accessible name and reveals its memory name
 * on hover or focus; visually, every memory remains a simple firefly.
 */
export const NIGHT = '#071319';

export const NIGHT_PALETTE: Record<Certainty, string> = {
  uncertain: '#9fb4ae',
  oral: '#e8d46a',
  document_supported: '#8fd6e0',
  conflicting: '#ff9a76',
  confirmed: '#b8e878',
};

/** An unlit ring: a question nobody has answered. Deliberately colourless — it is an absence. */
export const NIGHT_UNLIT = '#cfdcd7';

/**
 * TASK-041 — the paper the book is actually printed on, once it moved back into the forest.
 *
 * The app's light page is `PAPER` (#f2f1ec, a cool white). A book lying in a wood at night is not
 * that: the design gives it a warm, aged sheet lit from one side. Its ink is warmer and darker to
 * match, and — like every other palette here — the ratio between them is asserted rather than
 * assumed, because a badge that passed on cool white can fail on cream.
 */
export const LEAF = '#f4ecd6';
export const LEAF_INK = '#3a2f1f';
/**
 * The design canvas uses #8a7550 here. Measured on its own paper that is **3.76:1** — below the
 * 4.5 WCAG asks of small text, and these labels are 10px. Darkened along the same hue to 5.15,
 * which is the smallest change that clears the bar. Following a design into a contrast failure
 * would be following it badly.
 */
export const LEAF_LABEL = '#726040';

export function CertaintyBadge({
  certainty,
  lang = 'vi',
  prominent = false,
}: {
  certainty: Certainty;
  lang?: Lang;
  prominent?: boolean;
}): JSX.Element {
  const label = LABELS[certainty];
  const { ink, bg } = PALETTE[certainty];

  return (
    <span
      className={`badge${prominent ? ' prominent' : ''}`}
      style={{ color: ink, background: bg }}
      lang={lang}
      title={lang === 'vi' ? label.en : label.vi}
    >
      <span aria-hidden="true" className="glyph">
        {label.glyph}
      </span>
      {lang === 'vi' ? label.vi : label.en}
    </span>
  );
}
