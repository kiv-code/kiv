# Instalación

## Estado actual: paquetes no publicados

Los paquetes de Kiv (`@kivcode/engine`, `@kivcode/nodes`, `@kivcode/nodes-interactive`,
`@kivcode/vue`, `@kivcode/vue-editor`, `@kivcode/plugin-seo`, `@kivcode/plugin-a11y`) están todos
en versión `0.0.0` y **aún no se publican a npm**. Hasta que eso ocurra, hay dos
formas de consumir Kiv desde otro proyecto.

### Opción A — Workspace de pnpm (recomendado durante desarrollo activo de Kiv)

Si tu proyecto y Kiv viven en máquinas/checkouts distintos pero quieres iterar en
ambos a la vez:

```yaml
# pnpm-workspace.yaml de tu proyecto (o el de Kiv, si integras Kiv como submódulo)
packages:
  - "."
  - "../kiv/packages/*"
```

```json
// package.json de tu proyecto
{
  "dependencies": {
    "@kivcode/engine": "workspace:*",
    "@kivcode/nodes": "workspace:*",
    "@kivcode/vue": "workspace:*",
    "@kivcode/vue-editor": "workspace:*"
  }
}
```

Cada paquete de Kiv debe estar **construido** (`pnpm build` en el repo de Kiv)
antes de que tu proyecto pueda importarlo — los `exports` de cada `package.json`
apuntan a `dist/`, no a `src/`:

```bash
cd /path/to/kiv && pnpm build
cd /path/to/tu-proyecto && pnpm install
```

Si editas algo dentro de Kiv, tienes que volver a correr `pnpm build` en el
paquete tocado (o `pnpm --filter @kivcode/nodes build`) para que el cambio se vea del
otro lado — no hay watch-mode automático entre repos hoy.

### Opción B — Dependencia `file:`/`link:` sin workspace compartido

Si no quieres modificar la configuración de workspace de tu proyecto:

```json
{
  "dependencies": {
    "@kivcode/engine": "file:../kiv/packages/engine",
    "@kivcode/nodes": "file:../kiv/packages/nodes",
    "@kivcode/vue": "file:../kiv/packages/vue",
    "@kivcode/vue-editor": "file:../kiv/packages/vue-editor"
  }
}
```

Mismo requisito: cada paquete debe estar construido (`dist/` presente) antes de
instalar.

### Opción C — Futuro: paquete publicado a npm

Cuando Kiv se publique, la instalación será la estándar:

```bash
npm install @kivcode/engine @kivcode/nodes @kivcode/vue @kivcode/vue-editor
```

Este documento se actualizará con el registro exacto (npm público vs. registro
privado de la organización) cuando eso ocurra.

## Requisitos

- **Vue 3.5+** (peer dependency de `@kivcode/vue` y `@kivcode/vue-editor`).
- **Node 18+** / cualquier bundler moderno (Vite, Rollup) — los paquetes se
  publican solo como ESM (`"type": "module"`, `dist/index.mjs`).
- TypeScript recomendado pero no obligatorio — cada paquete trae sus `.d.ts`.

`@kivcode/engine` en sí **no depende de Vue** — su única dependencia es
`@vue/reactivity` (para el sistema reactivo interno del document model). Si solo
necesitas el motor headless (por ejemplo, para generar HTML server-side sin
editor visual), puedes instalar únicamente `@kivcode/engine` + `@kivcode/nodes`.

## Instalación mínima según tu caso de uso

| Quiero... | Instala |
|---|---|
| Solo renderizar documentos Kiv a HTML estático (SSR/email/export) | `@kivcode/engine`, `@kivcode/nodes` |
| Renderizar documentos Kiv como Vue en mi app (sin editor) | + `@kivcode/vue` |
| Dar a mis usuarios un editor visual completo | + `@kivcode/vue-editor` |
| Nodos interactivos (Accordion/Tabs/Modal/Carousel) | + `@kivcode/nodes-interactive` |
| SEO / accesibilidad automatizada | + `@kivcode/plugin-seo` y/o `@kivcode/plugin-a11y` |

## Verificación rápida

```ts
import { createEngine } from "@kivcode/engine";
import { ALL_NODES } from "@kivcode/nodes";

const engine = createEngine();
engine.registry.registerMany([...ALL_NODES]);

console.log(engine.registry.get("heading")); // debería imprimir el CompiledNode
```

Si esto corre sin errores, la instalación es correcta. Para levantar el editor
visual completo, ver [Editor](./editor.md).

## Integrando en un proyecto ya existente (con contenido propio)

Si tu proyecto ya tiene un sistema de páginas/contenido y quieres que Kiv conviva
con él sin migrar datos de forma destructiva, no empieces por aquí — ve directo a
[Migración](./migration.md), que cubre el patrón de adaptadores recomendado antes
de instalar nada.
