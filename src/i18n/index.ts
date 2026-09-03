/**
 * TASK-033 — i18next, with the translations bundled.
 *
 * Two decisions worth stating, because both are load-bearing:
 *
 *   `i18next-http-backend` is deliberately NOT installed. It fetches, and `NFR-PRIV-01` allows no
 *   runtime network call at all — the shipped CSP would block it silently and the interface would
 *   render as bare keys. Resources are imported and bundled instead.
 *
 *   TASK-048 — the interface is English only now, by the owner's decision. The detector is gone
 *   and `en` is both the language and the fallback: nothing about the surface asks the reader to
 *   choose, because there is nothing to choose. The Vietnamese resource stays in the bundle —
 *   the paired `*_vi` / `*_en` columns are the schema's, tests hold the two files to the same
 *   keys, and the family's OWN WORDS in the archive are testimony kept verbatim, not interface.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import vi from './locales/vi.json';

export const LANGS = ['vi', 'en'] as const;
export type Lang = (typeof LANGS)[number];

export const resources = { vi: { translation: vi }, en: { translation: en } } as const;

void i18n.use(initReactI18next).init({
  resources,
  supportedLngs: LANGS,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

/** The active language, narrowed — `i18n.language` can carry a region ("vi-VN"). */
export function currentLang(): Lang {
  const base = i18n.language?.split('-')[0] ?? 'en';
  return isLang(base) ? base : 'en';
}

export default i18n;
