/**
 * TASK-033 — the two languages cannot drift apart.
 *
 * Before this, seventy `{ vi, en }` pairs sat in ten components and a half-translated string was
 * caught only by someone noticing. Now a missing key fails here.
 *
 * The plural suffixes are stripped before comparing, because differing plural forms are correct,
 * not drift: English distinguishes one claim from two, Vietnamese does not, so `card.claim_one`
 * legitimately exists in one file and not the other.
 */
import { describe, expect, it } from 'vitest';
import i18n, { LANGS, currentLang, resources } from '../src/i18n';

const PLURAL = /_(zero|one|two|few|many|other)$/;

function keysOf(node: unknown, prefix = ''): string[] {
  if (typeof node !== 'object' || node === null) return [prefix];
  return Object.entries(node).flatMap(([k, v]) =>
    keysOf(v, prefix ? `${prefix}.${k}` : k),
  );
}

const base = (k: string): string => k.replace(PLURAL, '');

describe('the resource files', () => {
  it('carry the same keys in both languages', () => {
    const vi = new Set(keysOf(resources.vi.translation).map(base));
    const en = new Set(keysOf(resources.en.translation).map(base));

    expect([...vi].filter((k) => !en.has(k)), 'in vi but not en').toEqual([]);
    expect([...en].filter((k) => !vi.has(k)), 'in en but not vi').toEqual([]);
  });

  it('has no empty string anywhere', () => {
    for (const lng of LANGS) {
      const flat = keysOf(resources[lng].translation);
      for (const key of flat) {
        const value = key.split('.').reduce<unknown>(
          (acc, part) => (acc as Record<string, unknown>)[part],
          resources[lng].translation,
        );
        expect(typeof value, `${lng}:${key}`).toBe('string');
        expect((value as string).trim().length, `${lng}:${key} is empty`).toBeGreaterThan(0);
      }
    }
  });

  it('translates the same key differently in the two languages', () => {
    // A key identical in both is usually one somebody forgot to translate. The set is empty on
    // purpose: adding to it must be a deliberate act, argued in the PR.
    const ALLOWED_IDENTICAL = new Set<string>();
    const vi = keysOf(resources.vi.translation);

    const identical = vi.filter((key) => {
      const read = (obj: unknown): unknown =>
        key.split('.').reduce<unknown>((a, p) => (a as Record<string, unknown>)?.[p], obj);
      const a = read(resources.vi.translation);
      const b = read(resources.en.translation);
      return typeof a === 'string' && a === b && !ALLOWED_IDENTICAL.has(key);
    });

    expect(identical, 'untranslated keys').toEqual([]);
  });
});

describe('i18next itself', () => {
  it('resolves a key in both languages', async () => {
    await i18n.changeLanguage('vi');
    expect(i18n.t('road.next')).toBe('Đi tiếp');
    await i18n.changeLanguage('en');
    expect(i18n.t('road.next')).toBe('Onward');
  });

  it('interpolates the circa year rather than concatenating it by hand', async () => {
    await i18n.changeLanguage('vi');
    expect(i18n.t('evidence.circa', { year: 1972 })).toBe('khoảng 1972');
    await i18n.changeLanguage('en');
    expect(i18n.t('evidence.circa', { year: 1972 })).toBe('around 1972');
  });

  it('uses real plural rules, not a hand-written pair', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('card.claim', { count: 1 })).toBe('claim');
    expect(i18n.t('card.claim', { count: 3 })).toBe('claims');

    // Vietnamese has one plural form; both counts resolve, neither invents an English 's'.
    await i18n.changeLanguage('vi');
    expect(i18n.t('card.claim', { count: 1 })).toBe('lời kể');
    expect(i18n.t('card.claim', { count: 3 })).toBe('lời kể');
  });

  it('falls back to Vietnamese, because English is the translation here', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.options.fallbackLng).toContain('vi');
  });

  it('narrows a regional tag to a supported language', async () => {
    await i18n.changeLanguage('vi-VN');
    expect(currentLang()).toBe('vi');
    await i18n.changeLanguage('vi');
  });
});
