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
import i18n, { currentLang, type Lang } from '../i18n';

/** The family reads Vietnamese and the judges read English; both are first-class (FR-I18N). */
export type { Lang };

interface Store {
  model: ReadModel | null;
  ui: UiState;
  /**
   * Which language's DATA column to read — `title_vi` against `title_en`. Interface strings come
   * from `useTranslation()` instead; this exists because a story card carries two bodies written
   * by a person, and choosing between them is not translation.
   *
   * Mirrors i18next rather than competing with it: `setLang` changes the language there, and the
   * subscription below follows a change made anywhere else.
   */
  lang: Lang;
  refresh: () => Promise<void>;
  setUi: (ui: UiState) => void;
  setLang: (lang: Lang) => void;
}

export const useStore = create<Store>((set) => ({
  model: null,
  ui: INITIAL_UI_STATE,
  lang: currentLang(),
  refresh: async () => set({ model: await buildReadModel() }),
  setUi: (ui) => set({ ui }),
  setLang: (lang) => void i18n.changeLanguage(lang),
}));

i18n.on('languageChanged', () => useStore.setState({ lang: currentLang() }));
