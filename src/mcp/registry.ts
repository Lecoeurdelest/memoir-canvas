/**
 * R4 — the registry is a pure function: tools = f(uiState).
 *
 * This is the only file allowed to call provideContext(). Do not sprinkle
 * register/unregister calls across components: that builds a hidden state machine
 * nobody can debug, and it breaks exactly when you are recording the demo.
 */

import {
  BASE_TOOLS,
  DESCRIPTORS,
  type ToolDescriptor,
  type ToolName,
} from './descriptors';
import type { UiState } from '../store/uiState';

export interface RegistryInput {
  ui: UiState;
  /** Subject ids that currently have a row in v_open_disagreement. */
  subjectsWithDisagreement: ReadonlySet<string>;
  /** Conflict ids whose status is still 'open'. */
  openConflictIds: ReadonlySet<string>;
}

/**
 * Pure. No DOM, no agent, no database — so it is testable on its own.
 * See docs/technical/04-stateful-registration.md for the full table.
 */
export function toolNamesFor(input: RegistryInput): ToolName[] {
  const names: ToolName[] = [...BASE_TOOLS];
  const { ui, subjectsWithDisagreement, openConflictIds } = input;

  if (ui.view === 'person' && subjectsWithDisagreement.has(ui.personId)) {
    names.push('flag_conflict');
  }

  if (ui.view === 'conflict' && openConflictIds.has(ui.conflictId)) {
    names.push('flag_conflict', 'propose_followup_question', 'resolve_claim');
  }

  return [...new Set(names)];
}

export function toolsFor(input: RegistryInput): ToolDescriptor[] {
  return toolNamesFor(input).map((n) => DESCRIPTORS[n]);
}
