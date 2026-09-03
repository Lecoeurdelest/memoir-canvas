/**
 * TASK-034 → TASK-048 — the archive as a moonlit meadow. One firefly per memory.
 *
 * This is the first screen, and it makes the project's argument as a picture. The owner's
 * firefly language (TASK-048): a WHITE light is an empty place you can press to tell a memory;
 * ORANGE-RED is a story in open conflict — it flickers, fast and out of time with everything
 * else, and the whole meadow goes grey behind it, because the wedge (FR-BOOK-03) refuses every
 * route forward and the forest is a route like any other; GREEN is a told story, and brighter
 * green is a longer one. Certainty still lives in every light's accessible name and on every
 * card — only the picture's first question changed.
 *
 * The scenery is deterministic SVG on three CSS planes; the ambient fireflies move on a
 * decoration-only three.js canvas when the browser has WebGL, and fall back to the CSS swarm
 * when it does not (NFR-PORT-01). Every interactive light stays a DOM button: 44px target,
 * keyboard order, hover-only name. What is scenery is `aria-hidden`; every fact it carries is
 * also written in the accessible name of the forest or its target.
 *
 * R5: reads the projection, writes nothing but UI state.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/store';
import { FirefliesGL } from './FirefliesGL';
import { ForegroundArt, MeadowArt, SkyArt } from './forestArt';
import {
  CENTRE,
  FIREFLY_TONES,
  ambientLights,
  clampTravel,
  lightShift,
  parallaxShift,
  placeGaps,
  placeLights,
  placeSilences,
  span,
  storyColour,
  storyGlow,
  storyLength,
  travelShift,
} from './forestLayout';
import { hasWebGL } from './webgl';
import type { Pointer } from './forestLayout';
import type { SpreadNavigation } from './useSpreadNavigation';

const PLANE_INDEXES = [0, 1, 2] as const;
const PLANE_ART = [SkyArt, MeadowArt, ForegroundArt] as const;

/** Viewport size, watched because the art composition and the firefly budget hang off it. */
function useStageSize(): { width: number; height: number } {
  const [size, setSize] = useState(() =>
    typeof window === 'undefined'
      ? { width: 1280, height: 800 }
      : { width: window.innerWidth, height: window.innerHeight },
  );
  useEffect(() => {
    const onResize = (): void => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

export function Forest({ nav }: { nav: SpreadNavigation }): JSX.Element {
  const { t } = useTranslation();
  const lang = useStore((s) => s.lang);
  const people = useStore((s) => s.model?.people) ?? [];
  const places = useStore((s) => s.model?.places) ?? [];
  const questions = useStore((s) => s.model?.questions) ?? [];
  const cards = useStore((s) => s.model?.cards) ?? [];
  const setOpenQuestion = useStore((s) => s.setOpenQuestion);
  const setOpenYear = useStore((s) => s.setOpenYear);

  const { spreads, index, openAt } = nav;
  const { width, height } = useStageSize();
  const sparse = width < 700;
  // Bucketed to one decimal so a 1px resize never repaints three SVG sheets.
  const aspect = Math.round((width / Math.max(1, height)) * 10) / 10;
  const stage = useRef<HTMLDivElement>(null);

  const [pointer, setPointer] = useState<Pointer>(CENTRE);
  // T2 — travel accumulates, so the forest can be walked rather than leaned at.
  const [travel, setTravel] = useState<Pointer>(CENTRE);
  const [walking, setWalking] = useState(false);
  const from = useRef<{ x: number; y: number; travel: Pointer } | null>(null);
  // T3 — the light that was pressed blooms before the book replaces it.
  const [blooming, setBlooming] = useState<number | null>(null);
  // The GL swarm is an enhancement; a lost context hands the stage back to the CSS one.
  const [glOk, setGlOk] = useState(() => typeof window !== 'undefined' && hasWebGL());

  const lights = useMemo(() => placeLights(spreads, index), [spreads, index]);
  const ambient = useMemo(() => ambientLights(width), [width]);
  const years = span(spreads);
  // Two kinds of emptiness, drawn the same way: something the agent asked, and a stretch of years
  // the family has simply never filled. The second is what makes a first-run archive answerable.
  const gaps = useMemo(
    () => [...placeGaps(questions, lights, spreads), ...placeSilences(spreads, span(spreads))],
    [questions, lights, spreads],
  );
  const torn = useMemo(() => spreads.some((s) => s.conflict !== null), [spreads]);
  const forestLabel = t('forest.a11yLabel', {
    memories: lights.length,
    gaps: gaps.length,
    from: years?.from ?? '—',
    to: years?.to ?? '—',
  });

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

  const colourOf = (spreadIndex: number): string => {
    const spread = spreads[spreadIndex];
    if (spread.conflict) return FIREFLY_TONES.conflict;
    return storyColour(storyGlow(storyLength(spread, cards)));
  };

  // Arrow keys walk the forest in the order the family lived it. The lights are scattered across
  // three planes, so DOM order is not time order and focus has to be moved by hand.
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    const at = Number((e.target as HTMLElement).dataset.light ?? index);
    const to = Math.min(Math.max(at + step, 0), lights.length - 1);
    if (to === at) return;
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
    <section className="forest" aria-label={forestLabel}>
      <div
        className={`forest-stage${torn ? ' forest-torn' : ''}`}
        ref={stage}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          from.current = { x: e.clientX, y: e.clientY, travel };
          setWalking(true);
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            /* a pointer already gone (or synthetic) cannot be captured — the walk still works */
          }
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
          const Art = PLANE_ART[plane];
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
              <Art torn={torn} sparse={sparse} aspect={aspect} />

              {!glOk && (
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
                          width: `${a.size.toFixed(2)}px`,
                          height: `${a.size}px`,
                          background: 'transparent',
                          color: a.colour,
                          boxShadow: 'none',
                          animationDuration: `${a.duration.toFixed(1)}s`,
                          animationDelay: `${a.delay.toFixed(1)}s`,
                        }}
                      />
                    ))}
                </div>
              )}
            </div>
          );
        })}

        {glOk && (
          <FirefliesGL torn={torn} lean={pointer} travel={travel} onLost={() => setGlOk(false)} />
        )}

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
                      className="memory create-light"
                      lang={lang}
                      aria-label={`${t('forest.unanswered')} — ${asked}`}
                      style={{
                        left: `${g.x}%`,
                        top: `${g.y}%`,
                        width: `${g.size}px`,
                        height: `${g.size}px`,
                        background: 'transparent',
                        color: FIREFLY_TONES.create,
                        boxShadow: 'none',
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
                  const colour = colourOf(l.index);
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
                        background: 'transparent',
                        color: colour,
                        boxShadow: 'none',
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

      </div>
    </section>
  );
}
