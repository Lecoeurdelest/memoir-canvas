/**
 * Entry point and composition root.
 *
 * Paint the first frame FIRST, then load PGlite (~5.3 MB gz) and register the tools. Nothing
 * imported statically here may reach src/domain/db.ts, or the wasm lands in the entry chunk and
 * the first frame waits for it — NFR-PORT-01, NFR-PERF-02.
 *
 * TASK-003, TASK-012
 */

import {
  Component,
  StrictMode,
  Suspense,
  lazy,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { createRoot } from 'react-dom/client';
import type { BootReport } from './bootstrap';
import './app.css';

const Archive = lazy(async () => ({ default: (await import('./Archive')).Archive }));

type Phase =
  | { at: 'booting' }
  | { at: 'ready'; report: BootReport }
  | { at: 'failed'; error: string };

/**
 * NFR-REL-04 — a render that throws must not leave an empty #root. React unmounts the whole
 * tree on an uncaught error, which is precisely the white screen the requirement forbids.
 */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="fatal">
        <h1>Memoir Canvas could not start</h1>
        <p>{this.state.error.message}</p>
        <p className="hint">Reload the page. If it keeps happening, the archive may need resetting.</p>
      </main>
    );
  }
}

function App(): JSX.Element {
  const [phase, setPhase] = useState<Phase>({ at: 'booting' });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { bootstrap } = await import('./bootstrap');
        const report = await bootstrap();
        if (!cancelled) setPhase({ at: 'ready', report });
      } catch (err) {
        if (!cancelled) {
          setPhase({ at: 'failed', error: err instanceof Error ? err.message : String(err) });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (phase.at === 'booting') {
    return (
      <main className="booting">
        <h1>Memoir Canvas</h1>
        <p role="status">Opening the archive… a real Postgres is starting in this tab.</p>
      </main>
    );
  }

  if (phase.at === 'failed') {
    // NFR-REL-04 again: a boot that never settles or throws must produce a readable page.
    return (
      <main className="fatal">
        <h1>The archive did not open</h1>
        <p>{phase.error}</p>
        <p className="hint">
          PGlite needs WebAssembly and about 5 MB of download. Check the network tab, then reload.
        </p>
      </main>
    );
  }

  return (
    <Suspense fallback={<main className="booting"><h1>Memoir Canvas</h1></main>}>
      <Archive report={phase.report} />
    </Suspense>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
