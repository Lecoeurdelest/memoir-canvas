/**
 * TASK-021 — the five certainty labels, bilingual, never relying on colour alone.
 *
 * NFR-A11Y-02: each label carries a word AND a distinct glyph, so the ladder survives greyscale,
 * colour blindness, and a screen reader that reports none of the styling. The glyph is decorative
 * — the accessible name is the word.
 *
 * R5: pure presentation, no store access, no writes.
 */

import type { Certainty } from '../domain/types';

type Lang = 'vi' | 'en';

/**
 * Ordered weakest to strongest, matching CERTAINTY_ORDER and the SQL enum. The glyphs are a
 * filling scale rather than five unrelated icons, so the ranking reads without the colour.
 */
export const LABELS: Record<Certainty, { vi: string; en: string; glyph: string }> = {
  uncertain: { vi: 'Chưa rõ', en: 'Uncertain', glyph: '○' },
  oral: { vi: 'Lời kể', en: 'Oral recollection', glyph: '◔' },
  document_supported: { vi: 'Có tài liệu', en: 'Document-supported', glyph: '◑' },
  conflicting: { vi: 'Mâu thuẫn', en: 'Conflicting', glyph: '◈' },
  confirmed: { vi: 'Đã xác nhận', en: 'Confirmed', glyph: '●' },
};

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
