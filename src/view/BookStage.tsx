/**
 * The renderer switch: one truth, two skins.
 *
 * `useSpreadNavigation` holds the state, the wedge rule and the R4 contract; `<Spread>` holds the
 * content; `commands.resolveClaim` holds the write. Neither skin owns any of it, so there is
 * nothing to keep in sync and every existing test still exercises the real thing.
 *
 * The road is the default because CSS perspective has no download cost and no context to lose.
 * The flat book is not a failure mode — it is the escape hatch, reachable with `?flat=1` or the
 * toggle, and it is what NFR-PORT-01 guarantees is always there.
 */

import { useState } from 'react';
import { CssBook } from './CssBook';
import { Road } from './Road';
import { useSpreadNavigation } from './useSpreadNavigation';
import { flatRequested } from './webgl';
import { useStore } from '../store/store';
import type { Lang } from '../store/store';

const COPY = {
  flat: { vi: 'Xem dạng danh sách', en: 'List view' },
  road: { vi: 'Xem dạng con đường', en: 'Road view' },
} satisfies Record<string, Record<Lang, string>>;

export function BookStage(): JSX.Element {
  const lang = useStore((s) => s.lang);
  const nav = useSpreadNavigation();
  const [flat, setFlat] = useState(flatRequested);

  function toggle(): void {
    const next = !flat;
    setFlat(next);
    try {
      window.localStorage.setItem('memoir:flat', next ? '1' : '0');
    } catch {
      /* private browsing — the choice simply does not persist */
    }
  }

  return (
    <>
      {flat ? <CssBook nav={nav} /> : <Road nav={nav} />}
      <button type="button" className="skin-toggle" onClick={toggle}>
        {flat ? COPY.road[lang] : COPY.flat[lang]}
      </button>
    </>
  );
}
