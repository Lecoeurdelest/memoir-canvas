/**
 * The controls, shared by every skin.
 *
 * These are real DOM buttons outside any 3D transform, and they are the reason travelling the road
 * never depends on seeing it: the spine is skip-navigation, the turn pair is step-navigation, and
 * both obey the same wedge rule as the geometry. NFR-A11Y-01 — the whole demo core is reachable
 * with the canvas gone.
 */

import { useStore } from '../store/store';
import type { Lang } from '../store/store';
import type { SpreadNavigation } from './useSpreadNavigation';

const COPY = {
  prev: { vi: 'Lùi lại', en: 'Back' },
  next: { vi: 'Đi tiếp', en: 'Onward' },
  spine: { vi: 'Các mốc thời gian', en: 'Milestones' },
  wedged: {
    vi: 'Không đi tiếp được: chỗ này còn một chỗ chưa khớp.',
    en: 'The way is blocked: this stretch is still unsettled.',
  },
  locked: {
    vi: 'Chưa tới được: còn một chỗ chưa khớp phía trước.',
    en: 'Out of reach: something unsettled lies before it.',
  },
  at: { vi: 'Chặng', en: 'Stop' },
} satisfies Record<string, Record<Lang, string>>;

export function BookControls({ nav }: { nav: SpreadNavigation }): JSX.Element {
  const lang = useStore((s) => s.lang);
  const { spreads, index, wedged, lockedFrom, go, jumpTo } = nav;

  return (
    <div className="controls">
      <nav className="spine" aria-label={COPY.spine[lang]}>
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
              aria-label={`${year}${locked ? ` — ${COPY.locked[lang]}` : ''}`}
              onClick={() => jumpTo(i)}
            >
              {year}
            </button>
          );
        })}
      </nav>

      <div className="turn">
        <button type="button" onClick={() => go(-1)} disabled={index === 0}>
          ← {COPY.prev[lang]}
        </button>
        <span className="folio">
          {COPY.at[lang]} {index + 1} / {spreads.length}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={wedged || index >= spreads.length - 1}
          aria-describedby={wedged ? 'wedged' : undefined}
        >
          {COPY.next[lang]} →
        </button>
      </div>

      {wedged && index < spreads.length - 1 && (
        <p id="wedged" className="wedged" role="status">
          {COPY.wedged[lang]}
        </p>
      )}
    </div>
  );
}
