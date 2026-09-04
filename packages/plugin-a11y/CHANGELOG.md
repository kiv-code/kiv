# @kivcode/plugin-a11y

## 0.4.0

### Patch Changes

- Updated dependencies [d501343]
- Updated dependencies [0121248]
  - @kivcode/engine@0.4.0
  - @kivcode/nodes@0.4.0

## 0.3.0

### Minor Changes

- Publish every `@kivcode/*` package on a single, shared version line, and declare
  internal dependencies as `^` ranges instead of exact pins.

  Until now each package pinned its siblings exactly (`"@kivcode/vue": "0.1.5"`),
  so a consuming app that also installed `@kivcode/vue` directly ended up with two
  copies of it in its bundle whenever the two versions differed. That is not
  merely wasteful: the Vue renderer's `provide`/`inject` keys are module-level
  `Symbol()`s, so a `KivRenderer` from one copy cannot hand its render context,
  media provider, bus, or editor-mode flag to node components from the other copy.
  Nodes that read those values through `inject` — `ModalNode`,
  `AccordionItemNode`, `TabPanelNode`, `CarouselNode`, `SpacerNode` — silently
  fell back to their production behaviour inside the editor canvas: collapsed,
  hidden, unselectable.

  Every package now shares one version and depends on its siblings via `^`, so npm
  and pnpm resolve a single copy of each. Releases are locked in step (changesets
  `fixed`), which keeps those ranges satisfiable release after release.

  For consumers: set every `@kivcode/*` entry to the same `^` range and reinstall.
  No API changed in this release.

### Patch Changes

- Updated dependencies
- Updated dependencies
  - @kivcode/engine@0.3.0
  - @kivcode/nodes@0.3.0

## 0.1.0

### Minor Changes

- Initial public release of the Kiv visual page-builder — headless engine, node
  schema, Vue 3 renderer, editor UI, interactive nodes + content-block template
  library, and SEO/accessibility plugins.

### Patch Changes

- Updated dependencies
  - @kivcode/engine@0.1.0
  - @kivcode/nodes@0.1.0
