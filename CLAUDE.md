# @kiv/engine — Visual Experience Engine

## Qué es
Motor visual **headless, JSON-driven, plugin-based** para construir experiencias
visuales modernas. NO es solo un page builder ni un CMS: es el núcleo reutilizable
sobre el que se construyen múltiples productos SIN modificar el core.

Productos que deben poder construirse sobre el mismo motor:
Landing Builder, CMS Visual, Event Builder, Form Builder, Email Builder,
Documentation/Knowledge Base Builder, Marketing Builder, Customer Portal Builder.

Monorepo pnpm + Turborepo. Marca: Kivcode. Licencia MIT. Open Source desde el día 1.

## Finalidad y filosofía (la estrella polar)
El motor es agnóstico de framework y de backend. El renderer se implementa por
framework (Vue primero, React después); el core solo produce/resuelve JSON.

Debe ser: Headless · JSON-Driven · Plugin-Based · Type-Safe · Extensible ·
Responsive-First · Localization-First · Event-Driven · Framework-Friendly.

Compatibilidad objetivo (SIN depender de ninguno): Vue 3, Vite, Nuxt, Inertia, Laravel.
Los renderers React/otros consumen el mismo core y los mismos @kiv/nodes.

El core NUNCA conoce: bases de datos, APIs, Laravel, Inertia, auth, roles,
permisos, tenants, ni modelo de negocio. Persistencia y backend son SIEMPRE
responsabilidad de la app consumidora.
Responsabilidades del core: crear/editar/renderizar/generar JSON, resolver ejes
(responsive + locale), gestionar eventos, temas y migraciones.

DX es un requisito de primera clase: la API debe sentirse tan cuidada como
Vue/Nuxt/Vite/Tailwind — intuitiva, consistente, curva de aprendizaje baja.

## Reglas de arquitectura (no violar)
- `@kiv/engine` es el core headless. Su ÚNICA dependencia de Vue es `@vue/reactivity`.
  Nunca importar componentes de Vue ni tocar el DOM aquí. Si necesitas runtime de
  Vue o el DOM dentro de engine, PARA: algo está en el paquete equivocado.
- Fronteras: engine ← nodes ← {vue | react} ← editor. La dependencia SIEMPRE va
  hacia el core; el core no conoce a nadie aguas arriba.
- Multi-framework: los nodos (@kiv/nodes) son definiciones PURAS (schema + defaults,
  sin componente). Cada renderer (@kiv/vue, @kiv/react) registra sus propios
  componentes contra esos tipos. Añadir un renderer nuevo NO toca engine ni nodes.
- El contrato público estable es el JSON del documento (schemaVersion), no la API de TS.
- `exports` map cerrado: nada de deep imports.
- Estilos token-constrained: los nodos referencian tokens del theme vía tokenRef()
  (`var(--kiv-*)`), no valores crudos salvo escape hatch explícito.
- Responsive y localización son ejes SEPARADOS, no una matriz.
- Event-Driven: el core expone emit/on; NO implementa analytics, heatmaps ni A/B.
  Eso vive en plugins. Emitir un evento nuevo no debe requerir cambiar el bus.
- Plugin-Based: extensiones vía `engine.use(plugin)`. Un nodo interactivo o una
  integración debe poder añadirse SIN tocar @kiv/engine. Ese es el examen de la arquitectura.
- "Solo lo necesario": el MVP no adelanta features que ningún consumidor use aún.
  La visión es la estrella polar (destino), NO el backlog inmediato. Se llega por
  iteraciones; la arquitectura debe permitir crecer sin romper el JSON.
## Catálogo de nodos

### MVP — @kiv/nodes (Fase 2): 10 nodos ESTÁTICOS
Layout (contenedores, slot `default`):
- Page (raíz, lang activo), Section (RICA — ver abajo),
  Container (max-width centrado), Grid (slot solo acepta Column),
  Column (acepta cualquier nodo), Stack (flex vertical/horizontal)
Contenido (hojas, sin hijos):
- Heading (prop level 1-6), Text, Button
Media (hoja):
- Image (src, alt, fit cover/contain)

**Section RICA (decisión: estilo Framer/Webflow desde el MVP).**
Section debe soportar, todo token-constrained y responsive donde aplique:
background color · background image · background video · overlay · gradient ·
blur · opacity · border · border radius · shadow · padding · margin.
Objetivo: construir páginas modernas sin escribir CSS libre. Es el único nodo
del MVP que rompe deliberadamente el minimalismo, porque es el diferenciador visual.
Nota: background video NO convierte a Section en interactivo (no tiene estado ni
emite eventos); es media de fondo declarativa.

**Button — navegación (3 modos, el renderer elige el mecanismo):**
- `href` (`#price`, `https://…`, `/about`), `target` (`_self` | `_blank`),
  `linkType`: `anchor` (scroll a sección) | `external` (`<a>` normal) |
  `internal` (SPA sin recarga → RouterLink en Vue, Link en React, fallback `<a>`).
El engine guarda la INTENCIÓN de navegación; cada renderer resuelve el mecanismo.

Orden de construcción: contenedores simples primero
(Page → Section → Container → Stack), luego hojas
(Heading → Text → Button → Image), Grid/Column al final (slots más elaborados).

### FUERA del MVP (v1+) — NO implementar en Fase 2
- Contenido avanzado: RichText, Link (como nodo), Divider
- Media avanzada: Video (nodo autónomo), SVG, Icon, Embed.
  OJO: background image/video de Section SÍ está en el MVP; el nodo Video
  autónomo (reproductor con controles) NO — ese es interactivo.
- Interactivos: Modal, Accordion, Tabs, Carousel, Slider, Gallery,
  FAQ, Timeline, Countdown, Lightbox
- Row: NO existe. Un Stack horizontal ya es una fila. No duplicar.

### Regla: estáticos vs interactivos
Los nodos base son estáticos: JSON → render, sin estado en runtime.
Los interactivos tienen estado + comportamiento + emiten eventos (modal.opened,
slide.changed, etc.) + usan slots múltiples (un slot por tab/panel).
Arquitectónicamente SIGUEN siendo nodos (mismo defineNode, registry, resolver).
Llegan DESPUÉS del MVP y varios como packs/plugins opcionales
(@kiv/nodes-interactive, @kiv/plugin-*), NUNCA dentro del core ni del pack base.
Poder añadir un interactivo sin tocar @kiv/engine es el examen de la arquitectura.

## Stack
- TypeScript strict + noUncheckedIndexedAccess
- Zod 4 (usar `ZodType`, no `ZodTypeAny` deprecado)
- Biome (tabs, comillas dobles) — NO ESLint/Prettier
- Vitest
- unbuild (engine), Vite library mode (vue/nodes/editor)

## Verificación (correr siempre antes de dar algo por hecho)
pnpm biome check --write . && pnpm typecheck && pnpm test

## Monorepo (paquetes objetivo)
- @kiv/engine — core headless (tipos, schema, registry, resolver, theme, i18n,
  migrations, event bus, plugin system, createEngine). ÚNICA dep Vue: @vue/reactivity.
- @kiv/nodes — definiciones puras de los nodos base (schema + defaults, sin UI).
- @kiv/vue — renderer Vue (<KivRenderer>) + componentes de los nodos.
- @kiv/react — renderer React (mismo contrato, mismos @kiv/nodes). Post-Vue.
- @kiv/editor — builder visual (canvas, inspector auto-generado, tree, DnD, preview).
- @kiv/nodes-interactive, @kiv/plugin-* — packs opcionales, NUNCA en el core ni base.

## Estado actual
Core @kiv/engine — COMPLETO (todos los pilares implementados + tests):
- 1.1 Tipos base: KivNode, KivDocument, Responsive<T>, Localizable<T>, Breakpoint
- 1.2 Field descriptor sobre Zod: defineNode, f.*, InferProps
- 1.3 Registry de nodos
- 1.4 Resolver (ejes responsive + locale, mobile-first)
- 1.5 Theme engine (tokens → CSS variables, --kiv-*)
- 1.6 Event Bus tipado: createEventBus, emit/on/once/off/clear, wildcard por
  namespace (`node.*`) y global (`*`). En src/events/. (SÍ existe — 13 tests.)
- 1.7 i18n config: validateI18nConfig + buildLocaleFallbackChain (src/i18n/)
- 1.8 Migraciones scaffold: migrateDocument + CURRENT_SCHEMA_VERSION (src/migrations/)
- 1.9 Plugin System: KivPlugin { name, install(ctx) }, engine.use(plugin),
  PluginContext da acceso a bus/registry/theme/i18n. En src/plugin/.
- 1.10 createEngine({ theme, i18n, plugins, nodes }) → KivEngine
  { bus, registry, theme, i18n, use, css, resolve }. En src/engine/.

Fases 2–4 — COMPLETADAS:
- @kiv/nodes: 10 nodos base + escalas de estilo compartidas (src/scales.ts,
  fuente única para todos los renderers — ver Reglas de arquitectura).
- @kiv/vue: <KivRenderer> + los 10 componentes de nodo, consumen las escalas.
- @kiv/editor: canvas, inspector, tree con DnD, paleta, i18n en vivo,
  light/dark, ID editable. Demo multi-locale (en/es/fr) en apps/demos/vue.

Pendiente:
- @kiv/react: segundo renderer (mismo contrato, mismas escalas de @kiv/nodes).
  Es la prueba real del diseño multi-framework.
- Persistencia end-to-end de ejemplo (guardar/cargar JSON, probar migrateDocument).
- Packs interactivos (@kiv/nodes-interactive), plugins (analytics/forms/…), docs site.