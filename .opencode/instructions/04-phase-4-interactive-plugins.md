# Phase 4: Interactive Nodes & Plugins (v0.4.0)

## Goal
Deliver the interactive node system (Carousel, Accordion, Tabs, Modal) as a separate
`@kiv/nodes-interactive` package, proving the plugin architecture. Expand the plugin
system with editor hooks (toolbar buttons, custom panels, custom field controls).
Add document mutation events, history timeline, SEO plugin, accessibility checker,
and page templates.

---

## Step 4.1: Interactive Node Architecture

### Pattern for all interactive nodes

Interactive nodes share:
1. **Runtime state** managed by the renderer component (not in the JSON)
2. **Events emitted** on the bus when state changes
3. **Named slots** for each content panel/tab/slide
4. **Default state** defined in props

### Package: `packages/nodes-interactive/`

New monorepo package. Depends on `@kiv/engine` and `@kiv/nodes`.

```json
{
  "name": "@kiv/nodes-interactive",
  "dependencies": {
    "@kiv/engine": "workspace:*",
    "@kiv/nodes": "workspace:*"
  }
}
```

### InteractiveNode base type
```typescript
// Each interactive node's state is stored in its props as serialized defaults
// The renderer component initializes its runtime state from props and emits
// changes via the bus. The JSON NEVER stores runtime state.
export interface InteractiveProps {
  initialActiveIndex?: number
  autoplay?: boolean
  autoplayInterval?: number
  pauseOnHover?: boolean
  loop?: boolean
  animation?: "fade" | "slide" | "none"
  animationDuration?: number
}
```

---

## Step 4.2: Carousel Node

### Schema
```typescript
export const carouselNode = defineNode({
  type: "carousel",
  category: "interactive",
  label: "Carousel",
  icon: "images",
  slotConstraints: { default: ["image", "section", "container", "stack"] },
  fields: {
    autoplay: f.boolean({ label: "Autoplay", default: true, group: "Behavior" }),
    autoplayInterval: f.number({ label: "Interval (ms)", default: 5000, group: "Behavior" }),
    pauseOnHover: f.boolean({ label: "Pause on Hover", default: true, group: "Behavior" }),
    loop: f.boolean({ label: "Loop", default: true, group: "Behavior" }),
    animation: f.select(["fade", "slide", "none"], { label: "Animation", default: "slide", group: "Style" }),
    animationDuration: f.number({ label: "Duration (ms)", default: 300, group: "Style" }),
    showArrows: f.boolean({ label: "Show Arrows", default: true, group: "Controls" }),
    showDots: f.boolean({ label: "Show Dots", default: true, group: "Controls" }),
    showThumbnails: f.boolean({ label: "Show Thumbnails", default: false, group: "Controls" }),
    aspectRatio: f.select(["16/9", "4/3", "1/1", "3/2", "auto"], {
      label: "Aspect Ratio", default: "16/9", group: "Layout",
    }),
    borderRadius: f.select(["none", "sm", "md", "lg", "xl", "full"], {
      label: "Border Radius", default: "lg", group: "Style",
    }),
  },
})
```

### Events emitted
- `carousel.slideChanged`: `{ nodeId, currentIndex, previousIndex }`

---

## Step 4.3: Accordion Node

### Schema
```typescript
export const accordionNode = defineNode({
  type: "accordion",
  category: "interactive",
  label: "Accordion",
  icon: "chevrons-down-up",
  slotConstraints: { default: ["accordion-item"] },
  fields: {
    allowMultiple: f.boolean({ label: "Allow Multiple Open", default: false, group: "Behavior" }),
    keepOneOpen: f.boolean({ label: "Keep One Open", default: true, group: "Behavior" }),
    defaultOpenIndex: f.number({ label: "Default Open Index", default: 0, group: "Behavior" }),
    animation: f.select(["slide", "fade", "none"], { label: "Animation", default: "slide", group: "Style" }),
    animationDuration: f.number({ label: "Duration (ms)", default: 200, group: "Style" }),
    icon: f.select(["chevron", "plus", "arrow"], { label: "Expand Icon", default: "chevron", group: "Style" }),
    iconPosition: f.select(["left", "right"], { label: "Icon Position", default: "right", group: "Style" }),
    gap: f.select(["none", "xs", "sm", "md", "lg"], {
      label: "Gap Between Items", default: "sm", group: "Layout",
    }),
    borderRadius: f.select(["none", "sm", "md", "lg"], {
      label: "Border Radius", default: "md", group: "Style",
    }),
  },
})

export const accordionItemNode = defineNode({
  type: "accordion-item",
  category: "interactive",
  label: "Accordion Item",
  icon: "chevron-right",
  fields: {
    title: f.text({ label: "Title", localizable: true, inline: true, group: "Content" }),
    defaultOpen: f.boolean({ label: "Open by Default", default: false, group: "Behavior" }),
    disabled: f.boolean({ label: "Disabled", default: false, group: "Behavior" }),
    icon: f.text({ label: "Custom Icon", group: "Style" }),
    background: f.color({ label: "Background", default: "transparent", group: "Style" }),
    titleColor: f.color({ label: "Title Color", group: "Style" }),
  },
})
```

### Events emitted
- `accordion.itemToggled`: `{ nodeId, itemIndex, isOpen }`

---

## Step 4.4: Tabs Node

### Schema
```typescript
export const tabsNode = defineNode({
  type: "tabs",
  category: "interactive",
  label: "Tabs",
  icon: "folder-tab",
  slotConstraints: { default: ["tab-panel"] },
  fields: {
    defaultTab: f.number({ label: "Default Tab Index", default: 0, group: "Behavior" }),
    orientation: f.select(["horizontal", "vertical"], {
      label: "Orientation", default: "horizontal", group: "Layout",
    }),
    position: f.select(["top", "left", "right"], {
      label: "Tab Position", default: "top", group: "Layout",
    }),
    style: f.select(["underline", "pills", "buttons"], {
      label: "Tab Style", default: "underline", group: "Style",
    }),
    animation: f.select(["fade", "slide", "none"], {
      label: "Animation", default: "fade", group: "Style",
    }),
    stretch: f.boolean({ label: "Stretch Tabs", default: false, group: "Layout" }),
    fullWidth: f.boolean({ label: "Full Width", default: false, responsive: true, group: "Layout" }),
  },
})

export const tabPanelNode = defineNode({
  type: "tab-panel",
  category: "interactive",
  label: "Tab Panel",
  icon: "file-text",
  fields: {
    title: f.text({ label: "Tab Title", localizable: true, inline: true, group: "Content" }),
    icon: f.text({ label: "Tab Icon", group: "Style" }),
    badge: f.text({ label: "Badge", group: "Content" }),
    badgeColor: f.color({ label: "Badge Color", group: "Content" }),
    disabled: f.boolean({ label: "Disabled", default: false, group: "Behavior" }),
  },
})
```

### Events emitted
- `tabs.tabChanged`: `{ nodeId, currentIndex, currentTitle }`

---

## Step 4.5: Modal Node

### Schema
```typescript
export const modalNode = defineNode({
  type: "modal",
  category: "interactive",
  label: "Modal",
  icon: "window",
  fields: {
    triggerType: f.select(["button", "link", "image", "text"], {
      label: "Trigger Type", default: "button", group: "Trigger",
    }),
    triggerLabel: f.text({ label: "Trigger Label", localizable: true, group: "Trigger" }),
    triggerStyle: f.select(["primary", "secondary", "outline", "ghost", "link"], {
      label: "Trigger Style", default: "primary", group: "Trigger",
    }),
    size: f.select(["sm", "md", "lg", "xl", "full", "auto"], {
      label: "Size", default: "md", group: "Layout",
    }),
    closeOnOverlay: f.boolean({ label: "Close on Overlay Click", default: true, group: "Behavior" }),
    closeOnEscape: f.boolean({ label: "Close on Escape", default: true, group: "Behavior" }),
    showCloseButton: f.boolean({ label: "Show Close Button", default: true, group: "Controls" }),
    preventScroll: f.boolean({ label: "Prevent Background Scroll", default: true, group: "Behavior" }),
    animation: f.select(["fade", "slide-up", "slide-down", "zoom", "none"], {
      label: "Animation", default: "fade", group: "Style",
    }),
  },
})
```

### Events emitted
- `modal.opened`: `{ nodeId }`
- `modal.closed`: `{ nodeId }`

---

## Step 4.6: Document Mutation Events

### Implementation in EditorEngine
The EditorEngine already has `onMutation()` and `emit()` from Phase 1.
Now also emit on the engine bus:

```typescript
// In EditorEngine constructor, accept the event bus:
constructor(opts: EditorEngineOptions & { bus?: EventBus }) {
  // ...
  if (opts.bus) {
    this.onMutation((mutation) => {
      const event = mutationTypeToBusEvent(mutation.type)
      opts.bus.emit(event, mutation)
    })
  }
}

function mutationTypeToBusEvent(type: DocumentMutation["type"]): string {
  switch (type) {
    case "node.created": return "node.created"
    case "node.removed": return "node.removed"
    case "node.moved": return "node.moved"
    case "node.propsChanged": return "node.propsChanged"
    case "node.renamed": return "node.renamed"
  }
}
```

### Extend KivEventMap
```typescript
// In @kiv/engine/src/events/types.ts or via module augmentation
declare module "@kiv/engine" {
  interface KivEventMap {
    "node.created": DocumentMutation & { type: "node.created" }
    "node.removed": DocumentMutation & { type: "node.removed" }
    // ... etc
  }
}
```

---

## Step 4.7: Plugin Hooks Implementation

### Editor plugin hooks

Add the following capabilities to the PluginContext.editor object:

```typescript
editor: {
  // Add buttons to the editor toolbar
  addToolbarButton(btn: ToolbarButton): void

  // Add a panel to any sidebar area
  addPanel(name: string, component: ComponentDef): void

  // Add items to the node palette (the "Add" dialog)
  addPaletteItem(item: PaletteItem): void

  // Add tabs to the inspector sidebar
  addInspectorTab(name: string, component: ComponentDef): void

  // Register a custom field control for a given type
  addFieldControl(type: string, component: ComponentDef): void

  // Register keyboard shortcuts
  addKeyboardShortcut(sc: ShortcutDef): void

  // Lifecycle hooks
  onNodeSelect(cb: (node: KivNode) => void): void
  onNodeCreate(cb: (node: KivNode) => void): void
  onDocumentChange(cb: (doc: KivDocument) => void): void
}
```

### Vue editor implementation
- The Vue editor stores arrays of registered buttons/panels/tabs
- Plugins push to these arrays via the PluginContext
- The editor renders them dynamically

---

## Step 4.8: SEO Plugin (Example Plugin)

### Package: `packages/plugin-seo/`

```typescript
export function seoPlugin(): KivPlugin {
  return {
    name: "seo",
    install(ctx: PluginContext) {
      // Register an inspector tab for SEO
      ctx.editor?.addInspectorTab({
        id: "seo",
        label: "SEO",
        component: { type: "vue", path: "./SeoInspectorTab.vue" },
      })

      // Listen for document save to update meta tags
      ctx.bus.on("document.saved", (payload) => {
        updateMetaTags(payload.doc)
      })
    },
  }
}
```

### Features
- Page title and meta description fields
- Open Graph and Twitter card preview
- Slug/URL preview
- Sitemap priority
- Index/noindex toggle
- Canonical URL
- Structured data preview (JSON-LD)

---

## Step 4.9: Accessibility Checker Plugin

### Package: `packages/plugin-a11y/`

### Rules checked
- Images must have alt text (in all locales)
- Heading levels must not skip (h1 → h2 → h3, not h1 → h3)
- Color contrast ratio minimum for text on background
- Links must have discernible text
- Buttons must have accessible labels
- Videos must have captions

### Implementation
```typescript
export function a11yPlugin(): KivPlugin {
  return {
    name: "a11y",
    install(ctx: PluginContext) {
      ctx.editor?.addInspectorTab({
        id: "a11y",
        label: "Accessibility",
        component: { type: "vue", path: "./A11yPanel.vue" },
      })

      // Listen for node changes and re-check
      ctx.bus.on("node.created", (mutation) => checkNode(mutation.node))
      ctx.bus.on("node.propsChanged", (mutation) => { /* re-check */ })
    },
  }
}
```

---

## Step 4.10: Page Templates

### Template system
- Templates are stored as KivDocument JSON snippets
- A template is a partial document (a subtree, or a full page)
- Templates can have category, thumbnail, name, description
- Template browser modal in the editor toolbar

### Template storage
```typescript
interface PageTemplate {
  id: string
  name: string
  description?: string
  category?: string
  thumbnail?: string
  document: KivDocument  // or a subtree KivNode
}
```

### Built-in templates
- Blank page
- Landing page (hero + features + pricing + CTA)
- About page (hero + text + team grid)
- Contact page (text + form structure)
- Blog post (header + content + sidebar)

---

## Completion Checklist

- [ ] `@kiv/nodes-interactive` package exists with Carousel, Accordion, Tabs, Modal
- [ ] Interactive nodes emit correct events on state changes
- [ ] Document mutation events fire on the bus
- [ ] Plugin hooks (addToolbarButton, addPanel, addPaletteItem, etc.) work
- [ ] SEO plugin produces valid meta tags and OG data
- [ ] A11y plugin checks basic accessibility rules
- [ ] Page templates can be saved, loaded, and applied
- [ ] All packages build and test pass
