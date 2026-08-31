/**
 * TASK-034 — the archive as a forest at night. One firefly per memory.
 *
 * This is the first screen, and it makes the project's argument as a picture: brightness and hue
 * are certainty, so how sure this family is of its own past reads before a word is read. An open
 * contradiction flickers, fast and out of time with everything else, and the forest behind it
 * goes dark — because the wedge (FR-BOOK-03) refuses every route forward, and the forest is a
 * route like any other.
 *
 * No WebGL. Three CSS planes sliding at different rates against the pointer, which costs nothing
 * to download and has no GL context to lose when a phone backgrounds the tab (NFR-PORT-01).
 *
 * What is scenery and what is information, deliberately: the trunks, the drifting ambient
 * fireflies and the rings are `aria-hidden`, and every fact they carry is also written in the
 * summary line above them. Nothing here is knowable only by looking.
 *
 * R5: reads the projection, writes nothing but UI state.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CERTAINTY_ORDER } from '../domain/types';
import { toolsOnOffer } from '../bootstrap';
import { GLYPH, NIGHT_PALETTE, NIGHT_UNLIT } from '../panels/CertaintyBadge';
import { useStore } from '../store/store';
import {
  CENTRE,
  ambientLights,
  clampTravel,
  glowLayers,
  lightShift,
  parallaxShift,
  placeGaps,
  placeLights,
  placeSilences,
  span,
  travelShift,
  trees,
} from './forestLayout';
import type { Pointer } from './forestLayout';
import type { SpreadNavigation } from './useSpreadNavigation';

const PLANE_INDEXES = [0, 1, 2] as const;

/** Hex to `r, g, b` so a glow can be built at several opacities from one palette entry. */
function rgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function glow(hex: string, layers: 1 | 2): string {
  const c = rgb(hex);
  const inner = `0 0 6px 2px rgba(${c}, 0.55)`;
  return layers === 1 ? inner : `${inner}, 0 0 18px 6px rgba(${c}, 0.18)`;
}

/** Viewport width, watched because the light budget and the glow depth both hang off it. */
function useStageWidth(): number {
  const [width, setWidth] = useState(() =>
    typeof window === 'undefined' ? 1280 : window.innerWidth,
  );
  useEffect(() => {
    const onResize = (): void => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
}

export function Forest({ nav }: { nav: SpreadNavigation }): JSX.Element {
  const { t } = useTranslation();
  const lang = useStore((s) => s.lang);
  const people = useStore((s) => s.model?.people) ?? [];
  const places = useStore((s) => s.model?.places) ?? [];
  const questions = useStore((s) => s.model?.questions) ?? [];
  const setOpenQuestion = useStore((s) => s.setOpenQuestion);
  const setOpenYear = useStore((s) => s.setOpenYear);

  const { spreads, index, openAt } = nav;
  const width = useStageWidth();
  const layers = glowLayers(width);
  const stage = useRef<HTMLDivElement>(null);

  const [pointer, setPointer] = useState<Pointer>(CENTRE);
  // T2 — travel accumulates, so the forest can be walked rather than leaned at.
  const [travel, setTravel] = useState<Pointer>(CENTRE);
  const [walking, setWalking] = useState(false);
  const from = useRef<{ x: number; y: number; travel: Pointer } | null>(null);
  // T3 — the light that was pressed blooms before the book replaces it.
  const [blooming, setBlooming] = useState<number | null>(null);

  // T4 — the project's argument, stated where a person is actually looking. The registry is a
  // pure function of what is open (R4), so this number changes the moment a memory does — and
  // that visible change is the whole claim, made without opening Backstage.
  const ui = useStore((s) => s.ui);
  const toolCount = useMemo(() => toolsOnOffer().length, [ui]);

  const lights = useMemo(() => placeLights(spreads, index), [spreads, index]);
  const ambient = useMemo(() => ambientLights(width), [width]);
  const years = span(spreads);
  // Two kinds of emptiness, drawn the same way: something the agent asked, and a stretch of years
  // the family has simply never filled. The second is what makes a first-run archive answerable.
  const gaps = useMemo(
    () => [...placeGaps(questions, lights, spreads), ...placeSilences(spreads, span(spreads))],
    [questions, lights, spreads],
  );
  const woods = useMemo(() => PLANE_INDEXES.map((p) => trees(p, width)), [width]);

  // A whole sentence, because "moved to · 1972" names no destination and reads as a fragment.
  const nameOf = (spreadIndex: number): string => {
    const spread = spreads[spreadIndex];
    const lead = spread.claims[0];
    const subject = people.find((p) => p.id === spread.subjectId)?.display_name ?? '';
    const object = places.find((p) => p.id === lead?.object_place_id)?.name ?? lead?.object_text ?? '';
    const verb = t(`predicate.${spread.predicate}`, spread.predicate);
    const year = lead?.year_value;
    return [`${subject} ${verb}${object ? ` ${object}` : ''}`, year].filter(Boolean).join(' · ');
  };

  // Arrow keys walk the forest in the order the family lived it. The lights are scattered across
  // three planes, so DOM order is not time order and focus has to be moved by hand.
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    const from = Number((e.target as HTMLElement).dataset.light ?? index);
    const to = Math.min(Math.max(from + step, 0), lights.length - 1);
    if (to === from) return;
    e.preventDefault();
    stage.current?.querySelector<HTMLButtonElement>(`[data-light="${to}"]`)?.focus();
  }

  if (lights.length === 0) {
    return (
      <section className="forest" aria-label={t('forest.name')}>
        <p className="forest-empty">{t('forest.empty')}</p>
      </section>
    );
  }

  return (
    <section className="forest" aria-label={t('forest.name')}>
      <div
        className="forest-stage"
        ref={stage}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          const r = e.currentTarget.getBoundingClientRect();
          from.current = { x: e.clientX, y: e.clientY, travel };
          setWalking(true);
          e.currentTarget.setPointerCapture(e.pointerId);
          void r;
        }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          if (from.current) {
            const start = from.current;
            setTravel(
              clampTravel(
                {
                  x: start.travel.x + (e.clientX - start.x),
                  y: start.travel.y + (e.clientY - start.y),
                },
                { width: r.width, height: r.height },
              ),
            );
            return;
          }
          setPointer({
            x: (e.clientX - r.left) / r.width - 0.5,
            y: (e.clientY - r.top) / r.height - 0.5,
          });
        }}
        onPointerUp={() => {
          from.current = null;
          setWalking(false);
        }}
        onPointerCancel={() => {
          from.current = null;
          setWalking(false);
        }}
        onPointerLeave={() => setPointer(CENTRE)}
      >
        {PLANE_INDEXES.map((plane) => {
          const lean = parallaxShift(pointer, plane);
          const walk = travelShift(travel, plane, true);
          return (
            <div
              key={plane}
              className={`forest-plane plane-${plane}${walking ? ' walking' : ''}`}
              style={{
                transform: `translate(${(lean.x + walk.x).toFixed(0)}px, ${(
                  lean.y + walk.y
                ).toFixed(0)}px)`,
              }}
            >
              <div className="forest-trees" aria-hidden="true">
                {woods[plane].map((tree) => (
                  <span
                    key={tree.key}
                    className="trunk"
                    style={{
                      left: `${tree.x}%`,
                      width: `${tree.width}px`,
                      height: `${tree.height}%`,
                      transform: `rotate(${tree.tilt.toFixed(2)}deg)`,
                    }}
                  />
                ))}
              </div>

              <div className="forest-ambient" aria-hidden="true">
                {ambient
                  .filter((a) => a.plane === plane)
                  .map((a) => (
                    <span
                      key={a.key}
                      className="fly"
                      style={{
                        left: `${a.x}%`,
                        top: `${a.y}%`,
                        width: `${a.size}px`,
                        height: `${a.size}px`,
                        background: NIGHT_UNLIT,
                        boxShadow: glow(NIGHT_UNLIT, 1),
                        animationDuration: `${a.duration.toFixed(1)}s`,
                        animationDelay: `${a.delay.toFixed(1)}s`,
                      }}
                    />
                  ))}
              </div>

            </div>
          );
        })}

        {/* The lights ride their own layers, sized exactly to the stage, so a per-cent is a
            per-cent OF WHAT YOU CAN SEE. */}
        {PLANE_INDEXES.map((plane) => {
          const lean = lightShift(pointer, plane);
          const walk = travelShift(travel, plane, false);
          return (
            <div
              key={`lights-${plane}`}
              className={`forest-lights lights-${plane}${walking ? ' walking' : ''}`}
              style={{
                transform: `translate(${(lean.x + walk.x).toFixed(0)}px, ${(
                  lean.y + walk.y
                ).toFixed(0)}px)`,
              }}
            >
              {gaps
                .filter((g) => g.plane === plane)
                .map((g) => {
                  const question = questions.find((q) => q.id === g.id);
                  const asked =
                    g.kind === 'silence'
                      ? t('blank.emptyYear', { year: g.year })
                      : lang === 'vi'
                        ? (question?.question_vi ?? '')
                        : (question?.question_en ?? question?.question_vi ?? '');
                  return (
                    <button
                      key={g.id}
                      type="button"
                      className="ring"
                      lang={lang}
                      aria-label={`${t('forest.unanswered')} — ${asked}`}
                      style={{
                        left: `${g.x}%`,
                        top: `${g.y}%`,
                        width: `${g.size}px`,
                        height: `${g.size}px`,
                        borderColor: `rgba(${rgb(NIGHT_UNLIT)}, 0.55)`,
                        animationDuration: `${g.duration.toFixed(1)}s`,
                        animationDelay: `${g.delay.toFixed(1)}s`,
                      }}
                      onClick={() =>
                        g.kind === 'silence' ? setOpenYear(g.year) : setOpenQuestion(g.id)
                      }
                    />
                  );
                })}

              {lights
                .filter((l) => l.plane === plane)
                .map((l) => {
                  const colour = NIGHT_PALETTE[l.certainty];
                  const name = nameOf(l.index);
                  return (
                    <button
                      key={l.key}
                      type="button"
                      data-light={l.index}
                      className={`memory${l.certainty === 'conflicting' ? ' flickering' : ''}${
                        l.reachable ? '' : ' out-of-reach'
                      }${blooming === l.index ? ' blooming' : ''}`}
                      tabIndex={l.index === index ? 0 : -1}
                      aria-label={`${name} · ${t(`certainty.${l.certainty}`)}${
                        l.reachable ? '' : ` · ${t('forest.locked')}`
                      }`}
                      aria-disabled={l.reachable ? undefined : true}
                      lang={lang}
                      style={{
                        left: `${l.x}%`,
                        top: `${l.y}%`,
                        width: `${l.size}px`,
                        height: `${l.size}px`,
                        background: colour,
                        boxShadow: glow(colour, layers),
                        animationDuration: `${l.duration.toFixed(2)}s`,
                        animationDelay: `${l.delay.toFixed(1)}s`,
                      }}
                      onClick={() => {
                        if (!l.reachable) return;
                        // T3 — the light has to BECOME the book, not be replaced by it. The
                        // delay is the bloom; reduced motion skips straight through.
                        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                        if (still) return openAt(l.index);
                        setBlooming(l.index);
                        window.setTimeout(() => openAt(l.index), 260);
                      }}
                    >
                      <span className="memory-name" aria-hidden="true">
                        {name}
                      </span>
                    </button>
                  );
                })}
            </div>
          );
        })}

        <div className="forest-chrome">
          <div className="forest-head">
            <h2 className="forest-title">{t('forest.name')}</h2>
            <p className="forest-agent" role="status">
              {t('forest.agentHolds', { count: toolCount })}
            </p>
            <p className="forest-count">
              {t('forest.summary', {
                memories: lights.length,
                gaps: gaps.length,
                from: years?.from ?? '—',
                to: years?.to ?? '—',
              })}
            </p>
            <ul className="forest-legend">
              {CERTAINTY_ORDER.map((c) => (
                <li key={c} style={{ color: NIGHT_PALETTE[c] }}>
                  <span aria-hidden="true" className="dot" style={{ background: NIGHT_PALETTE[c] }} />
                  <span aria-hidden="true" className="glyph">
                    {GLYPH[c]}
                  </span>
                  {t(`certainty.${c}`)}
                </li>
              ))}
              <li style={{ color: NIGHT_UNLIT }}>
                <span aria-hidden="true" className="dot hollow" />
                {t('forest.unanswered')}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
