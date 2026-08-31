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

export function Cover({ spread, onOpen }: { spread: Spread; onOpen: () => void }): JSX.Element {
  const { t } = useTranslation();
  const lang = useStore((s) => s.lang);
  const people = useStore((s) => s.model?.people) ?? [];

  const subject = people.find((p) => p.id === spread.subjectId)?.display_name ?? '';
  const year = spread.claims[0]?.year_value;

  return (
    <div className="cover-stage">
      <button
        type="button"
        className={`cover${spread.conflict ? ' cover-torn' : ''}`}
        onClick={onOpen}
        aria-label={`${subject} ${t(`predicate.${spread.predicate}`, spread.predicate)}${year ? ` · ${year}` : ''} — ${t('volume.openIt')}`}
        lang={lang}
      >
        <span className="cover-board" aria-hidden="true">
          <span className="cover-spine" />
          <span className="cover-rule" />
          <span className="cover-title">{subject}</span>
          <span className="cover-sub">{t(`predicate.${spread.predicate}`, spread.predicate)}</span>
          {year !== null && year !== undefined && <span className="cover-year">{year}</span>}
        </span>
      </button>
    </div>
  );
}
