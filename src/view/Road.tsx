/**
 * The road — the archive as a path you travel, not a book you leaf through.
 *
 * Opening the archive lays the pages end to end and you glide forward along them; travelling
 * forward is travelling through the family's time. Built with CSS perspective rather than WebGL,
 * for three reasons that all point the same way: it costs nothing to download, Vietnamese
 * diacritics shape correctly because they are ordinary text in ordinary DOM, and there is no GL
 * context to lose — so NFR-PORT-01 holds by construction instead of by fallback.
 *
 * What is in 3D and what is not, deliberately:
 *
 *   The WORLD carries the milestones and the tear. It is scenery, and it is aria-hidden — nothing
 *   is knowable only by looking at it.
 *
 *   The STATION reads as flat DOM below the horizon. Putting the person selector inside a
 *   transformed subtree anchors native pickers to the untransformed rect in WKWebView, which is
 *   the browser NFR-PORT names — so the thing a person must click never enters the 3D at all.
 *
 * R5: reads the projection, writes nothing but UI state, and owns no navigation truth.
 */

import { useEffect, useRef } from 'react';
import { BookControls } from './BookControls';
import { Spread } from './Spread';
import { useStore } from '../store/store';
import type { Lang } from '../store/store';
import type { SpreadNavigation } from './useSpreadNavigation';

/** World units between stations. Constant, not proportional to elapsed years: a long empty leg
 *  would be a long empty crawl. Distance in time is told by the milestones instead. */
const GAP = 260;

/**
 * Where a station meets the road, measured ALONG the ground plane.
 *
 * The milestones are upright billboards positioned in world Z; the road is one long plane laid
 * down with rotateX. Those two projections do not share an origin, so the meeting point is fitted
 * rather than derived — measured in Chrome by sweeping a probe strip down the plane and reading
 * back where each station's base landed. Changing GAP, the plane's rotation or the stage height
 * means re-measuring these two.
 */
const PLANE_ORIGIN = 800;
const PLANE_GAP = 350;

const COPY = {
  empty: { vi: 'Kho lưu trữ còn trống.', en: 'The archive is empty.' },
  road: { vi: 'Con đường của gia đình', en: "The family's road" },
  blocked: { vi: 'Đường còn dở', en: 'The way is unfinished' },
} satisfies Record<string, Record<Lang, string>>;

export function Road({ nav }: { nav: SpreadNavigation }): JSX.Element {
  const lang = useStore((s) => s.lang);
  const { spreads, index, spread, wedged, go } = nav;
  const stage = useRef<HTMLDivElement>(null);

  // Arrow keys travel, but only while the road itself holds focus — bound to the stage rather
  // than the window, so they do not hijack the person selector or a tool form further down.
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

  if (!spread) {
    return (
      <section className="road" aria-label={COPY.road[lang]}>
        <p className="hint">{COPY.empty[lang]}</p>
      </section>
    );
  }

  return (
    <section className="road" aria-label={COPY.road[lang]}>
      <div
        className="road-stage"
        ref={stage}
        tabIndex={0}
        role="group"
        aria-label={COPY.road[lang]}
      >
        {/* Scenery only. Every year drawn here is also a real button in the spine below. */}
        <div className="road-world" style={{ transform: `translateZ(${index * GAP}px)` }} aria-hidden="true">
          <div className="road-ground">
            {/* The road is torn THROUGH. The gap lives INSIDE the ground plane, measured along it,
                because world Z and the rotated plane do not share an origin — placing it beside
                the plane put it off the bottom of the stage. */}
            {spreads.map((s, i) =>
              s.conflict ? (
                <div
                  key={`gap-${s.key}`}
                  className="chasm"
                  style={{ bottom: `${PLANE_ORIGIN + i * PLANE_GAP + PLANE_GAP / 2}px` }}
                >
                  <span className="lip near" />
                  <span className="lip far" />
                </div>
              ) : null,
            )}
          </div>

          {/* The far lip does not lie flat — it curls UP into a standing sheet across the road.
              A gap seen from a low camera is edge-on and reads as a pencil line; a torn page
              standing in the way reads instantly, and it is the truer picture anyway: the road
              cannot continue because the archive says two things about the same step. */}
          {spreads.map((s, i) =>
            s.conflict ? (
              <div
                key={`block-${s.key}`}
                className="roadblock"
                style={{ transform: `translate3d(-50%, 0, ${-i * GAP - 70}px)` }}
              >
                <span className="sheet" />
              </div>
            ) : null,
          )}

          {spreads.map((s, i) => {
            // Perspective piles every distant marker onto the vanishing point, so the years stack
            // into an illegible smudge. Show the road AHEAD and fade it with distance; what lies
            // behind has already been read.
            const ahead = i - index;
            if (ahead < 0 || ahead > 3) return null;
            return (
              <div
                key={s.key}
                className={`milestone${ahead === 0 ? ' here' : ''}${s.conflict ? ' torn' : ''}`}
                style={{
                  transform: `translate3d(-50%, 0, ${-i * GAP}px)`,
                  opacity: 1 - ahead * 0.28,
                }}
              >
                <span className="post" />
                <span className="milestone-year">{s.claims[0].year_value ?? '—'}</span>
              </div>
            );
          })}

        </div>

        <div className="fog" aria-hidden="true" />
        {wedged && <p className="road-blocked" aria-hidden="true">{COPY.blocked[lang]}</p>}
      </div>

      <BookControls nav={nav} />
      <Spread spread={spread} />
    </section>
  );
}
