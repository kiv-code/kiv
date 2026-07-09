# Phase 2: Editor Maturity (v0.2.0)

## Goal
Transform the editor from a basic tool into a production-grade visual builder.
Add copy/paste, multi-select, canvas DnD, keyboard shortcuts, undo grouping,
node locking, per-breakpoint visibility, resize handles, zoom/pan, and tree search.

---

## Step 2.1: Clipboard — Copy/Paste Nodes

### Files to create/implement

`packages/engine/src/clipboard.ts`

```typescript
import type { KivNode } from "./types"

// Serializes a node (and its subtree) to JSON for clipboard storage
export function serializeNode(node: KivNode): string {
  return JSON.stringify(node)
}

// Deserializes a node from clipboard JSON, generating new IDs
export function deserializeNode(json: string): KivNode | null {
  try {
    const node = JSON.parse(json) as KivNode
    if (!node.id || !node.type) return null
    return node
  } catch { return null }
}

// Creates a deep clone of a single node (not the full doc) with new IDs
export function cloneNodeTree(node: KivNode, suffix?: string): KivNode {
  const s = suffix ?? Math.random().toString(36).slice(2, 6)
  return reIdNode(node, s)
}

function reIdNode(node: KivNode, suffix: string): KivNode {
  const newSlots: Record<string, KivNode[]> = {}
  for (const [slot, children] of Object.entries(node.slots ?? {})) {
    newSlots[slot] = children.map(c => reIdNode(c, suffix))
  }
  return {
    ...node,
    id: `${node.id}-${suffix}`,
    slots: Object.keys(newSlots).length > 0 ? newSlots : undefined,
  }
}
```

### Editor changes
- Add copy (`⌘C`), cut (`⌘X`), paste (`⌘V`) keyboard handlers in KivCanvas
- Copy stores `serializeNode(selectedNode)` in a `ref<string | null>` (or native clipboard)
- Paste calls `deserializeNode()` + `cloneNodeTree()` + `store.addNode()`
- Cut = copy + remove

---

## Step 2.2: Multi-Select

### EditorEngine changes (already in Phase 1)
- `SelectionState` already supports multi-select: `add()`, `remove()`, `toggle()`, `has()`

### Canvas changes
- Shift+click: toggle node selection via `store.selection.toggle(id)`
- Show selection outlines on ALL selected nodes (not just one)
- Bulk delete (Delete key removes all selected)
- Bulk move (drag one → all selected move)

### Inspector changes
- When multiple nodes selected: show "Multiple selected (N)" instead of field editor
- Show "Edit all" option that applies a prop change to all selected nodes

### Tree changes
- Shift+click in tree: toggle selection
- Ctrl+A: select all visible nodes

---

## Step 2.3: Canvas Drag and Drop

Currently DnD only exists in the tree panel. Add canvas DnD:

### Canvas drop zones
- Drag from palette OR tree onto the canvas
- Show visual drop indicator (horizontal line at insertion point)
- Drop between nodes → insert at that position
- Drop on empty slot → insert at end
- Drag existing node on canvas → reposition

### Implementation approach
- Use the same HTML5 DnD API as KivTreeNode
- On `dragover`: determine insertion point by finding the nearest `[data-kiv-node-id]` at the cursor Y position
- Show a colored insertion line (2px, accent color)
- On `drop`: call `store.moveNode()` or `store.addNode()`

### Palette-to-canvas drag
- Palette items are `draggable="true"` — dragging from palette sets `dataTransfer` with the node type
- Canvas `drop` handler: create node from defaults, insert at drop position

---

## Step 2.4: Undo Grouping

### Problem
Every keystroke in inline editing creates a separate undo entry.
Rapid prop changes (slider drag, quick text input) should batch.

### Implementation
```typescript
// In EditorEngine
export class EditorEngine {
  private batchDepth = 0
  private pendingSnapshot: KivDocument | null = null

  startBatch(label?: string): void {
    if (this.batchDepth === 0) {
      this.pendingSnapshot = cloneDocument(this._document)
    }
    this.batchDepth++
  }

  endBatch(label?: string): void {
    this.batchDepth--
    if (this.batchDepth === 0 && this.pendingSnapshot) {
      // Push the snapshot from when batching started as the undo point
      this.history.push(this.pendingSnapshot, label)
      this.pendingSnapshot = null
    }
  }

  private commit(nextDoc: KivDocument, mutation?: DocumentMutation): void {
    if (this.batchDepth > 0) {
      // Don't push to history — just update document
      this._document = nextDoc
    } else {
      this.history.push(cloneDocument(this._document))
      this._document = nextDoc
    }
    if (mutation) this.emit(mutation)
  }
}
```

### Vue editor integration
- Inline editing: `startBatch()` on focus/click, `endBatch()` on blur/Enter
- Inspector slider/drag: `startBatch()` on mousedown, `endBatch()` on mouseup
- Quick text changes: debounce 300ms → `startBatch()` + `endBatch()`

---

## Step 2.5: Keyboard Shortcuts Expansion

### Add to KivCanvas keydown handler

| Shortcut | Action |
|---|---|
| `⌘C` / `Ctrl+C` | Copy selected node |
| `⌘X` / `Ctrl+X` | Cut selected node |
| `⌘V` / `Ctrl+V` | Paste node at selection |
| `⌘A` / `Ctrl+A` | Select all nodes |
| `⌘F` / `Ctrl+F` | Focus tree search |
| `⌘S` / `Ctrl+S` | Emit `document.save` event on bus |
| `⌘/` / `Ctrl+/` | Show keyboard shortcut reference modal |
| `↑` | Select previous sibling (tree navigation) |
| `↓` | Select next sibling |
| `⌘↑` / `Ctrl+↑` | Move selected node up |
| `⌘↓` / `Ctrl+↓` | Move selected node down |
| `⌘]` / `Ctrl+]` | Indent (nest into previous sibling if it has slots) |
| `⌘[` / `Ctrl+[` | Outdent (move out of parent) |
| `Enter` | Start inline editing on selected node (if supports it) |

---

## Step 2.6: Node Locking

### Data model
`KivNode.locked?: boolean` (already added in Phase 1)

### Editor behavior
- Locked nodes: show a lock icon in the tree
- Locked nodes: cannot be moved, deleted, or have props changed
- Locked nodes: show a padlock overlay on the canvas
- Toggle lock: context menu option "Lock/Unlock" or keyboard shortcut

### Implementation
```typescript
// In editor-store or EditorEngine:
function isLocked(id: string): boolean {
  const node = findNode(document, id)
  return node?.node.locked === true
}

function updateProps(id: string, patch: Record<string, unknown>): void {
  if (isLocked(id)) return // silently ignore, or toast warning
  commit(updateNodeProps(document, id, patch))
}
```

---

## Step 2.7: Per-Breakpoint Visibility

### Data model
`KivNode.visible?: Responsive<boolean>` (already added in Phase 1)

### Resolution
The resolver should handle `visible` specially:
```typescript
// In resolveNode, after resolving props:
const visible = resolveResponsive(node.visible ?? true, ctx.breakpoint)
```

### Renderer behavior
```vue
<!-- In KivNodeRenderer.vue -->
<template v-if="resolvedVisible">
  <component ... />
</template>
```

### Editor behavior
- Inspector shows visibility toggle per breakpoint (eye icon)
- Hidden nodes shown with reduced opacity in editor with "hidden" badge
- Tree shows hidden indicator

---

## Step 2.8: Canvas Resize Handles

### Implementation
- When a node is selected (and supports resizing), show handles at edges/midpoints
- Dragging a handle updates the node's `width`, `height`, or `aspectRatio` props
- Responsive-aware: setting width at current breakpoint stores the responsive value

### Which nodes support resize handles
- Image (width, aspect ratio)
- Section (min-height) — via bottom handle
- Column (span) — via right handle or via drag to resize column proportions

---

## Step 2.9: Canvas Zoom and Pan

### Zoom
- `⌘` + scroll wheel: zoom in/out
- Zoom range: 25% to 200%
- Zoom indicator in toolbar
- `⌘0`: reset to 100%
- Transform: `transform: scale(zoom)` on the canvas stage div

### Pan
- Middle mouse button drag OR Space + drag to pan canvas
- Scroll wheel for vertical scroll (when not zoomed)
- Auto-scroll when dragging near edges

---

## Step 2.10: Tree Search/Filter

### Implementation
- Add search input at top of KivTree panel (magnifying glass icon)
- Filter-as-you-type: match against node label, type name, and ID
- Matched nodes are highlighted, non-matching nodes dimmed (not hidden)
- Show match count
- Tree scrolls to first match
- `Esc` clears search

---

## Completion Checklist

- [ ] `pnpm biome check --write .` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes with new tests for clipboard, multi-select, undo grouping
- [ ] Copy/paste works within and between documents
- [ ] Multi-select works (Shift+click on canvas and tree)
- [ ] Canvas DnD works (from palette + from tree)
- [ ] Undo grouping batches rapid edits into single undo step
- [ ] Keyboard shortcuts match the expansion table
- [ ] Node locking works (lock icon, cannot edit/move/delete)
- [ ] Per-breakpoint visibility hides nodes at specific breakpoints
- [ ] Resize handles appear on Image and Section nodes
- [ ] Canvas zoom/pan work (scroll zoom, space+drag pan)
- [ ] Tree search filters nodes by label/type/ID
