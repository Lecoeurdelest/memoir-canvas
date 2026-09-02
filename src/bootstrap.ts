/**
 * The composition root's async half: boot the database, seed it, build the read model, and hand
 * the tool set to whatever WebMCP implementation the browser has.
 *
 * Everything here runs AFTER the first frame. `getDb()` pulls ~5.3 MB gz of wasm, so importing
 * this module eagerly would put that on the critical path — main.tsx imports it dynamically.
 */

import * as commands from './domain/commands';
import { makeHandlers, type ToolResult } from './mcp/handlers';
import { ModelContextBridge, type ModelContextFlavour } from './mcp/modelContext';
import { toolsFor } from './mcp/registry';
import { loadSeed, seedIfEmpty } from './seed/loadSeed';
import { useStore } from './store/store';
import { describeUiState } from './store/uiState';
import type { ToolDescriptor, ToolName } from './mcp/descriptors';
import type { ActorKind } from './domain/types';

const bridge = new ModelContextBridge(undefined, (report) => useStore.getState().setWebmcp(report));

export interface BootReport {
  flavour: ModelContextFlavour;
  ephemeral: boolean;
  rebuilt: boolean;
  bootMs: number;
}

/**
 * Rebuilt on every call rather than cached: `registered_because` has to describe the UI at call
 * time, and a stale context would put a lie in the audit trail.
 *
 * The actor is a parameter because the manual panel is operated by a person. Recording their
 * click as `'agent'` would be the same kind of lie, and the database would refuse it anyway —
 * app_human and app_agent hold different privileges, which is the point.
 */
function handlersForNow(actor: ActorKind) {
  const { ui } = useStore.getState();
  return makeHandlers({ actor, registeredBecause: describeUiState(ui) });
}

/** Native calls resolve both context and handlers at invocation time, then repaint after writes. */
function nativeHandlers(): Record<string, (args: unknown) => Promise<unknown>> {
  return Object.fromEntries(
    Object.keys(handlersForNow('agent')).map((name) => [
      name,
      async (args: unknown) => {
        const handler = handlersForNow('agent')[name as ToolName];
        const result = await handler(args);
        if (name !== 'read_memory_graph') await useStore.getState().refresh();
        return result;
      },
    ]),
  );
}

function currentTools(): ToolDescriptor[] {
  const { ui, model } = useStore.getState();
  return toolsFor({
    ui,
    subjectsWithDisagreement: model?.subjectsWithDisagreement ?? new Set(),
    openConflictIds: model?.openConflictIds ?? new Set(),
  });
}

/** R4 — whole-set replacement, computed from UI state alone. */
function provideNow(): void {
  bridge.provide(
    currentTools(),
    nativeHandlers(),
  );
}

/** What the manual panel invokes — the same handlers, as whichever actor is driving. */
export async function invokeTool(
  name: ToolName,
  args: unknown,
  actor: ActorKind,
): Promise<ToolResult> {
  return handlersForNow(actor)[name](args);
}

export function toolsOnOffer(): ToolDescriptor[] {
  return currentTools();
}

export function modelContextFlavour(): ModelContextFlavour {
  return bridge.flavour;
}

let running: Promise<BootReport> | null = null;

/**
 * Memoised because StrictMode mounts effects twice in development. Without it both passes see an
 * empty archive and both seed it, and the demo opens with four claims instead of two.
 */
export function bootstrap(): Promise<BootReport> {
  if (!running) running = runBootstrap();
  return running;
}

async function runBootstrap(): Promise<BootReport> {
  const started = performance.now();

  await seedIfEmpty();
  await useStore.getState().refresh();

  provideNow();
  // Re-provide whenever the projection or the UI changes: the tool set is a pure function of
  // both, so anything that moves either has to move the agent's tools with it.
  const unsubscribe = useStore.subscribe((state, previous) => {
    if (state.ui !== previous.ui || state.model !== previous.model) provideNow();
  });

  import.meta.hot?.dispose(() => {
    unsubscribe();
    bridge.dispose();
  });

  const { ephemeral, rebuilt } = commands.archiveStatus();
  return {
    flavour: bridge.flavour,
    ephemeral,
    rebuilt,
    bootMs: Math.round(performance.now() - started),
  };
}

/** Wipe and re-stage the demo. Human-only; deliberately not reachable through a tool. */
export async function reseedArchive(): Promise<void> {
  const ctx = { actor: 'human' as const, registeredBecause: 'user reset the archive' };
  await commands.resetArchive(ctx);
  await loadSeed();
  await useStore.getState().refresh();
}
