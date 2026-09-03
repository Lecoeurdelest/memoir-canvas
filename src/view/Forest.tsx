/**
 * TASK-034 → TASK-048 — the archive as a moonlit meadow. One firefly per memory.
 *
 * This is the first screen, and it makes the project's argument as a picture. The owner's
 * firefly language: a WHITE light is an empty place you can press to tell a memory; ORANGE-RED
 * is a story in open conflict — it flickers, fast and out of time with everything else, and the
 * whole meadow goes grey behind it, because the wedge (FR-BOOK-03) refuses every route forward
 * and the forest is a route like any other; GREEN is a told story, and brighter green is a
 * longer one. Certainty still lives in every light's accessible name and on every card.
 *
 * The world is a RING of SCENE_COUNT scenes: three scenery strips (sky, meadow, foreground)
 * each loop at their own parallax rate, so dragging sideways walks an endless night; the lights
 * ride the meadow's loop, laid along the world's whole timeline. Every firefly answers a press;
 * a double-click on scenery opens Backstage; only the vertical walk still meets a wall.
 *
 * Ambient motion is a decoration-only three.js canvas with a CSS fallback (NFR-PORT-01). Every
 * interactive light stays a DOM button: 44px target, keyboard order, hover-only name. What is
 * scenery is `aria-hidden`; every fact it carries is also written in an accessible name.
 *
 * R5: reads the projection, writes nothing but UI state.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/store';
import { FirefliesGL } from './FirefliesGL';
import type { FirefliesHandle } from './FirefliesGL';
import { ForegroundArt, H as ART_H, MeadowArt, SkyArt, designWidth } from './forestArt';
import {
  CENTRE,
  FIREFLY_TONES,
  SCENE_COUNT,
  ambientLights,
  clampTravel,
  parallaxShift,
  placeGaps,
  placeLights,
  placeSilences,
  span,
  storyColour,
  storyGlow,
  storyLength,
  wrapOffset,
  yearAtX,
} from './forestLayout';
import { hasWebGL } from './webgl';
import type { Plane, Pointer } from './forestLayout';
import type { SpreadNavigation } from './useSpreadNavigation';

/** How fast each strip walks relative to the hand: sky far behind, meadow AS the ground the
 *  lights stand on, foreground sweeping past. */
const STRIP_RATES = [0.35, 1, 1.3] as const;
const STRIP_ART = [SkyArt, MeadowArt, ForegroundArt] as const;

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
  const setBackstage = useStore((s) => s.setBackstage);

  const { spreads, index, openAt } = nav;
  const { width, height } = useStageSize();
  const sparse = width < 700;
  // Bucketed to one decimal so a 1px resize never repaints three SVG strips.
  const aspect = Math.round((width / Math.max(1, height)) * 10) / 10;
  const stage = useRef<HTMLDivElement>(null);

  // The ring, in on-screen pixels: SCENE_COUNT scenes, each composed for this stage. The 1.06
  // is the strips' vertical overscan in the stylesheet (`.forest-strip` height: 106%) — the art
  // is scaled by the STRIP's height, so the loop must be measured with it or every pixel of
  // translate lands ~6% short.
  const unit = (height * 1.06) / ART_H;
  const loopPx = SCENE_COUNT * designWidth(aspect) * unit;

  const [pointer, setPointer] = useState<Pointer>(CENTRE);
  // T2 — travel accumulates, and sideways it never ends: the world is a ring.
  const [travel, setTravel] = useState<Pointer>(CENTRE);
  const [walking, setWalking] = useState(false);
  const from = useRef<{ x: number; y: number; travel: Pointer } | null>(null);
  // T3 — the light that was pressed blooms before the book replaces it.
  const [blooming, setBlooming] = useState<number | null>(null);
  // The GL swarm is an enhancement; a lost context hands the stage back to the CSS one.
  const [glOk, setGlOk] = useState(() => typeof window !== 'undefined' && hasWebGL());
  const flies = useRef<FirefliesHandle>(null);
  // A walk is not a click: the distance a pointer wanders between down and up decides.
  const wandered = useRef(0);

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

  // Where the ground stands inside its loop right now — the lights and the click-to-year
  // mapping both hang off this exact number.
  const groundLean = parallaxShift(pointer, 1);
  const groundT = wrapOffset(travel.x, STRIP_RATES[1], loopPx) + groundLean.x;
  const groundTy = travel.y * 0.95 + groundLean.y;

  /** A world-percent position, wrapped onto the screen; things just left of the seam appear
   *  just left of the screen instead of a whole world away. */
  const screenX = (worldPercent: number): number => {
    const wx = (worldPercent / 100) * loopPx;
    const sx = (((wx + groundT) % loopPx) + loopPx) % loopPx;
    return sx > loopPx - 200 ? sx - loopPx : sx;
  };

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

  // Arrow keys walk the forest in the order the family lived it — and carry the world along, so
  // the light that takes focus is also the light in front of you.
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    const at = Number((e.target as HTMLElement).dataset.light ?? index);
    const to = Math.min(Math.max(at + step, 0), lights.length - 1);
    if (to === at) return;
    e.preventDefault();
    const target = lights[to];
    if (target) {
      const wx = (target.x / 100) * loopPx;
      setTravel((prev) => ({ x: width / 2 - wx, y: prev.y }));
    }
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
        // TASK-048 — the surface carries no controls, so the machinery's mouse entrance is the
        // surface itself: a double-click on scenery (never on a light) opens Backstage. The
        // keyboard route is the ghost door in Archive.tsx.
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          setBackstage(true);
        }}
        // Every firefly is a place a memory could live (owner's rule): press one — not a walk,
        // not a light, the ambient swarm itself — and the blank page opens on the year that
        // point of the WORLD's timeline names, wherever the ring has been dragged to.
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          if (wandered.current > 6) return;
          const r = e.currentTarget.getBoundingClientRect();
          const cx = e.clientX - r.left;
          const cy = e.clientY - r.top;
          const onFly = glOk
            ? flies.current?.hitTest(cx, cy)
            : ambient.some((a) => {
                const ax = (a.x / 100) * r.width;
                const ay = (a.y / 100) * r.height;
                return (ax - cx) ** 2 + (ay - cy) ** 2 <= (a.size * 0.5 + 12) ** 2;
              });
          if (!onFly) return;
          const worldPercent = (((((cx - groundT) % loopPx) + loopPx) % loopPx) / loopPx) * 100;
          const year = yearAtX(spreads, worldPercent);
          if (year !== null) setOpenYear(year);
        }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          from.current = { x: e.clientX, y: e.clientY, travel };
          wandered.current = 0;
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
            wandered.current = Math.max(
              wandered.current,
              Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y),
            );
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
        {STRIP_RATES.map((rate, strip) => {
          const lean = parallaxShift(pointer, strip as Plane);
          const tx = wrapOffset(travel.x, rate, loopPx) + lean.x;
          const ty = travel.y * (0.6 + strip * 0.35) + lean.y;
          const Art = STRIP_ART[strip];
          return (
            <div
              key={strip}
              className={`forest-strip strip-${strip}${walking ? ' walking' : ''}`}
              style={{ transform: `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px)` }}
            >
              <Art torn={torn} sparse={sparse} aspect={aspect} />
            </div>
          );
        })}

        {!glOk && (
          <div className="forest-ambient" aria-hidden="true">
            {ambient.map((a) => (
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

        {glOk && (
          <FirefliesGL
            ref={flies}
            torn={torn}
            lean={pointer}
            travel={travel}
            onLost={() => setGlOk(false)}
          />
        )}

        {/* The lights ride the meadow's loop: their x lives on the WORLD's timeline and wraps
            with it, so a memory keeps its place however far the night has been dragged. */}
        <div
          className={`forest-lights${walking ? ' walking' : ''}`}
          style={{ transform: `translate(0px, ${groundTy.toFixed(1)}px)` }}
        >
          {gaps.map((g) => {
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
                  left: `${screenX(g.x).toFixed(1)}px`,
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

          {lights.map((l) => {
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
                  left: `${screenX(l.x).toFixed(1)}px`,
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

      </div>
    </section>
  );
}
