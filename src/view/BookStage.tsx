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
 * The flat list is not a failure mode — it is the escape hatch, reachable with `?flat=1` or the
 * toggle, and it is what NFR-PORT-01 guarantees is always there.
 */

import { useEffect, useMemo, useState } from 'react';
import { toolsOnOffer } from '../bootstrap';
import { Cover } from './Cover';
import { CssBook } from './CssBook';
import { BlankPage } from './BlankPage';
import { Forest } from './Forest';
import { FrontPage } from './FrontPage';
import { GuidedStory } from './GuidedStory';
import { Volume } from './Volume';
import { useSpreadNavigation } from './useSpreadNavigation';
import { flatRequested } from './webgl';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/store';

export function BookStage(): JSX.Element {
  const { t } = useTranslation();
  const nav = useSpreadNavigation();
  const [flat, setFlat] = useState(flatRequested);
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

  // T4 — the same line the forest carries, so a reader watches the number CHANGE as they move.
  // That change IS the claim: the registry is a pure function of what is open (R4), and a count
  // that visibly grows when you open a contradiction says it better than any paragraph.
  const ui = useStore((s) => s.ui);
  const toolCount = useMemo(() => toolsOnOffer().length, [ui]);

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

  function toggle(): void {
    const next = !flat;
    setFlat(next);
    try {
      window.localStorage.setItem('memoir:flat', next ? '1' : '0');
    } catch {
      /* private browsing — the choice simply does not persist */
    }
  }

  if (question || openYear !== null) {
    const shut = (): void => {
      setOpenQuestion(null);
      setOpenYear(null);
    };
    return (
      <div className="reading reading-book">
        <BlankPage question={question} year={openYear ?? undefined} onClose={shut} />
        <div className="stage-controls">
          <button type="button" className="skin-toggle" onClick={shut}>
            {t('forest.back')}
          </button>
        </div>
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
      {/* The way out is a downward drag or Escape (FR-BOOK-08). What stays visible is the
          NFR-PORT-01 escape hatch, which has to be visible to be an escape hatch. */}
      <div className="stage-controls">
        <p className="reading-agent" role="status">
          {t('forest.agentHolds', { count: toolCount })}
        </p>
        <button type="button" className="skin-toggle" onClick={toggle}>
          {t(flat ? 'volume.bookView' : 'volume.listView')}
        </button>
      </div>
    </div>
  );
}
