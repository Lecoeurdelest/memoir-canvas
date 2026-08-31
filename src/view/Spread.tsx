/**
 * TASK-016 — one spread: recollection left, evidence right.
 *
 * Plain DOM. The 3D version renders the same component through `<Html transform>` (without
 * `occlude`, see FR-BOOK-07), so the accessibility tree and the tests do not change with the
 * renderer.
 *
 * R5: reads the projection, holds no domain state.
 */

import { EvidencePanel } from '../panels/EvidencePanel';
import { Tear } from './Tear';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/store';
import type { Spread as SpreadModel } from '../store/projection';

export function Spread({ spread }: { spread: SpreadModel }): JSX.Element {
  const { t } = useTranslation();
  const lang = useStore((s) => s.lang);
  const people = useStore((s) => s.model?.people) ?? [];
  const places = useStore((s) => s.model?.places) ?? [];

  const subject = people.find((p) => p.id === spread.subjectId);
  const lead = spread.claims[0];
  const place = places.find((p) => p.id === lead.object_place_id)?.name;
  const object = place ?? lead.object_text ?? '';

  return (
    <article className={`spread${spread.conflict ? ' spread-torn' : ''}`}>
      <div className="page page-left">
        <p className="page-label">{t('spread.recollection')}</p>
        {/* A sentence, not `subject · predicate`. The raw column name is a fact about the
            database, and TASK-031 keeps those behind Backstage. An unknown predicate falls back
            to its own name rather than to an empty gap. */}
        <h3 lang={lang}>
          {subject?.display_name} {t(`predicate.${spread.predicate}`, spread.predicate)}
          {object ? ` ${object}` : ''}
        </h3>
        <Tear spread={spread} />
      </div>

      <div className="page page-right">
        <p className="page-label">{t('spread.evidence')}</p>
        {spread.claims.map((c) => (
          <EvidencePanel key={c.id} claim={c} />
        ))}
      </div>
    </article>
  );
}
