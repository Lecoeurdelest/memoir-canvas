/**
 * The property being pinned: a tool withdrawn from the set is actually gone from the host.
 *
 * That is the whole of FR-REG and R4 as the agent experiences them. `resolve_claim` is
 * registered only while a person has the conflict on screen; if withdrawal silently fails, the
 * agent keeps the one tool the project promises it cannot have unsupervised — and the promise
 * is broken in the place nobody looks, because provide() still returns normally.
 *
 * Both host shapes are tested. The per-tool fallback is the one that had the bug.
 */
import { describe, expect, it } from 'vitest';
import { ModelContextBridge, type ModelContextLike } from '../src/mcp/modelContext';
import { DESCRIPTORS, type ToolDescriptor, type ToolName } from '../src/mcp/descriptors';

const tools = (...names: ToolName[]): ToolDescriptor[] => names.map((n) => DESCRIPTORS[n]);
const noHandlers = {};

/** A host that only ever shipped registerTool/unregisterTool — no provideContext. */
function perToolHost() {
  const registered = new Set<string>();
  const mc: ModelContextLike = {
    registerTool: (t) => void registered.add((t as { name: string }).name),
    unregisterTool: (name) => void registered.delete(name),
  };
  return { mc, registered };
}

/** A host that shipped the whole-set API. */
function wholeSetHost() {
  let last: string[] = [];
  const mc: ModelContextLike = {
    provideContext: (ctx) => {
      last = (ctx.tools as { name: string }[]).map((t) => t.name);
    },
  };
  return { mc, seen: () => last };
}

describe('ModelContextBridge.provide — per-tool fallback', () => {
  it('withdraws a tool that is no longer in the set', async () => {
    const { mc, registered } = perToolHost();
    const bridge = new ModelContextBridge({ flavour: 'navigator', mc });

    bridge.provide(tools('add_person', 'resolve_claim'), noHandlers);
    await bridge.settled();
    expect([...registered].sort()).toEqual(['add_person', 'resolve_claim']);

    // The person navigates away from the conflict. resolve_claim must go with them.
    bridge.provide(tools('add_person'), noHandlers);
    await bridge.settled();
    expect(registered.has('resolve_claim')).toBe(false);
    expect([...registered]).toEqual(['add_person']);
  });

  it('does not unregister a tool that is still current', async () => {
    const { mc, registered } = perToolHost();
    const calls: string[] = [];
    mc.unregisterTool = (name) => {
      calls.push(name);
      registered.delete(name);
    };
    const bridge = new ModelContextBridge({ flavour: 'navigator', mc });

    bridge.provide(tools('add_person', 'resolve_claim'), noHandlers);
    await bridge.settled();
    bridge.provide(tools('add_person'), noHandlers);
    await bridge.settled();

    // add_person survived both sets — withdrawing and re-adding it would drop it from the host
    // for the instant between the two calls.
    expect(calls).toEqual(['resolve_claim']);
  });

  it('survives three successive sets without leaking a stale tool', async () => {
    const { mc, registered } = perToolHost();
    const bridge = new ModelContextBridge({ flavour: 'navigator', mc });

    bridge.provide(tools('add_person'), noHandlers);
    bridge.provide(tools('add_person', 'flag_conflict'), noHandlers);
    bridge.provide(tools('add_person', 'resolve_claim'), noHandlers);
    await bridge.settled();

    expect(registered.has('flag_conflict')).toBe(false);
    expect([...registered].sort()).toEqual(['add_person', 'resolve_claim']);
  });
});

describe('ModelContextBridge.provide — whole-set host', () => {
  it('hands over exactly the current set, replacing the last one', async () => {
    const { mc, seen } = wholeSetHost();
    const bridge = new ModelContextBridge({ flavour: 'navigator', mc });

    bridge.provide(tools('add_person', 'resolve_claim'), noHandlers);
    await bridge.settled();
    bridge.provide(tools('add_person'), noHandlers);
    await bridge.settled();

    expect(seen()).toEqual(['add_person']);
  });
});

describe('ModelContextBridge — no host at all', () => {
  it('still records the set so the manual tool panel can render it', () => {
    const bridge = new ModelContextBridge({ flavour: 'absent', mc: null });
    expect(bridge.available).toBe(false);

    bridge.provide(tools('add_person', 'flag_conflict'), noHandlers);

    // NFR-PORT-04: the panel is the primary surface, so it must work with no host present.
    expect(bridge.currentTools().map((t) => t.name)).toEqual(['add_person', 'flag_conflict']);
  });
});

describe('ModelContextBridge — current AbortSignal API', () => {
  it('uses the current handler even when the tool stays registered', async () => {
    let execute: ((args: unknown) => Promise<unknown>) | undefined;
    let registrations = 0;
    const mc: ModelContextLike = { registerTool: (tool) => { execute = tool.execute; registrations++; } };
    const bridge = new ModelContextBridge({ flavour: 'document', mc });
    bridge.provide(tools('add_person'), { add_person: async () => 'old context' });
    await bridge.settled();
    bridge.provide(tools('add_person'), { add_person: async () => 'current context' });
    await bridge.settled();
    expect(await execute?.({})).toBe('current context');
    expect(registrations).toBe(1);
  });

  it('reports registration failures and retries instead of claiming tools are ready', async () => {
    let fail = true;
    const reports: string[] = [];
    const mc: ModelContextLike = { registerTool: async () => {
      if (fail) throw new Error('Host rejected registration');
    } };
    const bridge = new ModelContextBridge({ flavour: 'document', mc }, (report) => reports.push(report.status));
    bridge.provide(tools('add_person'), noHandlers);
    await bridge.settled();
    expect(reports.at(-1)).toBe('error');
    fail = false;
    bridge.provide(tools('add_person'), noHandlers);
    await bridge.settled();
    expect(reports.at(-1)).toBe('ready');
  });

  it('aborts pending registrations when the bridge is disposed', async () => {
    let signal: AbortSignal | undefined;
    let finish: (() => void) | undefined;
    const mc: ModelContextLike = { registerTool: (_tool, options) => {
      signal = options?.signal;
      return new Promise<void>((resolve) => { finish = resolve; });
    } };
    const bridge = new ModelContextBridge({ flavour: 'document', mc });
    bridge.provide(tools('add_person'), noHandlers);
    await Promise.resolve();
    bridge.dispose();
    expect(signal?.aborted).toBe(true);
    finish?.();
    await bridge.settled();
    expect(bridge.currentTools()).toEqual([]);
  });

  it('registers without requiring unregisterTool and aborts a withdrawn tool', async () => {
    const registered = new Map<string, AbortSignal | undefined>();
    const mc: ModelContextLike = {
      registerTool: (tool, options) => void registered.set(tool.name, options?.signal),
    };
    const bridge = new ModelContextBridge({ flavour: 'document', mc });

    bridge.provide(tools('add_person', 'resolve_claim'), noHandlers);
    await bridge.settled();
    const withdrawn = registered.get('resolve_claim');
    expect([...registered.keys()].sort()).toEqual(['add_person', 'resolve_claim']);

    bridge.provide(tools('add_person'), noHandlers);
    await bridge.settled();
    expect(withdrawn?.aborted).toBe(true);
    expect(bridge.currentTools().map((tool) => tool.name)).toEqual(['add_person']);
  });

  it('refuses an in-flight tool after the page withdraws it', async () => {
    let execute: ((args: unknown) => Promise<unknown>) | undefined;
    const mc: ModelContextLike = { registerTool: (tool) => { execute = tool.execute; } };
    const bridge = new ModelContextBridge({ flavour: 'document', mc });
    bridge.provide(tools('resolve_claim'), { resolve_claim: async () => ({ ok: true }) });
    await bridge.settled();

    bridge.provide([], {});
    const result = await execute?.({});
    expect(result).toMatchObject({ ok: false, error: { kind: 'refused' } });
  });
});
