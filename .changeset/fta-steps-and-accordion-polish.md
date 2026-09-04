---
"@kivcode/engine": minor
"@kivcode/nodes": minor
"@kivcode/nodes-interactive": minor
"@kivcode/react": minor
"@kivcode/react-editor": minor
"@kivcode/vue": minor
"@kivcode/vue-editor": minor
---

Add `z-stack`/`layer` nodes for stacked-layer compositions, a reusable
`resolveShadow(preset, color)` for colorable shadows (now available on
`card`, `stack`, `image`, `video`, and `section` via `borderVisualFields()`'s
new `shadowColor` field), and `card.width`/`height`/`margin`/`alignItems`/
`justifyContent` for building fixed-size badges and responsive panels.

Fix `column` not stretching a single child to the row's full height in a
grid (unequal card heights in the same row), register `column`/`z-stack`/
`layer`/`spacer` in both editors' "Add node" palettes, wire up per-tier
pricing CTA links that were previously inert, and fix accordion items'
`Border Radius`/`Shadow`/`Shadow color`/separator-line fields, which were
declared in the inspector but never actually applied to the rendered output.
