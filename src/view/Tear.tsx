/**
 * TASK-019 · TASK-036 — the healing.
 *
 * This used to hold the refusal too. `TASK-036` moved that to `RefusedPage.tsx`, where the two
 * competing claims face each other across the tear instead of sharing one page — so what is left
 * here is the other half of the pair, and the more easily forgotten one.
 *
 * A settled conflict shows **who settled it**. Without the name this is a green tick, and a green
 * tick is exactly the thing this project exists to argue against: a fact with nobody behind it.
 *
 * R5: reads the projection, writes nothing.
 */

import { useTranslation } from 'react-i18next';
import type { Spread } from '../store/projection';

export function Tear({ spread }: { spread: Spread }): JSX.Element | null {
  const { t } = useTranslation();

  if (!spread.resolvedBy) return null;

  return (
    <p className="healed" role="status">
      <span aria-hidden="true">✓</span> {t('tear.healed')} · {t('tear.confirmedBy')}:{' '}
      <b>{spread.resolvedBy.display_name}</b>
    </p>
  );
}
