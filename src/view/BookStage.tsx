/**
 * The renderer switch: one truth, several skins.
 *
 * `useSpreadNavigation` holds the state, the wedge rule and the R4 contract; `<Spread>` holds the
 * content; `commands.resolveClaim` holds the write. No skin owns any of it, so there is nothing
 * to keep in sync and every existing test still exercises the real thing.
 *
 * The forest is the door. Nothing is open until a reader picks a light, and while the forest is
 * showing the UI state says `archive` — which is the whole point of putting `open` in the
 * navigation truth rather than here: the agent must not be handed `resolve_claim` for a
 * contradiction nobody has looked at yet.
 *
 * The flat book is not a failure mode — it is the escape hatch, reachable with `?flat=1` or the
 * toggle, and it is what NFR-PORT-01 guarantees is always there.
 */

import { useEffect, useState } from 'react';
import { CssBook } from './CssBook';
import { Forest } from './Forest';
import { Road } from './Road';
import { useSpreadNavigation } from './useSpreadNavigation';
import { flatRequested } from './webgl';
import { useTranslation } from 'react-i18next';

export function BookStage(): JSX.Element {
  const { t } = useTranslation();
  const nav = useSpreadNavigation();
  const [flat, setFlat] = useState(flatRequested);
  const { open, close } = nav;

  // Escape closes the book from anywhere inside it. FR-BOOK-08 wants the pointer gesture to be
  // a drag, which is TASK-035; the keyboard route is the one NFR-A11Y-03 actually requires and
  // it should not wait for the animation.
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

  if (!open) return <Forest nav={nav} />;

  return (
    <>
      {flat ? <CssBook nav={nav} /> : <Road nav={nav} />}
      <div className="stage-controls">
        <button type="button" className="skin-toggle" onClick={close}>
          {t('forest.back')}
        </button>
        <button type="button" className="skin-toggle" onClick={toggle}>
          {t(flat ? 'road.roadView' : 'road.flatView')}
        </button>
      </div>
    </>
  );
}
