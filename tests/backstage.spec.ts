/**
 * TASK-031 — the machinery moved into a drawer without any of it being softened.
 *
 * The tension this task solves is easy to solve wrongly: hiding the technical surface would lose
 * the hackathon, and showing it first lost the family. So what is pinned here is that the drawer
 * kept everything a judge needs, and that the one thing a judge must read — the database's own
 * refusal — is still the database's own words.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import * as commands from '../src/domain/commands';
import { LANGS, resources } from '../src/i18n';
import { DESCRIPTORS } from '../src/mcp/descriptors';
import { buildReadModel } from '../src/store/projection';
import { loadSeed, type SeededArchive } from '../src/seed/loadSeed';

const HUMAN = { actor: 'human' as const, registeredBecause: 'test' };
const AGENT = { actor: 'agent' as const, registeredBecause: 'a reader asked the assistant to settle it' };

let seed: SeededArchive;

beforeEach(async () => {
  await commands.resetArchive(HUMAN);
  seed = await loadSeed();
});

describe('the second entrance', () => {
  it('is refused by Postgres in Postgres’ own words, not in ours', async () => {
    await commands.flagConflict(
      { subject_kind: 'person', subject_id: seed.grandmaId, predicate: 'moved_to' },
      AGENT,
    );
    const { spreads } = await buildReadModel();
    const conflictId = spreads[0].conflict!.id;

    // Exactly what the "ask the assistant" control calls.
    const refusal = await commands
      .resolveClaim(
        { conflict_id: conflictId, winning_claim_id: seed.claim1974, resolved_by: seed.uncleId },
        AGENT,
      )
      .then(() => null)
      .catch((e: unknown) => (e instanceof Error ? e.message : String(e)));

    expect(refusal, 'the agent must be refused').not.toBeNull();
    // The message a reader sees. If this ever becomes a friendly paraphrase, the evidence is gone
    // and the project is asserting its own claim instead of demonstrating it.
    expect(refusal).toContain('permission denied');
    expect(refusal).not.toMatch(/cannot|not allowed|sorry/i);
  });

  it('writes the attempt into the audit, marked refused and stamped agent', async () => {
    await commands.flagConflict(
      { subject_kind: 'person', subject_id: seed.grandmaId, predicate: 'moved_to' },
      AGENT,
    );
    const { spreads } = await buildReadModel();
    await commands
      .resolveClaim(
        {
          conflict_id: spreads[0].conflict!.id,
          winning_claim_id: seed.claim1974,
          resolved_by: seed.uncleId,
        },
        AGENT,
      )
      .catch(() => undefined);

    const { audit } = await buildReadModel();
    const row = audit.find(
      (r) => r.tool_name === 'resolve_claim' && r.actor === 'agent',
    );
    expect(row, 'the refusal is an event too').toBeDefined();

    const after = row!.after as { outcome?: string; reason?: string } | null;
    expect(after?.outcome).toBe('refused');
    expect(after?.reason).toContain('permission denied');
    // The link a reader follows says "see what just happened" — this is what they arrive at.
    expect(row!.registered_because).toContain('asked the assistant');
  });
});

describe('what the drawer must still contain', () => {
  it('offers every tool the contract advertises, so nothing was lost in the move', () => {
    // Backstage renders ManualToolPanel unchanged; if a tool vanished from the contract the
    // drawer would quietly stop demonstrating it.
    expect(Object.keys(DESCRIPTORS).length).toBeGreaterThanOrEqual(8);
    expect(Object.keys(DESCRIPTORS)).toContain('resolve_claim');
  });

  it('names both Postgres roles somewhere a judge can read them', () => {
    // The role names are literals in the toggle, not translated copy — but the plain-language
    // half beside them is, and it must exist in both languages.
    for (const lng of LANGS) {
      const b = resources[lng].translation.backstage as Record<string, string>;
      expect(b.roleAgent, `${lng} agent role`).toBeTruthy();
      expect(b.roleHuman, `${lng} human role`).toBeTruthy();
      expect(b.actorWhy, `${lng} why it is not cosmetic`).toBeTruthy();
      expect(b.noServer, `${lng} there is no server`).toBeTruthy();
    }
  });
});

describe('what a family member reads', () => {
  it('has a word for every predicate the seeded archive uses', async () => {
    // TASK-031: no raw database identifier outside Backstage. A missing word here would print
    // `moved_to` in the largest text on the page.
    const { spreads } = await buildReadModel();
    const used = [...new Set(spreads.map((s) => s.predicate))];
    expect(used.length).toBeGreaterThan(1);

    for (const lng of LANGS) {
      const words = resources[lng].translation.predicate as Record<string, string>;
      for (const predicate of used) {
        expect(words[predicate], `${lng} has no word for ${predicate}`).toBeTruthy();
      }
    }
  });

  it('says what the archive is in both languages, not only in English', () => {
    for (const lng of LANGS) {
      const app = resources[lng].translation.app as Record<string, string>;
      expect(app.tagline, `${lng} tagline`).toBeTruthy();
      expect(app.ephemeral, `${lng} private-browsing warning`).toBeTruthy();
    }
    expect(resources.vi.translation.app.tagline).not.toBe(resources.en.translation.app.tagline);
  });
});
