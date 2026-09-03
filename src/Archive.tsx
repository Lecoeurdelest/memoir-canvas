/**
 * The archive shell: what a person sees once the database is open.
 *
 * Loaded lazily by main.tsx and it must stay that way — importing the store here pulls
 * projection → db → PGlite, so a static import from the entry would put ~5.3 MB gz of wasm on
 * the first frame (NFR-PERF-02, NFR-PORT-01).
 *
 * TASK-031 · TASK-037 · TASK-048 — a family member opening this should see their family, and
 * ONLY their family: the owner removed everything below the forest, so the archive is one
 * surface and every way in is a mouse gesture. The machinery did not go away; it lives in
 * Backstage, reached by double-clicking the forest itself (Forest.tsx) — and by the ghost door
 * below, which no eye sees but every Tab key finds, because a mouse-only entrance would lock
 * out exactly the readers NFR-A11Y-03 exists for. The language switch moved into Backstage.
 *
 * R5: reads the projection, writes only through the handlers the panels call.
 */

import { Backstage } from './panels/Backstage';
import { BookStage } from './view/BookStage';
import { useTranslation } from 'react-i18next';
import { useStore } from './store/store';
import type { BootReport } from './bootstrap';

export function Archive({ report }: { report: BootReport }): JSX.Element {
  const { t } = useTranslation();
  const backstage = useStore((s) => s.backstage);
  const setBackstage = useStore((s) => s.setBackstage);

  return (
    <>
      {/* FR-BOOK-09 — the archive IS the screen. Nothing above it, and now nothing below it. */}
      <BookStage />

      {/* NFR-REL-03 still has to be SEEN. Pinned to the foot of the viewport, so it says its
          piece without putting anything above the forest. */}
      {(report.ephemeral || report.rebuilt) && (
        <p className="banner warn floating" role="status">
          {report.ephemeral ? t('app.ephemeral') : t('app.rebuilt')}
        </p>
      )}

      <button type="button" className="ghost-door" onClick={() => setBackstage(true)}>
        {t('backstage.open')}
      </button>

      <Backstage report={report} open={backstage} onClose={() => setBackstage(false)} />
    </>
  );
}
