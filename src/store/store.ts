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

/** The family reads Vietnamese and the judges read English; both are first-class (FR-I18N). */
export type Lang = 'vi' | 'en';

interface Store {
  model: ReadModel | null;
  ui: UiState;
  /** A display preference, not domain data — one toggle for every panel rather than each keeping its own. */
  lang: Lang;
  refresh: () => Promise<void>;
  setUi: (ui: UiState) => void;
  setLang: (lang: Lang) => void;
}

export const useStore = create<Store>((set) => ({
  model: null,
  ui: INITIAL_UI_STATE,
  lang: 'vi',
  refresh: async () => set({ model: await buildReadModel() }),
  setUi: (ui) => set({ ui }),
  setLang: (lang) => set({ lang }),
}));
