/**
 * TASK-031 — one drawer for the machinery.
 *
 * The tension this solves must not be solved by deleting. A family member opening this archive
 * should see their family; a judge has three minutes and must see the database refusing an AI in
 * its own words. Hiding the machinery would lose the second; showing it first lost the first, and
 * `WEBMCP — not offered by this browser` as the opening line of a family archive reads as
 * *this is broken*.
 *
 * So: everything technical moves in here, one gesture from anywhere. Nothing is removed, nothing
 * is softened, and in particular no Postgres refusal is ever paraphrased — the verbatim message is
 * the evidence, and rewording it is the same act this project exists to refuse.
 *
 * R5: reads the projection. `ManualToolPanel` and `AuditTrail` are unchanged and simply live here.
 */

import { Suspense, lazy, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AuditTrail } from './AuditTrail';
import { useStore } from '../store/store';
import type { BootReport } from '../bootstrap';

const ManualToolPanel = lazy(async () => ({
  default: (await import('./ManualToolPanel')).ManualToolPanel,
}));

export function Backstage({
  report,
  open,
  onClose,
}: {
  report: BootReport;
  open: boolean;
  onClose: () => void;
}): JSX.Element {
  const { t } = useTranslation();
  const model = useStore((s) => s.model);
  const dialog = useRef<HTMLDialogElement>(null);

  const conflicts = model?.conflicts.filter((c) => c.status === 'open') ?? [];

  // showModal, not the `open` attribute: it is what gives us the focus trap, the inert background
  // and Esc for free, rather than three hand-rolled approximations of them (NFR-A11Y-03).
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog className="backstage" ref={dialog} onClose={onClose} aria-labelledby="backstage-title">
      <div className="backstage-head">
        <h2 id="backstage-title">{t('backstage.title')}</h2>
        <button type="button" className="backstage-close" onClick={onClose}>
          {t('backstage.close')}
        </button>
      </div>
      <p className="hint">{t('backstage.intro')}</p>

      <dl className="boot">
        <div>
          {/* A protocol name, not copy. Putting it in the catalogue would have forced
              an entry in tests/i18n's ALLOWED_IDENTICAL, weakening the rule that catches real
              untranslated strings — for a word that is the same in every language. */}
          <dt>WebMCP</dt>
          <dd>{report.flavour === 'absent' ? t('backstage.absent') : report.flavour}</dd>
        </div>
        <div>
          <dt>{t('backstage.ready')}</dt>
          <dd>{report.bootMs} ms</dd>
        </div>
        <div>
          <dt>{t('backstage.claims')}</dt>
          <dd>{model?.claims.length ?? 0}</dd>
        </div>
        <div>
          <dt>{t('backstage.openConflicts')}</dt>
          <dd>{conflicts.length}</dd>
        </div>
      </dl>
      <p className="hint no-server">{t('backstage.noServer')}</p>

      {open && (
        <>
          <Suspense fallback={<p className="hint">…</p>}>
            <ManualToolPanel />
          </Suspense>
          <AuditTrail />
        </>
      )}
    </dialog>
  );
}
