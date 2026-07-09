# Phase 3: Content & Media (v0.3.0)

## Goal
Add rich content creation capabilities: RichText editing, Video/Icon/Divider/Link nodes,
media upload system, media browser, responsive images, and image editing.

---

## Step 3.1: RichText Node

### Definition (`packages/nodes/src/content/richtext.ts`)

RichText is the most requested content node. It uses Tiptap/ProseMirror for editing.

```typescript
export const richTextNode = defineNode({
  type: "richtext",
  category: "content",
  label: "Rich Text",
  icon: "align-left",
  fields: {
    content: f.textarea({
      label: "Content",
      localizable: true,
      inline: true,
      group: "Content",
    }),
    size: f.number({ label: "Font Size", default: 16, responsive: true, group: "Typography" }),
    color: f.color({ label: "Text Color", default: "#000000", group: "Typography" }),
    lineHeight: f.select(["tight", "snug", "normal", "relaxed", "loose"], {
      label: "Line Height", default: "normal", group: "Typography",
    }),
    dropCap: f.boolean({ label: "Drop Cap", default: false, group: "Style" }),
    columns: f.select(["1", "2", "3"], { label: "Columns", default: "1", responsive: true, group: "Layout" }),
    columnGap: f.select(["none", "sm", "md", "lg"], { label: "Column Gap", default: "md", group: "Layout" }),
  },
})
```

### Vue Component (`packages/vue/src/nodes/RichTextNode.vue`)
- Renders content as HTML via `v-html`
- In editor mode: <div contenteditable> with a light Tiptap instance
- Inline editing: double-click activates Tiptap toolbar

### React Component (future)
- Same contract, uses draft-js or lexical

---

## Step 3.2: Video Node

### Definition (`packages/nodes/src/media/video.ts`)

```typescript
export const videoNode = defineNode({
  type: "video",
  category: "media",
  label: "Video",
  icon: "video",
  fields: {
    src: f.text({ label: "Video URL", group: "Source" }),
    type: f.select(["youtube", "vimeo", "html5", "loom"], {
      label: "Source Type", default: "youtube", group: "Source",
    }),
    autoplay: f.boolean({ label: "Autoplay", default: false, group: "Behavior" }),
    controls: f.boolean({ label: "Show Controls", default: true, group: "Behavior" }),
    loop: f.boolean({ label: "Loop", default: false, group: "Behavior" }),
    muted: f.boolean({ label: "Muted", default: false, group: "Behavior" }),
    poster: f.text({ label: "Poster Image", group: "Source" }),
    aspectRatio: f.select(["16/9", "4/3", "1/1", "21/9"], {
      label: "Aspect Ratio", default: "16/9", group: "Layout",
    }),
    borderRadius: f.select(["none", "sm", "md", "lg", "xl", "full"], {
      label: "Border Radius", default: "none", group: "Style",
    }),
    shadow: f.select(["none", "sm", "md", "lg", "xl"], {
      label: "Shadow", default: "none", group: "Style",
    }),
    caption: f.text({ label: "Caption", localizable: true, group: "Content" }),
  },
})
```

### Vue Component
- For YouTube/Vimeo: render iframe embed
- For HTML5: render `<video>` tag with source
- Lazy loading by default
- Aspect ratio container to prevent CLS

---

## Step 3.3: Icon Node

### Definition (`packages/nodes/src/media/icon.ts`)

```typescript
export const iconNode = defineNode({
  type: "icon",
  category: "media",
  label: "Icon",
  icon: "star",
  fields: {
    name: f.text({ label: "Icon Name", placeholder: "e.g. lucide:star", group: "Content" }),
    library: f.select(["lucide", "iconify", "custom"], {
      label: "Icon Library", default: "iconify", group: "Source",
    }),
    size: f.number({ label: "Size", default: 24, responsive: true, group: "Style" }),
    color: f.color({ label: "Color", default: "#000000", group: "Style" }),
    strokeWidth: f.number({ label: "Stroke Width", default: 2, group: "Style" }),
    rotate: f.number({ label: "Rotate (deg)", default: 0, group: "Style" }),
    link: f.text({ label: "Link URL", group: "Link" }),
    linkTarget: f.select(["_self", "_blank"], { label: "Link Target", default: "_self", group: "Link" }),
  },
})
```

### Vue Component
- Iconify integration for icon selection
- Lucide icon support
- Custom SVG support

---

## Step 3.4: Divider Node

### Definition (`packages/nodes/src/content/divider.ts`)

```typescript
export const dividerNode = defineNode({
  type: "divider",
  category: "content",
  label: "Divider",
  icon: "minus",
  fields: {
    style: f.select(["solid", "dashed", "dotted", "double", "none"], {
      label: "Style", default: "solid", group: "Style",
    }),
    color: f.color({ label: "Color", default: "#e2e8f0", group: "Style" }),
    thickness: f.number({ label: "Thickness", default: 1, group: "Style" }),
    width: f.select(["25%", "50%", "75%", "100%"], {
      label: "Width", default: "100%", group: "Layout",
    }),
    align: f.select(["left", "center", "right"], {
      label: "Alignment", default: "center", group: "Layout",
    }),
    marginY: f.select(["none", "xs", "sm", "md", "lg", "xl"], {
      label: "Margin Y", default: "md", responsive: true, group: "Layout",
    }),
    icon: f.text({ label: "Icon (optional)", group: "Content" }),
    iconSize: f.number({ label: "Icon Size", default: 16, group: "Content" }),
  },
})
```

---

## Step 3.5: Link Node

### Definition (`packages/nodes/src/content/link.ts`)

```typescript
export const linkNode = defineNode({
  type: "link",
  category: "content",
  label: "Link",
  icon: "link",
  fields: {
    href: f.text({ label: "URL", group: "Link" }),
    target: f.select(["_self", "_blank"], { label: "Target", default: "_self", group: "Link" }),
    linkType: f.select(["internal", "external", "anchor"], {
      label: "Link Type", default: "internal", group: "Link",
    }),
    label: f.text({ label: "Label", localizable: true, inline: true, group: "Content" }),
    underline: f.select(["always", "hover", "never"], {
      label: "Underline", default: "hover", group: "Style",
    }),
    color: f.color({ label: "Color", default: "#6366f1", group: "Style" }),
    weight: f.select(["400", "500", "600", "700"], {
      label: "Font Weight", default: "500", group: "Typography",
    }),
  },
})
```

A Link node wraps its children (text, icon, or image) in an anchor element.

---

## Step 3.6: Media Provider Integration

### Image node update
Modify the Image node to work with MediaProvider:
- `src` field gets a media picker control in the inspector
- Upload button triggers `media.upload(file)`
- Resolved URL passes through `media.resolve(src, transforms)`
- Responsive images: auto-generate srcSet from breakpoints

### Media browser
- Inspector shows a "Browse Media" button in image fields
- Opens a media library modal with:
  - Grid view of uploaded assets
  - Upload button
  - Search/filter by filename, type, date
  - Select returns the asset URL

### Vue Image component update
- Use `media.resolve(src, { width })` for responsive images
- Generate `srcset` for different viewport widths
- Lazy loading with `loading="lazy"`
- Blur-up placeholder or dominant color placeholder

---

## Completion Checklist

- [ ] RichText node works with inline Tiptap editing
- [ ] Video node supports YouTube, Vimeo, HTML5
- [ ] Icon node renders icons from Lucide and Iconify
- [ ] Divider node renders with style/color/thickness options
- [ ] Link node wraps children in anchor element
- [ ] MediaProvider integration resolves image URLs with transforms
- [ ] Media browser modal works for selecting images
- [ ] Responsive images with srcSet
- [ ] All new nodes have tests
- [ ] All new nodes have Vue components
