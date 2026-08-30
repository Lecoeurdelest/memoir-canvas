/**
 * The archive shell: what a person sees once the database is open.
 *
 * Loaded lazily by main.tsx and it must stay that way — importing the store here pulls
 * projection → db → PGlite, so a static import from the entry would put ~5.3 MB gz of wasm on
 * the first frame (NFR-PERF-02, NFR-PORT-01).
 *
 * R5: reads the projection, writes only through the handlers the panel calls.
 */

import { Suspense, lazy } from 'react';
import { AuditTrail } from './panels/AuditTrail';
import { StoryCard } from './panels/StoryCard';
import { useStore } from './store/store';
import type { BootReport } from './bootstrap';

const ManualToolPanel = lazy(async () => ({
  default: (await import('./panels/ManualToolPanel')).ManualToolPanel,
}));

export function Archive({ report }: { report: BootReport }): JSX.Element {
  const model = useStore((s) => s.model);
  const ui = useStore((s) => s.ui);
  const setUi = useStore((s) => s.setUi);
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);

  const conflicts = model?.conflicts.filter((c) => c.status === 'open') ?? [];
  const cards = model?.cards ?? [];

  return (
    <div className="layout">
      <header>
        <div className="title-row">
          <h1>Memoir Canvas</h1>
          <div className="lang" role="group" aria-label={lang === 'vi' ? 'Ngôn ngữ' : 'Language'}>
            {(['vi', 'en'] as const).map((l) => (
              <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
                {l === 'vi' ? 'Tiếng Việt' : 'English'}
              </button>
            ))}
          </div>
        </div>
        <p className="tagline">
          An evidence-first family archive. The agent may find a contradiction; it may not settle
          one.
        </p>
        <dl className="boot">
          <div>
            <dt>WebMCP</dt>
            <dd>{report.flavour === 'absent' ? 'not offered by this browser' : report.flavour}</dd>
          </div>
          <div>
            <dt>archive ready in</dt>
            <dd>{report.bootMs} ms</dd>
          </div>
          <div>
            <dt>claims</dt>
            <dd>{model?.claims.length ?? 0}</dd>
          </div>
          <div>
            <dt>open conflicts</dt>
            <dd>{conflicts.length}</dd>
          </div>
        </dl>
      </header>

      {report.ephemeral && (
        // NFR-REL-03 — IndexedDB is blocked, so nothing survives the reload. Say so.
        <p className="banner warn" role="status">
          Private browsing: this archive lives in memory only and will be gone when you close the
          tab.
        </p>
      )}
      {report.rebuilt && (
        <p className="banner warn" role="status">
          The archive was rebuilt for a schema update. Previous contents were discarded.
        </p>
      )}

      <nav className="views" aria-label="What you are looking at">
        <button
          type="button"
          aria-pressed={ui.view === 'archive'}
          onClick={() => setUi({ view: 'archive' })}
        >
          Archive
        </button>
        {model?.people.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={ui.view === 'person' && ui.personId === p.id}
            onClick={() => setUi({ view: 'person', personId: p.id })}
          >
            {p.display_name}
          </button>
        ))}
        {conflicts.map((c) => (
          <button
            key={c.id}
            type="button"
            className="conflict"
            aria-pressed={ui.view === 'conflict' && ui.conflictId === c.id}
            onClick={() => setUi({ view: 'conflict', conflictId: c.id, subjectId: c.subject_id })}
          >
            Conflict · {c.predicate}
          </button>
        ))}
      </nav>

      {cards.length > 0 && (
        <section aria-labelledby="cards-heading">
          <h2 id="cards-heading">Story cards</h2>
          {cards.map((c) => (
            <StoryCard key={c.id} card={c} />
          ))}
        </section>
      )}

      <Suspense fallback={<p className="hint">Loading tools…</p>}>
        <ManualToolPanel />
      </Suspense>

      <AuditTrail />
    </div>
  );
}
