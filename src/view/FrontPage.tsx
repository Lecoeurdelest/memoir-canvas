/**
 * TASK-039 — the front page: ask the book, and it marks itself.
 *
 * The product owner asked for this twice: *"Sách thần như 1 công cụ tìm các quyển hồi ký"*. It is
 * not a search box bolted into a corner — it is the flyleaf. Ask a question and ribbons slide out
 * of the spine marking the pages that bear on the answer; pull one and the book opens there.
 *
 * **The certainty shown is the floor, never an average.** An answer assembled from three pages is
 * worth no more than the weakest of them, and averaging would let two confident pages launder an
 * uncertain one into a confident-looking answer — the exact move the rest of this project refuses.
 *
 * R5: reads the projection, writes nothing at all. Asking is not recording.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CertaintyBadge, PALETTE } from '../panels/CertaintyBadge';
import { ask } from './bookSearch';
import { usePageDrag } from './usePageDrag';
import { useStore } from '../store/store';
import type { Spread } from '../store/projection';
import type { SpreadNavigation } from './useSpreadNavigation';

export function FrontPage({
  nav,
  onLeave,
  onClose,
}: {
  nav: SpreadNavigation;
  /** Turning forward off the flyleaf goes back into the book. */
  onLeave: () => void;
  /** Pulled down, the book shuts. */
  onClose?: () => void;
}): JSX.Element {
  const { t } = useTranslation();
  const lang = useStore((s) => s.lang);
  const model = useStore((s) => s.model);
  const { spreads, index, lockedFrom, openAt } = nav;

  const [question, setQuestion] = useState('');
  const drag = usePageDrag((direction) => direction === 1 && onLeave(), onClose);

  const answer = useMemo(() => {
    if (!model) return { marked: [], floor: null };

    const sourceTextOf = (spread: Spread): string[] =>
      model.evidence
        .filter((e) => spread.claims.some((c) => c.id === e.claim_id))
        .flatMap((e) => {
          const source = model.sources.find((s) => s.id === e.source_id);
          return [source?.title ?? '', source?.verbatim ?? '', e.excerpt ?? ''];
        });

    return ask({
      question,
      spreads,
      people: model.people,
      places: model.places,
      sourceTextOf,
      reachableUpTo: Math.max(index, lockedFrom - 1),
      labelOf: (s) => {
        const subject = model.people.find((p) => p.id === s.subjectId)?.display_name ?? '';
        return `${subject} ${t(`predicate.${s.predicate}`, s.predicate)}`;
      },
    });
  }, [question, spreads, model, index, lockedFrom, t]);

  const asked = question.trim().length > 1;

  return (
    <section className="front-page" aria-label={t('front.name')}>
      <div className="book-body flyleaf" {...drag.bind}>
        <div className="page-block" aria-hidden="true">
          <span className="block-under" />
        </div>

        <div className="flyleaf-spread">
          <div className="page page-left">
            {/* Written straight onto the page — the design's flyleaf, not a form control, and
                since TASK-048 not labelled either: a ruled line under a cursor asks for itself. */}
            <input
              className="flyleaf-line"
              type="search"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              aria-label={t('front.askTheBook')}
              placeholder={t('front.askTheBook')}
              lang={lang}
            />
          </div>

          <div className="page page-right">
            {!asked || answer.marked.length === 0 ? null : (
              <>
                <ul className="ribbons">
                  {answer.marked.map((m) => (
                    <li key={m.key}>
                      <button
                        type="button"
                        className={`ribbon${m.reachable ? '' : ' locked'}`}
                        style={{ background: PALETTE[m.certainty].ink }}
                        aria-disabled={m.reachable ? undefined : true}
                        aria-label={`${m.year ?? '—'} · ${m.label} · ${t('front.page', {
                          page: m.page,
                        })} · ${t(`certainty.${m.certainty}`)}${
                          m.reachable ? '' : ` · ${t('road.locked')}`
                        }`}
                        onClick={() => {
                          openAt(m.index);
                          onLeave();
                        }}
                      >
                        <span className="ribbon-year">{m.year ?? '—'}</span>
                        <span className="ribbon-label">{m.label}</span>
                        <span className="ribbon-page">{t('front.page', { page: m.page })}</span>
                      </button>
                    </li>
                  ))}
                </ul>

                {/* The whole point of the view. Stated as a floor, and labelled as one. */}
                {answer.floor && (
                  <p className="floor" role="status">
                    <CertaintyBadge certainty={answer.floor} lang={lang} />
                    <span>{t('front.noSurerThan')}</span>
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
