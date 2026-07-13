# Phase 5: Additional Nodes (v0.5.0)

## Goal
Round out the node library with the remaining high-value building blocks every real
landing/marketing/portfolio page needs: forms, social proof, structured content, and
small layout utilities. All nodes live in `@kivcode/nodes` (pure definitions, no components)
with Vue components in `@kivcode/vue`, following the exact pattern already used by the
existing content nodes (`button`, `heading`, `richtext`, etc.) — check
`packages/nodes/src/content/button.ts` for the real `defineNode`/`f.*` shape and
`packages/nodes/src/html-utils.ts`/`scales.ts` for shared helpers before writing new code.

---

## Step 5.1: Form + Form Field Nodes

### Definitions (`packages/nodes/src/content/form.ts`, `form-field.ts`)

```typescript
export const formNode = defineNode({
  type: "form",
  category: "content",
  label: "Form",
  icon: "clipboard-list",
  slotConstraints: { default: ["form-field"] },
  fields: {
    submitLabel: f.text({ label: "Submit Button Label", default: "Submit", localizable: true, group: "Content" }),
    submitUrl: f.text({ label: "Submit URL (endpoint)", group: "Behavior" }),
    method: f.select(["post", "get"], { label: "Method", default: "post", group: "Behavior" }),
    successMessage: f.text({ label: "Success Message", default: "Thank you!", localizable: true, group: "Behavior" }),
    errorMessage: f.text({ label: "Error Message", default: "Something went wrong.", localizable: true, group: "Behavior" }),
    layout: f.select(["stacked", "inline", "grid-2"], { label: "Layout", default: "stacked", group: "Layout" }),
    gap: f.select(["sm", "md", "lg"], { label: "Field Gap", default: "md", group: "Layout" }),
  },
})

export const formFieldNode = defineNode({
  type: "form-field",
  category: "content",
  label: "Form Field",
  icon: "text-cursor-input",
  fields: {
    fieldType: f.select(["text", "email", "tel", "textarea", "select", "checkbox"], {
      label: "Field Type", default: "text", group: "Content",
    }),
    name: f.text({ label: "Field Name (key)", default: "field", group: "Content" }),
    label: f.text({ label: "Label", localizable: true, group: "Content" }),
    placeholder: f.text({ label: "Placeholder", localizable: true, group: "Content" }),
    required: f.boolean({ label: "Required", default: false, group: "Behavior" }),
    options: f.text({ label: "Options (comma-separated, for select)", group: "Content" }),
  },
})
```

- Submission calls `services.api?.post(submitUrl, formData)` when an `ApiClient` is
  injected (`packages/engine/src/services/types.ts`); if no `api` service is configured,
  fall back to a native HTML form submit (progressive enhancement, not a hard error).
- Renders `successMessage`/`errorMessage` inline after submit; no page navigation by default.

---

## Step 5.2: Testimonial Node

### Definition (`packages/nodes/src/content/testimonial.ts`)

```typescript
export const testimonialNode = defineNode({
  type: "testimonial",
  category: "content",
  label: "Testimonial",
  icon: "quote",
  fields: {
    quote: f.textarea({ label: "Quote", localizable: true, group: "Content" }),
    authorName: f.text({ label: "Author Name", localizable: true, group: "Content" }),
    authorRole: f.text({ label: "Author Role / Company", localizable: true, group: "Content" }),
    avatar: f.text({ label: "Avatar Image", group: "Content", pluginControl: "media-picker" }),
    rating: f.number({ label: "Star Rating (0-5, 0 = hidden)", default: 0, group: "Content" }),
    layout: f.select(["card", "minimal", "centered"], { label: "Layout", default: "card", group: "Style" }),
    quoteMarkStyle: f.select(["none", "icon", "large-glyph"], { label: "Quote Mark", default: "icon", group: "Style" }),
  },
})
```

Reuse the existing `media-picker` control (built in Phase 3) for `avatar`, and the same
star-rating rendering pattern you'd use anywhere a 0-5 rating needs simple SVG/icon stars.

---

## Step 5.3: Card Node

### Definition (`packages/nodes/src/content/card.ts`)

Generic content card — doubles as a feature card, pricing tier, or team-member card
depending on which fields/slot content are used. Prefer a slotted body over rigid fields
so it composes with existing nodes instead of duplicating them.

```typescript
export const cardNode = defineNode({
  type: "card",
  category: "content",
  label: "Card",
  icon: "square",
  slotConstraints: { default: ["heading", "text", "button", "icon", "image", "stack", "divider"] },
  fields: {
    background: colorOrGradientField({ label: "Background", group: "Style" }),
    borderRadius: f.select(["none", "sm", "md", "lg", "xl"], { label: "Border Radius", default: "lg", group: "Style" }),
    padding: f.select(["sm", "md", "lg", "xl"], { label: "Padding", default: "lg", group: "Style" }),
    shadow: f.select(["none", "sm", "md", "lg", "xl"], { label: "Shadow", default: "md", group: "Style" }),
    borderWidth: f.number({ label: "Border Width", default: 0, group: "Style" }),
    borderColor: f.color({ label: "Border Color", default: "#e2e8f0", group: "Style" }),
    highlighted: f.boolean({ label: "Highlighted (featured)", default: false, group: "Style" }),
    hoverEffect: f.select(["none", "lift", "grow", "glow"], { label: "Hover Effect", default: "none", group: "Effects" }),
  },
})
```

Reuse `colorOrGradientField`/`resolveBackgroundPaint` (Phase 2 color-gradient system) and
`hoverEffectClass`/`hoverGlowStyle` (already used by `button`) instead of re-implementing
either.

---

## Step 5.4: Countdown Timer Node

### Definition (`packages/nodes/src/content/countdown.ts`)

```typescript
export const countdownNode = defineNode({
  type: "countdown",
  category: "content",
  label: "Countdown",
  icon: "timer",
  fields: {
    targetDate: f.text({ label: "Target Date (ISO)", group: "Behavior" }),
    expiredMessage: f.text({ label: "Expired Message", default: "Time's up!", localizable: true, group: "Behavior" }),
    showLabels: f.boolean({ label: "Show Unit Labels", default: true, group: "Style" }),
    style: f.select(["boxes", "inline", "minimal"], { label: "Style", default: "boxes", group: "Style" }),
    size: f.select(["sm", "md", "lg"], { label: "Size", default: "md", responsive: true, group: "Style" }),
    accentColor: f.color({ label: "Accent Color", default: "#6366f1", group: "Style" }),
  },
})
```

- Runtime countdown state (remaining days/hours/min/sec) is **component-local** (same rule
  as the Phase 4 interactive nodes — never written back into the document).
- `toHtml()` renders a static snapshot (computed at export time) plus a `<time>` element
  with `datetime="targetDate"`, since a server-rendered/exported page can't tick live
  without embedding a small inline script — out of scope to add a script tag; document
  the static-snapshot limitation in a one-line comment on `toHtml()` only (this is the
  kind of non-obvious constraint worth a comment).

---

## Step 5.5: Stat Counter Node

### Definition (`packages/nodes/src/content/stat.ts`)

```typescript
export const statNode = defineNode({
  type: "stat",
  category: "content",
  label: "Stat Counter",
  icon: "trending-up",
  fields: {
    value: f.number({ label: "Value", default: 100, group: "Content" }),
    prefix: f.text({ label: "Prefix", group: "Content" }),
    suffix: f.text({ label: "Suffix (e.g. %, +, k)", group: "Content" }),
    label: f.text({ label: "Label", localizable: true, group: "Content" }),
    decimals: f.number({ label: "Decimal Places", default: 0, group: "Content" }),
    animateOnView: f.boolean({ label: "Animate on Scroll Into View", default: true, group: "Behavior" }),
    animationDuration: f.number({ label: "Duration (ms)", default: 1500, group: "Behavior" }),
    align: f.select(["left", "center", "right"], { label: "Align", default: "center", group: "Style" }),
    valueColor: colorOrGradientField({ label: "Value Color", group: "Style" }),
    size: f.select(["md", "lg", "xl", "2xl"], { label: "Size", default: "xl", responsive: true, group: "Style" }),
  },
})
```

- `animateOnView` uses an `IntersectionObserver` in the Vue component (component-local
  runtime state, same rule as 5.4) — counts up from 0 to `value` once visible, once only.
- `toHtml()` renders the final value directly (no animation in static export).

---

## Step 5.6: Social Icons Node

### Definition (`packages/nodes/src/content/social-icons.ts`)

```typescript
export const socialIconsNode = defineNode({
  type: "social-icons",
  category: "content",
  label: "Social Icons",
  icon: "share-2",
  fields: {
    links: f.text({
      label: "Links (JSON array of {platform, url})",
      default: "[]",
      hint: "e.g. [{\"platform\":\"twitter\",\"url\":\"https://...\"}]",
      group: "Content",
    }),
    size: f.number({ label: "Icon Size", default: 20, group: "Style" }),
    gap: f.select(["xs", "sm", "md", "lg"], { label: "Gap", default: "sm", group: "Style" }),
    shape: f.select(["none", "circle", "square", "rounded"], { label: "Background Shape", default: "circle", group: "Style" }),
    color: f.color({ label: "Icon Color", default: "#000000", group: "Style" }),
    backgroundColor: f.color({ label: "Background Color", default: "transparent", group: "Style" }),
    hoverEffect: f.select(["none", "lift", "grow", "glow"], { label: "Hover Effect", default: "lift", group: "Effects" }),
  },
})
```

- Maps a small fixed set of known platforms (twitter/x, facebook, instagram, linkedin,
  youtube, github, tiktok, whatsapp, email) to bundled Iconify icon names via the existing
  `packages/nodes/src/icons/index.ts` resolver — check what's already bundled there before
  adding new `@iconify-json/*` packages; prefer reusing what's already a dependency.
- A raw JSON text field is a pragmatic v1 (no repeatable-group field type exists yet in
  the schema system) — do not build a new field-array UI primitive for this; that is a
  bigger schema-system change than one node justifies. Validate the JSON leniently at
  render time (invalid/empty → render nothing, never throw).

---

## Step 5.7: Spacer Node

### Definition (`packages/nodes/src/layout/spacer.ts`)

```typescript
export const spacerNode = defineNode({
  type: "spacer",
  category: "layout",
  label: "Spacer",
  icon: "move-vertical",
  fields: {
    height: f.select(["xs", "sm", "md", "lg", "xl", "2xl", "3xl"], {
      label: "Height", default: "md", responsive: true, group: "Layout",
    }),
    showDividerOnCanvas: f.boolean({
      label: "Show Guide in Editor", default: true, group: "Editor",
    }),
  },
})
```

- Renders an empty `<div style="height: ...">` using `SPACING` scale values from
  `packages/nodes/src/scales.ts` (no raw px in props — resolve the scale key to a token
  the same way every other spacing field in this codebase already does).
- `showDividerOnCanvas` only affects the editor-mode Vue component (a faint dashed
  outline so it's not invisible/unselectable on an empty canvas) — has zero effect on
  `toHtml()`/production rendering.

---

## Step 5.8: Custom Embed / HTML Node

### Definition (`packages/nodes/src/content/embed.ts`)

```typescript
export const embedNode = defineNode({
  type: "embed",
  category: "content",
  label: "Custom Embed",
  icon: "code",
  fields: {
    embedType: f.select(["html", "iframe"], { label: "Embed Type", default: "iframe", group: "Content" }),
    html: f.textarea({ label: "HTML", group: "Content", showIf: { field: "embedType", equals: "html" } }),
    iframeUrl: f.text({ label: "Iframe URL", group: "Content", showIf: { field: "embedType", equals: "iframe" } }),
    height: f.number({ label: "Height (px)", default: 400, group: "Layout" }),
    sandboxed: f.boolean({ label: "Sandboxed (iframe only)", default: true, group: "Behavior" }),
  },
})
```

- **Security note (do not skip):** raw `html` mode is inherently an XSS vector once this
  document is rendered outside the trusted editor (e.g. via `renderToHtml()` for a public
  page). Do NOT sanitize-and-hope — instead: (1) in the live Vue editor/preview, render via
  a **sandboxed same-origin-free `<iframe srcdoc="...">`**, never raw `v-html` on the main
  page DOM; (2) `toHtml()` must do the same (`<iframe sandbox="allow-scripts" srcdoc="...">`
  for `html` mode, plain `<iframe src=iframeUrl sandbox="...">` for `iframe` mode when
  `sandboxed` is true). This keeps arbitrary embedded script/HTML from ever running with
  access to the parent page's DOM/cookies. This is the one node in this phase where a
  short comment explaining *why* the iframe/sandbox indirection exists is warranted.

---

## Step 5.9: Table Node

### Definition (`packages/nodes/src/content/table.ts`)

```typescript
export const tableNode = defineNode({
  type: "table",
  category: "content",
  label: "Table",
  icon: "table",
  fields: {
    data: f.textarea({
      label: "Data (JSON: { headers: string[], rows: string[][] })",
      default: '{"headers":["Column 1","Column 2"],"rows":[["",""]]}',
      group: "Content",
    }),
    striped: f.boolean({ label: "Striped Rows", default: true, group: "Style" }),
    bordered: f.boolean({ label: "Bordered", default: true, group: "Style" }),
    compact: f.boolean({ label: "Compact", default: false, group: "Style" }),
    headerBackground: f.color({ label: "Header Background", default: "#f8fafc", group: "Style" }),
    align: f.select(["left", "center", "right"], { label: "Cell Align", default: "left", group: "Style" }),
  },
})
```

- Same pragmatic JSON-text-field approach as 5.6 (no repeatable-field-group primitive
  exists yet) — parse leniently, malformed JSON renders an empty table, never throws.
- `toHtml()` renders a real semantic `<table><thead><tbody>` (not styled `<div>`s) — this
  is exactly the kind of content a table SHOULD be, for accessibility and copy/paste.

---

## Cross-cutting Notes

- None of these fields should introduce a new schema-system primitive (no repeatable
  field-array control) — that is bigger than this phase's scope. Where a node conceptually
  wants a repeatable list (Social Icons, Table), use a validated JSON text field, exactly
  as sketched above, and document that choice in your report — do not silently invent a
  different data shape than what's specified here.
- Register every new node type in `@kivcode/vue`'s component registry (same place the Phase 4
  interactive nodes were registered) and in the demo app's node list, so they're reachable
  for manual verification.
- Every node needs: a schema-defaults-satisfy-schema test in `packages/nodes/src/nodes.test.ts`
  (or split per-node test files if that's cleaner — check what Phase 3/4 already did) and a
  Vue component test in `packages/vue/src/nodes/*.test.ts`.

## Completion Checklist

- [x] Form + Form Field nodes work, submit via `services.api` when configured, fall back gracefully otherwise
- [x] Testimonial node renders quote/author/avatar/rating in all three layouts
- [x] Card node composes with existing content nodes via its `default` slot
- [x] Countdown node ticks live in the editor/preview, renders a static snapshot in `toHtml()`
- [x] Stat Counter animates once on scroll-into-view, renders final value in `toHtml()`
- [x] Social Icons renders known platforms from a JSON links array, invalid JSON never throws
- [x] Spacer renders an empty, scale-driven height block, editor-only guide outline doesn't leak into export
- [x] Custom Embed never renders raw HTML/script outside a sandboxed iframe, in both editor and `toHtml()`
- [x] Table renders a real semantic `<table>`, invalid JSON never throws
- [x] All new nodes registered in `@kivcode/vue` + demo app, all have schema and component tests
- [x] `pnpm biome check --write .` passes
- [x] `pnpm typecheck` passes
- [x] `pnpm test` passes
- [x] `pnpm -r build` passes

Done — see `PROGRESS.md` → "Phases 2-5" for the verified summary.
