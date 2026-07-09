# @kiv/engine — Visual Experience Engine

Headless, JSON-driven, plugin-based page builder engine.
Framework-agnostic core. Vue renderer (stable). React renderer (pending).
MIT License. Open source from day one.

---

## What This Is

@kiv/engine is a **reusable page builder framework** that any application can embed.
It is NOT tied to any CMS, framework, or backend. It provides:

- A **headless engine** that produces/resolves JSON documents
- A **schema system** for defining typed nodes with validation
- A **registry** for node types and renderer components
- A **resolver** for responsive (mobile-first) and localization axes
- A **theme system** with design tokens → CSS variables
- An **event bus** with wildcards and typed events
- A **plugin system** with hooks for editor, media, and services
- A **Vue 3 renderer** with recursive node rendering
- A **Vue 3 editor** with canvas, tree, inspector, undo/redo, DnD

Products that can be built on this engine:
Landing Builder, CMS Visual, Event Builder, Form Builder, Email Builder,
Documentation/Knowledge Base Builder, Marketing Builder, Customer Portal Builder.

---

## Architecture Rules (NEVER violate)

### Dependency Flow (strict unidirectional)
```
@kiv/engine (core, knows nothing about frameworks/DOM)
  ← @kiv/nodes (pure definitions, no components)
    ← @kiv/vue (Vue 3 renderer)
      ← @kiv/editor (Vue 3 editor UI)
    ← @kiv/react (React renderer — shares same nodes)
```

### Golden Rules
1. **@kiv/engine NEVER imports Vue, React, or any UI framework.** Its only dependency is `@vue/reactivity` (for the event bus). If you need the DOM or a component framework inside engine, STOP — you are in the wrong package.
2. **@kiv/nodes are pure definitions** (schema + defaults, NO components). Each renderer provides its own components.
3. **The stable public API is the JSON document shape** (KivDocument + schemaVersion), not the TypeScript interface.
4. **Styling is token-constrained.** Nodes reference theme tokens via `tokenRef()` (`var(--kiv-*)`) or resolve through shared scales (`SPACING["lg"]` → `"32px"`). No raw CSS values in node props.
5. **Responsive and localization are SEPARATE axes** (`Responsive<T>` and `Localizable<T>`), not a matrix. The resolver chains them: responsive first, then locale.
6. **Event-driven.** The bus is the communication backbone. Emitting a new event type NEVER requires core changes.
7. **Plugin-based.** Adding a node or integration must NEVER require touching @kiv/engine. That is the architecture exam.
8. **Consumers extend, they don't modify.** kmjkevents and other apps register custom nodes, provide services, implement MediaProvider, and write plugins. They never edit @kiv/engine source files.

---

## Code Style & Conventions

- **TypeScript** strict + `noUncheckedIndexedAccess` + `verbatimModuleSyntax`
- **Zod 4** — use `ZodType`, NOT deprecated `ZodTypeAny`
- **Biome** — tabs, double quotes, NO ESLint/Prettier
- **Vitest** for all tests
- **No comments in code** unless absolutely necessary for non-obvious logic
- **English ONLY** in code, comments, error messages, documentation, and commit messages
- **Exports maps are closed** — no deep imports from packages
- **Kebab-case for files**, PascalCase for types/components
- **Prefix all error messages** with `[kiv]` or `[kiv/<package>]`
- **Every mutation must be immutable** — return new objects, never mutate inputs
- **Every feature needs tests** — engine core tests are mandatory, editor tests are required, Vue renderer tests are required

### Verification (run before every commit)
```bash
pnpm biome check --write .
pnpm typecheck
pnpm test
```

---

## Monorepo Structure

```
packages/
├── engine/            @kiv/engine     — Core headless engine
│   └── src/
│       ├── types/         KivDocument, KivNode, Responsive<T>, Localizable<T>
│       ├── schema/        defineNode, FieldDescriptor, f.* helpers, CompiledNode
│       ├── registry/      Registry class (register/get/has/types/all)
│       ├── resolver/      resolveNode, resolveProps, resolveResponsive, resolveLocalized
│       ├── theme/         ThemeTokens, defaultTheme, resolveTheme, themeToCssVars, tokenRef
│       ├── events/        createEventBus — emit/on/once/off/clear, wildcards (*, node.*)
│       ├── i18n/          validateI18nConfig, buildLocaleFallbackChain
│       ├── migrations/    migrateDocument, CURRENT_SCHEMA_VERSION, Migration[]
│       ├── plugin/        KivPlugin, PluginContext
│       ├── media/ ← NEW   MediaProvider interface, MediaAsset types
│       ├── services/ ← NEW Service types (ApiClient, AuthProvider, etc.)
│       ├── editor/ ← NEW  Framework-agnostic EditorEngine, SelectionState, HistoryManager
│       ├── render/ ← NEW  renderToHtml() for SSR/HTML export
│       └── engine/        createEngine({theme, i18n, plugins, nodes})
├── nodes/             @kiv/nodes      — Pure node definitions (10 base nodes + scales)
├── vue/               @kiv/vue        — Vue 3 renderer (KivRenderer, KivNodeRenderer, 10 components)
├── editor/            @kiv/editor     — Vue 3 editor UI (canvas, tree, inspector, palette, DnD)
├── react/  ← FUTURE   @kiv/react      — React renderer
└── plugin-analytics/  @kiv/plugin-analytics — Example plugin
```

---

## Phase 1 Implementation Plan (Current Sprint)

### Goal: v0.1.0 — Hardening for production consumption

The engine core is solid. The editor is too Vue-coupled. The plugin system is too thin.
The goal of Phase 1 is to make @kiv/engine a framework that any application can consume
without forking or patching.

### Step 1: EditorEngine — framework-agnostic editor state

**Files to create:**
- `packages/engine/src/editor/editor-engine.ts`
- `packages/engine/src/editor/selection.ts`
- `packages/engine/src/editor/history.ts`
- `packages/engine/src/editor/types.ts`
- `packages/engine/src/editor/index.ts`

**What to implement:**
- `SelectionState` class: track selected node IDs, support multi-select (add/remove/toggle/clear/all)
- `HistoryManager` class: stack of immutable snapshots with configurable depth, undo/redo, skip-to-index, operation metadata
- `EditorEngine` class: coordinates document state + selection + history, emits mutation events
- `DocumentMutations` type: operations that emit `node.created`, `node.removed`, `node.moved`, `node.propsChanged`
- All pure TypeScript, NO Vue imports, NO `ref`/`computed` — use simple class instances with getter/setter patterns

**Files to modify:**
- `packages/engine/src/index.ts` — add exports for editor types
- `packages/engine/src/types/node.ts` — add `locked?: boolean`, `visible?: Responsive<boolean>` to KivNode

**Files to update:**
- `packages/editor/src/store/editor-store.ts` — rewrite to WRAP EditorEngine instead of implementing state directly
- `packages/editor/src/store/context.ts` — update injection key if needed

### Step 2: PluginContext enrichment

**Files to modify:**
- `packages/engine/src/plugin/types.ts` — extend PluginContext with editor, media, services

**New PluginContext shape:**
```typescript
interface PluginContext {
  // Core (existing)
  bus: EventBus
  registry: Registry
  theme: ThemeTokens
  i18n: I18nConfig | null

  // Editor hooks (optional — null when no editor is loaded)
  editor?: {
    addToolbarButton(btn: ToolbarButton): void
    addPanel(name: string, component: ComponentDef): void
    addPaletteItem(item: PaletteItem): void
    addInspectorTab(name: string, component: ComponentDef): void
    addFieldControl(type: string, component: ComponentDef): void
    addKeyboardShortcut(sc: ShortcutDef): void
    onNodeSelect(cb: (node: KivNode) => void): void
    onNodeCreate(cb: (node: KivNode) => void): void
    onDocumentChange(cb: (doc: KivDocument) => void): void
  }

  // Media (optional — null when no media provider is configured)
  media?: {
    upload(file: File, opts?: UploadOpts): Promise<MediaAsset>
    resolve(src: string, transforms?: ImageTransform): string
    delete(url: string): Promise<void>
  }

  // Services (injected by consumer app)
  services: {
    api?: ApiClient
    auth?: AuthProvider
    router?: RouterProvider
    storage?: StorageProvider
  }
}
```

**Files to also create:**
- `packages/engine/src/plugin/types-editor.ts` — ToolbarButton, PaletteItem, InspectorTab, ShortcutDef, ComponentDef types
- `packages/engine/src/plugin/types-media.ts` — MediaProvider, MediaAsset, UploadOptions, ImageTransform types
- `packages/engine/src/plugin/types-services.ts` — ApiClient, AuthProvider, RouterProvider, StorageProvider types

### Step 3: CompiledNode enrichment

**Files to modify:**
- `packages/engine/src/schema/define-node.ts` — add to CompiledNode:
  ```typescript
  label?: string                          // Human-readable name
  icon?: string                           // Icon identifier
  slotConstraints?: Record<string, string[]>  // e.g. { default: ["column"] } means only Column goes in default slot
  description?: string                    // Shown in palette
  category?: string                       // Already exists — use for palette grouping
  ```

- `packages/engine/src/schema/field.ts` — add to FieldDescriptor:
  ```typescript
  placeholder?: string    // Placeholder text in inspector
  hint?: string           // Helper text below the control
  required?: boolean      // Mark as required
  hidden?: boolean        // Hide from inspector (for system fields)
  ```

### Step 4: MediaProvider interface

**Files to create:**
- `packages/engine/src/media/types.ts` — MediaProvider, MediaAsset, UploadOptions, ImageTransform
- `packages/engine/src/media/index.ts` — exports

**Files to modify:**
- `packages/engine/src/engine/create-engine.ts` — accept `media?: { provider: MediaProvider }` in CreateEngineOptions
- `packages/engine/src/index.ts` — add exports

### Step 5: Services container

**Files to create:**
- `packages/engine/src/services/types.ts` — ApiClient, AuthProvider, RouterProvider, StorageProvider interfaces
- `packages/engine/src/services/index.ts` — exports

**Files to modify:**
- `packages/engine/src/engine/create-engine.ts` — accept `services?: ServicesContainer` in CreateEngineOptions

### Step 6: renderToHtml()

**Files to create:**
- `packages/engine/src/render/render-to-html.ts` — minimal HTML renderer that walks KivNode tree and produces HTML
- `packages/engine/src/render/types.ts` — RenderContext, RenderOptions
- `packages/engine/src/render/index.ts`

**Design:**
- Each CompiledNode can optionally provide a `toHtml(props, children, ctx) => string` function
- If a node type doesn't provide toHtml, render a `<div>` with data-kiv-* attributes as fallback
- Inline styles from resolved props (not external CSS)
- Enables: SSR for SEO, email rendering, PDF generation

### Step 7: English everything

**Scan all files for non-English content:**
- `packages/engine/src/**/*.ts` — translate all Spanish comments and error messages
- `packages/nodes/src/**/*.ts` — translate
- `packages/vue/src/**/*.{ts,vue}` — translate
- `packages/editor/src/**/*.{ts,vue}` — translate
- All error messages prefixed with `[kiv]` or `[kiv/<package>]`

### Step 8: Test coverage

- Engine: add tests for EditorEngine, HistoryManager, SelectionState
- Engine: add tests for new PluginContext types
- Engine: add tests for renderToHtml
- Nodes: add tests for each node definition (validate defaults match schema)
- Vue: add tests for KivRenderer, KivNodeRenderer, each component
- Editor: add tests for store, canvas interactions, palette

---

## Package Export Maps Convention

Each package must have a closed `exports` map in `package.json`:

```json
{
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.mjs", "require": "./dist/index.cjs" },
    "./scales": { "types": "./dist/scales.d.ts", "import": "./dist/scales.mjs" },
    "./nodes": { "types": "./dist/nodes/index.d.ts", "import": "./dist/nodes/index.mjs" }
  }
}
```

No deep imports (`@kiv/engine/src/...`) allowed.

---

## Verifying Completeness

Before marking any phase as done:

```bash
pnpm biome check --write .   # No lint errors
pnpm typecheck               # No type errors
pnpm test                    # All tests pass
pnpm build                   # All packages build
```

Then manually verify:
- Engine exports are as expected
- Editor loads without errors
- Demo app works (editor + preview + locale switching + autosave)
- All Spanish content migrated to English
