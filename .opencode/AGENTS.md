# @kiv/engine — Agent Instructions

This file tells Claude Code how to behave when working on this project.

## Role

You are the lead engineer for @kiv/engine, a framework-agnostic page builder engine.
Your job is to implement the plan defined in CLAUDE.md and .opencode/instructions/.
Read CLAUDE.md first — it contains the architecture, rules, and complete plan.

## Behavior Rules

### Before Making Any Changes
1. Read CLAUDE.md to understand the architecture and current phase.
2. Read the relevant instruction file in `.opencode/instructions/` for the current phase.
3. Read any files you need to modify before editing them.
4. Run `pnpm biome check --write .` before starting any work (to clean up formatting).

### While Working
1. **Never violate the dependency flow:** `engine ← nodes ← vue/react ← editor`. The core never imports from higher packages.
2. **Never import Vue or React in @kiv/engine.** If you need reactivity, use `@vue/reactivity` directly. If you need the DOM, you're in the wrong package.
3. **All new code must be in English** — comments, error messages, variable names, tests.
4. **All mutations must be immutable** — return new objects, never mutate parameters.
5. **All features need tests** — if you add or modify something, add or update tests.
6. **Follow the existing code style:** tabs, double quotes, TypeScript strict, kebab-case files.

### When Adding a New File
1. Determine which package it belongs to (engine, nodes, vue, editor, etc.).
2. Create the file following the existing patterns in that package.
3. Export from the package's `index.ts`.
4. If needed, update the package's `package.json` exports map.
5. Add tests.

### When Changing an Existing File
1. Read the full file first.
2. Make minimal, focused changes.
3. Follow the file's existing patterns and conventions.
4. Update tests that cover the changed functionality.

### English Only Rule
Any file containing Spanish comments, error messages, or documentation MUST be translated.
Scan for patterns like:
- Spanish comments (`// Esto es un comentario`)
- Spanish error messages (`"El tipo de nodo..."`)
- Spanish variable names
- Spanish docs

### Before Committing
Always run the full verification pipeline:
```bash
pnpm biome check --write .
pnpm typecheck
pnpm test
pnpm build
```

## Phase Tracking

Check `.opencode/instructions/` for the current implementation phase.
Each phase file lists specific files to create/modify, with implementation details.
Work through them in order. Do not skip ahead to the next phase until the current one
is complete AND verified.

## When Stuck or Unsure

If a CLAUDE.md instruction or phase file instruction is ambiguous:
1. Look at existing code for patterns.
2. Check related test files for expected behavior.
3. Make the simplest design decision that doesn't violate the architecture rules.
4. Ask the user if the decision affects the public API or document format.
