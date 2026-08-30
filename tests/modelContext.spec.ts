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
  it('withdraws a tool that is no longer in the set', () => {
    const { mc, registered } = perToolHost();
    const bridge = new ModelContextBridge({ flavour: 'navigator', mc });

    bridge.provide(tools('add_person', 'resolve_claim'), noHandlers);
    expect([...registered].sort()).toEqual(['add_person', 'resolve_claim']);

    // The person navigates away from the conflict. resolve_claim must go with them.
    bridge.provide(tools('add_person'), noHandlers);
    expect(registered.has('resolve_claim')).toBe(false);
    expect([...registered]).toEqual(['add_person']);
  });

  it('does not unregister a tool that is still current', () => {
    const { mc, registered } = perToolHost();
    const calls: string[] = [];
    mc.unregisterTool = (name) => {
      calls.push(name);
      registered.delete(name);
    };
    const bridge = new ModelContextBridge({ flavour: 'navigator', mc });

    bridge.provide(tools('add_person', 'resolve_claim'), noHandlers);
    bridge.provide(tools('add_person'), noHandlers);

    // add_person survived both sets — withdrawing and re-adding it would drop it from the host
    // for the instant between the two calls.
    expect(calls).toEqual(['resolve_claim']);
  });

  it('survives three successive sets without leaking a stale tool', () => {
    const { mc, registered } = perToolHost();
    const bridge = new ModelContextBridge({ flavour: 'navigator', mc });

    bridge.provide(tools('add_person'), noHandlers);
    bridge.provide(tools('add_person', 'flag_conflict'), noHandlers);
    bridge.provide(tools('add_person', 'resolve_claim'), noHandlers);

    expect(registered.has('flag_conflict')).toBe(false);
    expect([...registered].sort()).toEqual(['add_person', 'resolve_claim']);
  });
});

describe('ModelContextBridge.provide — whole-set host', () => {
  it('hands over exactly the current set, replacing the last one', () => {
    const { mc, seen } = wholeSetHost();
    const bridge = new ModelContextBridge({ flavour: 'navigator', mc });

    bridge.provide(tools('add_person', 'resolve_claim'), noHandlers);
    bridge.provide(tools('add_person'), noHandlers);

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
