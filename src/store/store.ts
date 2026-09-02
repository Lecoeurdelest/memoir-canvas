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
import type { ModelContextReport } from '../mcp/modelContext';

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
  /**
   * Whether the machinery drawer is open. UI state of the same kind as `ui` — about what the
   * person is looking at, not about what is true — and it lives here rather than being drilled
   * from Archive through BookStage and Volume to reach the one button on the refused page that
   * needs it. It is deliberately NOT part of `ui`: the registry is a pure function of that, and
   * opening a drawer must not change which tools an agent holds.
   */
  backstage: boolean;
  /**
   * The blank page that is open, if any — either a question the agent asked, or a silent year
   * the family may fill. UI state, like `backstage`.
   */
  openQuestion: string | null;
  openYear: number | null;
  webmcp: ModelContextReport;
  refresh: () => Promise<void>;
  setUi: (ui: UiState) => void;
  setLang: (lang: Lang) => void;
  setBackstage: (open: boolean) => void;
  setOpenQuestion: (id: string | null) => void;
  setOpenYear: (year: number | null) => void;
  setWebmcp: (webmcp: ModelContextReport) => void;
}

export const useStore = create<Store>((set) => ({
  model: null,
  ui: INITIAL_UI_STATE,
  lang: currentLang(),
  backstage: false,
  openQuestion: null,
  openYear: null,
  webmcp: { status: 'absent', registered: 0, message: null },
  refresh: async () => set({ model: await buildReadModel() }),
  setUi: (ui) => set({ ui }),
  setLang: (lang) => void i18n.changeLanguage(lang),
  setBackstage: (backstage) => set({ backstage }),
  setOpenQuestion: (openQuestion) => set({ openQuestion, openYear: null }),
  setOpenYear: (openYear) => set({ openYear, openQuestion: null }),
  setWebmcp: (webmcp) => set({ webmcp }),
}));

i18n.on('languageChanged', () => useStore.setState({ lang: currentLang() }));
