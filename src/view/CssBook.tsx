/**
 * TASK-026 — the book, in CSS and DOM, with no WebGL anywhere.
 *
 * Built first rather than as a day-4 contingency: it is the only version an automated test can
 * read, it is the more accessible one, and NFR-PORT-01 requires the app to paint and stay
 * painted without WebGL regardless.
 *
 * Two behaviours carry the metaphor:
 *
 *   Turning to a spread sets the UI state, and the registry is a pure function of that (R4). So
 *   opening a torn page is what puts `resolve_claim` in the agent's hands — steps 6-9 of the
 *   core scenario are this navigation, not a separate mechanism.
 *
 *   A torn page wedges the book: you cannot turn FORWARD past it. Going back is allowed, so the
 *   reader is never trapped, but they cannot move on until a person decides. That is what "the
 *   book will not close" means once the book is flat.
 *
 * R5: reads the projection, writes nothing but UI state.
 */

import { useEffect, useState } from 'react';
import { Spread } from './Spread';
import { useStore } from '../store/store';
import type { Lang } from '../store/store';

const COPY = {
  empty: { vi: 'Kho lưu trữ còn trống.', en: 'The archive is empty.' },
  prev: { vi: 'Trang trước', en: 'Previous' },
  next: { vi: 'Trang sau', en: 'Next' },
  spine: { vi: 'Gáy sách', en: 'Spine' },
  wedged: {
    vi: 'Không lật qua được: trang này còn rách.',
    en: 'Cannot turn past: this page is still torn.',
  },
  of: { vi: 'trên', en: 'of' },
} satisfies Record<string, Record<Lang, string>>;

export function CssBook(): JSX.Element {
  const lang = useStore((s) => s.lang);
  const spreads = useStore((s) => s.model?.spreads) ?? [];
  const setUi = useStore((s) => s.setUi);

  const [at, setAt] = useState(0);
  const index = Math.min(at, Math.max(spreads.length - 1, 0));
  const spread = spreads[index];

  // The registry follows the page (R4). Opening a torn spread is what registers resolve_claim;
  // turning away withdraws it again.
  useEffect(() => {
    if (!spread) return setUi({ view: 'archive' });
    if (spread.conflict) {
      setUi({ view: 'conflict', conflictId: spread.conflict.id, subjectId: spread.subjectId });
    } else {
      setUi({ view: 'person', personId: spread.subjectId });
    }
  }, [spread?.key, spread?.conflict?.id, setUi, spread]);

  if (!spread) {
    return (
      <section className="book" aria-label="Book">
        <p className="hint">{COPY.empty[lang]}</p>
      </section>
    );
  }

  const wedged = spread.conflict !== null;

  return (
    <section className="book" aria-label="Book">
      <nav className="spine" aria-label={COPY.spine[lang]}>
        {spreads.map((s, i) => (
          <button
            key={s.key}
            type="button"
            className={`vertebra${s.conflict ? ' torn' : ''}`}
            aria-current={i === index}
            aria-label={`${s.predicate} · ${s.claims[0].year_value ?? ''}`}
            onClick={() => setAt(i)}
          >
            {s.claims[0].year_value ?? '—'}
          </button>
        ))}
      </nav>

      <Spread spread={spread} />

      <div className="turn">
        <button type="button" onClick={() => setAt(index - 1)} disabled={index === 0}>
          ← {COPY.prev[lang]}
        </button>
        <span className="folio">
          {index + 1} {COPY.of[lang]} {spreads.length}
        </span>
        <button
          type="button"
          onClick={() => setAt(index + 1)}
          disabled={wedged || index >= spreads.length - 1}
          aria-describedby={wedged ? 'wedged' : undefined}
        >
          {COPY.next[lang]} →
        </button>
      </div>

      {wedged && index < spreads.length - 1 && (
        <p id="wedged" className="wedged" role="status">
          {COPY.wedged[lang]}
        </p>
      )}
    </section>
  );
}
