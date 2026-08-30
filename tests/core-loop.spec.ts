/**
 * TASK-025 — the demo core, end to end, in one unbroken pass.
 *
 * The DAY 4 GATE. It walks the chain the way the scenario in .agent/context/project.md tells it:
 * two recollections disagree, the agent flags it, the page tears, the agent stops because no tool
 * it holds can settle it, it proposes a question instead, a person opens the conflict, and only
 * then does resolve_claim exist at all.
 *
 * Everything here goes through the real handlers against a real PGlite. Nothing is mocked,
 * because every guarantee under test is enforced by SQL.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import * as commands from '../src/domain/commands';
import { query } from '../src/domain/db';
import { makeHandlers } from '../src/mcp/handlers';
import { toolNamesFor } from '../src/mcp/registry';
import { buildReadModel } from '../src/store/projection';
import { loadSeed, type SeededArchive } from '../src/seed/loadSeed';
import type { UiState } from '../src/store/uiState';

const HUMAN = { actor: 'human' as const, registeredBecause: 'a person confirmed it on the conflict page' };

/** The agent's context changes with the page, exactly as bootstrap.ts rebuilds it. */
const asAgent = (ui: UiState) =>
  makeHandlers({ actor: 'agent', registeredBecause: describe_(ui) });

function describe_(ui: UiState): string {
  return ui.view === 'conflict' ? `user has conflict ${ui.conflictId} open` : `user is browsing the archive`;
}

/** What the registry hands over for a given page — the same pure function the app uses. */
async function toolsOn(ui: UiState): Promise<string[]> {
  const m = await buildReadModel();
  return toolNamesFor({
    ui,
    subjectsWithDisagreement: m.subjectsWithDisagreement,
    openConflictIds: m.openConflictIds,
  });
}

let seed: SeededArchive;

beforeEach(async () => {
  await commands.resetArchive(HUMAN);
  seed = await loadSeed();
});

describe('TASK-025 — the demo core in one pass', () => {
  it('runs the whole chain, and resolve_claim exists only in the middle of it', async () => {
    const archive: UiState = { view: 'archive' };

    // ── 1-4. The archive already holds two recollections that disagree. ──────────────────
    let m = await buildReadModel();
    expect(m.disagreements, 'the detector sees it').toHaveLength(1);
    expect(m.spreads[0].conflict, 'but nobody has recorded it yet').toBeNull();

    // ── 5. Before anything is flagged, the agent cannot settle anything. ────────────────
    expect(await toolsOn(archive)).not.toContain('resolve_claim');

    const onPerson: UiState = { view: 'person', personId: seed.grandmaId };
    expect(await toolsOn(onPerson), 'a disagreement offers flag_conflict').toContain('flag_conflict');
    expect(await toolsOn(onPerson), 'and still not resolve_claim').not.toContain('resolve_claim');

    // ── 6. The agent flags it. The page tears. ──────────────────────────────────────────
    const flagged = await asAgent(onPerson).flag_conflict({
      subject_kind: 'person',
      subject_id: seed.grandmaId,
      predicate: 'moved_to',
    });
    expect(flagged.ok).toBe(true);
    const conflictId = (flagged.data as { conflict_id: string }).conflict_id;

    m = await buildReadModel();
    expect(m.spreads[0].conflict?.id, 'the page is torn').toBe(conflictId);

    // ── 7. The agent stops. Nothing it holds can decide. ────────────────────────────────
    expect(
      (flagged.data as { resolution: string }).resolution,
      'the return value refuses to adjudicate',
    ).toContain('requires a person');

    const onConflict: UiState = { view: 'conflict', conflictId, subjectId: seed.grandmaId };
    const agentOnConflict = asAgent(onConflict);

    const agentTries = await agentOnConflict.resolve_claim({
      conflict_id: conflictId,
      winning_claim_id: seed.claim1974,
      resolved_by: seed.uncleId,
    });
    expect(agentTries.ok, 'even with perfect arguments, the agent is refused').toBe(false);

    m = await buildReadModel();
    expect(m.spreads[0].conflict, 'and nothing moved').not.toBeNull();

    // ── 8. So it proposes a question instead. ───────────────────────────────────────────
    const asked = await agentOnConflict.propose_followup_question({
      conflict_id: conflictId,
      question_vi: 'Hỏi Cậu Ba: ảnh chụp trước hay sau khi chuyển?',
      question_en: 'Ask Uncle Ba: was the photo taken before or after the move?',
      ask_person_id: seed.uncleId,
    });
    expect(asked.ok).toBe(true);

    // ── 9. A person opens the conflict. Only now does the tool exist. ───────────────────
    expect(await toolsOn(onConflict)).toContain('resolve_claim');

    // ── 10. The person confirms 1974. ───────────────────────────────────────────────────
    await commands.resolveClaim(
      {
        conflict_id: conflictId,
        winning_claim_id: seed.claim1974,
        resolved_by: seed.uncleId,
        resolution_note: 'Cậu Ba xác nhận từ mặt sau tấm ảnh',
      },
      HUMAN,
    );

    m = await buildReadModel();
    const spread = m.spreads[0];
    expect(spread.conflict, 'the tear heals').toBeNull();
    expect(spread.resolvedBy?.display_name, 'and carries the name').toBe('Cậu Ba');
    expect(spread.claims[0].certainty).toBe('confirmed');

    // ── and the tool is gone again ──────────────────────────────────────────────────────
    expect(await toolsOn(onConflict), 'withdrawn once the conflict closes').not.toContain(
      'resolve_claim',
    );
  });

  it('records the full chain in the audit trail, with registered_because', async () => {
    const onPerson: UiState = { view: 'person', personId: seed.grandmaId };
    const flagged = await asAgent(onPerson).flag_conflict({
      subject_kind: 'person',
      subject_id: seed.grandmaId,
      predicate: 'moved_to',
    });
    const conflictId = (flagged.data as { conflict_id: string }).conflict_id;
    const onConflict: UiState = { view: 'conflict', conflictId, subjectId: seed.grandmaId };

    await asAgent(onConflict).resolve_claim({
      conflict_id: conflictId,
      winning_claim_id: seed.claim1974,
      resolved_by: seed.uncleId,
    });
    await asAgent(onConflict).propose_followup_question({
      conflict_id: conflictId,
      question_vi: 'Hỏi Cậu Ba',
    });
    await commands.resolveClaim(
      { conflict_id: conflictId, winning_claim_id: seed.claim1974, resolved_by: seed.uncleId },
      HUMAN,
    );

    const log = await query<{
      tool_name: string;
      actor: string;
      registered_because: string;
      outcome: string | null;
    }>(
      `SELECT tool_name, actor, registered_because, after->>'outcome' AS outcome
         FROM audit_event ORDER BY id`,
    );
    const names = log.map((r) => r.tool_name);

    expect(names, 'the chain is all there').toEqual(
      expect.arrayContaining([
        'flag_conflict',
        'resolve_claim',
        'propose_followup_question',
      ]),
    );

    // The agent's blocked attempt is in the log — the evidence that the constraint is real.
    const blocked = log.filter((r) => r.outcome === 'refused' && r.actor === 'agent');
    expect(blocked.length, 'the agent tried and was blocked').toBeGreaterThanOrEqual(1);

    // Every row says why the caller was allowed to act at that moment.
    for (const row of log) {
      expect(row.registered_because.length, row.tool_name).toBeGreaterThan(0);
    }
    const onConflictRows = log.filter((r) => r.registered_because.includes(conflictId));
    expect(onConflictRows.length, 'context names the conflict on screen').toBeGreaterThanOrEqual(1);

    // The successful resolution was a person's.
    const settled = log.filter((r) => r.tool_name === 'resolve_claim' && r.outcome === null);
    expect(settled).toHaveLength(1);
    expect(settled[0].actor).toBe('human');
  });
});

describe('TASK-008 — the button and the tool are the same function', () => {
  it('refuses a non-member claim identically down both paths', async () => {
    const onPerson: UiState = { view: 'person', personId: seed.grandmaId };
    const flagged = await asAgent(onPerson).flag_conflict({
      subject_kind: 'person',
      subject_id: seed.grandmaId,
      predicate: 'moved_to',
    });
    const conflictId = (flagged.data as { conflict_id: string }).conflict_id;

    const stray = await commands.addMemoryClaim(
      {
        subject_kind: 'person',
        subject_id: seed.grandmaId,
        predicate: 'occupation',
        object_text: 'thợ may',
      },
      HUMAN,
    );

    // The UI path: what Tear.tsx's Confirm button calls.
    const fromButton = await commands
      .resolveClaim(
        { conflict_id: conflictId, winning_claim_id: stray, resolved_by: seed.uncleId },
        HUMAN,
      )
      .then(() => null)
      .catch((e: Error) => e.message);

    // The tool path: what an agent reaches.
    const onConflict: UiState = { view: 'conflict', conflictId, subjectId: seed.grandmaId };
    const fromTool = await makeHandlers(HUMAN).resolve_claim({
      conflict_id: conflictId,
      winning_claim_id: stray,
      resolved_by: seed.uncleId,
    });
    void onConflict;

    expect(fromButton, 'the button is refused').not.toBeNull();
    expect(fromTool.ok, 'the tool is refused').toBe(false);
    expect(fromTool.error?.message, 'with the same reason').toBe(fromButton);
  });

  it('leaves no half state when a command fails', async () => {
    const before = await query<{ n: number }>('SELECT count(*)::int AS n FROM source');

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

    const after = await query<{ n: number }>('SELECT count(*)::int AS n FROM source');
    expect(after[0].n, 'the source insert rolled back with the evidence insert').toBe(before[0].n);
  });
});
