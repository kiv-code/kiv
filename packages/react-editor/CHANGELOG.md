# @kivcode/react-editor

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
  - @kivcode/nodes-interactive@0.3.0
  - @kivcode/react@0.3.0

## 0.2.0

### Minor Changes

- Add the React 19 editor UI (`@kivcode/react-editor`) — a full port of the Vue editor covering the canvas (selection, drag & drop, resize handles, inline editing), structure tree, inspector with all 15 field controls, and the node palette/block library/template browser dialogs. Wraps the same framework-agnostic `EditorEngine` from `@kivcode/engine` that the Vue editor uses, and renders its live preview with `@kivcode/react`.
