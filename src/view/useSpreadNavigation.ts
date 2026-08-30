/**
 * The single navigation truth, shared by every renderer.
 *
 * Extracted from CssBook so the flat book and the road cannot disagree about where the reader is
 * or what they are allowed to do. Both consume this; neither owns any of it.
 *
 * Two things live here and nowhere else:
 *
 *   The R4 contract. Arriving at a spread sets the UI state, and the tool registry is a pure
 *   function of that — landing on a torn spread is what puts `resolve_claim` in the agent's hands.
 *
 *   The wedge. You cannot travel FORWARD past an open conflict, by any route. Going back is
 *   always allowed, so a reader is never trapped.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/store';
import type { Spread } from '../store/projection';

/**
 * The furthest station reachable going forward: the first torn one, inclusive. A reader may walk
 * up to a tear and no further, whether they use the controls or the spine.
 */
export function reachLimit(spreads: readonly Spread[]): number {
  const torn = spreads.findIndex((s) => s.conflict !== null);
  return torn === -1 ? spreads.length - 1 : torn;
}

/** Forward is refused while standing on a tear. Pure, so the wedge is testable without a DOM. */
export function nextIndex(spreads: readonly Spread[], at: number, direction: 1 | -1): number {
  const next = at + direction;
  if (next < 0 || next >= spreads.length) return at;
  if (direction === 1 && spreads[at]?.conflict) return at;
  return next;
}

/**
 * Where the spine may land. Backward is always free — a reader is never trapped — but forward
 * stops at the same limit the turn controls obey, so no route walks through a tear.
 */
export function jumpTarget(spreads: readonly Spread[], at: number, target: number): number {
  if (target < 0 || target >= spreads.length) return at;
  if (target <= at) return target;
  return target <= reachLimit(spreads) ? target : at;
}

export interface SpreadNavigation {
  spreads: Spread[];
  index: number;
  spread: Spread | undefined;
  /** True when the current spread holds an open conflict, so forward travel is refused. */
  wedged: boolean;
  /** First index the wedge puts out of reach, or spreads.length when nothing blocks. */
  lockedFrom: number;
  go: (direction: 1 | -1) => void;
  jumpTo: (index: number) => void;
}

export function useSpreadNavigation(): SpreadNavigation {
  const spreads = useStore((s) => s.model?.spreads) ?? [];
  const setUi = useStore((s) => s.setUi);

  const [at, setAt] = useState(0);
  const index = Math.min(at, Math.max(spreads.length - 1, 0));
  const spread = spreads[index];

  const limit = useMemo(() => reachLimit(spreads), [spreads]);

  useEffect(() => {
    if (!spread) return setUi({ view: 'archive' });
    if (spread.conflict) {
      setUi({ view: 'conflict', conflictId: spread.conflict.id, subjectId: spread.subjectId });
    } else {
      setUi({ view: 'person', personId: spread.subjectId });
    }
  }, [spread?.key, spread?.conflict?.id, setUi, spread]);

  const go = useCallback(
    (direction: 1 | -1) => setAt((a) => nextIndex(spreads, a, direction)),
    [spreads],
  );

  // The spine used to call setAt raw, which walked straight through a tear the book had just
  // refused.
  const jumpTo = useCallback(
    (target: number) => setAt((a) => jumpTarget(spreads, a, target)),
    [spreads],
  );

  return {
    spreads,
    index,
    spread,
    wedged: spread?.conflict != null,
    lockedFrom: limit + 1,
    go,
    jumpTo,
  };
}
