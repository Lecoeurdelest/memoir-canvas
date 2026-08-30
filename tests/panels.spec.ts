/**
 * TASK-024 — the audit panel renders sentences, so every tool needs one. A new tool with no
 * phrasing falls back to its raw name, which is exactly the "JSON dump" the task rules out, and
 * nothing else would catch it.
 *
 * TASK-022's ordering rule is asserted the same way: as data, not as CSS.
 */
import { describe, expect, it } from 'vitest';
import { ALL_TOOL_NAMES } from '../src/mcp/descriptors';
import auditRaw from '../src/panels/AuditTrail.tsx?raw';
import evidenceRaw from '../src/panels/EvidencePanel.tsx?raw';

/** Prose about not truncating is not truncating. Assert on code, not on comments. */
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const auditSource = stripComments(auditRaw);
const evidenceSource = stripComments(evidenceRaw);

/** Commands that write an audit row without being tools — they still appear in the timeline. */
const NON_TOOL_WRITERS = ['add_place', 'reset_archive'];

describe('TASK-024 — the audit panel', () => {
  it('has a readable sentence for every tool an agent can call', () => {
    for (const name of ALL_TOOL_NAMES) {
      expect(auditSource, `no phrasing for ${name}`).toContain(`${name}: {`);
    }
  });

  it('has one for the commands that are not tools but still audit', () => {
    for (const name of NON_TOOL_WRITERS) {
      expect(auditSource, `no phrasing for ${name}`).toContain(`${name}: {`);
    }
  });

  it('phrases every operation in both languages', () => {
    const entries = [...auditSource.matchAll(/^\s{2}(\w+): \{ vi: '([^']*)', en: '([^']*)' \}/gm)];
    expect(entries.length).toBeGreaterThanOrEqual(ALL_TOOL_NAMES.length);
    for (const [, name, vi, en] of entries) {
      expect(vi.length, `${name} vi`).toBeGreaterThan(0);
      expect(en.length, `${name} en`).toBeGreaterThan(0);
      expect(vi, `${name} must not be phrased as its tool name`).not.toBe(name);
    }
  });

  it('never renders the raw args object into the sentence', () => {
    // A judge reads this panel. JSON.stringify anywhere in it would defeat the whole task.
    expect(auditSource).not.toContain('JSON.stringify');
  });
});

describe('TASK-022 — the evidence panel', () => {
  it('orders a contradicting source before a supporting one', () => {
    const m = evidenceSource.match(/const STANCE_ORDER: Stance\[\] = \[([^\]]+)\]/);
    expect(m, 'STANCE_ORDER must exist').not.toBeNull();

    const order = m![1].split(',').map((s) => s.trim().replace(/'/g, ''));
    expect(order[0], 'contradicts must sort first').toBe('contradicts');
    expect(order).toContain('supports');
    expect(order).toContain('mentions');
  });

  it('renders verbatim as its own node, with nothing that could clip it', () => {
    expect(evidenceSource).toContain('{source.verbatim}');
    for (const clipper of ['slice(', 'substring(', 'truncate', 'text-overflow']) {
      expect(evidenceSource, `verbatim must not be clipped (${clipper})`).not.toContain(clipper);
    }
  });

  it('labels every stance and source kind in both languages', () => {
    for (const stance of ['contradicts', 'supports', 'mentions']) {
      expect(evidenceSource).toContain(`${stance}: {`);
    }
    for (const kind of ['oral_account', 'photo', 'document', 'external_record']) {
      expect(evidenceSource).toContain(`${kind}: {`);
    }
  });
});
