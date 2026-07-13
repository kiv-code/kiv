# Phase 1: Hardening for Production (v0.1.0)

## Goal

Make @kivcode/engine a framework that any application can consume without forking or patching.
Decouple the editor from Vue, enrich the plugin system, add media/services abstractions,
add HTML renderer, translate to English, and add test coverage.

---

## Step 1.1: EditorEngine — Framework-Agnostic Editor State

### Files to Create

#### `packages/engine/src/editor/types.ts`

```typescript
import type { KivDocument, KivNode } from "../types";

export interface EditorEngineOptions {
  document: KivDocument;
  historyLimit?: number;
}

export interface NodeLocation {
  node: KivNode;
  parent: KivNode | null;
  slotName: string | null;
  index: number;
}

export type DocumentMutation =
  | {
      type: "node.created";
      node: KivNode;
      parentId: string;
      slot: string;
      index: number;
    }
  | {
      type: "node.removed";
      node: KivNode;
      parentId: string;
      slot: string;
      index: number;
    }
  | {
      type: "node.moved";
      nodeId: string;
      from: { parentId: string; slot: string; index: number };
      to: { parentId: string; slot: string; index: number };
    }
  | {
      type: "node.propsChanged";
      nodeId: string;
      patch: Record<string, unknown>;
    }
  | { type: "node.renamed"; nodeId: string; oldId: string; newId: string };

export type MutationListener = (mutation: DocumentMutation) => void;
```

#### `packages/engine/src/editor/selection.ts`

```typescript
export class SelectionState {
  private selectedIds: Set<string> = new Set();

  get ids(): string[] {
    return [...this.selectedIds];
  }
  get first(): string | null {
    return this.selectedIds.values().next().value ?? null;
  }
  get size(): number {
    return this.selectedIds.size;
  }

  select(id: string): void {
    this.selectedIds = new Set([id]);
  }
  add(id: string): void {
    this.selectedIds = new Set([...this.selectedIds, id]);
  }
  remove(id: string): void {
    this.selectedIds = new Set([...this.selectedIds].filter((s) => s !== id));
  }
  toggle(id: string): void {
    if (this.selectedIds.has(id)) this.remove(id);
    else this.add(id);
  }
  clear(): void {
    this.selectedIds = new Set();
  }
  has(id: string): boolean {
    return this.selectedIds.has(id);
  }
  isSingle(): boolean {
    return this.selectedIds.size === 1;
  }
}
```

#### `packages/engine/src/editor/history.ts`

```typescript
import type { KivDocument } from "../types";

export interface HistoryEntry {
  snapshot: KivDocument;
  label?: string;
  timestamp: number;
}

export interface HistoryManagerOptions {
  limit?: number;
}

export class HistoryManager {
  private stack: HistoryEntry[] = [];
  private currentIndex = -1;
  private limit: number;

  constructor(opts: HistoryManagerOptions = {}) {
    this.limit = opts.limit ?? 50;
  }

  get canUndo(): boolean {
    return this.currentIndex > 0;
  }
  get canRedo(): boolean {
    return this.currentIndex < this.stack.length - 1;
  }
  get current(): KivDocument | null {
    return this.stack[this.currentIndex]?.snapshot ?? null;
  }
  get entries(): HistoryEntry[] {
    return [...this.stack];
  }

  push(snapshot: KivDocument, label?: string): void {
    // Discard any future entries beyond current position
    this.stack = this.stack.slice(0, this.currentIndex + 1);
    this.stack.push({
      snapshot: structuredClone(snapshot),
      label,
      timestamp: Date.now(),
    });
    if (this.stack.length > this.limit) this.stack.shift();
    this.currentIndex = this.stack.length - 1;
  }

  undo(): KivDocument | null {
    if (!this.canUndo) return null;
    this.currentIndex--;
    return this.stack[this.currentIndex]!.snapshot;
  }

  redo(): KivDocument | null {
    if (!this.canRedo) return null;
    this.currentIndex++;
    return this.stack[this.currentIndex]!.snapshot;
  }

  skipTo(index: number): KivDocument | null {
    if (index < 0 || index >= this.stack.length) return null;
    this.currentIndex = index;
    return this.stack[index]!.snapshot;
  }

  clear(): void {
    this.stack = [];
    this.currentIndex = -1;
  }
}
```

#### `packages/engine/src/editor/editor-engine.ts`

```typescript
import type { KivDocument, KivNode, Breakpoint, I18nConfig } from "../types";
import { cloneDocument } from "../utils/clone-document";
import {
  EditorEngineOptions,
  DocumentMutation,
  MutationListener,
} from "./types";
import { SelectionState } from "./selection";
import { HistoryManager } from "./history";

export class EditorEngine {
  readonly selection: SelectionState = new SelectionState();
  readonly history: HistoryManager;
  breakpoint: Breakpoint = "base";
  locale: string = "en";

  private _document: KivDocument;
  private mutationListeners: Set<MutationListener> = new Set();

  constructor(opts: EditorEngineOptions) {
    this._document = cloneDocument(opts.document);
    this.history = new HistoryManager({ limit: opts.historyLimit });
    this.history.push(cloneDocument(this._document));
    this.locale = this._document.i18n?.default ?? "en";
  }

  get document(): KivDocument {
    return this._document;
  }

  onMutation(listener: MutationListener): () => void {
    this.mutationListeners.add(listener);
    return () => this.mutationListeners.delete(listener);
  }

  private emit(mutation: DocumentMutation): void {
    for (const listener of this.mutationListeners) listener(mutation);
  }

  private commit(nextDoc: KivDocument, mutation?: DocumentMutation): void {
    this.history.push(cloneDocument(this._document));
    this._document = nextDoc;
    if (mutation) this.emit(mutation);
  }

  updateProps(id: string, patch: Record<string, unknown>): void {
    const next = updateNodeProps(this._document, id, patch);
    this.commit(next, { type: "node.propsChanged", nodeId: id, patch });
  }

  addNode(
    parentId: string,
    slotName: string,
    node: KivNode,
    index?: number,
  ): void {
    const next = addNode(this._document, parentId, slotName, node, index);
    this.commit(next, {
      type: "node.created",
      node,
      parentId,
      slot: slotName,
      index: index ?? 0,
    });
  }

  // ... etc. (mirror the pattern from document-ops.ts)
}
```

#### `packages/engine/src/editor/index.ts`

Export all editor types and classes.

### Files to Modify

#### `packages/engine/src/index.ts`

Add exports for EditorEngine, SelectionState, HistoryManager, editor types.

#### `packages/engine/src/types/node.ts`

Add to KivNode:

```typescript
locked?: boolean
visible?: Responsive<boolean>
```

#### `packages/engine/src/utils/clone-document.ts` (CREATE)

```typescript
import type { KivDocument } from "../types";
export function cloneDocument(doc: KivDocument): KivDocument {
  return JSON.parse(JSON.stringify(doc));
}
```

#### `packages/editor/src/store/editor-store.ts` (REWRITE)

Wrap EditorEngine instead of implementing state directly:

```typescript
export function useEditorStore(
  initialDoc: KivDocument,
  registry: Registry,
): EditorStore {
  const engine = new EditorEngine({ document: initialDoc });
  // Wrap engine state in Vue refs for reactivity
  const docRef = ref(engine.document);
  // Sync: when engine emits a mutation, update the Vue ref
  engine.onMutation(() => {
    docRef.value = engine.document;
  });
  return {
    /* delegate to engine */
  };
}
```

---

## Step 1.2: PluginContext Enrichment

### Create: `packages/engine/src/plugin/types-editor.ts`

```typescript
export interface ToolbarButton {
  id: string;
  label: string;
  icon?: string;
  group?: string;
  onClick(): void;
}

export interface PaletteItem {
  type: string;
  label: string;
  description?: string;
  category?: string;
  icon?: string;
  hasDefaultSlot?: boolean;
}

export interface InspectorTab {
  id: string;
  label: string;
  icon?: string;
  component: ComponentDef;
}

export interface ComponentDef {
  /** For Vue: import('../MyComponent.vue'). For React: import('../MyComponent') */
  type: "vue" | "react";
  path: string;
}

export interface ShortcutDef {
  keys: string; // "Mod+Z", "Shift+Mod+Z", "Delete"
  label: string;
  handler(): void;
}
```

### Create: `packages/engine/src/plugin/types-media.ts`

```typescript
export interface MediaProvider {
  name: string;
  upload(file: File, options?: UploadOptions): Promise<MediaAsset>;
  delete(url: string): Promise<void>;
  resolve(src: string, transforms?: ImageTransform): string;
}

export interface MediaAsset {
  id: string;
  url: string;
  width: number;
  height: number;
  mimeType: string;
  size: number;
  alt?: string;
  thumbnails?: Record<string, string>;
}

export interface UploadOptions {
  folder?: string;
  public?: boolean;
}

export interface ImageTransform {
  width?: number;
  height?: number;
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  quality?: number;
  format?: "webp" | "avif" | "jpeg" | "png" | "original";
}
```

### Create: `packages/engine/src/plugin/types-services.ts`

```typescript
export interface ApiClient {
  get<T>(url: string, params?: Record<string, unknown>): Promise<T>;
  post<T>(url: string, data?: unknown): Promise<T>;
  put<T>(url: string, data?: unknown): Promise<T>;
  delete<T>(url: string): Promise<T>;
}

export interface AuthProvider {
  user: unknown;
  isAuthenticated: boolean;
  login(credentials: unknown): Promise<void>;
  logout(): Promise<void>;
  getToken(): string | null;
}

export interface RouterProvider {
  push(path: string): void;
  replace(path: string): void;
  back(): void;
  current: string;
}

export interface StorageProvider {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}
```

### Modify: `packages/engine/src/plugin/types.ts`

Extend PluginContext to include `editor?`, `media?`, `services`.

### Modify: `packages/engine/src/engine/create-engine.ts`

Accept `media` and `services` in CreateEngineOptions. Pass them through in PluginContext.

---

## Step 1.3: CompiledNode Enrichment

### Modify: `packages/engine/src/schema/define-node.ts`

Add to `CompiledNode`:

- `label?: string`
- `icon?: string`
- `slotConstraints?: Record<string, string[]>`
- `description?: string`

Update `NodeDefinition` to accept these new fields in `defineNode()`.

### Modify: `packages/engine/src/schema/field.ts`

Add to `FieldDescriptor`:

- `placeholder?: string`
- `hint?: string`
- `required?: boolean`
- `hidden?: boolean`

Update `f.*` helpers in `fields.ts` to accept these options.

---

## Step 1.4: MediaProvider Interface

### Create: `packages/engine/src/media/types.ts`

MediaProvider, MediaAsset, UploadOptions, ImageTransform (same as in Step 1.2 types-media.ts).

### Create: `packages/engine/src/media/index.ts`

Re-export types.

### Modify: `packages/engine/src/engine/create-engine.ts`

Accept `media?: { provider: MediaProvider }` in CreateEngineOptions.

---

## Step 1.5: Services Container

### Create: `packages/engine/src/services/types.ts`

ServiceContainer, ApiClient, AuthProvider, RouterProvider, StorageProvider (same as Step 1.2).

### Create: `packages/engine/src/services/index.ts`

Re-export types.

### Modify: `packages/engine/src/engine/create-engine.ts`

Accept `services?: ServiceContainer` in CreateEngineOptions.

---

## Step 1.6: renderToHtml()

### Create: `packages/engine/src/render/types.ts`

```typescript
import type { KivNode } from "../types";

export interface RenderOptions {
  locale?: string;
  breakpoint?: string;
}

export interface RenderContext {
  locale: string;
  breakpoint: string;
  resolveUrl(src: string): string;
}

export type NodeToHtml = (
  node: KivNode,
  props: Record<string, unknown>,
  children: string,
  ctx: RenderContext,
) => string;
```

### Create: `packages/engine/src/render/render-to-html.ts`

Implement a recursive HTML renderer that:

1. Takes a KivNode + CompiledNode registry + RenderOptions
2. Resolves props (responsive + locale)
3. Checks if the node type has a `toHtml` function in the CompiledNode
4. If yes, calls it to produce HTML
5. If no, renders a `<div>` with `data-kiv-type` and `data-kiv-node-id` attributes
6. Recursively renders all slot children

### Create: `packages/engine/src/render/index.ts`

Re-export types and renderToHtml function.

---

## Step 1.7: English Everything

Scan and translate ALL files in these packages:

- `packages/engine/src/**/*.ts`
- `packages/nodes/src/**/*.ts`
- `packages/vue/src/**/*.{ts,vue}`
- `packages/editor/src/**/*.{ts,vue}`
- `packages/plugin-analytics/src/**/*.ts`

Patterns to find:

```bash
rg '// [A-ZÁÉÍÓÚÑ]' packages/  # Spanish comments starting with capital letter
rg 'Error\(`\[kiv' packages/     # Error messages
rg 'Error\("\[kiv' packages/     # Error messages
rg '^\s*/\*\*' packages/         # JSDoc blocks (may be Spanish)
rg '^.*[áéíóúñ].*$' packages/   # Lines with Spanish characters in text
```

Translate ALL to English. Error messages must be prefixed with `[kiv]` or `[kiv/<package>]`.

---

## Step 1.8: Test Coverage

### Engine tests to add:

- `EditorEngine` tests: initialization, selection, undo/redo, mutations, listeners
- `SelectionState` tests: select/add/remove/toggle/clear/has/size
- `HistoryManager` tests: push/undo/redo/clear/skipTo/limit
- `renderToHtml` tests: basic rendering, node with toHtml, fallback div
- `PluginContext` types test (compile-time check)
- `MediaProvider` types test
- `ServiceContainer` types test

### Nodes tests to add/open:

- Each node definition should have a test that validates defaults match schema
- Test that ALL_NODES exports the expected 10 nodes

### Vue tests to add:

- KivRenderer mounts and renders
- KivNodeRenderer resolves props and renders components
- Each Vue component renders with default props

### Editor tests to add/open:

- Wrap EditorEngine store tests
- Canvas click selection test
- Palette create node test

---

## Completion Checklist

Before marking Phase 1 as complete, verify:

- [x] `pnpm biome check --write .` passes with no errors
- [x] `pnpm typecheck` passes with no errors
- [x] `pnpm test` passes with all tests green
- [x] `pnpm build` builds all packages without errors
- [x] Demo app loads and works (editor + preview)
- [x] No Spanish comments or error messages remain in any source file
- [x] Engine exports include EditorEngine, SelectionState, HistoryManager
- [x] PluginContext includes editor/media/services
- [x] CompiledNode includes label/icon/slotConstraints/description
- [x] FieldDescriptor includes placeholder/hint/required/hidden
- [x] MediaProvider interface exists in @kivcode/engine
- [x] Services container types exist in @kivcode/engine
- [x] renderToHtml() works and is exported
- [x] KivNode has locked and visible fields
