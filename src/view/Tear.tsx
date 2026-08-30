/**
 * TASK-018 · TASK-019 — the tear, and its healing.
 *
 * The most valuable moment in the demo: the physical metaphor for an AI refusing to guess. The
 * tear exists if and only if an open conflict does (FR-BOOK-06 — a consequence of state, never
 * spontaneous), and the competing claims are rendered by one component in one grid, so neither
 * can be visually favoured by construction rather than by care.
 *
 * R5: reads the projection, and writes only by calling commands.resolveClaim — the same function
 * the resolve_claim tool calls. That shared door is R2, and it is what the Confirm button below
 * exists to demonstrate: a person and an agent reach the identical code, and only one of them
 * has the privilege to finish.
 */

import { useState } from 'react';
import * as commands from '../domain/commands';
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
  whoDecides: { vi: 'Ai là người quyết?', en: 'Who is deciding?' },
  pick: { vi: '— chọn một người —', en: '— choose a person —' },
  confirm: { vi: 'Xác nhận năm này', en: 'Confirm this year' },
  needPerson: {
    vi: 'Phải có tên một người thì mới chốt được. Cơ sở dữ liệu từ chối nếu không.',
    en: 'A person has to be named. The database refuses the write without one.',
  },
  working: { vi: 'đang ghi…', en: 'saving…' },
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
function CompetingClaim({
  claim,
  lang,
  onConfirm,
  busy,
}: {
  claim: Claim;
  lang: Lang;
  onConfirm: (() => void) | null;
  busy: boolean;
}): JSX.Element {
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

      {/* Both claims get the identical control, enabled on the identical condition. */}
      <button type="button" className="confirm" onClick={onConfirm ?? undefined}
              disabled={onConfirm === null || busy}>
        {busy ? COPY.working[lang] : COPY.confirm[lang]}
      </button>
    </div>
  );
}

export function Tear({ spread }: { spread: Spread }): JSX.Element | null {
  const lang = useStore((s) => s.lang);
  const people = useStore((s) => s.model?.people) ?? [];
  const refresh = useStore((s) => s.refresh);

  const [decider, setDecider] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only people a human entered may sign for a fact — the same rule the database enforces in
  // claim_confirmed_by_a_human. Offering the others would be offering a refusal.
  const witnesses = people.filter((p) => p.created_by === 'human');

  async function confirm(conflictId: string, winningClaimId: string): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      // R2: the same function the resolve_claim tool calls. No private path for the UI.
      await commands.resolveClaim(
        { conflict_id: conflictId, winning_claim_id: winningClaimId, resolved_by: decider },
        { actor: 'human', registeredBecause: 'a person confirmed it on the conflict page' },
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (spread.conflict) {
    const conflictId = spread.conflict.id;
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
            <CompetingClaim
              key={c.id}
              claim={c}
              lang={lang}
              busy={busy}
              onConfirm={decider ? () => void confirm(conflictId, c.id) : null}
            />
          ))}
        </div>

        <div className="decider">
          <label>
            <span>{COPY.whoDecides[lang]}</span>
            <select value={decider} onChange={(e) => setDecider(e.target.value)}>
              <option value="">{COPY.pick[lang]}</option>
              {witnesses.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name}
                </option>
              ))}
            </select>
          </label>
          {!decider && <p className="hint">{COPY.needPerson[lang]}</p>}
          {error && (
            <p className="result refused" role="alert">
              {error}
            </p>
          )}
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
