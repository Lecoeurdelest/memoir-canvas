/**
 * TASK-023 — the bilingual story card. floor_certainty comes from the data, never from the agent.
 *
 * The aesthetic constraint is the requirement: a well-written card must not bury a weak label.
 * So the badge sits above the prose, not under it, and the card is tinted by its own certainty —
 * an 'uncertain' card cannot be made to look settled by writing it well.
 *
 * R5: read from src/store/, never mutate.
 */

import { useState } from 'react';
import { CertaintyBadge } from './CertaintyBadge';
import { useStore } from '../store/store';
import type { Certainty, StoryCard as Card } from '../domain/types';

type Lang = 'vi' | 'en';

const CITED_BY: Record<Lang, string> = { vi: 'Dựa trên', en: 'Standing on' };
const CLAIM_WORD: Record<Lang, [string, string]> = {
  vi: ['lời kể', 'lời kể'],
  en: ['claim', 'claims'],
};

function ClaimLine({ id, lang }: { id: string; lang: Lang }): JSX.Element {
  const claim = useStore((s) => s.model?.claims.find((c) => c.id === id));
  const places = useStore((s) => s.model?.places);

  if (!claim) {
    return (
      <li className="cited missing">
        {lang === 'vi' ? 'lời kể đã bị thay thế' : 'a superseded claim'}
      </li>
    );
  }

  const place = places?.find((p) => p.id === claim.object_place_id)?.name;
  const object = place ?? claim.object_text ?? '';
  const year = claim.year_value
    ? claim.year_precision === 'circa'
      ? `${lang === 'vi' ? 'khoảng' : 'around'} ${claim.year_value}`
      : String(claim.year_value)
    : '';

  return (
    <li className="cited">
      <span className="predicate">{claim.predicate}</span>
      {object && <span> · {object}</span>}
      {year && <span> · {year}</span>}
      <CertaintyBadge certainty={claim.certainty} lang={lang} />
    </li>
  );
}

export function StoryCard({ card }: { card: Card }): JSX.Element {
  const [lang, setLang] = useState<Lang>('vi');
  const subject = useStore((s) => s.model?.people.find((p) => p.id === card.subject_person_id));

  const title = lang === 'vi' ? card.title_vi : card.title_en;
  const body = lang === 'vi' ? card.body_vi : card.body_en;
  const [one, many] = CLAIM_WORD[lang];
  const n = card.claim_ids.length;

  return (
    <article className={`card certainty-${card.floor_certainty as Certainty}`}>
      <div className="card-head">
        {/* Above the prose, deliberately. A reader meets the label before the story. */}
        <CertaintyBadge certainty={card.floor_certainty} lang={lang} prominent />
        <div className="lang" role="group" aria-label={lang === 'vi' ? 'Ngôn ngữ' : 'Language'}>
          {(['vi', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={lang === l}
              onClick={() => setLang(l)}
            >
              {l === 'vi' ? 'Tiếng Việt' : 'English'}
            </button>
          ))}
        </div>
      </div>

      <h3 lang={lang}>{title}</h3>
      {subject && <p className="subject">{subject.display_name}</p>}
      <p className="body" lang={lang}>
        {body}
      </p>

      <p className="cited-head">
        {CITED_BY[lang]} {n} {n === 1 ? one : many}
      </p>
      <ul className="cited-list">
        {card.claim_ids.map((id) => (
          <ClaimLine key={id} id={id} lang={lang} />
        ))}
      </ul>
    </article>
  );
}
