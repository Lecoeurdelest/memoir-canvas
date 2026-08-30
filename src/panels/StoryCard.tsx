/**
 * TASK-023 — the bilingual story card. floor_certainty comes from the data, never from the agent.
 *
 * The aesthetic constraint is the requirement: a well-written card must not bury a weak label.
 * So the badge sits above the prose, not under it, and the card is tinted by its own certainty —
 * an 'uncertain' card cannot be made to look settled by writing it well.
 *
 * R5: read from src/store/, never mutate.
 */

import { CertaintyBadge } from './CertaintyBadge';
import { EvidencePanel } from './EvidencePanel';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/store';
import type { Certainty, StoryCard as Card } from '../domain/types';

function ClaimLine({ id }: { id: string }): JSX.Element {
  const { t } = useTranslation();
  const claim = useStore((s) => s.model?.claims.find((c) => c.id === id));
  const places = useStore((s) => s.model?.places);

  if (!claim) {
    return (
      <li className="cited missing">
        {t('card.superseded')}
      </li>
    );
  }

  const place = places?.find((p) => p.id === claim.object_place_id)?.name;
  const object = place ?? claim.object_text ?? '';
  const year = claim.year_value
    ? claim.year_precision === 'circa'
      ? t('evidence.circa', { year: claim.year_value })
      : String(claim.year_value)
    : '';

  return (
    <li className="cited">
      <div className="cited-line">
        <span className="predicate">{claim.predicate}</span>
        {object && <span> · {object}</span>}
        {year && <span> · {year}</span>}
      </div>
      <EvidencePanel claim={claim} />
    </li>
  );
}

export function StoryCard({ card }: { card: Card }): JSX.Element {
  const { t } = useTranslation();
  const lang = useStore((s) => s.lang);
  const subject = useStore((s) => s.model?.people.find((p) => p.id === card.subject_person_id));

  const title = lang === 'vi' ? card.title_vi : card.title_en;
  const body = lang === 'vi' ? card.body_vi : card.body_en;
  const n = card.claim_ids.length;

  return (
    <article className={`card certainty-${card.floor_certainty as Certainty}`}>
      <div className="card-head">
        {/* Above the prose, deliberately. A reader meets the label before the story. */}
        <CertaintyBadge certainty={card.floor_certainty} lang={lang} prominent />
      </div>

      <h3 lang={lang}>{title}</h3>
      {subject && <p className="subject">{subject.display_name}</p>}
      <p className="body" lang={lang}>
        {body}
      </p>

      <p className="cited-head">
        {t('card.citedBy')} {n} {t('card.claim', { count: n })}
      </p>
      <ul className="cited-list">
        {card.claim_ids.map((id) => (
          <ClaimLine key={id} id={id} />
        ))}
      </ul>
    </article>
  );
}
