/**
 * TASK-018 · TASK-019 — the tear, and its healing.
 *
 * The most valuable moment in the demo: the physical metaphor for an AI refusing to guess. The
 * tear exists if and only if an open conflict does (FR-BOOK-06 — a consequence of state, never
 * spontaneous), and the competing claims are rendered by one component in one grid, so neither
 * can be visually favoured by construction rather than by care.
 *
 * R5: reads the projection, writes nothing. Resolution happens through commands, elsewhere.
 */

import { CertaintyBadge } from '../panels/CertaintyBadge';
import { useStore } from '../store/store';
import type { Lang } from '../store/store';
import type { Spread } from '../store/projection';
import type { Claim } from '../domain/types';

const COPY = {
  torn: { vi: 'Trang này rách', en: 'This page is torn' },
  why: {
    vi: 'Kho lưu trữ tự mâu thuẫn với chính nó. Không công cụ nào của tác nhân AI khép lại được — chỉ một người mới quyết được.',
    en: 'The archive disagrees with itself. No tool available to the agent can close this — only a person can decide.',
  },
  cannotClose: {
    vi: 'Sách không gấp lại được ở đây.',
    en: 'The book will not close here.',
  },
  healed: { vi: 'Vết rách đã lành', en: 'The tear has healed' },
  confirmedBy: { vi: 'Người xác nhận', en: 'Confirmed by' },
  says: { vi: 'Nguồn nói', en: 'This says' },
} satisfies Record<string, Record<Lang, string>>;

function yearOf(claim: Claim, lang: Lang): string {
  if (claim.year_value === null) return lang === 'vi' ? 'không rõ năm' : 'no year';
  return claim.year_precision === 'circa'
    ? `${lang === 'vi' ? 'khoảng' : 'around'} ${claim.year_value}`
    : String(claim.year_value);
}

/**
 * One component for every competing claim, so "neither visually favoured" is structural. There
 * is no `primary` prop to pass and no ordering emphasis to get wrong.
 */
function CompetingClaim({ claim, lang }: { claim: Claim; lang: Lang }): JSX.Element {
  const sources = useStore((s) => s.model?.sources) ?? [];
  const evidence = useStore((s) => s.model?.evidence) ?? [];

  const supporting = evidence
    .filter((e) => e.claim_id === claim.id && e.stance === 'supports')
    .map((e) => sources.find((s) => s.id === e.source_id))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);

  return (
    <div className="competing">
      <p className="year">{yearOf(claim, lang)}</p>
      <CertaintyBadge certainty={claim.certainty} lang={lang} />
      {supporting.map((s) => (
        <p key={s.id} className="says">
          <span className="says-label">{COPY.says[lang]}</span>
          {s.verbatim ?? s.title}
        </p>
      ))}
    </div>
  );
}

export function Tear({ spread }: { spread: Spread }): JSX.Element | null {
  const lang = useStore((s) => s.lang);

  if (spread.conflict) {
    return (
      <div className="tear" role="group" aria-label={COPY.torn[lang]}>
        <p className="tear-head">
          <span aria-hidden="true" className="rip">
            ✂
          </span>
          {COPY.torn[lang]}
        </p>
        <p className="tear-why">{COPY.why[lang]}</p>

        {/* One grid, equal tracks. Order is by year, which is the data's order, not a ranking. */}
        <div className="competing-grid">
          {spread.claims.map((c) => (
            <CompetingClaim key={c.id} claim={c} lang={lang} />
          ))}
        </div>

        <p className="tear-foot">{COPY.cannotClose[lang]}</p>
      </div>
    );
  }

  if (spread.resolvedBy) {
    // TASK-019 — a human is visible in the result. Without the name this is just a green tick.
    return (
      <p className="healed" role="status">
        <span aria-hidden="true">✓</span> {COPY.healed[lang]} · {COPY.confirmedBy[lang]}:{' '}
        <b>{spread.resolvedBy.display_name}</b>
      </p>
    );
  }

  return null;
}
