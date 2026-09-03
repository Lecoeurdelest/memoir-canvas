/**
 * TASK-016 · TASK-048 — one memory, written out as a book writes things out.
 *
 * The owner took the apparatus off the page: no RECOLLECTION/EVIDENCE headings, no certainty
 * chips, no bordered group per claim. What is left is prose on paper — the memory as a sentence,
 * then each year, then each source in a line of its own with its testimony under it. The words
 * that carried meaning are still words: `contradicts` and `supports` are written out, and so is
 * how sure the archive is, because a picture that says it in colour alone says it to nobody
 * (NFR-A11Y-02).
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
            <span className="stance">{t(`evidence.stance.${e.stance}`)}</span>{' '}
            <span className="kind">{t(`evidence.kind.${source.kind}`)}</span>{' '}
            <span className="title">{source.title}</span>
            {/* Testimony, whole: nothing here truncates or paraphrases it. */}
            {source.verbatim && <q className="verbatim">{source.verbatim}</q>}
            {e.excerpt && e.excerpt !== source.verbatim && <q className="excerpt">{e.excerpt}</q>}
            {contributor && <span className="hand">— {contributor.display_name}</span>}
          </p>
        );
      })}

      <PhotoDrop claim={claim} />
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
          <ClaimProse claim={claim} />
        </Fragment>
      ))}
    </article>
  );
}
