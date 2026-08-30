/**
 * TASK-022 — sources, verbatim excerpts, supports/contradicts stance.
 *
 * Two rules shape this file. A `contradicts` source is listed FIRST and marked, because burying
 * the thing that disagrees is exactly the failure the project exists to prevent. And `verbatim`
 * is rendered whole, never clipped or summarised — it is testimony, and paraphrasing it is the
 * same act as an agent rewriting a recollection.
 *
 * R5: read from src/store/, never mutate.
 */

import { CertaintyBadge } from './CertaintyBadge';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/store';
import type { Claim, Evidence, Source, Stance } from '../domain/types';

/** contradicts first, then supports, then mentions — the disagreement is never below the fold. */
const STANCE_ORDER: Stance[] = ['contradicts', 'supports', 'mentions'];

function SourceRow({
  evidence,
  source,
}: {
  evidence: Evidence;
  source: Source | undefined;
}): JSX.Element {
  const { t } = useTranslation();
  const people = useStore((s) => s.model?.people);
  const contributor = people?.find((p) => p.id === source?.contributor_id);

  if (!source) {
    return <li className="evidence missing">{t('evidence.none')}</li>;
  }

  return (
    <li className={`evidence stance-${evidence.stance}`}>
      <p className="evidence-head">
        <span className="stance">{t(`evidence.stance.${evidence.stance}`)}</span>
        <span className="kind">{t(`evidence.kind.${source.kind}`)}</span>
        <span className="title">{source.title}</span>
      </p>

      {/* Rendered whole. React escapes it; nothing here truncates or paraphrases. */}
      {source.verbatim && <blockquote className="verbatim">{source.verbatim}</blockquote>}

      {evidence.excerpt && evidence.excerpt !== source.verbatim && (
        <p className="excerpt">“{evidence.excerpt}”</p>
      )}

      {contributor && (
        <p className="contributor">
          {t('evidence.contributor')}: {contributor.display_name}
        </p>
      )}
    </li>
  );
}

export function EvidencePanel({ claim }: { claim: Claim }): JSX.Element {
  const { t } = useTranslation();
  const lang = useStore((s) => s.lang);
  const allEvidence = useStore((s) => s.model?.evidence) ?? [];
  const sources = useStore((s) => s.model?.sources) ?? [];

  const rows = allEvidence
    .filter((e) => e.claim_id === claim.id)
    .sort((a, b) => STANCE_ORDER.indexOf(a.stance) - STANCE_ORDER.indexOf(b.stance));

  return (
    <section className="evidence-panel" aria-labelledby={`ev-${claim.id}`}>
      {/* Headed by the claim it belongs to, not by the word "Evidence" — the page is already
          labelled that, and a reader needs to know WHICH claim these sources bear on. */}
      <h4 id={`ev-${claim.id}`}>
        <span className="ev-for">
          {claim.year_value === null
            ? t('evidence.noYear')
            : claim.year_precision === 'circa'
              ? t('evidence.circa', { year: claim.year_value })
              : claim.year_value}
        </span>
        <CertaintyBadge certainty={claim.certainty} lang={lang} />
      </h4>

      {rows.length === 0 ? (
        <p className="hint">{t('evidence.noEvidence')}</p>
      ) : (
        <ul className="evidence-list">
          {rows.map((e) => (
            <SourceRow
              key={`${e.claim_id}-${e.source_id}-${e.stance}`}
              evidence={e}
              source={sources.find((s) => s.id === e.source_id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
