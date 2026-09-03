/**
 * TASK-035 — the closed volume, and the way in from the forest.
 *
 * A firefly does not become a page. It becomes a bound book with a name on it, and the book
 * opens. The pause matters: it is the moment a memory stops being a dot in a wood and becomes
 * a thing somebody wrote down.
 *
 * No instruction copy (`FR-BOOK-08`). A closed book with a title, under a cursor, is already the
 * most legible affordance there is.
 *
 * R5: pure presentation, no store access beyond the spread it is handed.
 */

import { useTranslation } from 'react-i18next';
import { useStore } from '../store/store';
import type { Spread } from '../store/projection';

export function Cover({
  spread,
  label,
  onOpen,
}: {
  /** The memory this volume holds. Absent for the blank book, which has nothing on it yet. */
  spread?: Spread;
  /** What a screen reader should call a coverless book. */
  label?: string;
  onOpen: () => void;
}): JSX.Element {
  const { t } = useTranslation();
  const lang = useStore((s) => s.lang);
  const people = useStore((s) => s.model?.people) ?? [];

  const subject = spread ? (people.find((p) => p.id === spread.subjectId)?.display_name ?? '') : '';
  const year = spread?.claims[0]?.year_value;
  const named = spread
    ? `${subject} ${t(`predicate.${spread.predicate}`, spread.predicate)}${year ? ` · ${year}` : ''}`
    : (label ?? '');

  return (
    <div className="cover-stage">
      <button
        type="button"
        className={`cover${spread?.conflict ? ' cover-torn' : ''}`}
        onClick={onOpen}
        aria-label={`${named} — ${t('volume.openIt')}`}
        lang={lang}
      >
        <span className="cover-board" aria-hidden="true">
          <span className="cover-spine" />
          <span className="cover-rule" />
          {spread && (
            <>
              <span className="cover-title">{subject}</span>
              <span className="cover-sub">{t(`predicate.${spread.predicate}`, spread.predicate)}</span>
              {year !== null && year !== undefined && <span className="cover-year">{year}</span>}
            </>
          )}
        </span>
      </button>
    </div>
  );
}
