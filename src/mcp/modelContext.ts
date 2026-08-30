/**
 * TASK-006 — the WebMCP entry point is not settled yet.
 *
 * The W3C proposal puts it on `navigator.modelContext`; the challenge page shows
 * `document.modelContext` in places. Nobody knows which one ships. So we detect at
 * runtime instead of guessing, and when neither exists the app stays usable through a
 * manual tool panel — which is what keeps the demo recordable no matter how this lands.
 */

import type { ToolDescriptor } from './descriptors';

export interface ModelContextLike {
  provideContext?: (ctx: { tools: unknown[] }) => void;
  registerTool?: (tool: unknown) => void;
  unregisterTool?: (name: string) => void;
}

export type ModelContextFlavour = 'navigator' | 'document' | 'absent';

interface Detected {
  flavour: ModelContextFlavour;
  mc: ModelContextLike | null;
}

export function detectModelContext(): Detected {
  const nav = (globalThis as { navigator?: { modelContext?: ModelContextLike } }).navigator;
  if (nav?.modelContext) return { flavour: 'navigator', mc: nav.modelContext };

  const doc = (globalThis as { document?: { modelContext?: ModelContextLike } }).document;
  if (doc?.modelContext) return { flavour: 'document', mc: doc.modelContext };

  return { flavour: 'absent', mc: null };
}

export interface ToolHandler {
  (args: unknown): Promise<unknown>;
}

/**
 * One place that talks to the browser API. Everything else goes through provide().
 * R4 lives next door in registry.ts: this file does not decide WHICH tools, only how
 * to hand them over.
 */
export class ModelContextBridge {
  readonly flavour: ModelContextFlavour;
  private readonly mc: ModelContextLike | null;
  private lastProvided: ToolDescriptor[] = [];

  constructor(detected: Detected = detectModelContext()) {
    this.flavour = detected.flavour;
    this.mc = detected.mc;
  }

  get available(): boolean {
    return this.mc !== null;
  }

  /** Whole-set replacement — the semantics a pure tools = f(uiState) actually wants. */
  provide(tools: ToolDescriptor[], handlers: Record<string, ToolHandler>): void {
    this.lastProvided = tools;
    if (!this.mc) return;

    const payload = tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
      execute: handlers[t.name],
    }));

    if (this.mc.provideContext) {
      this.mc.provideContext({ tools: payload });
      return;
    }

    // Fallback for a runtime that only shipped the per-tool API: emulate replacement.
    if (this.mc.registerTool && this.mc.unregisterTool) {
      for (const t of this.lastProvided) this.mc.unregisterTool(t.name);
      for (const t of payload) this.mc.registerTool(t);
    }
  }

  /** What the manual tool panel renders when the API is absent. */
  currentTools(): ToolDescriptor[] {
    return this.lastProvided;
  }
}
