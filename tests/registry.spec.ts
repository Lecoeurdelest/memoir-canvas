/**
 * R4 in one file: the registry is a pure function, so it needs no DOM and no agent.
 *
 * The cases that matter are the last two — tools that switch ON and then OFF again. That is
 * the whole stateful-registration claim, checkable in milliseconds.
 *
 * TASK-013 · FR-REG
 */
import { describe, expect, it } from 'vitest';
import { toolNamesFor } from '../src/mcp/registry';
import type { UiState } from '../src/store/uiState';

const none = new Set<string>();
const at = (ui: UiState, disagree = none, open = none) =>
  toolNamesFor({ ui, subjectsWithDisagreement: disagree, openConflictIds: open });

describe('toolsFor(uiState)', () => {
  it('always exposes the five base tools', () => {
    expect(at({ view: 'archive' })).toEqual([
      'read_memory_graph',
      'add_person',
      'add_memory_claim',
      'link_claim_to_source',
      'generate_story_card',
    ]);
  });

  it('does not expose flag_conflict for a subject with no disagreement', () => {
    expect(at({ view: 'person', personId: 'p1' })).not.toContain('flag_conflict');
  });

  it('exposes flag_conflict once the open subject has a disagreement', () => {
    expect(at({ view: 'person', personId: 'p1' }, new Set(['p1']))).toContain('flag_conflict');
  });

  it('does NOT expose resolve_claim merely because a person is open', () => {
    expect(at({ view: 'person', personId: 'p1' }, new Set(['p1']))).not.toContain('resolve_claim');
  });

  it('exposes resolve_claim only while that conflict is on screen', () => {
    const tools = at({ view: 'conflict', conflictId: 'k1', subjectId: 'p1' }, none, new Set(['k1']));
    expect(tools).toContain('resolve_claim');
    expect(tools).toContain('propose_followup_question');
  });

  it('withdraws resolve_claim once the conflict is closed', () => {
    const tools = at({ view: 'conflict', conflictId: 'k1', subjectId: 'p1' }, none, none);
    expect(tools).not.toContain('resolve_claim');
  });

  it('drops all three conditional tools on returning to the archive', () => {
    const tools = at({ view: 'archive' }, new Set(['p1']), new Set(['k1']));
    expect(tools).not.toContain('flag_conflict');
    expect(tools).not.toContain('resolve_claim');
    expect(tools).not.toContain('propose_followup_question');
  });
});
