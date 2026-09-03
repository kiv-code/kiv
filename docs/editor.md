# Editor

`@kivcode/vue-editor` es la UI de edición sobre Vue 3: toolbar, canvas,
árbol de estructura, inspector, paleta de nodos y biblioteca de bloques,
montados alrededor de un único componente de entrada, `<KivEditor>`.

## Montar `<KivEditor>`

Props mínimas:

```vue
<script setup lang="ts">
import { KivEditor } from "@kivcode/vue-editor";
import { vueRegistry } from "@kivcode/vue";
import { registry } from "@kivcode/nodes";
import type { KivDocument } from "@kivcode/engine";

const document: KivDocument = /* ... tu documento ... */;
</script>

<template>
	<KivEditor
		:document="document"
		:registry="registry"
		:vue-registry="vueRegistry"
		@update:document="onDocumentChange"
	/>
</template>
```

- `document` — el `KivDocument` inicial. `KivEditor` lo carga en su propio store
  interno; no lo muta directamente, emite `update:document` cada vez que cambia.
- `registry` — el `Registry` de `@kivcode/engine` (schema/metadata de cada tipo de
  nodo). Se usa para resolver labels, defaults y descriptors en el inspector y la
  paleta.
- `vueRegistry` — el `VueRegistry` de `@kivcode/vue` (componente Vue por tipo de
  nodo). Es lo que monta `KivCanvas` para renderizar el documento en vivo.

Props opcionales:

- `title?: string`
- `theme?: "dark" | "light"` — tema inicial del *chrome* del editor (ver
  [Dos temas distintos](#dos-temas-distintos-el-chrome-del-editor-vs-el-contenido) más abajo). El
  editor mantiene su propio estado interno (`editorTheme`) inicializado desde
  esta prop y toggleable en runtime con el botón de sol/luna de la toolbar — no
  hay forma de controlarlo como una prop reactiva desde afuera una vez montado.
- `bus?: EventBus` — bus compartido (p.ej. `engine.bus`) para que otros plugins
  observen las mutaciones del editor. Si se omite, `useEditorStore` crea uno
  propio internamente.
- `engine?: KivEngine` — cuando se pasa, `KivEditor` llama a
  `engine.setEditorExtensions(extensions)` en `onMounted`, lo que dispara el
  hook `onEditorReady` de cualquier plugin registrado en el engine. También es
  la fuente de `media`, `fonts` y `services` que se inyectan en el store (ver
  abajo) — sin `engine`, esos tres quedan en `null`.
- `disabledNodeTypes?: DisabledNodeTypes` — tipos de nodo que se muestran
  bloqueados (atenuados, con candado, no insertables) en la paleta y la
  biblioteca de bloques. Pensado para un tipo de nodo válido en Kiv pero que la
  app consumidora todavía no soporta (p.ej. `form` sin un endpoint de backend
  configurado) — evita el caso "parece usable pero no hace nada en silencio".

## `useEditorStore` / `EditorStore`

`KivEditor` construye su store internamente con:

```ts
const store = useEditorStore(props.document, props.registry, {
	bus: props.bus,
	media: props.engine?.media ?? null,
	fonts: props.engine?.fonts ?? null,
	services: props.engine?.services ?? null,
});
```

`useEditorStore` es un wrapper Vue reactivo sobre `EditorEngine` (el core
framework-agnóstico de `@kivcode/engine`) — traduce los eventos del `EventBus`
del engine a `ref`s/`computed`s de Vue. El resultado se expone vía `provide`
bajo `EDITOR_STORE_KEY`, así que cualquier componente descendiente (controles
de campo custom incluidos) puede leerlo con
`inject(EDITOR_STORE_KEY, null)` — así es como `FontPicker` y
`FontWeightControl` acceden a `store.fonts` (ver
[Crear un control de Inspector](./creating-an-inspector-control.md)).

La interfaz completa (`EditorStore`, en
`packages/vue-editor/src/store/editor-store.ts`):

**Estado reactivo (todo `Readonly<{ value: T }>`, es decir refs de solo lectura
desde afuera):**

- `document: KivDocument` — el documento completo, actualizado cada vez que
  cualquier mutación se confirma.
- `selected: KivNode | null` — primer nodo seleccionado (o `null`). Se mantiene
  para call sites de selección simple; siempre en sync con `selectedIds`.
- `selectedNodes: KivNode[]` — todos los nodos seleccionados, en orden de
  selección (selección múltiple).
- `selectedIds: readonly string[]`
- `canUndo` / `canRedo: boolean`
- `breakpoint: Breakpoint` — el breakpoint que se está editando (ver
  [Breakpoints](#breakpoints) abajo).
- `locale: string` — el locale que se está editando/previsualizando.
- `zoom: number` — zoom del canvas, 0.25–2. Es estado de UI puro, no forma
  parte del documento.

**Referencias de solo lectura no-reactivas:**

- `registry: Registry`
- `bus: EventBus`
- `media: MediaProvider | null` — viene de `createEngine({ media })`, `null` si
  no se configuró ninguno.
- `fonts: FontProvider | null` — viene de `createEngine({ fonts })`.
- `services: ServicesContainer | null` — viene de `createEngine({ services })`.

**Selección:**

- `select(id: string | null)` — reemplaza toda la selección por un único id (o
  la limpia con `null`).
- `toggleSelect(id: string)` — agrega/quita `id` de la selección actual sin
  tocar el resto (shift-click).
- `selectAll()` — selecciona todo el documento (menos la raíz).
- `clearSelection()`
- `isLocked(id: string): boolean`

**Breakpoint / locale:**

- `setBreakpoint(bp: Breakpoint)`
- `setLocale(locale: string)`

**Mutaciones del documento** (cada una es un paso de historial, salvo que se
indique lo contrario):

- `updateProps(id, patch)`
- `updatePropsMany(ids, patch)` — aplica el mismo patch a varios ids, como un
  único paso de undo (usa `startBatch`/`endBatch` internamente).
- `renameNode(id, newId)` / `canUseId(id): boolean`
- `addNode(parentId, slotName, node, index?)`
- `removeNode(id)` / `removeMany(ids)` — igual que `updatePropsMany`, un solo
  paso de undo para todos los ids.
- `duplicateNode(id)`
- `moveNode(id, targetParentId, targetSlot, targetIndex)`
- `setLocked(id, locked)` / `setVisible(id, visible: Responsive<boolean>)`
- `updateSeoMeta(patch: Partial<SeoMeta>)` — mergea sobre el SEO a nivel página.
- `loadDocument(document)` — reemplaza el documento entero (p.ej. al aplicar un
  page template) como un único paso de undo.

**Zoom (UI, no forma parte del historial):**

- `setZoom(zoom)` / `resetZoom()`

**Historial:**

- `startBatch()` / `endBatch()` — agrupa una secuencia de mutaciones en un
  único paso de undo/redo. Ver
  [`useContinuousEdit`](#useContinuousEdit-gestos-continuos-como-un-solo-undo)
  para el caso de uso principal.
- `undo()` / `redo()`

## `EditorExtensions`

`KivEditor` instancia `new EditorExtensions()` y la provee bajo
`EDITOR_EXTENSIONS_KEY`. Es el mecanismo con el que un plugin (o el propio
`KivEditor`, que la usa para registrar sus propios controles built-in como
`icon-picker` o `size-slider`) extiende el editor sin tocar su core. La clase
implementa `EditorExtensionPoints` (`@kivcode/engine`):

```ts
export interface EditorExtensionPoints {
	addToolbarButton(btn: ToolbarButton): void;
	addPanel(name: string, component: ComponentDef): void;
	addPaletteItem(item: PaletteItem): void;
	addInspectorTab(name: string, component: ComponentDef): void;
	addFieldControl(type: string, component: ComponentDef): void;
	addKeyboardShortcut(sc: ShortcutDef): void;
	onNodeSelect(cb: (node: KivNode) => void): void;
	onNodeCreate(cb: (node: KivNode) => void): void;
	onDocumentChange(cb: (doc: KivDocument) => void): void;
}
```

- **`addFieldControl(type, component)`** — registra un control de campo custom
  bajo un nombre (`type`), que un `FieldDescriptor` referencia con
  `pluginControl: type`. Es el punto de extensión que documenta en detalle
  [Crear un control de Inspector](./creating-an-inspector-control.md).
- **`addToolbarButton(btn)`** — agrega un botón a la toolbar del editor
  (`ToolbarButton = { id, label, icon?, onClick() }`). `KivEditor` los renderiza
  con un `v-for` sobre `extensions.getToolbarButtons()`, después del
  separador de undo/redo.
- **`addPaletteItem(item)`** — agrega un ítem a la paleta de "Add node"
  (`PaletteItem = { type, label, icon?, description?, category? }`).
- **`addInspectorTab(name, component)`** / **`addPanel(name, component)`** —
  registran componentes bajo un nombre en mapas reactivos
  (`getInspectorTabs()`, y `_panels` internamente). A la fecha, `KivInspector`
  no consume `getInspectorTabs()` para renderizar pestañas adicionales ni hay
  UI que consuma `_panels` — ambos métodos existen en la interfaz y guardan el
  registro, pero no hay un punto de render built-in todavía. No asumas una UI
  de pestañas/paneles que hoy no existe.
- **`addKeyboardShortcut(sc)`** — registra un atajo (`ShortcutDef = { keys,
  description?, onTrigger() }`) en una lista reactiva; igual que los tabs, el
  registro existe pero no hay un listener global built-in que los dispare
  automáticamente — verificar el estado real en
  `packages/vue-editor/src/extensions/editor-extensions.ts` antes de depender
  de esto.
- **`onNodeSelect(cb)` / `onNodeCreate(cb)` / `onDocumentChange(cb)`** —
  callbacks disparados por `KivEditor` cuando: se selecciona un nodo (via el
  evento `selection.changed` del bus), se crea un nodo (via `node.created`), o
  cambia el documento (el `watch` profundo sobre `store.document`).

Todas las colecciones internas son `shallowReactive` (Map o array), no
`reactive` — los valores son definiciones de componente y funciones callback,
que no deben quedar deep-proxied por Vue.

Un plugin externo obtiene la instancia de `EditorExtensions` en su
`onEditorReady(extensions)` (disparado cuando se pasa `engine` a `KivEditor`,
ver arriba), o un consumidor directo del editor puede `inject`arla con
`EDITOR_EXTENSIONS_KEY` desde un componente hijo.

## `useContinuousEdit` — gestos continuos como un solo undo

```ts
export function useContinuousEdit(store: EditorStore | null | undefined) {
	let active = false;

	function end(): void {
		if (!active) return;
		active = false;
		window.removeEventListener("blur", end);
		store?.endBatch();
	}

	function start(): void {
		if (active || !store) return;
		active = true;
		store.startBatch();
		window.addEventListener("blur", end, { once: true });
	}

	onBeforeUnmount(end);

	return { start, end };
}
```

Colapsa un gesto de drag/selección continua (slider de rango, color picker) en
una única entrada de historial en vez de una por cada tick de `input`. Uso:
llamar `start()` en el primer tick del gesto (típicamente dentro del handler
de `@input`, con guarda para no reiniciar el batch en cada tick — ver
`onSlider` en `SizeSliderControl.vue`) y `end()` cuando el gesto se confirma —
el evento nativo `change`, que los `<input type="range">` y `<input
type="color">` disparan exactamente una vez, al soltar. También se limpia
automáticamente en `blur` de la ventana y en `onBeforeUnmount`, para que un
batch no quede "abierto" si el usuario suelta el drag fuera del elemento.

Cualquier control nuevo que dispare cambios continuos debe seguir el mismo
patrón: inyectar el store, llamar `start()` desde la función de mutación
compartida, agregar un `@change="end"` en el elemento raíz del control. Ver el
ejemplo completo en
[Crear un control de Inspector](./creating-an-inspector-control.md).

## Insertar contenido programáticamente

- **`insertNodeNearSelection(store, node)`**
  (`packages/vue-editor/src/utils/insert-node.ts`) — inserción "inteligente":
  si el nodo seleccionado tiene slots, agrega `node` como su último hijo; si
  la selección es una hoja (sin slots), inserta `node` justo después de ella
  en su mismo padre; sin selección, agrega al final del primer slot de la
  raíz del documento.
- **`cloneNodeTree(node)`** (`@kivcode/engine`) — clona recursivamente un árbol
  de nodos generando ids nuevos para cada uno, para poder insertar el mismo
  template/bloque más de una vez sin colisión de ids.

`KivEditor` combina ambas al insertar un bloque de la biblioteca de contenido:

```ts
function insertBlock(template: ContentTemplate): void {
	const node = cloneNodeTree(template.create());
	insertNodeNearSelection(store, node);
	store.select(node.id);
}
```

## Breakpoints

`store.breakpoint` es el breakpoint que el editor está editando/previsualizando
(`Breakpoint` de `@kivcode/engine` — `"base" | "md" | "lg" | "xl"` en el switcher
de `KivEditor`, ver el array `BREAKPOINTS` en `KivEditor.vue`). Es estado del
store, no del documento: cambia con `store.setBreakpoint(bp)` desde el switcher
central de la toolbar, y todo el `Responsive<T>` que el inspector resuelve para
mostrar/editar un campo usa este valor. Un consumidor externo con su propio
selector de dispositivo puede llamar `store.setBreakpoint(...)` directamente
(el store está disponible vía `inject(EDITOR_STORE_KEY)` desde cualquier
descendiente, o guardando la referencia si se envuelve `KivEditor`).

## Locale

Igual que el breakpoint: `store.locale` es el locale que se está editando,
inicializado desde `document.i18n?.default ?? "en"`. `KivEditor` solo muestra
el selector de locale en la toolbar cuando el documento declara más de un
locale soportado (`document.i18n.supported.length > 1`); cambiar de locale
llama a `store.setLocale(loc)`, que también gobierna qué valor de cada campo
`Localizable<T>` resuelve el inspector.

## Dos temas distintos: el chrome del editor vs. el contenido

Son ejes completamente separados — no confundirlos:

- **`theme: "dark" | "light"`** (prop de `KivEditor`, estado interno
  `editorTheme`) controla el aspecto visual del **chrome del editor mismo** —
  toolbar, panels, inspector, paleta — vía la clase
  `kiv-editor--dark`/`kiv-editor--light` y tokens CSS (`--color-surface-base`,
  `--color-text-primary`, etc.) definidos para cada variante. Es puramente
  cosmético para la herramienta de edición; no tiene relación con cómo se ve
  el sitio/documento que se está editando.
- **El theming del contenido** (tokens de marca resueltos por `tokenRef()`,
  ver [Arquitectura](./architecture.md)) es una capa completamente distinta
  que gobierna cómo se renderiza el `KivDocument` en sí — dentro del canvas y
  en producción. `KivCanvas` renderiza el documento con el `VueRegistry` igual
  que lo haría `KivRenderer` en producción; el tema del contenido no cambia
  según si el chrome del editor está en modo claro u oscuro.

Un proyecto que integra Kiv con su propio sistema de theming (ver el "puente
de tema" en [Migración](./migration.md)) solo necesita preocuparse por el
segundo eje — el primero es enteramente interno a `@kivcode/vue-editor`.

## Estructura de canvas / árbol / inspector

Componentes principales que `KivEditor` orquesta (no hace falta conocer cada
uno en detalle para usar el editor, solo dónde están si hace falta tocarlos):

- `packages/vue-editor/src/components/KivCanvas.vue` — renderiza el documento
  en vivo con `vueRegistry`, maneja selección por click, overlays de nodo,
  resize handles, zoom.
- `packages/vue-editor/src/components/KivTree.vue` (+ `KivTreeNode.vue`) —
  árbol de estructura del documento, con drag-and-drop de reordenamiento.
- `packages/vue-editor/src/components/KivInspector.vue` +
  `packages/vue-editor/src/inspector/FieldControl.vue` — el inspector único y
  genérico (no hay inspectores por tipo de nodo, ver
  [Crear un control de Inspector](./creating-an-inspector-control.md)).
- `packages/vue-editor/src/components/KivNodePalette.vue` — paleta de "Add
  node" (nodos sueltos).
- `packages/vue-editor/src/components/KivBlockLibrary.vue` — biblioteca de
  templates de bloque de contenido (subárboles multi-nodo, de
  `@kivcode/nodes-interactive`).
- `packages/vue-editor/src/components/KivTemplateBrowser.vue` — selector de
  page templates completos (`BUILT_IN_TEMPLATES` de `@kivcode/engine`).

## `@kivcode/react-editor`

Existe también `@kivcode/react-editor`, una alternativa más nueva para React 19
sobre el mismo `@kivcode/nodes`/document model — este documento cubre
únicamente `@kivcode/vue-editor`; consultar el código de ese paquete para su
propia API.
