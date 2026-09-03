/**
 * TASK-016 · TASK-048 — one memory, written out as a book writes things out.
 *
 * The owner took the apparatus off the page: no RECOLLECTION/EVIDENCE headings, no certainty
 * chips, no bordered group per claim, and no stance or kind tag on a source. What is left is
 * prose on paper — the memory as a sentence, then each year, then each source named with its
 * testimony under it and the hand that gave it at the end.
 *
 * One word survives the cull, and only where it is load-bearing: a source that CONTRADICTS says
 * so. Burying the thing that disagrees is the exact failure this project exists to prevent, and
 * a page that marked it by colour alone would be marking it for nobody (NFR-A11Y-02). Agreement
 * needs no word — it is what a source beneath a claim already means.
 *
 * In the book skin these flow as TWO COLUMNS across the spread, so what will not fit the near
 * leaf runs onto the far one instead of growing a scrollbar. The flat list (NFR-PORT-01) renders
 * the same component as one plain column.
 *
 * R5: reads the projection, holds no domain state.
 */

import { Fragment } from 'react';
import { PhotoDrop } from '../panels/PhotoDrop';
import { STANCE_ORDER } from '../panels/EvidencePanel';
import { Tear } from './Tear';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/store';
import type { Claim } from '../domain/types';
import type { Spread as SpreadModel } from '../store/projection';

/** One claim, told rather than tabulated: the year it stands on, then what bears on it. */
function ClaimProse({ claim }: { claim: Claim }): JSX.Element {
  const { t } = useTranslation();
  const allEvidence = useStore((s) => s.model?.evidence) ?? [];
  const sources = useStore((s) => s.model?.sources) ?? [];
  const people = useStore((s) => s.model?.people) ?? [];

  const rows = allEvidence
    .filter((e) => e.claim_id === claim.id)
    .sort((a, b) => STANCE_ORDER.indexOf(a.stance) - STANCE_ORDER.indexOf(b.stance));

  const year =
    claim.year_value === null
      ? t('evidence.noYear')
      : claim.year_precision === 'circa'
        ? t('evidence.circa', { year: claim.year_value })
        : String(claim.year_value);

  return (
    <>
      <p className="entry-year">
        {year} · {t(`certainty.${claim.certainty}`)}
      </p>

      {rows.length === 0 && <p className="entry-source quiet">{t('evidence.noEvidence')}</p>}

      {rows.map((e) => {
        const source = sources.find((s) => s.id === e.source_id);
        if (!source) {
          return (
            <p key={`${e.claim_id}-${e.source_id}`} className="entry-source quiet">
              {t('evidence.none')}
            </p>
          );
        }
        const contributor = people.find((p) => p.id === source.contributor_id);
        return (
          <p key={`${e.claim_id}-${e.source_id}-${e.stance}`} className={`entry-source stance-${e.stance}`}>
            {e.stance === 'contradicts' && (
              <span className="stance">{t('evidence.stance.contradicts')} </span>
            )}
            <span className="title">{source.title}</span>
            {/* Testimony, whole: nothing here truncates or paraphrases it. */}
            {source.verbatim && <q className="verbatim">{source.verbatim}</q>}
            {e.excerpt && e.excerpt !== source.verbatim && <q className="excerpt">{e.excerpt}</q>}
            {contributor && <span className="hand">— {contributor.display_name}</span>}
          </p>
        );
      })}
    </>
  );
}

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
    <article className={`spread entry${spread.conflict ? ' spread-torn' : ''}`} lang={lang}>
      {/* A sentence, not `subject · predicate`. The raw column name is a fact about the
          database, and TASK-031 keeps those behind Backstage. */}
      <h3 className="entry-open">
        {subject?.display_name} {t(`predicate.${spread.predicate}`, spread.predicate)}
        {object ? ` ${object}` : ''}
      </h3>

      <Tear spread={spread} />

      {spread.claims.map((claim) => (
        <Fragment key={claim.id}>
          {/* The entry itself is where a photograph lands — drop, paste or double-press it. */}
          <PhotoDrop claim={claim}>
            <ClaimProse claim={claim} />
          </PhotoDrop>
        </Fragment>
      ))}
    </article>
  );
}
