# Progress Log

Tracks what has actually been implemented against the plan in `PLAN.md` / `CLAUDE.md` and
the step-by-step specs in `.opencode/instructions/*.md`.
English per project convention (see CLAUDE.md → "English ONLY ... documentation").

## Status: Phases 1-5 (v0.1.0 through v0.5.0) — complete

Everything below Phase 1 covers `.opencode/instructions/02-phase-2-editor-maturity.md`
through the newly-authored `05-phase-5-additional-nodes.md`. See "Phase 2", "Phase 3",
"Phase 4", "Phase 5" sections further down for the actual per-step log — the note at the
bottom of the old Phase 1 log ("Not done yet: everything in Phases 2-6") is now stale and
superseded; kept below only for history, do not trust it as current status.

## Status: Phase 1 (Hardening, v0.1.0) — complete, plus early Phase 2 items

| Step | What | Status |
|---|---|---|
| 1 | `EditorEngine` — framework-agnostic editor core | ✅ |
| 2 | `PluginContext` enrichment (editor/media/services shape) | ✅ |
| 3 | `CompiledNode` / `FieldDescriptor` enrichment | ✅ |
| 4 | `MediaProvider` interface + `createEngine({ media })` | ✅ |
| 5 | Services container + `createEngine({ services })` | ✅ |
| 6 | `renderToHtml()` (SSR/export) | ✅ |
| 7 | English-only sweep (comments, errors) | ✅ |
| 8 | Test coverage (engine/nodes/vue/editor) | ✅ |
| — | Connect everything to the demo app | ✅ |
| 2.x | `locked` / `visible` wired into renderer + editor UI (pulled in early from Phase 2) | ✅ |

Deferred on purpose: `PluginContext.editor` UI hooks (`addToolbarButton`, `addPaletteItem`,
`onNodeSelect`, etc.) — needs real registries inside `@kivcode/editor` to back them; scoped as
its own follow-up, not started.

---

## Step 1 — EditorEngine

**New:** `packages/engine/src/editor/{selection,history,document-ops,editor-engine,types,index}.ts`
- `SelectionState` (multi-select), `HistoryManager<T>` (undo/redo, depth limit, `goto`),
  `EditorEngine` (document + selection + history, emits `node.*`/`selection.changed`/`history.changed`
  on an `EventBus`).

**Changed:** `types/node.ts` (`locked?`, `visible?` added to `KivNode`), top-level `index.ts` exports.

**Editor package:** `editor-store.ts` rewritten to wrap `EditorEngine` instead of owning state
directly — public `EditorStore` API unchanged, so no Vue component needed to change.
Removed the now-duplicate `packages/editor/src/utils/document-ops.ts` (re-exported from `@kivcode/engine` instead).

Tests: +33 (engine).

## Step 2 — PluginContext enrichment

**New:** `plugin/types-editor.ts`, `plugin/types-media.ts`, `plugin/types-services.ts`
(`EditorExtensionPoints`, `MediaProvider`-shaped context, `ServicesContainer`).

**Changed:** `PluginContext` now has `editor?`, `media?`, `services` (required, all-optional fields).
`create-engine.ts` passes `services: {}` by default so the type still compiles until Steps 4/5 wire real values.

## Step 3 — CompiledNode / FieldDescriptor enrichment

**Changed:** `schema/define-node.ts` (`label`, `icon`, `description`, `slotConstraints` on
`NodeDefinition`/`CompiledNode`), `schema/field.ts` (`placeholder`, `hint`, `required`, `hidden`
on `FieldDescriptor`), `schema/fields.ts` (`f.*` helpers accept the new options).

## Step 4 — MediaProvider

**New:** `media/types.ts` (canonical `MediaProvider`, `MediaAsset`, `UploadOptions`, `ImageTransform`), `media/index.ts`.
`plugin/types-media.ts` turned into a re-export of `../media` (removes the Step 2 duplication).

**Changed:** `create-engine.ts` — `createEngine({ media: { provider } })`; exposed on `engine.media` and `ctx.media`.

## Step 5 — Services container

**New:** `services/types.ts` (canonical `ApiClient`, `AuthProvider`, `RouterProvider`, `StorageProvider`,
`ServicesContainer`), `services/index.ts`. `plugin/types-services.ts` → re-export of `../services`.

**Changed:** `create-engine.ts` — `createEngine({ services })`; exposed on `engine.services` and `ctx.services`.

## Step 6 — renderToHtml()

**New:** `render/{types,render-to-html,index}.ts`. Walks a `KivDocument`, resolves props per
locale/breakpoint, calls each node's `toHtml(props, children, ctx)` if present, else falls back
to a bare `<div data-kiv-type data-kiv-node-id>`.

**Changed:** `schema/define-node.ts` — added `toHtml?` to `NodeDefinition`/`CompiledNode`, plus
`ToHtmlContext`/`ToHtml` types (kept minimal — no `Registry` — to avoid a schema↔registry import cycle).

Tests: +6.

## Step 7 — English-only sweep

Ran 4 parallel agents (one per package). Real Spanish content was concentrated in `@kivcode/engine`
(18 files: JSDoc + `[kiv]` error messages + test assertions kept in sync) and one message in
`@kivcode/vue`'s `registry.ts`. `@kivcode/nodes` and `@kivcode/editor` were already fully English.
One intentional exception left as-is: `"Título"`/`"Hola"` values inside i18n test *fixtures*
(data demonstrating the localization feature, not comments/errors).

## Step 8 — Test coverage

**Infra:** added `@vue/test-utils` + `happy-dom` to `@kivcode/vue`/`@kivcode/editor`; `vite.config.ts` in
both switched to `defineConfig` from `vitest/config` so build and test share the Vue plugin.

**Coverage added:**
- `@kivcode/nodes`: systematic "every node's defaults satisfy its own schema" check.
- `@kivcode/vue`: all 10 node components + `KivRenderer`/`KivNodeRenderer` (52 tests, was 0).
- `@kivcode/editor`: `KivCanvas` interactions (select/delete/duplicate/undo/redo/escape, input-focus guard) + `KivNodePalette` (25 tests, was 10).

**Bug found and fixed while writing tests:** `ContainerNode.vue`'s `centered` prop never
centered by default. Vue coerces an omitted `boolean`-typed prop to `false` (not `undefined`)
when there's no explicit `default`, so `centered !== false` was always false when the prop was
omitted. Fixed with `withDefaults(defineProps<...>(), { centered: true })`.

## Connecting it to the demo (`apps/demos/vue`)

- **`locked`/`visible`:** new `EditorEngine.setNodeFlags()` mutation (+ `node.flagsChanged` event),
  `store.setLocked()`/`store.setVisible()`. `KivNodeRenderer.vue` hides invisible-at-breakpoint
  nodes in production, dims them (`opacity: 0.35`, `data-kiv-hidden`) in editor mode. `KivCanvas.vue`
  blocks select/delete/duplicate on locked nodes; `KivTreeNode.vue` blocks drag/move/delete;
  `KivInspector.vue` got lock/visibility toggle buttons.
- **Shared bus:** `useEditorStore()` and `<KivEditor bus="...">` now accept an external `EventBus`,
  so a plugin installed via `createEngine({ plugins })` can observe live editor mutations
  (`node.propsChanged`, etc.) through `ctx.bus` — previously the editor ran on its own private bus.
- **`toHtml()` on all 10 `@kivcode/nodes`:** each mirrors its Vue component's exact style logic
  (`packages/nodes/src/html-utils.ts` has the shared `styleToString`/`escapeHtml` helpers).
  Verified the exported HTML matches the live-rendered look pixel-for-pixel (padding, colors, layout).
- **`services`/`media` example:** `apps/demos/vue/src/services.ts` — a localStorage-backed
  `StorageProvider` and a mock `MediaProvider`, passed to `createEngine`. A third demo plugin
  (`storage-log`, inline in `App.vue`) uses `ctx.services.storage` + `ctx.bus` to prove the whole
  chain reacts to real edits.
- **"Export HTML" button** in the demo toolbar calls `renderToHtml()` and opens the result in a new tab.

## Post-connection bug fixes (found via manual walkthrough)

- **Responsive field seeding bug (heading/any field with no schema default):** `KivInspector.vue`'s
  `updateFieldValue` seeded a new `Responsive<T>` object as `{ base: existing ?? schemaDefault }`.
  For fields with no explicit schema default (e.g. `heading.size`), `schemaDefault` is `undefined`,
  so `base` stayed permanently `undefined` no matter how many times a higher breakpoint was edited —
  the component's own hardcoded fallback kept winning below that breakpoint. Fixed by seeding `base`
  with the same value being written, only when `base` is still unset.
- **`ContainerNode.vue` centering bug** (see Step 8 above) was the same session; noted here for
  completeness of the "found while polishing the demo" list.
- **Export breakpoint was disconnected from intent.** `exportHtml()` reused `previewBreakpoint`
  (driven by the live Preview panel's *current pixel width*), so the exported snapshot silently
  changed based on how wide the browser happened to be, not what the user meant to export. Added an
  explicit breakpoint `<select>` next to the "Export HTML" button (`apps/demos/vue/src/App.vue`) —
  defaults to `base` (safest for email/PDF, which can't run media queries).
- **Button icon size didn't match between live preview and HTML export.** `ButtonNode.vue` forces
  a pasted SVG icon to a consistent `1em` box via scoped CSS (`.kiv-btn-icon :deep(svg)`), but that
  rule never traveled into `renderToHtml()`'s static output — a raw `width="16"` vs `width="24"`
  baked into two different pasted icons rendered at their own literal sizes in the export, even
  though both buttons had the identical `size` prop. Fixed with `normalizeSvgIconSize()`
  (`packages/nodes/src/html-utils.ts`), which inlines the same `width:1em;height:1em` directly onto
  the `<svg>` tag during `toHtml()`, so the export no longer depends on an external stylesheet rule.
- **`Failed to resolve component: RouterLink` console warning fired unconditionally.**
  `ButtonNode.vue` called `resolveComponent("RouterLink")` at setup time for every button instance,
  regardless of `linkType` — Vue warns as soon as that lookup fails, even if the result is never
  used. Fixed by replacing it with a silent lookup in `getCurrentInstance().appContext.components`,
  gated on `linkType === "internal"`, so the warning is gone when no router is installed and
  `RouterLink` still resolves correctly when a consumer app does install vue-router.

## Icon system cleanup (`IconPicker` / `IconNode` / `ButtonNode`)

`opencode` had added an `IconPicker.vue` inspector control with size/color sliders embedded
directly in the picker (writing `iconSize`/`iconColor` props on whatever node is selected), plus a
standalone `icon` node and icon support on `button`. Found and fixed three real bugs while
reconciling that work:

- **`icon.ts`/`IconNode.vue` prop mismatch:** the embedded picker always writes `iconSize`/
  `iconColor`, but `iconNode`'s `toHtml` and `IconNode.vue` still read `props.size`/`props.color` —
  the slider/color-picker in the Inspector had no effect on a standalone Icon node at all. Renamed
  both to `iconSize`/`iconColor` throughout.
- **Duplicate fields:** `icon.ts` still declared separate `size`/`color` field descriptors, and
  `button.ts` still declared separate `iconSize`/`iconColor` field descriptors — both redundant
  with the sliders `IconPicker` already renders inline for the `icon` field. Removed both; verified
  via `packages/nodes/src/nodes.test.ts`'s "defaults satisfy schema" test (still passes) and by
  confirming `schema.parse`/`safeParse` is never called on live document props outside tests, so
  dropping the field descriptors doesn't cause Zod to silently strip the prop values on save/render.
- **`IconNode.vue`'s SVG never scaled:** `[data-kiv-type="icon"] :deep(svg)` had `display:block` but
  no `width`/`height`, so a pasted/resolved SVG rendered at its own intrinsic size — the "Size"
  slider only affected icon-*font* (`<i>`) icons via `font-size`, never raw SVG icons. Added
  `width:1em;height:1em` (same pattern as `ButtonNode.vue`'s existing `.kiv-btn-icon :deep(svg)`
  rule). Verified live: before the fix an SVG icon ignored the size slider entirely; after, it
  tracks 24px → 64px correctly.
- Also removed an unused `searchIcons` import in `IconPicker.vue` (build-time warning, not a bug).

## Divider node: "Style"/"Alignment" fields had no visual effect

The `divider` node (another `opencode` addition) exposes `lineStyle` (solid/dashed/dotted/double)
and `alignment` (left/center/right) fields in the Inspector, but neither did anything:

- **`lineStyle` was never read.** The line was rendered as a plain `<div>` with `background: color`
  and `height: {thickness}px` — a solid-fill box can only ever look solid; `border-style` is the
  only way to render dashed/dotted/double. Fixed both `DividerNode.vue` and `divider.ts`'s `toHtml`
  to use `border-top: {thickness}px {lineStyle} {color}` with `height: 0` instead of a filled box.
- **`alignment` had no effect either.** The line `<div>` was block-level; `text-align` on the parent
  only affects inline/inline-block children, so setting alignment to `left`/`right` on anything
  narrower than 100% width did nothing visible. Initially fixed with `display: inline-block` on the
  line, but that reintroduced a worse bug (see below) once nested inside a flex container.
- **Nested-inside-a-flex-Group regression:** an `inline-block` child with a percentage `width` needs
  its containing block's width to already be resolved. The wrapper `<div>` was plain `block` with no
  explicit width, so when the divider sat inside a `Group` (flex) node, the wrapper — now a flex item
  with no declared width — sized itself to its own content (`flex-basis: auto`), which in turn was
  the percentage-width line depending on the wrapper. That circular dependency resolves to `0px` in
  every browser, so the divider visually disappeared (matches the report: "lo pierdo dentro de un
  Group"). Fixed by making the *wrapper* `display:flex; width:100%` (an explicit, non-circular width)
  and moving alignment to `justify-content` (`flex-start`/`center`/`flex-end`) instead of
  `text-align`/`inline-block` on the line. This also makes the divider robust regardless of the
  parent's own layout mode (block, flex-row, or flex-column) since the wrapper always claims 100% of
  whatever box it's given rather than depending on ancestor stretch/shrink-to-fit behavior.
- Verified live: standalone, `lineStyle: "dashed"` renders `border-top-style: dashed`; `width: "50%"`
  + `alignment: "right"` flushes the line's right edge to the wrapper's right edge (0px gap). Nested
  inside a `Group` with `direction: "row"`, the wrapper still resolves to the group's full width
  (897px) and the line to the correct 50% of that (448.5px) — no longer collapses to 0.

## Reusable color/gradient system (`f.colorOrGradient` equivalent)

Requested: consolidate the solid-vs-gradient color pattern (background, text, borders — used ad
hoc on `button` for backgrounds only) into one reusable field type + control, usable by any node
that needs solid-or-gradient paint (text, background, buttons, and future nodes like Heading/Section).

**New:** `packages/nodes/src/color-gradient.ts` — the canonical, framework-agnostic piece:
- `ColorOrGradientValue` — `{ type: "solid"|"gradient", solid, from, middle, to, angle }`, stored as
  a single composite prop instead of N raw fields with manual `showIf` wiring.
- `colorOrGradientField(opts)` — a `FieldDescriptor` factory with `pluginControl: "color-gradient"`,
  following the exact same plugin-control pattern as the earlier `icon-picker` (Golden Rule #7: no
  `@kivcode/engine` changes needed — `FieldControl`'s `pluginControl` override already supported this).
- `resolveBackgroundPaint(value, fallback)` — solid or gradient, both valid as a plain `background`.
- `resolveSolidColor(value, fallback)` — ignores gradient state; for contexts that can't render a
  gradient (icon inheritance, borders).
- `resolveTextPaintStyle(value, fallback)` — text color needs the `background-clip: text` trick for
  gradients (can't assign a gradient to `color` directly), which claims the element's own
  `background` — so this must be applied to a dedicated text element (e.g. the label `<span>`),
  never to an element that also has its own background fill (would conflict with the button's own
  background paint).

**New:** `packages/editor/src/inspector/controls/ColorGradientControl.vue` — Solid/Gradient tabs,
a checkerboard preview swatch, From/Middle/To color pickers + angle slider for gradient mode.
Registered once in `KivEditor.vue` (`extensions.addFieldControl("color-gradient", ColorGradientControl)`),
same mechanism as `icon-picker`.

**Migrated:** `button.ts` — replaced 7 raw fields (`backgroundType`, `customBackground`,
`gradientFrom`, `gradientMiddle`, `gradientTo`, `gradientAngle`, `customColor`) with 2 composite
fields (`background`, `textColor`). `ButtonNode.vue` and `toHtml` both updated to call the shared
resolvers instead of hand-rolling gradient CSS. `packages/nodes` gained a direct `zod` dependency
(previously only re-exported `FieldDescriptor`'s type from `@kivcode/engine`, never constructed a
schema itself).

**Bug found while wiring this up:** `styleToString`'s `kebabCase()` converts `webkitBackgroundClip`
→ `webkit-background-clip`, but vendor-prefixed CSS properties need a *leading* dash
(`-webkit-background-clip`) — the regex has nothing to match against before the first character, so
it can't insert one. The result is invalid CSS that browsers silently drop. This didn't affect the
live Vue-rendered button (Vue's own style-patching normalizes vendor prefixes), only the static
`toHtml()` export — confirmed via the exported HTML containing `webkit-background-clip: text;`
(broken) before the fix and `-webkit-background-clip: text;` (correct) after. Fixed by special-
casing `webkit|moz|ms|o` prefixes in `kebabCase()`.

Verified live: button background gradient renders (`linear-gradient(135deg, #6366f1, #a855f7)`);
button text gradient renders via `background-clip: text` + `color: transparent` on the label span
only (not the whole button, which still has its own solid/gradient fill); the exported HTML matches
byte-for-byte once the vendor-prefix fix landed.

## Rolling out color-gradient to Section and Heading + opacity support

Extended the same reusable field to the two other highest-value spots, and closed a related gap:

- **`ColorOrGradientValue` gained an `alpha` field** (0–1, default 1) for the solid branch, with a
  `withAlpha(hex, alpha)` helper that converts `#rgb`/`#rrggbb` → `rgba(...)` only when `alpha < 1`
  (stays plain hex otherwise, so existing snapshots/tests that expect bare hex are untouched).
  `ColorGradientControl.vue` got an Opacity slider under the Solid tab; the checkerboard preview
  swatch now calls `resolveBackgroundPaint()` directly instead of duplicating the gradient-CSS logic.
- **`section.ts` / `SectionNode.vue`:** merged `background` + the old free-text `gradient` field into
  one `background: colorOrGradientField()` — solid sets `background-color`, gradient sets
  `background-image` (gradient still wins over an uploaded background image, preserving the old
  field's precedence). Merged `overlayColor` (`f.color`) + `overlayOpacity` (`f.number`, applied as a
  *second*, independent layer-opacity multiplier) into one `overlayColor: colorOrGradientField()`
  whose alpha slider now controls transparency directly — this also fixes a latent double-opacity
  wrinkle in the old design (the default `overlayColor` was already `rgba(0,0,0,0.4)` *and*
  `overlayOpacity` defaulted to another `0.4` multiplied on top).
- **`heading.ts` / `HeadingNode.vue`:** `color: f.color()` → `color: colorOrGradientField()`. Unlike
  Button, a heading's own tag *is* the text with no separate background fill to conflict with, so
  `resolveTextPaintStyle()` is spread directly onto the `<hN>` element's style — no extra wrapper span
  needed.
- Updated `nodes.test.ts`'s "section schema accepts valid props" (needed a full composite object,
  not a bare hex string) and `SectionNode.test.ts`'s overlay test (dropped the now-nonexistent
  `overlayOpacity` prop) to match the new shape.

Verified live: Heading text gradient renders directly on the `<h1>` (no wrapper element); Section
overlay defaults to `rgba(0, 0, 0, 0.4)` with no `overlayOpacity` prop at all; setting the overlay
color's own opacity slider to `0.8` (after giving it an explicit solid color — an empty/"inherit"
solid has nothing to apply alpha to, by design) produces `rgba(0, 0, 0, 0.8)` on the rendered overlay.

**Scoped out on purpose:** `Divider`'s line color stays plain solid (`f.color()`, unchanged). Its
`lineStyle` (dashed/dotted/double) is implemented via `border-style`, which needs a single flat
`border-color` — a gradient there would require switching to a `background-image` + height trick
that can't simultaneously honor `border-style`'s dash/dot patterns. Border colors (`customBorderColor`
on Button, `borderColor` on Section) were left as-is too — gradients on a 1–2px border or a small
icon aren't visually worth the added Inspector complexity.

## Two color-picker bugs found via real usage, fixed

Reported after trying it in practice: opacity had no visible effect on a *background* field, in
either solid or gradient mode (only text seemed to work).

- **Gradient mode never applied opacity at all.** The single `alpha` slider only rendered inside the
  Solid tab — Gradient mode had no opacity control anywhere, so it silently did nothing whether the
  field was background, text, or anything else. Fixed by giving each gradient stop its own opacity:
  `ColorOrGradientValue` gained `fromAlpha`/`middleAlpha`/`toAlpha` (each 0–1, default 1), and
  `gradientCss()` now calls `withAlpha()` per stop instead of ignoring alpha entirely in gradient
  mode. `ColorGradientControl.vue`'s Gradient tab shows an Opacity slider under each of From/Middle/To
  (Middle's stays hidden until a middle color is actually set) — this matches how every real design
  tool handles gradient transparency (per-stop, not one global slider).
- **Solid mode's opacity slider silently no-op'd on an "inherit" (empty) color.** `solid: ""` means
  "no override, inherit the theme/variant" — `solidPaint()` correctly returns the fallback untouched
  in that case, since there's no actual color to apply alpha to. But the swatch UI shows a `#000000`
  placeholder purely so the native `<input type="color">` has something to render, which visually
  implies a real color is already active — dragging the opacity slider looked like it should do
  something, but silently changed nothing underneath. This is exactly the bug that made it look like
  "opacity doesn't work on background" during testing: the background field had never had an
  explicit color set. Fixed by having the slider commit that same `#000000` fallback as the real
  `solid` value the moment it's touched (`setSolidAlpha()` in `ColorGradientControl.vue`), so the
  slider always has a color to act on instead of quietly doing nothing.

Verified live: gradient background with `fromAlpha: 0.3` renders
`linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgb(168, 85, 247))` — first stop faded, second
stop still opaque. Solid text color, opacity slider moved to `0.5` **without ever touching the hex
input**, renders `rgba(0, 0, 0, 0.5)` — previously this combination (opacity-only, no explicit color)
produced no visible change at all.

## Data-corrupting bug found testing Section overlay over a background image

Reproducing "Section with a background image + overlay, both solid and gradient opacity" surfaced a
worse, silent data-corruption bug — unrelated to the opacity work itself.

- **`ColorGradientControl.vue` naively spread `modelValue`:** `{...DEFAULT_COLOR_OR_GRADIENT,
  ...(props.modelValue ?? {})}`. This works for a real composite object, but every node created
  *before* this migration still stores its color prop as a **plain hex string**
  (`background: "#0f172a"`, straight from `demo-document.ts`) — and spreading a STRING via `{...str}`
  iterates its characters as array indices, producing `{0: "#", 1: "0", 2: "f", ...}` merged in
  alongside the default object's `type`/`solid`/`alpha` keys. The corrupted shape then got written
  straight back to the document on the next edit (even an unrelated one, e.g. typing a background
  image URL), permanently replacing the clean string with garbage.
  Fixed by exporting `normalizeColorOrGradient()` from `@kivcode/nodes` (the same string/object/undefined
  handling the resolvers already used internally) and having the control call that instead of
  spreading `modelValue` directly — legacy plain-string props now normalize cleanly into
  `{ type: "solid", solid: "#0f172a", ... }` without ever touching the raw value unsafely.
- **Found only because "Reset" looked like it wasn't resetting.** `KivEditor.vue`'s internal store is
  constructed once from the initial `document` prop at mount time and never reactively reinitializes
  when that prop changes later — so `apps/demos/vue`'s "Reset" button (which just replaces the
  parent's `doc` ref) doesn't actually reset an already-mounted editor session; it only affects the
  *next* mount. Corrupted state from an earlier test kept reappearing after clicking Reset, surviving
  even a full page reload and dev-server restart, because both just remounted from the same
  already-corrupted `localStorage` entry. Not fixed (documenting as a known demo-app limitation, not
  an engine bug) — worked around for testing via `localStorage.clear()` before reload.

Verified live end-to-end on a Section with an uploaded background image + overlay enabled:
`background` stayed the clean string `"#0f172a"` through the whole session (never corrupted);
overlay solid `#ff0000` @ 60% → `rgba(255, 0, 0, 0.6)` over the image; overlay gradient with
`fromAlpha: 0.2` / `toAlpha: 0.9` → `linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85,
247, 0.9))`, visibly fading from transparent to opaque across the image in a screenshot.

## Button gradient background had a visible seam at the edges

Reported: a button with a gradient background looked like the color didn't quite reach the sides.

Root cause: `background-origin` defaults to `padding-box`, but the button also has
`border: 2px solid transparent` (the theme's default border, invisible but still present in the box
model). With origin=padding-box and clip=border-box (also default), the gradient image is *sized* to
the smaller padding-box area, then — because `background-repeat` defaults to `repeat` — tiles to fill
the extra border-box strip, producing a visible seam right at the 2px edge. Classic CSS gotcha
whenever a transparent border is combined with a gradient background and `background-origin` isn't
set explicitly.

Fixed by adding `background-origin: border-box` to `ButtonNode.vue`'s `buttonStyle` and
`button.ts`'s `toHtml` (and preventively to `Section`'s gradient background, since Section can also
combine a border with a gradient via `borderWidth` + `background`). Verified live:
`getComputedStyle(button).backgroundOrigin === "border-box"`, gradient renders edge-to-edge with no
seam in a screenshot. One test (`ButtonNode.test.ts`) needed updating — the browser coalesces the
separately-set `background`/`background-origin` longhands back into the `background` shorthand when
serializing the style attribute (`background: border-box transparent`, not `background: transparent`
anymore) — a serialization detail, not a behavior change.

## Real bug found while testing the button fix: Inspector panel crashes for any button without an icon

While re-verifying the button gradient, selecting a completely fresh button (no `icon` ever set —
true for every button in `demo-document.ts`) made the *entire* Inspector panel render nothing at all,
not just the icon field.

`IconPicker.vue` declared `modelValue: string` (required) but nothing enforces that at runtime — a
node that never had its `icon` prop set passes `undefined`, and `props.modelValue.trim()` in the
component's `setup()` threw immediately. Vue has no error boundary around a child's `setup()`, so the
crash propagated all the way up through `FieldControl` → `KivInspector`, unmounting every field for
every group, not just the broken one. This is very easy to miss during development, because any
document with at least one icon already set (e.g. from earlier manual testing, autosaved to
`localStorage`) never triggers it — it only shows up on a genuinely fresh document, which is exactly
what a new user's first session looks like.

Fixed with `withDefaults(defineProps<...>(), { modelValue: "" })` so every reference in the file can
safely assume a string. Verified live: selecting "Get started" (no icon) on a freshly-cleared
`localStorage` no longer throws, and the Inspector renders all its fields normally.

## Group (Stack) node: independent padding/margin/border per side

Requested: make Group more flexible for custom styling — independent padding/margin per side (not
just Y/X), and independent borders (width + one shared color) per side.

- Kept the existing `paddingY`/`paddingX` scale-based shorthands (quick common case) and added
  `marginY`/`marginX` alongside them (Stack had no margin support at all before).
- Added 8 free-text per-side override fields (`paddingTop/Right/Bottom/Left`,
  `marginTop/Right/Bottom/Left`, group `"Spacing (advanced)"`) — accepts any CSS length (`"40px"`,
  `"2rem"`, `"5%"`). Empty (default) falls back to the Y/X shorthand for that side; a shared `side()`
  helper (duplicated once in `stack.ts` for `toHtml`, once in `StackNode.vue` for the live render —
  same pattern as other nodes' toHtml/Vue pairs) implements the override-or-fallback logic.
- Added independent `borderTopWidth/RightWidth/BottomWidth/LeftWidth` (px, 0 = no border on that
  side) + one shared `borderStyle` (solid/dashed/dotted/double) and `borderColor` — matches the
  earlier decision (see the button/icon color-gradient section above) that borders stay plain solid,
  no gradient support. `box-sizing: border-box` is applied automatically whenever any side has a
  border, so adding a border doesn't change the box's outer footprint.

**Real, pre-existing bug found while verifying this:** none of the new fields showed up in the
Inspector at all. `KivInspector.vue`'s `groupedFields` computed filters every field's `group` through
a hardcoded `GROUP_ORDER` whitelist — any group name not in that list is **silently dropped**, not
just unordered. `"Spacing"` (used by Stack's *original*, pre-existing `paddingY`/`paddingX` fields,
before any of today's changes) was never in that list, so those two fields have likely been invisible
in the Inspector since Stack was first built — this wasn't a regression from today's work, just newly
noticed because the missing group suddenly mattered. Fixed two ways: (1) `groupedFields` now appends
any group not in `GROUP_ORDER` at the end instead of dropping it, so no future group name can vanish
silently again; (2) added `"Spacing"` and `"Spacing (advanced)"` to the curated list directly (right
after `"Layout"`) so they get sensible positioning instead of always trailing at the end.

Verified live: added a new Group node, set `Padding top: 40px` → confirmed
`getComputedStyle(el).paddingTop === "40px"` (after rebuilding `@kivcode/vue`'s dist — a second instance
this session of forgetting the build step after a source edit, since the demo app consumes the built
dist, not source). Set `Border top: 2`, `Border left: 4`, `Border color: #ff0066` → confirmed
`borderTop: "2px solid rgb(255, 0, 102)"`, `borderLeft: "4px solid rgb(255, 0, 102)"`,
`borderRight: "0px solid ..."` (untouched side stays at 0) on the live element.

## Verification (last full run)

```
pnpm biome check --write .   # clean
pnpm -r typecheck            # 6/6 packages clean (demo app has no typecheck script)
pnpm -r test                 # 223 tests, 6/6 packages passing
pnpm -r build                # 6/6 packages + demo app build clean
```

Test count by package: engine 110, nodes 24, plugin-analytics 9, vue 55, editor 25.

## Not done yet (as of Phase 1 — STALE, see Phase 2-4 below)

- `PluginContext.editor` hooks (`addToolbarButton`, `addPaletteItem`, `onNodeSelect`,
  `onNodeCreate`, `onDocumentChange`) — deferred, needs real UI-extension registries in `@kivcode/editor`.
- Everything in `PLAN.md` Phases 2 (rest of it) through 6 — `locked`/`visible` was the only
  Phase 2 item pulled forward.

**Correction:** both bullets above turned out to be wrong by the time Phases 2-4 were
audited — the editor hooks were fully implemented at some point after this log entry was
written, but this file was never updated to say so. Update this log in the same session as
the work, not "later."

---

## Phases 2-5 (v0.2.0 through v0.5.0) — complete

Per-item status lives in each phase's own spec file — every "Completion Checklist" is
checked off there, that's the source of truth, not a duplicate list here:

- `.opencode/instructions/02-phase-2-editor-maturity.md` — clipboard, multi-select, canvas
  DnD, undo batching, shortcut expansion, node-locking gap fix, resize handles, zoom/pan,
  tree search polish.
- `.opencode/instructions/03-phase-3-content-media.md` — RichText inline editing, Video
  html5/loom+poster/caption, Link made slot-capable, MediaProvider + media browser +
  responsive images.
- `.opencode/instructions/04-phase-4-interactive-plugins.md` — `@kivcode/nodes-interactive`
  (Carousel/Accordion/Tabs/Modal), `@kivcode/plugin-seo`, `@kivcode/plugin-a11y`, page templates.
- `.opencode/instructions/05-phase-5-additional-nodes.md` (new spec, authored this pass) —
  Form, Testimonial, Card, Countdown, Stat Counter, Social Icons, Spacer, Custom Embed, Table.

Each phase boundary was verified independently before moving on:
`pnpm biome check --write . && pnpm typecheck && pnpm test && pnpm -r build`, all clean.
Final count: **486 tests** across 9 packages + demo app build clean.

All of the above is currently **uncommitted** in the working tree.
