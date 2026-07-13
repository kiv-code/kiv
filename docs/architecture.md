# Arquitectura

## Flujo de dependencias (estricto, unidireccional)

```
@kivcode/engine (core, SIN Vue/React — solo @vue/reactivity)
  ← @kivcode/nodes (schema + defaults puros, SIN componentes)
    ← @kivcode/vue (renderer Vue 3)
      ← @kivcode/vue-editor (editor UI: canvas, tree, inspector, DnD)
    ← @kivcode/react (futuro, comparte @kivcode/nodes)
```

Reglas invariantes (no se rompen nunca, en ninguna integración):

1. **`@kivcode/engine` nunca importa un framework de UI.** Es el único paquete cuya
   única dependencia real es `@vue/reactivity` — y eso es una elección interna de
   implementación (reactividad), no una dependencia de renderizado.
2. **Los nodos (`@kivcode/nodes`) son definiciones puras.** Un nodo es *schema +
   defaults + (opcionalmente) `toHtml`* — nunca un componente. Cada renderer
   (`@kivcode/vue`, a futuro `@kivcode/react`) provee sus propios componentes para los
   mismos tipos de nodo.
3. **La API pública es la forma del documento JSON** (`KivDocument` +
   `schemaVersion`), no una API de clases que el consumidor deba conocer en
   detalle. Cualquier proyecto que integre Kiv debería poder razonar sobre "qué es
   un documento Kiv" leyendo el JSON, no leyendo el código fuente del engine.
4. **Estilos vía tokens de tema** (`tokenRef()`) o escalas compartidas
   (`SPACING["lg"]`), nunca CSS crudo hardcodeado dentro de un nodo. Esto es lo que
   permite que un consumidor con su propio sistema de diseño (ver
   [Migración](./migration.md)) intercepte el tema sin tener que sobreescribir CSS
   nodo por nodo.
5. **`Responsive<T>` y `Localizable<T>` son ejes independientes.** La cadena de
   resolución es siempre responsive → locale, nunca al revés, y nunca mezclados en
   un único wrapper.
6. **Agregar nodos o integraciones nuevas nunca requiere tocar `@kivcode/engine`.**
   Si te encuentras necesitando modificar el engine para agregar un nodo, una
   plantilla o una integración, es una señal de que el punto de extensión correcto
   todavía no existe — hay que diseñarlo como tal, no saltárselo.

## Los paquetes, uno por uno

### `@kivcode/engine` — el núcleo headless

Contiene:
- **Document model** (`KivDocument`, `KivNode`) — un árbol recursivo de nodos con
  slots nombrados, cada uno con `id`, `type`, `props`, `slots?`.
- **Registry** (`createRegistry()`, `Registry`) — mapa `type → CompiledNode`,
  donde `CompiledNode` es el resultado de `defineNode()` (schema Zod compilado +
  defaults derivados + metadata de editor: `label`, `icon`, `description`,
  `category`, `slotConstraints`).
- **Schema/fields** (`f.*` helpers, `FieldDescriptor`) — el vocabulario para
  declarar los campos editables de un nodo (texto, número, color, select,
  responsive, localizable, con `pluginControl` para UI custom).
- **Editor core** (`EditorEngine`, `SelectionState`, `HistoryManager`) —
  document + selección + historial, framework-agnóstico, emite eventos por un
  `EventBus` (ver [Eventos](./events.md)).
- **Templates** (`BUILT_IN_TEMPLATES`, `PageTemplate`) — documentos completos
  predefinidos (página en blanco, landing, about, etc.).
- **Render** (`renderToHtml()`) — recorre un `KivDocument` y produce HTML estático
  llamando al `toHtml()` de cada nodo, sin necesidad de Vue/DOM — útil para
  SSR/export/email.
- **Media/Services** (`MediaProvider`, `ServicesContainer`) — interfaces
  pluggables para que un consumidor conecte su propio backend de archivos/API sin
  que el engine sepa nada de S3, Laravel, etc.
- **Plugin system** (`createEngine({ plugins })`) — ver [Plugins](./plugins.md).

### `@kivcode/nodes` — el catálogo de contenido

~28 definiciones de nodo (layout: `page`/`section`/`container`/`grid`/`column`/
`stack`/`spacer`; contenido: `heading`/`text`/`rich-text`/`button`/`link`/
`image`/`video`/`icon`/`divider`/`card`/`form`/`form-field`/`testimonial`/
`countdown`/`stat`/`social-icons`/`embed`/`table`/`agenda`/`agenda-item`/
`pricing`). Cada uno es puro — schema + `toHtml` + (para el renderer Vue) nada
más; el componente visual vive en `@kivcode/vue`, no aquí.

Helpers de campo compartidos (única fuente de verdad para lo que se repite entre
nodos): `typography-field.ts`, `hover-field.ts`, `border-field.ts`,
`spacing-fields.ts`/`spacing-field.ts`, `align-field.ts`, `gap-field.ts`,
`size-field.ts`, `color-gradient.ts`. Si dos nodos necesitan el mismo concepto de
campo (padding, borde, tipografía…), la respuesta correcta es un helper aquí, no
duplicar el `FieldDescriptor` en cada nodo.

### `@kivcode/nodes-interactive` — nodos con estado propio

`accordion`/`accordion-item`, `tabs`/`tab-panel`, `modal`, `carousel` — separados
de `@kivcode/nodes` porque requieren estado de interacción en tiempo de ejecución
(abierto/cerrado, tab activo, slide actual), a diferencia de los nodos de
`@kivcode/nodes` que son mayormente presentacionales. También trae un sistema de
**templates de bloque de contenido** (Hero, Pricing, FAQ, etc. — 20 en total,
compuestos enteramente con nodos de `@kivcode/nodes`, sin lógica duplicada) — ver
[Sistema de Templates](./templates.md).

### `@kivcode/vue` — el renderer

Componentes Vue 3 por cada tipo de nodo (`HeadingNode.vue`, `ButtonNode.vue`,
etc.), más `KivRenderer.vue`/`KivNodeRenderer.vue` (recorren un `KivDocument` y
montan el árbol de componentes), `defaultRegistry.ts` (registro con todos los
nodos de `@kivcode/nodes` ya registrados, listo para usar), y el sistema de
inyecciones (`KIV_EDITOR_MODE_KEY`, `KIV_BUS_KEY`, `KIV_MEDIA_KEY`,
`KIV_SERVICES_KEY`) que cada nodo usa para saber si está en modo editor
(interacciones deshabilitadas) vs. modo real.

### `@kivcode/vue-editor` — la UI del editor

`KivEditor.vue` es el punto de entrada — orquesta:
- **Store** (`useEditorStore`) — wrapper Vue reactivo sobre `EditorEngine`,
  expuesto vía `provide`/`inject` (`EDITOR_STORE_KEY`).
- **Canvas** (`KivCanvas.vue`) — renderiza el documento en vivo, maneja
  selección, overlays de nodo, resize handles, zoom.
- **Tree** (`KivTree.vue`/`KivTreeNode.vue`) — árbol de estructura, DnD de
  reordenamiento, búsqueda/filtro.
- **Inspector** (`KivInspector.vue` + `FieldControl.vue`) — **un único inspector
  genérico** para todos los tipos de nodo, que renderiza un control por cada
  `FieldDescriptor` según su `control`/`pluginControl`. No existen (ni deben
  existir) inspectores dedicados por tipo de nodo — si sientes la tentación de
  crear uno, la respuesta correcta casi siempre es un nuevo control de campo (ver
  [Crear un control de Inspector](./creating-an-inspector-control.md)), no un
  segundo sistema de edición.
- **Paleta** (`KivNodePalette.vue`) — inserta un nodo suelto por tipo.
- **Biblioteca de bloques** (`KivBlockLibrary.vue`) — inserta un template de
  bloque de contenido completo (subárbol multi-nodo) junto a la selección actual.
- **Extensions** (`EditorExtensions`) — el mecanismo para que un plugin registre
  controles de campo custom, botones de toolbar, paneles, sin tocar el core del
  editor.

## Por qué esta separación importa para integrarlo en otro proyecto

Cuando integras Kiv en un proyecto con contenido ya existente (ver
[Migración](./migration.md)), esta arquitectura es lo que hace posible una
migración no-destructiva: el "documento Kiv" (`KivDocument`) es solo una forma de
JSON con una superficie pública clara, así que un adaptador puede traducir de/hacia
el formato de contenido que tu proyecto ya tenga, sin que ni el engine ni los
nodos necesiten saber que ese adaptador existe.
