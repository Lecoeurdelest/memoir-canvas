/**
 * What the user is currently looking at.
 *
 * Deliberately separate from domain data: the tool registry (R4) is a pure function of
 * THIS, not of the graph. Keeping them apart is what makes toolsFor() testable without a
 * DOM and without an agent.
 */

export type UiState =
  | { view: 'archive' }
  | { view: 'person'; personId: string }
  | { view: 'conflict'; conflictId: string; subjectId: string };

export const INITIAL_UI_STATE: UiState = { view: 'archive' };

/** Human-readable reason a tool was available, written into audit_event.registered_because. */
export function describeUiState(ui: UiState): string {
  switch (ui.view) {
    case 'archive':
      return 'user is browsing the archive';
    case 'person':
      return `user has person ${ui.personId} open`;
    case 'conflict':
      return `user has conflict ${ui.conflictId} open`;
  }
}
