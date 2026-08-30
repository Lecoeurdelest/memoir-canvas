/**
 * The controls, shared by every skin.
 *
 * These are real DOM buttons outside any 3D transform, and they are the reason travelling the road
 * never depends on seeing it: the spine is skip-navigation, the turn pair is step-navigation, and
 * both obey the same wedge rule as the geometry. NFR-A11Y-01 — the whole demo core is reachable
 * with the canvas gone.
 */

import { useTranslation } from 'react-i18next';
import type { SpreadNavigation } from './useSpreadNavigation';

export function BookControls({ nav }: { nav: SpreadNavigation }): JSX.Element {
  const { t } = useTranslation();
  const { spreads, index, wedged, lockedFrom, go, jumpTo } = nav;

  return (
    <div className="controls">
      <nav className="spine" aria-label={t('road.spine')}>
        {spreads.map((s, i) => {
          const locked = i >= lockedFrom;
          const year = s.claims[0].year_value ?? '—';
          return (
            <button
              key={s.key}
              type="button"
              className={`vertebra${s.conflict ? ' torn' : ''}${locked ? ' locked' : ''}`}
              aria-current={i === index}
              aria-disabled={locked}
              aria-label={`${year}${locked ? ` — ${t('road.locked')}` : ''}`}
              onClick={() => jumpTo(i)}
            >
              {year}
            </button>
          );
        })}
      </nav>

      <div className="turn">
        <button type="button" onClick={() => go(-1)} disabled={index === 0}>
          ← {t('road.prev')}
        </button>
        <span className="folio">
          {t('road.at')} {index + 1} / {spreads.length}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={wedged || index >= spreads.length - 1}
          aria-describedby={wedged ? 'wedged' : undefined}
        >
          {t('road.next')} →
        </button>
      </div>

      {wedged && index < spreads.length - 1 && (
        <p id="wedged" className="wedged" role="status">
          {t('road.wedged')}
        </p>
      )}
    </div>
  );
}
