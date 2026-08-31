/**
 * TASK-036 — the page that will not turn.
 *
 * This is the project's argument rendered as an object. The archive says two things about one
 * step in a life; no tool the agent holds can close that, and the book will not let a reader walk
 * past it. The refusal exists if and only if `spread.conflict` does (`FR-BOOK-06`), so it can
 * never appear on its own.
 *
 * **Neither claim is favoured, by construction rather than by care.** One component renders both,
 * in one grid with equal tracks, facing each other across the tear. There is no `primary` prop to
 * pass and no ordering emphasis to get wrong — the order is by year, which is the data's order.
 *
 * Settling it is putting your name to it: pick a person, then put that name on the year they
 * stand behind. A pointer can drag the name across; a keyboard arms the same two steps. Both call
 * `commands.resolveClaim` — the same function the `resolve_claim` tool calls, which is `R2`, and
 * which is the point: a person and an agent reach identical code and only one of them may finish.
 *
 * No instruction copy (`FR-BOOK-08`). Pressing a name is what arms the years; nothing needs
 * saying, because nothing is a target until a name has been chosen.
 *
 * R5: reads the projection, writes only through `commands.*`.
 */

import { useState } from 'react';
import * as commands from '../domain/commands';
import { EvidencePanel } from '../panels/EvidencePanel';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/store';
import type { Spread } from '../store/projection';
import type { Claim } from '../domain/types';
import type { Conflict } from '../domain/types';

type Translate = ReturnType<typeof useTranslation>['t'];

function yearOf(claim: Claim, t: Translate): string {
  if (claim.year_value === null) return t('tear.noYear');
  return claim.year_precision === 'circa'
    ? t('evidence.circa', { year: claim.year_value })
    : String(claim.year_value);
}

export function RefusedPage({
  spread,
  conflict,
}: {
  spread: Spread;
  conflict: Conflict;
}): JSX.Element {
  const { t } = useTranslation();
  const people = useStore((s) => s.model?.people) ?? [];
  const refresh = useStore((s) => s.refresh);

  // Only people a human entered may sign for a fact — the same rule the database enforces in
  // claim_confirmed_by_a_human. Offering the others would be offering a refusal.
  const witnesses = people.filter((p) => p.created_by === 'human');

  const [holding, setHolding] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function settle(winningClaimId: string, decidedBy: string): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await commands.resolveClaim(
        { conflict_id: conflict.id, winning_claim_id: winningClaimId, resolved_by: decidedBy },
        { actor: 'human', registeredBecause: 'a person put their name to a year' },
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
      setHolding(null);
      setOver(null);
    }
  }

  const held = witnesses.find((p) => p.id === holding);

  return (
    <article className="refused" aria-labelledby="refused-heading">
      <p className="refused-head" id="refused-heading">
        <span aria-hidden="true" className="rip">
          ✂
        </span>
        {t('refused.heading')}
      </p>
      <p className="refused-why">{t('tear.why')}</p>

      {/* One grid, equal tracks, torn down the middle. */}
      <div className="facing">
        {spread.claims.map((claim) => {
          const armed = held !== undefined && !busy;
          const isOver = over === claim.id;
          return (
            <div
              key={claim.id}
              className={`facing-page${armed ? ' armed' : ''}${isOver ? ' over' : ''}`}
              onDragOver={(e) => {
                if (!armed) return;
                e.preventDefault();
                setOver(claim.id);
              }}
              onDragLeave={() => setOver((o) => (o === claim.id ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                const who = e.dataTransfer.getData('text/plain') || holding;
                if (who) void settle(claim.id, who);
              }}
            >
              {/* EvidencePanel heads itself with the claim's year and certainty. Repeating them
                  here printed both twice; promoting its own heading is the fix, so the claim
                  header has exactly one source. */}
              <EvidencePanel claim={claim} />

              {/* Not a target until a name is in hand. That is what teaches the gesture, and it
                  is why no sentence is needed to explain it. */}
              <button
                type="button"
                className="put-name"
                disabled={!armed}
                onClick={() => held && void settle(claim.id, held.id)}
                aria-label={
                  held
                    ? t('refused.putNameOn', { name: held.display_name, year: yearOf(claim, t) })
                    : t('refused.pickFirst')
                }
              >
                {busy ? t('tear.working') : held ? held.display_name : '—'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="witnesses" role="group" aria-label={t('tear.whoDecides')}>
        {witnesses.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`witness${holding === p.id ? ' held' : ''}`}
            aria-pressed={holding === p.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', p.id);
              setHolding(p.id);
            }}
            onDragEnd={() => setOver(null)}
            onClick={() => setHolding((h) => (h === p.id ? null : p.id))}
          >
            {p.display_name}
          </button>
        ))}
      </div>

      {error && (
        <p className="result refused-error" role="alert">
          {error}
        </p>
      )}

      <p className="refused-foot">{t('refused.cannotTurn')}</p>
    </article>
  );
}
