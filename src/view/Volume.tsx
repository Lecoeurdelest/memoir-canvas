/**
 * TASK-035 — the spread, turned by hand.
 *
 * The rule that governs the layout, learned by building the opposite first and finding it
 * unreadable: **what must be read is never tilted; what is tilted never needs to be read.** The
 * spread lies near-frontal so every Vietnamese diacritic is crisp; the depth comes from the leaf
 * being lifted, the block of pages under it and the shadow in the gutter — none of which carries
 * a word.
 *
 * `FR-BOOK-08` — no visible navigation control. Travel is a drag across the page, a drag along
 * the fore-edge, or ArrowLeft/ArrowRight. The fore-edge tabs are the page block's own edges; they
 * are focusable and named because a control invisible to the pointer user must still be reachable
 * by assistive technology, which is the half of `FR-BOOK-08` that is easiest to lose.
 *
 * R5: reads the projection. Every rule about where a reader may go lives in useSpreadNavigation.
 */

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PALETTE } from '../panels/CertaintyBadge';
import { RefusedPage } from './RefusedPage';
import { Spread } from './Spread';
import { certaintyOf } from './forestLayout';
import { angleOf, usePageDrag } from './usePageDrag';
import type { SpreadNavigation } from './useSpreadNavigation';

export function Volume({ nav }: { nav: SpreadNavigation }): JSX.Element {
  const { t } = useTranslation();
  const { spreads, index, spread, wedged, lockedFrom, go, jumpTo } = nav;
  const stage = useRef<HTMLDivElement>(null);
  const drag = usePageDrag(go);

  // NFR-A11Y-03 names ArrowLeft/ArrowRight, and with no buttons left they are the whole keyboard
  // route. Bound to the book rather than the window so they do not hijack a form below it.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [go]);

  if (!spread) return <p className="hint">{t('road.empty')}</p>;

  const lifted = drag.progress !== 0;
  const refused = wedged && drag.progress < 0;

  return (
    <section className="volume" aria-label={t('volume.name')}>
      <div
        className={`book-body${refused ? ' refusing' : ''}`}
        ref={stage}
        tabIndex={0}
        role="group"
        aria-label={t('volume.name')}
        {...drag.bind}
      >
        {/* The block of pages the open spread rests on. Scenery: it carries no word. */}
        <div className="page-block" aria-hidden="true">
          <span className="block-under" />
          <span className="gutter" />
        </div>

        {spread.conflict ? (
          <RefusedPage spread={spread} conflict={spread.conflict} />
        ) : (
          <Spread spread={spread} />
        )}

        {/* The leaf under the reader's hand. Blank paper by construction — it is the one surface
            that tilts, so by the rule above it must never need reading. */}
        {lifted && (
          <div
            className="turning-leaf"
            aria-hidden="true"
            style={{ transform: `rotateY(${angleOf(drag.progress).toFixed(1)}deg)` }}
          />
        )}

        {/* The fore-edge: the stacked edges of the page block, one per memory, coloured by how
            sure the archive is. This replaces the row of year buttons entirely. */}
        <div className="fore-edge" role="group" aria-label={t('volume.fore')}>
          {spreads.map((s, i) => {
            const locked = i >= lockedFrom;
            const year = s.claims[0].year_value ?? '—';
            return (
              <button
                key={s.key}
                type="button"
                className={`edge${i === index ? ' here' : ''}${s.conflict ? ' torn' : ''}${
                  locked ? ' locked' : ''
                }`}
                style={{ background: PALETTE[certaintyOf(s)].ink }}
                aria-current={i === index}
                aria-disabled={locked}
                aria-label={`${year}${locked ? ` — ${t('road.locked')}` : ''}`}
                onPointerEnter={(e) => {
                  // Dragging ALONG the fore-edge riffles through the book, the way a thumb does.
                  if (e.buttons === 1 && !locked) jumpTo(i);
                }}
                onClick={() => jumpTo(i)}
              >
                <span className="edge-year">{year}</span>
              </button>
            );
          })}
        </div>
      </div>

      {wedged && index < spreads.length - 1 && (
        <p className="wedged" role="status">
          {t('road.wedged')}
        </p>
      )}
    </section>
  );
}
