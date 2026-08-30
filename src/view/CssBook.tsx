/**
 * TASK-026 — the archive with no 3D of any kind: no WebGL, and no perspective transforms either.
 *
 * This is the floor. NFR-PORT-01 requires the app to paint and stay painted when the road cannot
 * render, and it is the only skin an automated test can read without a canvas. It is also the
 * escape hatch a screen-reader user or a judge can force with `?flat=1`.
 *
 * R5: reads the projection. All navigation truth lives in useSpreadNavigation.
 */

import { BookControls } from './BookControls';
import { Spread } from './Spread';
import { useStore } from '../store/store';
import type { Lang } from '../store/store';
import type { SpreadNavigation } from './useSpreadNavigation';

const COPY = {
  empty: { vi: 'Kho lưu trữ còn trống.', en: 'The archive is empty.' },
} satisfies Record<string, Record<Lang, string>>;

export function CssBook({ nav }: { nav: SpreadNavigation }): JSX.Element {
  const lang = useStore((s) => s.lang);

  if (!nav.spread) {
    return (
      <section className="book" aria-label="Book">
        <p className="hint">{COPY.empty[lang]}</p>
      </section>
    );
  }

  return (
    <section className="book" aria-label="Book">
      <BookControls nav={nav} />
      <Spread spread={nav.spread} />
    </section>
  );
}
