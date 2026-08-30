# 06. Rendering the book

> **Status:** outline. Write it out when the corresponding task reaches it — do not write it
> ahead of time; six days leaves no room for speculative documentation.

## What this document answers

The book is the graph rendered. How to build it so the text stays crisp, stays accessible, and survives the webview.

## Outline

- R3F + drei, and why page content is DOM through `<Html transform>` — and why **not** `occlude`
- Why there is **no** physics simulation for page turns
- The tear: a physical metaphor for an AI refusing to guess
- Vietnamese text in 3D: the font must carry the diacritics
- `prefers-reduced-motion` and keyboard navigation
- The CSS 3D fallback, and why R5 makes it half a day

## Related requirements

- `FR-BOOK`
- `NFR-A11Y`
- `NFR-PORT`
