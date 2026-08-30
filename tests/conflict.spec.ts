/**
 * TASK-014 and TASK-009 acceptance criteria, driven through the real command layer.
 *
 * In node, PGlite.create('idb://…') fails and db.ts falls back to in-memory, so these run
 * against a real Postgres with the real schema — constraints, triggers and roles included.
 * Mocking the database here would prove nothing: every guarantee under test is enforced by SQL.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import * as commands from '../src/domain/commands';
import { RefusedError } from '../src/domain/commands';
import { query } from '../src/domain/db';
import { loadSeed, type SeededArchive } from '../src/seed/loadSeed';

const HUMAN = { actor: 'human' as const, registeredBecause: 'test' };
const AGENT = { actor: 'agent' as const, registeredBecause: 'user has person open' };

let seed: SeededArchive;

beforeEach(async () => {
  await commands.resetArchive(HUMAN);
  seed = await loadSeed();
});

describe('TASK-014 — detecting and recording conflicts', () => {
  it('refuses a conflict the data does not support, and writes nothing', async () => {
    const before = await query<{ n: number }>('SELECT count(*)::int AS n FROM conflict');

    await expect(
      commands.flagConflict(
        { subject_kind: 'person', subject_id: seed.uncleId, predicate: 'never_happened' },
        AGENT,
      ),
    ).rejects.toThrow(RefusedError);

    const after = await query<{ n: number }>('SELECT count(*)::int AS n FROM conflict');
    expect(after[0].n).toBe(before[0].n);
  });

  it('joins three disagreeing recollections into ONE conflict, not three pairs', async () => {
    await commands.addMemoryClaim(
      {
        subject_kind: 'person',
        subject_id: seed.grandmaId,
        predicate: 'moved_to',
        object_place_id: seed.daNangId,
        year_value: 1975,
        year_precision: 'exact',
      },
      HUMAN,
    );

    const rows = await query<{ claim_ids: string[] }>('SELECT * FROM v_open_disagreement');
    expect(rows).toHaveLength(1);
    expect(rows[0].claim_ids).toHaveLength(3);

    const flagged = await commands.flagConflict(
      { subject_kind: 'person', subject_id: seed.grandmaId, predicate: 'moved_to' },
      AGENT,
    );
    expect(flagged.claimIds).toHaveLength(3);

    const conflicts = await query<{ n: number }>('SELECT count(*)::int AS n FROM conflict');
    expect(conflicts[0].n).toBe(1);
  });

  it('leaves no path for an agent to close a conflict', async () => {
    const flagged = await commands.flagConflict(
      { subject_kind: 'person', subject_id: seed.grandmaId, predicate: 'moved_to' },
      AGENT,
    );

    // Well-formed, coherent, names a real human-entered person — and still refused, because
    // app_agent holds no UPDATE on conflict.status or claim.confirmed_by.
    await expect(
      commands.resolveClaim(
        {
          conflict_id: flagged.conflictId,
          winning_claim_id: seed.claim1974,
          resolved_by: seed.uncleId,
        },
        AGENT,
      ),
    ).rejects.toThrow();

    const [k] = await query<{ status: string }>('SELECT status FROM conflict WHERE id = $1', [
      flagged.conflictId,
    ]);
    expect(k.status).toBe('open');
  });

  it('does not report two compatible claims about different places as a contradiction', async () => {
    const saigon = await commands.addPlace({ name: 'Sài Gòn' }, HUMAN);
    await commands.addMemoryClaim(
      {
        subject_kind: 'person',
        subject_id: seed.grandmaId,
        predicate: 'moved_to',
        object_place_id: saigon,
        year_value: 1980,
        certainty: 'oral',
      },
      HUMAN,
    );

    const rows = await query<{ object_place_id: string }>('SELECT * FROM v_open_disagreement');
    expect(rows).toHaveLength(1);
    expect(rows[0].object_place_id).toBe(seed.daNangId);
  });
});

describe('TASK-009 — the audit trail', () => {
  it('loses both the command and its audit row when the write fails', async () => {
    const before = await query<{ n: number }>(
      `SELECT count(*)::int AS n FROM audit_event WHERE after->>'outcome' IS NULL`,
    );

    // An oral account with nobody to attribute it to trips source_oral_needs_a_voice.
    await expect(
      commands.linkClaimToSource(
        {
          claim_id: seed.claim1972,
          stance: 'supports',
          source: { kind: 'oral_account', title: 'Lời kể không rõ của ai' },
        },
        HUMAN,
      ),
    ).rejects.toThrow();

    const sources = await query<{ n: number }>(
      `SELECT count(*)::int AS n FROM source WHERE title = 'Lời kể không rõ của ai'`,
    );
    expect(sources[0].n).toBe(0);

    const after = await query<{ n: number }>(
      `SELECT count(*)::int AS n FROM audit_event WHERE after->>'outcome' IS NULL`,
    );
    expect(after[0].n).toBe(before[0].n);
  });

  it('records a blocked operation, with its reason and the constraint that fired', async () => {
    await expect(
      commands.linkClaimToSource(
        {
          claim_id: seed.claim1972,
          stance: 'supports',
          source: { kind: 'oral_account', title: 'Lời kể không rõ của ai' },
        },
        HUMAN,
      ),
    ).rejects.toThrow();

    const [row] = await query<{ reason: string; constraint: string; tool_name: string }>(
      `SELECT tool_name, after->>'reason' AS reason, after->>'constraint' AS constraint
         FROM audit_event WHERE after->>'outcome' = 'refused' ORDER BY id DESC LIMIT 1`,
    );
    expect(row.tool_name).toBe('link_claim_to_source');
    expect(row.constraint).toBe('source_oral_needs_a_voice');
    expect(row.reason).toContain('source_oral_needs_a_voice');
  });

  it('records a refusal raised before the database is touched', async () => {
    await expect(
      commands.flagConflict(
        { subject_kind: 'person', subject_id: seed.uncleId, predicate: 'never_happened' },
        AGENT,
      ),
    ).rejects.toThrow(RefusedError);

    const [row] = await query<{ reason: string; constraint: string | null; actor: string }>(
      `SELECT actor, after->>'reason' AS reason, after->>'constraint' AS constraint
         FROM audit_event WHERE after->>'outcome' = 'refused' ORDER BY id DESC LIMIT 1`,
    );
    expect(row.actor).toBe('agent');
    expect(row.reason).toContain('no open disagreement');
    expect(row.constraint).toBeNull();
  });

  it('stamps the actor from the database, not from what the caller claims', async () => {
    const id = await commands.addPerson({ display_name: 'Nhân chứng giả' }, AGENT);

    const [p] = await query<{ created_by: string }>(
      'SELECT created_by FROM person WHERE id = $1',
      [id],
    );
    expect(p.created_by).toBe('agent');

    const [a] = await query<{ actor: string }>(
      `SELECT actor FROM audit_event WHERE target_id = $1`,
      [id],
    );
    expect(a.actor).toBe('agent');
  });

  it('lets the sequence of what happened be reconstructed in order', async () => {
    await commands.flagConflict(
      { subject_kind: 'person', subject_id: seed.grandmaId, predicate: 'moved_to' },
      AGENT,
    );

    const rows = await query<{ tool_name: string; registered_because: string }>(
      'SELECT tool_name, registered_because FROM audit_event ORDER BY id',
    );
    const tools = rows.map((r) => r.tool_name);

    expect(tools[0]).toBe('reset_archive');
    expect(tools).toContain('add_person');
    expect(tools).toContain('add_memory_claim');
    expect(tools[tools.length - 1]).toBe('flag_conflict');
    expect(rows[rows.length - 1].registered_because).toBe('user has person open');
  });
});
