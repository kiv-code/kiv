# @kiv/engine — Product & Technical Roadmap

## Vision

A framework-agnostic page builder engine that any application can embed.
Comparable to Builder.io, GrapesJS, Craft.js, or BlocksUI — but framework-agnostic,
plugin-based, and designed for multi-tenant SaaS applications.

## Package Overview

| Package | Status | Description |
|---|---|---|
| `@kiv/engine` | ✅ Core complete, needs hardening | Types, schema, registry, resolver, theme, events, plugins, migrations |
| `@kiv/nodes` | ✅ Complete | 10 base node definitions + shared scales |
| `@kiv/vue` | ✅ Complete | Vue 3 renderer + 10 components |
| `@kiv/editor` | ⚠️ Needs decoupling | Vue 3 editor — too coupled, needs framework-agnostic core |
| `@kiv/react` | ❌ Pending | React renderer (same contract as Vue) |
| `@kiv/nodes-interactive` | ❌ Planned | Carousel, Accordion, Tabs, Modal |
| `@kiv/provider-s3` | ❌ Planned | S3 media provider |
| `@kiv/plugin-seo` | ❌ Planned | SEO meta tags, OG, structured data |
| `@kiv/plugin-a11y` | ❌ Planned | Accessibility checker |
| `@kiv/provider-cloudinary` | ❌ Stretch | Cloudinary media provider |

## Development Phases

### Phase 1: Hardening (v0.1.0)
Framework-agnostic editor core, plugin context enrichment, media/services abstractions, HTML renderer, English translation, test coverage.

**Duration:** ~2-3 weeks
**Files changed:** ~40 files, ~15 new files

### Phase 2: Editor Maturity (v0.2.0)
Clipboard, multi-select, canvas DnD, keyboard shortcuts, undo grouping, node locking, per-breakpoint visibility, resize handles, zoom/pan, tree search.

**Duration:** ~3-4 weeks
**Files changed:** ~30 files, ~10 new files

### Phase 3: Content & Media (v0.3.0)
RichText, Video, Icon, Divider, Link nodes. Media upload system, media browser, responsive images.

**Duration:** ~3-4 weeks
**Files changed:** ~25 files, ~15 new files

### Phase 4: Interactive & Plugins (v0.4.0)
Interactive nodes package, plugin hooks, mutation events, SEO plugin, a11y plugin, page templates.

**Duration:** ~4-5 weeks
**Files changed:** ~40 files, ~20 new files

### Phase 5: React & Ecosystem (v0.5.0)
React renderer, React editor, CLI tool, documentation site, Storybook, visual regression testing.

**Duration:** ~4-6 weeks
**Files changed:** ~50 files, ~30 new files

### Phase 6: Production (v1.0.0)
Collaboration (CRDT/OT), persisted undo, custom breakpoints, AI hooks, export/import formats, server-side rendering middleware.

**Duration:** ~6-8 weeks
**Files changed:** ~60 files, ~25 new files

## Total Estimated Timeline: ~22-30 weeks to v1.0.0

## How to Use This Plan

1. **Point Claude Code at this repository.** It reads `CLAUDE.md` first for the architecture
   and `.opencode/instructions/*.md` for step-by-step implementation guidance.
2. **Start with Phase 1.** Work through each step in order. Each step has specific files
   to create or modify. Do not skip verification.
3. **Run verification after each step** (`pnpm biome check --write . && pnpm typecheck && pnpm test`).
4. **Commit after each completed step** to keep changes manageable.
5. **When Phase 1 is done, move to Phase 2**, and so on.

## Current State Monorepo

```bash
/engine/
├── CLAUDE.md                     # Project guide (read by Claude Code)
├── PLAN.md                       # This file
├── .opencode/
│   ├── AGENTS.md                 # Agent behavior instructions
│   └── instructions/
│       ├── 01-phase-1-hardening.md
│       ├── 02-phase-2-editor-maturity.md
│       ├── 03-phase-3-content-media.md
│       └── 04-phase-4-interactive-plugins.md
├── packages/
│   ├── engine/          @kiv/engine        (core)
│   ├── nodes/           @kiv/nodes         (base nodes)
│   ├── vue/             @kiv/vue           (Vue renderer)
│   ├── editor/          @kiv/editor        (Vue editor)
│   ├── plugin-analytics/@kiv/plugin-analytics (example)
│   ├── nodes-interactive/@kiv/nodes-interactive (future)
│   ├── plugin-seo/      @kiv/plugin-seo    (future)
│   └── plugin-a11y/     @kiv/plugin-a11y   (future)
└── apps/demos/vue/      (demo app)
```
