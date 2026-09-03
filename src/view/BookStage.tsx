/**
 * The renderer switch: one truth, several skins.
 *
 * `useSpreadNavigation` holds the state, the wedge rule and the R4 contract; `<Spread>` holds the
 * content; `commands.resolveClaim` holds the write. No skin owns any of it, so there is nothing
 * to keep in sync and every existing test still exercises the real thing.
 *
 * The path is forest → cover → spread. The cover is a beat, not a state worth putting in the
 * navigation truth: by the time it shows, the reader HAS chosen that memory, and the UI state
 * already says so. What `open` gates is the thing that matters — while the forest is showing,
 * nothing is open and the agent is not handed tools for a page nobody looked at.
 *
 * The flat list is not a failure mode — it is the escape hatch NFR-PORT-01 guarantees is always
 * there, reached with `?flat=1` (or the stored choice) since TASK-048 took the toggle off the
 * page along with every other control.
 */

import { useEffect, useState } from 'react';
import { Cover } from './Cover';
import { CssBook } from './CssBook';
import { BlankPage } from './BlankPage';
import { Forest } from './Forest';
import { FrontPage } from './FrontPage';
import { GuidedStory } from './GuidedStory';
import { Volume } from './Volume';
import { useSpreadNavigation } from './useSpreadNavigation';
import { flatRequested } from './webgl';
import { useStore } from '../store/store';

export function BookStage(): JSX.Element {
  const nav = useSpreadNavigation();
  const [flat] = useState(flatRequested);
  const [bound, setBound] = useState(true);
  const [atFront, setAtFront] = useState(false);
  const [guided, setGuided] = useState(false);
  const { open, close, spread } = nav;
  const questions = useStore((s) => s.model?.questions) ?? [];
  const openQuestion = useStore((s) => s.openQuestion);
  const setOpenQuestion = useStore((s) => s.setOpenQuestion);
  const question = questions.find((q) => q.id === openQuestion && q.status === 'open');
  const openYear = useStore((s) => s.openYear);
  const setOpenYear = useStore((s) => s.setOpenYear);

  // Every trip out of the forest starts at the closed book again.
  useEffect(() => {
    if (open) {
      setBound(!guided);
      setAtFront(false);
    }
  }, [open, guided]);

  // Escape closes from anywhere inside. FR-BOOK-08 wants the pointer route to be a drag; the
  // keyboard route is the one NFR-A11Y-03 actually requires.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  // FR-BOOK-08 gave the book a downward drag and Escape. The owner added the third way out, the
  // one the forest already uses: press anywhere off the book. Guided mode runs its own overlay
  // and closes itself, so it is left alone.
  useEffect(() => {
    if (!open || flat || guided) return undefined;
    const onDown = (e: PointerEvent): void => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('.volume, .cover-stage, .front-page, .stage-controls, dialog')) return;
      close();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open, flat, guided, close]);

  if (question || openYear !== null) {
    const shut = (): void => {
      setOpenQuestion(null);
      setOpenYear(null);
    };
    return (
      <div className="reading reading-book">
        {/* No way out but the gestures the page itself carries (TASK-048): press off the
            paper, move focus off it, or press Escape. */}
        <BlankPage question={question} year={openYear ?? undefined} onClose={shut} />
      </div>
    );
  }

  if (!open) {
    return (
      <Forest nav={nav} />
    );
  }

  return (
    <div className={`reading ${flat ? 'reading-flat' : 'reading-book'}${guided ? ' reading-guided' : ''}`}>
      {guided && <GuidedStory nav={nav} onLeave={() => { setGuided(false); close(); }} />}
      {flat ? (
        <CssBook nav={nav} />
      ) : bound && spread ? (
        <Cover spread={spread} onOpen={() => setBound(false)} />
      ) : atFront ? (
        <FrontPage nav={nav} onLeave={() => setAtFront(false)} onClose={close} />
      ) : (
        <Volume nav={nav} onBeforeFirst={() => setAtFront(true)} onClose={close} />
      )}
    </div>
  );
}
