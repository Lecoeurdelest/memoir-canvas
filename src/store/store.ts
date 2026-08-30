/**
 * R5 — the view layer reads from here and never writes to it directly.
 *
 * The store holds nothing that did not come out of the database, except uiState, which is
 * about what the user is looking at rather than what is true. Keeping domain state out of
 * component-local useState is what lets the whole view layer be swapped (TASK-026) without
 * touching the three layers below.
 *
 * TASK-010
 */

import { create } from 'zustand';
import { buildReadModel, type ReadModel } from './projection';
import { INITIAL_UI_STATE, type UiState } from './uiState';

interface Store {
  model: ReadModel | null;
  ui: UiState;
  refresh: () => Promise<void>;
  setUi: (ui: UiState) => void;
}

export const useStore = create<Store>((set) => ({
  model: null,
  ui: INITIAL_UI_STATE,
  refresh: async () => set({ model: await buildReadModel() }),
  setUi: (ui) => set({ ui }),
}));
