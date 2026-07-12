# @kiv/engine

Headless, JSON-driven, plugin-based page builder engine.
Framework-agnostic core. Vue 3 renderer (stable). React (future).

## Architecture

Dependency flow (strict unidirectional):
```
@kiv/engine (core, NO Vue/React/DOM — only @vue/reactivity)
  ← @kiv/nodes (pure schema + defaults, NO components)
    ← @kiv/vue (Vue 3 renderer)
      ← @kiv/vue-editor (Vue 3 editor UI)
    ← @kiv/react (future, shares @kiv/nodes)
```

Rules:
1. engine NEVER imports UI frameworks. Only dependency is `@vue/reactivity`.
2. nodes are pure definitions. Each renderer provides its own components.
3. Public API is the JSON document shape (KivDocument + schemaVersion).
4. Styling via theme tokens (`tokenRef()`) or shared scales (`SPACING["lg"]`). No raw CSS in node props.
5. `Responsive<T>` and `Localizable<T>` are separate axes. Resolver chains: responsive → locale.
6. Adding nodes/integrations NEVER requires touching @kiv/engine.

## Conventions

- TypeScript strict + `noUncheckedIndexedAccess` + `verbatimModuleSyntax`
- Zod 4 — use `ZodType`, NOT `ZodTypeAny`
- Biome — tabs, double quotes. No ESLint/Prettier.
- Vitest for tests
- English ONLY (code, comments, errors, docs, commits)
- No comments unless non-obvious logic
- kebab-case files, PascalCase types/components
- Error messages prefixed `[kiv]` or `[kiv/<package>]`
- Immutable mutations — return new objects, never mutate inputs
- Closed exports maps — no deep imports (`@kiv/engine/src/...`)

## Monorepo

```
packages/
├── engine/            @kiv/engine     — Core headless engine
├── nodes/             @kiv/nodes      — Pure node definitions (schema + defaults)
├── vue/               @kiv/vue        — Vue 3 renderer + components
├── vue-editor/        @kiv/vue-editor — Vue 3 editor UI (canvas, tree, inspector, DnD)
├── react/             (future)        — React renderer
└── plugin-analytics/  @kiv/plugin-analytics — Example plugin
```

Shared node helpers (`packages/nodes/src/`): `typography-field.ts`, `hover-field.ts`, `border-field.ts`, `spacing-fields.ts`, `align-field.ts`, `gap-field.ts`, `size-field.ts`, `hover-effects.ts`, `spacing-field.ts`.

## Verification

```bash
pnpm biome check --write . && pnpm typecheck && pnpm test
```

Run before every commit. All must pass with zero errors.
