/**
 * The archive shell: what a person sees once the database is open.
 *
 * Loaded lazily by main.tsx and it must stay that way — importing the store here pulls
 * projection → db → PGlite, so a static import from the entry would put ~5.3 MB gz of wasm on
 * the first frame (NFR-PERF-02, NFR-PORT-01).
 *
 * TASK-031 · TASK-037 — a family member opening this should see their family. The machinery did
 * not go away; it moved into Backstage, one gesture from anywhere. `FR-BOOK-09` gives the forest
 * the whole first viewport, so everything here sits below it.
 *
 * R5: reads the projection, writes only through the handlers the panels call.
 */

import { Backstage } from './panels/Backstage';
import { BookStage } from './view/BookStage';
import { StoryCard } from './panels/StoryCard';
import { useTranslation } from 'react-i18next';
import { useStore } from './store/store';
import type { BootReport } from './bootstrap';

export function Archive({ report }: { report: BootReport }): JSX.Element {
  const { t } = useTranslation();
  const model = useStore((s) => s.model);
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const backstage = useStore((s) => s.backstage);
  const setBackstage = useStore((s) => s.setBackstage);

  const cards = model?.cards ?? [];

  return (
    <>
      {/* FR-BOOK-09 — the archive IS the screen. Nothing above it. */}
      <BookStage />

      {/* NFR-REL-03 still has to be SEEN. Pinned to the foot of the viewport, so it says its piece
          without putting anything above the forest — which is what pushed it below the fold when
          the forest went full-bleed in TASK-037. */}
      {(report.ephemeral || report.rebuilt) && (
        <p className="banner warn floating" role="status">
          {report.ephemeral ? t('app.ephemeral') : t('app.rebuilt')}
        </p>
      )}

      <div className="layout">
        <div className="title-row">
          <h1>Memoir Canvas</h1>
          <div className="lang" role="group" aria-label={t('app.language')}>
            {(['vi', 'en'] as const).map((l) => (
              <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
                {l === 'vi' ? 'Tiếng Việt' : 'English'}
              </button>
            ))}
          </div>
        </div>
        <p className="tagline">{t('app.tagline')}</p>

        {cards.length > 0 && (
          <section aria-labelledby="cards-heading">
            <h2 id="cards-heading">{t('app.cards')}</h2>
            {cards.map((c) => (
              <StoryCard key={c.id} card={c} />
            ))}
          </section>
        )}

        {/* Entrance one: quiet, discoverable, never imposed. The second entrance is on the page
            that will not turn, where a reader asks for it themselves. */}
        <p className="backstage-door">
          <button type="button" onClick={() => setBackstage(true)}>
            {t('backstage.open')}
          </button>
        </p>
      </div>

      <Backstage report={report} open={backstage} onClose={() => setBackstage(false)} />
    </>
  );
}
