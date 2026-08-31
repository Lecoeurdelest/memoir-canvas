/**
 * TASK-026 · TASK-035 — the archive with no gesture, no perspective and no 3D of any kind.
 *
 * This is the floor. `NFR-PORT-01` requires the app to paint and stay painted when the volume
 * cannot render, and `NFR-A11Y-01` requires the whole demo core to be reachable without it. It is
 * forced with `?flat=1`.
 *
 * It became a LIST when the turn buttons went (`FR-BOOK-08`): every memory laid out in order, so
 * there is nothing to navigate and nothing to gesture at. That is the strongest possible escape
 * hatch — but it means the wedge has to be honoured by what is *rendered*, not by what is
 * reachable. A memory behind an open contradiction shows its year and its refusal, never its
 * content. Otherwise `?flat=1` would be a way to read straight past a tear the book refuses.
 *
 * R5: reads the projection. All navigation truth lives in useSpreadNavigation.
 */

import { RefusedPage } from './RefusedPage';
import { Spread } from './Spread';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/store';
import type { SpreadNavigation } from './useSpreadNavigation';

export function CssBook({ nav }: { nav: SpreadNavigation }): JSX.Element {
  const { t } = useTranslation();
  const people = useStore((s) => s.model?.people) ?? [];
  const { spreads, lockedFrom } = nav;

  if (spreads.length === 0) {
    return (
      <section className="book" aria-label={t('volume.name')}>
        <p className="hint">{t('road.empty')}</p>
      </section>
    );
  }

  return (
    <section className="book" aria-label={t('volume.name')}>
      {spreads.map((spread, i) => {
        if (i >= lockedFrom) {
          const subject = people.find((p) => p.id === spread.subjectId)?.display_name ?? '';
          const year = spread.claims[0].year_value ?? '—';
          return (
            <article key={spread.key} className="spread spread-locked" aria-disabled="true">
              <p className="page-label">{year}</p>
              <h3>{subject} {t(`predicate.${spread.predicate}`, spread.predicate)}</h3>
              <p className="hint">{t('road.locked')}</p>
            </article>
          );
        }
        return spread.conflict ? (
          <RefusedPage key={spread.key} spread={spread} conflict={spread.conflict} />
        ) : (
          <Spread key={spread.key} spread={spread} />
        );
      })}
    </section>
  );
}
