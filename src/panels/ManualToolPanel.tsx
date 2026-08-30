/**
 * TASK-006 · NFR-PORT-04 — invoke the tools by hand.
 *
 * Not insurance: `navigator.modelContext` and `document.modelContext` are absent in Chrome 151
 * and in WebKit, so this is the primary interaction surface until a host ships the API. It
 * renders whatever `toolsFor(uiState)` currently offers, straight from each descriptor's
 * inputSchema, so a tool withdrawn by R4 disappears here too.
 *
 * R5: reads from the store, writes only through the same handlers the agent uses.
 */

import { useState } from 'react';
import { invokeTool, toolsOnOffer } from '../bootstrap';
import type { ToolDescriptor, ToolName } from '../mcp/descriptors';
import type { ActorKind } from '../domain/types';
import type { ToolResult } from '../mcp/handlers';
import { useStore } from '../store/store';

interface SchemaProp {
  type?: string;
  enum?: string[];
  description?: string;
}

function propsOf(tool: ToolDescriptor): [string, SchemaProp][] {
  const props = (tool.inputSchema.properties ?? {}) as Record<string, SchemaProp>;
  return Object.entries(props);
}

function requiredOf(tool: ToolDescriptor): string[] {
  return (tool.inputSchema.required as string[] | undefined) ?? [];
}

/** Text in, JSON out: integers become numbers, everything else stays a string. */
function coerce(raw: Record<string, string>, tool: ToolDescriptor): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, spec] of propsOf(tool)) {
    const value = raw[key]?.trim();
    if (!value) continue;
    out[key] = spec.type === 'integer' || spec.type === 'number' ? Number(value) : value;
  }
  return out;
}

function ToolForm({ tool, actor }: { tool: ToolDescriptor; actor: ActorKind }): JSX.Element {
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ToolResult | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = useStore((s) => s.refresh);
  const required = requiredOf(tool);

  async function run(): Promise<void> {
    setBusy(true);
    try {
      const r = await invokeTool(tool.name as ToolName, coerce(values, tool), actor);
      setResult(r);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="tool">
      <summary>
        <code>{tool.name}</code>
      </summary>
      <p className="tool-desc">{tool.description}</p>

      {propsOf(tool).map(([key, spec]) => (
        <label key={key} className="field">
          <span>
            {key}
            {required.includes(key) && <b aria-label="required"> *</b>}
          </span>
          {spec.enum ? (
            <select
              value={values[key] ?? ''}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
            >
              <option value="">—</option>
              {spec.enum.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={values[key] ?? ''}
              placeholder={spec.description ?? ''}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
            />
          )}
        </label>
      ))}

      <button type="button" onClick={run} disabled={busy}>
        {busy ? 'running…' : `call ${tool.name}`}
      </button>

      {result && (
        // Refusals are shown verbatim. "The agent tried and was blocked" is the point of the
        // project, so it must be legible here rather than swallowed into a generic error.
        <p className={result.ok ? 'result ok' : 'result refused'} role="status">
          {result.ok ? (
            <>
              <b>ok</b> <span>{JSON.stringify(result.data)}</span>
            </>
          ) : (
            <>
              <b>{result.error?.kind}</b> <span>{result.error?.message}</span>
            </>
          )}
        </p>
      )}
    </details>
  );
}

export function ManualToolPanel(): JSX.Element {
  const [actor, setActor] = useState<ActorKind>('agent');
  const ui = useStore((s) => s.ui);
  const model = useStore((s) => s.model);
  // Recomputed from the same pure function the agent's registry uses, so what is listed here is
  // exactly what an agent would hold in this UI state — void the deps to keep them honest.
  void ui;
  void model;
  const tools = toolsOnOffer();

  return (
    <section className="panel" aria-labelledby="tools-heading">
      <h2 id="tools-heading">Tools ({tools.length})</h2>
      <p className="hint">
        The same handlers an agent reaches over WebMCP. Tools appear and disappear with what you
        have open — that is the point.
      </p>

      <fieldset className="actor">
        <legend>Acting as</legend>
        {(['agent', 'human'] as const).map((a) => (
          <label key={a}>
            <input
              type="radio"
              name="actor"
              value={a}
              checked={actor === a}
              onChange={() => setActor(a)}
            />
            {a === 'agent' ? 'the agent' : 'a person'}
          </label>
        ))}
        <span className="hint">
          Not cosmetic: the database assumes a different role for each, and the agent's holds no
          privilege to confirm a claim or close a conflict. Try `resolve_claim` as both.
        </span>
      </fieldset>

      {tools.map((t) => (
        <ToolForm key={t.name} tool={t} actor={actor} />
      ))}
    </section>
  );
}
