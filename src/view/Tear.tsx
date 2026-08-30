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
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/store';
import type { Spread } from '../store/projection';
import type { Claim } from '../domain/types';

type Translate = ReturnType<typeof useTranslation>['t'];

function yearOf(claim: Claim, t: Translate): string {
  if (claim.year_value === null) return t('tear.noYear');
  return claim.year_precision === 'circa'
    ? t('evidence.circa', { year: claim.year_value })
    : String(claim.year_value);
}

/**
 * One component for every competing claim, so "neither visually favoured" is structural. There
 * is no `primary` prop to pass and no ordering emphasis to get wrong.
 */
function CompetingClaim({
  claim,
  onConfirm,
  busy,
}: {
  claim: Claim;
  onConfirm: (() => void) | null;
  busy: boolean;
}): JSX.Element {
  const { t } = useTranslation();
  const lang = useStore((s) => s.lang);
  const sources = useStore((s) => s.model?.sources) ?? [];
  const evidence = useStore((s) => s.model?.evidence) ?? [];

  const supporting = evidence
    .filter((e) => e.claim_id === claim.id && e.stance === 'supports')
    .map((e) => sources.find((s) => s.id === e.source_id))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);

  return (
    <div className="competing">
      <p className="year">{yearOf(claim, t)}</p>
      <CertaintyBadge certainty={claim.certainty} lang={lang} />
      {supporting.map((s) => (
        <p key={s.id} className="says">
          <span className="says-label">{t('tear.says')}</span>
          {s.verbatim ?? s.title}
        </p>
      ))}

      {/* Both claims get the identical control, enabled on the identical condition. */}
      <button type="button" className="confirm" onClick={onConfirm ?? undefined}
              disabled={onConfirm === null || busy}>
        {busy ? t('tear.working') : t('tear.confirm')}
      </button>
    </div>
  );
}

export function Tear({ spread }: { spread: Spread }): JSX.Element | null {
  const { t } = useTranslation();
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
      <div className="tear" role="group" aria-label={t('tear.torn')}>
        <p className="tear-head">
          <span aria-hidden="true" className="rip">
            ✂
          </span>
          {t('tear.torn')}
        </p>
        <p className="tear-why">{t('tear.why')}</p>

        {/* One grid, equal tracks. Order is by year, which is the data's order, not a ranking. */}
        <div className="competing-grid">
          {spread.claims.map((c) => (
            <CompetingClaim
              key={c.id}
              claim={c}
              busy={busy}
              onConfirm={decider ? () => void confirm(conflictId, c.id) : null}
            />
          ))}
        </div>

        <div className="decider">
          <label>
            <span>{t('tear.whoDecides')}</span>
            <select value={decider} onChange={(e) => setDecider(e.target.value)}>
              <option value="">{t('tear.pick')}</option>
              {witnesses.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name}
                </option>
              ))}
            </select>
          </label>
          {!decider && <p className="hint">{t('tear.needPerson')}</p>}
          {error && (
            <p className="result refused" role="alert">
              {error}
            </p>
          )}
        </div>

        <p className="tear-foot">{t('tear.cannotClose')}</p>
      </div>
    );
  }

  if (spread.resolvedBy) {
    // TASK-019 — a human is visible in the result. Without the name this is just a green tick.
    return (
      <p className="healed" role="status">
        <span aria-hidden="true">✓</span> {t('tear.healed')} · {t('tear.confirmedBy')}:{' '}
        <b>{spread.resolvedBy.display_name}</b>
      </p>
    );
  }

  return null;
}
