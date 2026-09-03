# API pública

Este documento es una referencia (no narrativa): lista, por paquete, exactamente
qué exporta cada `index.ts` público. Esa es la regla de "estable" vs. "interno"
en este proyecto (ver `CLAUDE.md`: "Closed exports maps — no deep imports"):

> **Todo lo exportado desde el `index.ts` de un paquete es API pública** — un
> cambio ahí es un breaking change real. **Cualquier import profundo**
> (`@kivcode/engine/src/...`, `@kivcode/vue/src/...`) **nunca está soportado**,
> aunque técnicamente funcione hoy — puede romperse sin aviso en cualquier
> versión menor.

Cada símbolo enlaza, cuando aplica, a la sección narrativa correspondiente.

## `@kivcode/engine`

| Símbolo | Tipo | Qué hace |
| --- | --- | --- |
| `KivDocument`, `KivNode`, `SeoMeta`, `I18nConfig` | tipo | [Document model](./engine.md#el-document-model) |
| `Responsive`, `ResponsiveObject`, `Localizable`, `LocalizedObject`, `Locale`, `Breakpoint` | tipo | [Resolución responsive/locale](./engine.md#resolución-responsivet--localizablet) |
| `defineNode`, `f`, `FieldDescriptor`, `FieldMap`, `FieldControl`, `CompiledNode`, `NodeDefinition`, `InferProps`, `ToHtml`, `ToHtmlContext` | función/tipo | [`defineNode()` y `f.*`](./engine.md#definenode-y-compilednode) |
| `createRegistry`, `Registry` | clase/función | [Registry](./engine.md#registry) |
| `createEngine`, `CreateEngineOptions`, `KivEngine` | función/tipo | [`createEngine()`](./engine.md#createengine) |
| `renderToHtml`, `RenderOptions`, `RenderContext` | función/tipo | [`renderToHtml()`](./engine.md#rendertohtml) |
| `resolveNode`, `resolveProps`, `resolveResponsive`, `resolveLocalized`, `isResponsive`, `isLocalized`, `ResolveContext` | función/tipo | Motor de resolución interno, usado por `renderToHtml`/los renderers |
| `createEventBus`, `EventBus`, `EventHandler`, `WildcardHandler`, `ErrorHandler`, `KivEventMap` | función/tipo | [Eventos](./events.md) |
| `KivPlugin`, `PluginContext`, `EditorExtensionPoints`, `ToolbarButton`, `PaletteItem`, `InspectorTab`, `ShortcutDef`, `ComponentDef` | tipo | [Plugins](./plugins.md) |
| `EditorEngine`, `EditorEngineOptions`, `HistoryManager`, `HistoryMeta`, `HistoryOptions`, `SelectionState`, `SelectionListener` | clase/tipo | Motor de edición framework-agnóstico (usado internamente por `@kivcode/vue-editor`/`@kivcode/react-editor`) |
| `addNode`, `AddNodeInput`, `removeNode`, `moveNode`, `MoveNodeInput`, `duplicateNode`, `renameNode`, `updateNodeProps`, `setNodeFlags`, `updateSeoMeta`, `findNode`, `nodeIdExists`, `cloneDocument`, `DocumentMutations`, `NodeLocation` | función/tipo | Operaciones de mutación de documento inmutables — cada una devuelve un documento nuevo |
| `cloneNodeTree`, `serializeNode`, `deserializeNode` | función | Clonado con nuevos ids / copiar-pegar (usado al insertar templates de bloque) |
| `CURRENT_SCHEMA_VERSION`, `Migration`, `migrateDocument`, `migrations` | función/tipo | [Migraciones de schema](./engine.md#migraciones-de-schema) |
| `BUILT_IN_TEMPLATES`, `PageTemplate` | const/tipo | [Sistema de Templates](./templates.md) |
| `defaultTheme`, `resolveTheme`, `themeToCssVars`, `tokenRef`, `ThemeTokens`, `ThemeOverride` | función/tipo | Resolución de tema y tokens CSS |
| `MediaProvider`, `MediaAsset`, `MediaListQuery`, `UploadOptions`, `ImageTransform` | tipo | [`MediaProvider`](./engine.md#mediaprovider) |
| `FontProvider`, `KivFont`, `DEFAULT_FONT_WEIGHTS`, `SYSTEM_FONTS`, `systemFontProvider`, `resolveFontStack`, `fontWeights` | función/tipo | [`FontProvider`](./engine.md#fontprovider) |
| `ServicesContainer`, `ApiClient`, `AuthProvider`, `AuthUser`, `RouterProvider`, `StorageProvider` | tipo | Contenedor de servicios opcionales inyectados por la app anfitriona |
| `buildLocaleFallbackChain`, `validateI18nConfig` | función | Utilidades de `I18nConfig` |

## `@kivcode/nodes`

`ALL_NODES` — array con las 28 definiciones de nodo base, pensado para
`registry.registerMany(ALL_NODES)`:

`pageNode`, `sectionNode`, `containerNode`, `stackNode`, `gridNode`,
`columnNode`, `spacerNode`, `headingNode`, `richTextNode`, `textNode`,
`buttonNode`, `linkNode`, `imageNode`, `videoNode`, `iconNode`, `dividerNode`,
`formNode`, `formFieldNode`, `testimonialNode`, `cardNode`, `countdownNode`,
`statNode`, `socialIconsNode`, `embedNode`, `tableNode`, `agendaNode`,
`agendaItemNode`, `pricingNode`.

Cada uno se exporta también de forma individual (no solo dentro de
`ALL_NODES`), por si un consumidor quiere registrar un subconjunto.

Helpers de campo compartidos — API segura de usar directamente desde fuera al
escribir un nodo propio (ver [Crear un Node](./creating-a-node.md) para el
detalle de cada uno): todo lo exportado desde `align-field.ts`,
`border-field.ts`, `color-gradient.ts`, `gap-field.ts`, `hover-effects.ts`,
`hover-field.ts`, `link-field.ts`, `scales.ts`, `size-field.ts`,
`spacing-field.ts` (re-exportados con `export *` desde el `index.ts` del
paquete), más `typographyFields`/`resolveTypographyStyle` desde
`typography-field.ts`.

Constantes de escala (`SPACING`, `GAP`, `RADIUS`, `SHADOW` y similares, en
`scales.ts`) son seguras de usar directamente desde un nodo propio o desde
código de aplicación que necesite alinear un valor con la escala de Kiv — a
diferencia de utilidades como `parsePricingData`/`parseTableData`/
`parseSocialLinks`, que son detalle de implementación de un nodo específico
(`pricing`, `table`, `social-icons`) y solo están expuestas porque `toHtml` y
el componente Vue del mismo nodo las comparten, no como una API de propósito
general.

Utilidades HTML (`html-utils.ts`) e íconos (`icons.ts`) también se exportan;
tratarlas como detalle de soporte de `toHtml()`, no como una API que un
consumidor deba aprender.

## `@kivcode/nodes-interactive`

`ALL_INTERACTIVE_NODES` — los 6 nodos con estado propio, separados de
`@kivcode/nodes` porque llevan interacción en tiempo de ejecución:
`accordionNode`, `accordionItemNode`, `tabsNode`, `tabPanelNode`, `modalNode`,
`carouselNode` (cada uno también exportado individualmente).

`CONTENT_TEMPLATES` (+ el tipo `ContentTemplate`) — el catálogo de 20 templates
de bloque de contenido, ver [Sistema de Templates](./templates.md). Cada
función de template individual (`heroTemplate`, `pricingTemplate`,
`faqTemplate`, etc.) también se exporta por separado desde
`templates/index.ts`, por si un consumidor quiere insertar uno programáticamente
sin pasar por `KivBlockLibrary`.

## `@kivcode/vue`

| Símbolo | Qué es |
| --- | --- |
| `KivRenderer` | Componente raíz: recorre un `KivDocument` completo y monta el árbol |
| `KivNodeRenderer` | Monta un único `KivNode` (usado internamente por `KivRenderer`, y por un consumidor que quiera renderizar un subárbol suelto) |
| `createDefaultVueRegistry` | `VueRegistry` con los 28 nodos de `@kivcode/nodes` ya mapeados a sus componentes — el punto de partida normal |
| `createVueRegistry`, `VueRegistry` | Constructor de un registro Vue vacío/custom, para quien registra sus propios componentes por tipo |
| `AccordionItemNode`, `AccordionNode`, `AgendaItemNode`, `AgendaNode`, `ButtonNode`, `CardNode`, `CarouselNode`, `ColumnNode`, `ContainerNode`, `CountdownNode`, `DividerNode`, `EmbedNode`, `FormFieldNode`, `FormNode`, `GridNode`, `HeadingNode`, `IconNode`, `ImageNode`, `LinkNode`, `ModalNode`, `PageNode`, `PricingNode`, `RichTextNode`, `SectionNode`, `SocialIconsNode`, `SpacerNode`, `StackNode`, `StatNode`, `TableNode`, `TabPanelNode`, `TabsNode`, `TestimonialNode`, `TextNode`, `VideoNode` | Componente Vue individual por tipo de nodo (incluye los interactivos: accordion/tabs/modal/carousel, que no tienen equivalente en `@kivcode/nodes` porque llevan estado propio) |
| `KIV_BUS_KEY`, `KIV_CONTEXT_KEY`, `KIV_EDITOR_MODE_KEY`, `KIV_FONTS_KEY`, `KIV_MEDIA_KEY`, `KIV_SERVICES_KEY` | `InjectionKey`s de Vue | `KIV_EDITOR_MODE_KEY` es `boolean` (no `boolean | null`) — el valor por default fuera de un `KivRenderer`/`KivEditor` es `false` (modo real, no editor). El resto (`KIV_BUS_KEY`, `KIV_MEDIA_KEY`, `KIV_FONTS_KEY`, `KIV_SERVICES_KEY`) son `T | null` — `null` cuando se monta un nodo suelto sin el árbol de provide completo, así que cualquier componente que los inyecte debe manejar el caso `null` explícitamente. |
| `useKivNode` | Composable interno de acceso al contexto de nodo (locale/breakpoint/modo editor resueltos) |

## `@kivcode/vue-editor`

| Símbolo | Qué es |
| --- | --- |
| `KivEditor` | Componente de entrada — ver [Editor](./editor.md) |
| `KivCanvas`, `KivInspector`, `KivTree` | Componentes internos exportados por si un consumidor arma su propio layout en vez de usar `KivEditor` tal cual |
| `useEditorStore`, `EditorStore` | API completa del store — ver [Editor](./editor.md#useeditorstore--editorstore) |
| `EditorExtensions` | Clase que implementa `EditorExtensionPoints` — ver [Editor](./editor.md#editorextensions) y [Crear un control de Inspector](./creating-an-inspector-control.md) |
| `addNode`, `cloneDocument`, `findNode`, `moveNode`, `NodeLocation`, `removeNode`, `updateNodeProps` | Re-exportados directamente de `@kivcode/engine` por conveniencia — mismo símbolo, no una copia |

## `@kivcode/react` / `@kivcode/react-editor`

Renderer y editor UI para React 19, más recientes que sus equivalentes Vue.
Reflejan el mismo diseño de contratos (contexts de React en vez de
`InjectionKey`s de Vue, componentes función en vez de `.vue`):

- `@kivcode/react`: `KivRenderer`, `KivNodeRenderer`, `createDefaultReactRegistry`,
  `createReactRegistry`/`ReactRegistry`, los mismos 34 componentes de nodo que
  `@kivcode/vue` (mismos nombres), y los contexts `KivContext`, `KivBusContext`,
  `KivEditorModeContext`, `KivFontsContext`, `KivMediaContext`,
  `KivServicesContext`, `KivLinkContext` (+ `KivLinkComponentProps`, para que
  un consumidor con router propio — Next.js, React Router — le pase su propio
  componente de link).
- `@kivcode/react-editor`: `KivEditor`, `KivCanvas`, `KivInspector`, `KivTree`,
  `KivBlockLibrary`, `KivMediaBrowser`, `KivNodePalette`, `KivTemplateBrowser`,
  `EditorExtensions`, `useEditorStore`/`EditorStore`, y los contexts
  `EditorStoreContext`, `EditorExtensionsContext`, `KivTreeFilterContext`,
  `KivTreeFocusSearchContext`. Igual que en `@kivcode/vue-editor`, re-exporta
  `addNode`/`cloneDocument`/`findNode`/`moveNode`/`removeNode`/
  `updateNodeProps` de `@kivcode/engine`.

## `@kivcode/plugin-seo`

`seoPlugin(options?: SeoPluginOptions)` — el plugin en sí (ver
[Plugins](./plugins.md)). También exporta sus utilidades de generación de
metadata por si un consumidor las necesita fuera del plugin (por ejemplo, en
una ruta de servidor que genera metatags sin montar el editor):
`generateMetaTags`, `applyMetaTagsToHead`, `resolveCanonicalUrl`,
`generateStructuredData`, `buildSitemapEntry`, `metaTagsToHtml`, y los tipos
`MetaTag`, `SitemapEntry`, `SeoContext`. `SeoInspectorTab` (el componente Vue
de la pestaña) también se exporta, por si un consumidor quiere montarlo fuera
del flujo normal del plugin.

## `@kivcode/plugin-a11y`

`a11yPlugin()` — el plugin en sí. Expone también su motor de chequeo de forma
independiente del plugin: `checkDocument`, `walkDocument`, `A11yIssue`,
`A11ySeverity` (útil para correr el chequeo en CI/build sin montar el editor),
y las utilidades de contraste de color que usa internamente: `contrastRatio`,
`relativeLuminance`, `compositeOver`, `parseColor`, `isLargeText`,
`minimumContrastRatio`, `Rgb`. `A11yPanel` (el componente Vue) también se
exporta.

## Ver también

- [Arquitectura](./architecture.md) — por qué la superficie está dividida así entre paquetes.
- [Engine](./engine.md), [Editor](./editor.md), [Plugins](./plugins.md) — la versión narrativa de esta misma superficie.
