/**
 * Entry point.
 *
 * The order is deliberate: paint the first frame FIRST, then load PGlite (~3 MB gz) and
 * register the tools. The first frame must not depend on WebGL or wasm — NFR-PORT-01,
 * NFR-PERF-02.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

function App(): JSX.Element {
  return <main>Memoir Canvas</main>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// TODO(TASK-003, TASK-012): after the first frame —
//   1. getDb() loads PGlite, applies the schema, loadSeed() if the archive is empty
//   2. store.refresh() builds the read model
//   3. ModelContextBridge.provide(toolsFor(...), makeHandlers(...))
//   4. subscribe to uiState → provide again (R4)
