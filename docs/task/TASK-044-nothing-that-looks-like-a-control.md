---
id: TASK-044
title: Nothing that looks like a control
branch: A
day: 6
depends_on: [TASK-041, TASK-043]
status: todo
---

# TASK-044 — Nothing that looks like a control

| | |
|---|---|
| **Branch** | A · view/ + panels/ |
| **Depends on** | `TASK-041`, `TASK-043` |
| **Requirements** | `FR-BOOK-12`, [`NFR-A11Y`](../requirements/non-functional/NFR-A11Y-accessibility.md), [`NFR-PORT-01`](../requirements/non-functional/NFR-PORT-webview-portability.md) |

## Goal

Every remaining thing that announces itself as a widget stops doing so. Counted, not guessed:
**17 `<button>` elements across 11 files.** They are not one problem — they are four.

## The inventory

**Already the thing itself — no visual change, they only need to keep working:**

| Where | What it looks like |
|---|---|
| `Forest.tsx` ×2 | a firefly, an unlit ring |
| `Volume.tsx` | a page edge in the block |
| `Cover.tsx` | a closed book |
| `FrontPage.tsx` | a ribbon out of the spine |

**Chrome that goes:**

| Where | What it is now | What replaces it |
|---|---|---|
| `Archive.tsx` | language toggle | the browser's own language, plus `?lang=` |
| `Archive.tsx` | *Hậu trường* | a pull up from the bottom edge |
| `BookStage.tsx` ×2 | *Về rừng*, *Xem dạng danh sách* | the pull-down already built; `?flat=1` stays a URL |
| `PhotoDrop.tsx` | *Thêm ảnh* | the page itself is the drop target; tapping the evidence area opens the picker |
| `Backstage.tsx` | *Đóng* | Esc, and a pull down |
| `RefusedPage.tsx` ×2 | *Nhờ trợ lý quyết hộ*, *Xem chuyện vừa xảy ra* | see `TASK-045` |
| `BlankPage.tsx` | *Viết vào sổ* | the page commits when a name is put to it |

**Must stay operable, restyled to belong to the page:**

| Where | Becomes |
|---|---|
| `RefusedPage.tsx` | the two names written in the margin, and the year they can be set beside |

**Exempt:** `ManualToolPanel.tsx`. Backstage is the machinery drawer; a tool form is supposed to
look like a tool form, and a judge needs it to.

## The line this task must not cross

**Nothing visible is a control; everything is still reachable.** Every element above stays a real
focusable element with a real accessible name. A test must prove it, because this is precisely the
change where a11y is lost by accident.

## In scope

- remove the chrome listed above
- gestures for the two shell routes that lose their only affordance: Backstage, and the picker
- restyle the settle controls as page-native
- a test that walks every interactive element and asserts it is named and focusable

## Out of scope

- `ManualToolPanel` and Backstage's internals
- no removal of `?flat=1` or `?lang=` — a URL is not chrome

## Acceptance criteria

- [ ] No visible button remains outside Backstage's internals
- [ ] Every interactive element is focusable and has a non-empty accessible name — asserted
- [ ] Backstage is reachable without a pointer, and by a gesture with one
- [ ] `NFR-PORT-01`'s escape hatch still exists by URL and is documented in the README
- [ ] The demo core runs end to end with no visible button pressed
- [ ] `tests/core-loop.spec.ts` untouched

## Files touched

- `src/Archive.tsx`, `src/view/BookStage.tsx`, `src/view/RefusedPage.tsx`,
  `src/view/BlankPage.tsx`, `src/panels/PhotoDrop.tsx`, `src/panels/Backstage.tsx`
- `src/app.css`
- `tests/chrome.spec.ts` (new)
- `README.md`

## Notes

**The riskiest removal is the language toggle.** i18next already detects from the browser, so most
readers are unaffected — but a Vietnamese family on an English-set phone loses Vietnamese with no
way back except a URL. That is a real cost and it is the one item in this task worth arguing about.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-044`
3. Write `docs/implement/IMPL-TASK-044.md`
4. Walk `.agent/workflows/review-checklist.md`
