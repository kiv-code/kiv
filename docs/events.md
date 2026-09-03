# Eventos

Kiv se comunica hacia afuera casi exclusivamente por un `EventBus` — no hay
callbacks por prop para cada mutación posible. Un `EventBus` por instancia de
editor: `EditorEngine`, `KivEditor`/`KivEditorReact` y cualquier plugin instalado
vía `createEngine({ plugins })` comparten el mismo bus, nunca uno por
componente.

## El `EventBus`

`createEventBus()` (`packages/engine/src/events/bus.ts`) devuelve un objeto con
`emit`, `on`, `once`, `off`, `clear`:

```ts
export interface EventBus {
	emit<K extends keyof KivEventMap>(event: K, payload: KivEventMap[K]): void;
	on<K extends keyof KivEventMap>(event: K, handler: EventHandler<KivEventMap[K]>): () => void;
	on(pattern: `${string}.*`, handler: WildcardHandler): () => void;
	on(pattern: "*", handler: WildcardHandler): () => void;
	once<K extends keyof KivEventMap>(event: K, handler: EventHandler<KivEventMap[K]>): () => void;
	off<K extends keyof KivEventMap>(event: K, handler: EventHandler<KivEventMap[K]>): void;
	clear(event?: string): void;
}
```

`on()` devuelve una función de desuscripción — no hay un `off()` separado que
recordar salvo que prefieras esa forma explícitamente.

### Wildcards

Además de suscribirse a un evento exacto (`"node.created"`), `on()` soporta dos
patrones comodín:

- **`"<namespace>.*"`** — recibe todos los eventos cuyo prefijo antes del
  primer punto coincide (`"node.*"` recibe `node.created`, `node.propsChanged`,
  `node.moved`, etc., pero no `selection.changed`).
- **`"*"`** — recibe absolutamente todos los eventos emitidos en el bus, sin
  importar el nombre. Este es el mecanismo que usa `@kivcode/plugin-analytics`
  para observar el bus entero sin conocer de antemano qué eventos existen.

El handler comodín recibe `(eventName, payload)` en vez de solo `payload`. Un
error lanzado dentro de cualquier handler no interrumpe a los demás — `emit()`
envuelve cada llamada en un `try/catch` interno y reporta a un `onError`
opcional pasado a `createEventBus({ onError })`.

### `KivEventMap` — tipado extensible por augmentation

El bus es genérico sobre `KivEventMap`, una interfaz vacía por defecto
(`packages/engine/src/events/types.ts`) más una entrada fija, `"editor.ready"`.
Cualquier paquete que introduce eventos propios la extiende con
`declare module`:

```ts
declare module "@kivcode/engine" {
	interface KivEventMap {
		"modal.opened": { nodeId?: string };
		"modal.closed": { nodeId?: string };
	}
}
```

Este es el patrón real usado por `ModalNode.vue` (`packages/vue/src/nodes/`) y
por `@kivcode/plugin-a11y` para su propio `"a11y.checked"`. Sin este `declare
module`, `bus.emit`/`bus.on` para ese evento seguirían funcionando en runtime
(el índice de `KivEventMap` es `[event: string]: unknown`), pero perderías el
autocompletado y la inferencia del tipo del payload en TypeScript.

## Catálogo de eventos

### Emitidos por `EditorEngine` (`packages/engine/src/editor/editor-engine.ts`)

| Evento | Payload | Cuándo |
|---|---|---|
| `selection.changed` | `{ ids: string[] }` | cambia la selección del canvas |
| `node.created` | `{ id, parentId, slot }` | se agrega un nodo |
| `node.removed` | `{ id }` | se elimina un nodo |
| `node.moved` | `{ id, targetParentId, ... }` | se reordena/mueve un nodo |
| `node.propsChanged` | `{ id, patch }` | cambian props de un nodo (edición en el Inspector) |
| `node.renamed` | `{ id, newId }` | cambia el id de un nodo |
| `node.duplicated` | `{ id }` | se duplica un nodo |
| `node.flagsChanged` | `{ id }` | cambian flags del nodo (visibilidad, lock, etc.) |
| `document.seoChanged` | `{ patch }` | cambian los metadatos SEO del documento |
| `document.loaded` | `{ document }` | se carga/reemplaza el documento (incluye aplicar un template) |
| `history.changed` | `{ canUndo, canRedo }` | cambia el estado de undo/redo |

### Emitidas por `createEngine()` (`packages/engine/src/engine/create-engine.ts`)

- `editor.ready` — payload `undefined`. Se emite cuando se llama
  `engine.setEditorExtensions(ext)`, es decir, cuando un editor efectivamente
  se monta sobre el engine (no al construir el engine en sí). Los plugins
  reciben además su propio callback `onEditorReady(ctx)` en ese mismo momento,
  con `ctx.editor` ya definido — normalmente no necesitas escuchar
  `editor.ready` por el bus si tu plugin ya implementa `onEditorReady`.

### Emitidas por la capa de canvas (`@kivcode/vue`/`@kivcode/react` editor)

- `document.save` — `{ document }`. Emitida por `KivCanvas.vue`/`KivCanvas.tsx`
  en el atajo de guardar (⌘S). Es el evento que consume `@kivcode/plugin-seo` para
  sincronizar el `<head>` en cada guardado:

  ```ts
  ctx.bus.on("document.save", (payload) => {
  	const tags = generateMetaTags(payload.document.seo, { origin: options.origin });
  	applyMetaTagsToHead(tags);
  });
  ```

### Eventos de nodos con estado propio

Un nodo con interacción en tiempo real (modal, carousel, tabs, accordion)
declara y emite los suyos a través del bus inyectado por
`KIV_BUS_KEY`/equivalente React. Ejemplo real, `ModalNode.vue`:

```ts
declare module "@kivcode/engine" {
	interface KivEventMap {
		"modal.opened": { nodeId?: string };
		"modal.closed": { nodeId?: string };
	}
}
```

Patrón a seguir para un nodo nuevo con estado propio: declara el módulo
augmentado junto al componente (no en un archivo de tipos separado, para que
sea evidente que ese componente es el dueño del evento), y emite con
`bus.emit("mi-nodo.algo", payload)` en el mismo punto donde el estado interno
cambia (abrir/cerrar, cambiar de slide, etc.).

### Eventos específicos del dominio (emitidos por el consumidor, no por Kiv)

El bus también sirve como canal genérico para eventos que **no** define Kiv —
por ejemplo, un `button.clicked` o `slide.changed` que la propia página en
runtime emite al interactuar un visitante (ver los tests de
`@kivcode/plugin-analytics`, que emiten `"button.clicked"`, `"modal.opened"`,
`"slide.changed"` e incluso `"totally.new.custom.event"` directamente sobre
`engine.bus.emit(...)` sin que ninguno de esos nombres esté declarado en
`KivEventMap`). Esto es válido: el bus no exige que un evento esté tipado para
poder emitirse o escucharse — la interfaz solo mejora el tipado en TypeScript.

## Cómo se suscribe un plugin

Un plugin recibe `ctx.bus` en `install(ctx)` (ver [Plugins](./plugins.md)):

```ts
export function a11yPlugin(): KivPlugin {
	return {
		name: "a11y",
		install(ctx: PluginContext): void {
			ctx.bus.on("node.created", () => recheck(ctx));
			ctx.bus.on("node.removed", () => recheck(ctx));
			ctx.bus.on("node.propsChanged", () => recheck(ctx));
		},
	};
}
```

## Cómo se suscribe un consumidor externo

`<KivEditor bus="...">` acepta un `EventBus` externo como prop opcional — pásale
el mismo `engine.bus` que usaste en `createEngine()` para que tu código de
integración (fuera del sistema de plugins) observe exactamente los mismos
eventos que ve un plugin instalado:

```vue
<KivEditor :engine="engine" :bus="engine.bus" />
```

```ts
engine.bus.on("document.save", ({ document }) => {
	// tu propio código de persistencia, analytics, lo que sea
});
```

Internamente, `KivEditor.vue` usa ese mismo `bus` para conectar sus propios
extension points (`onNodeSelect`, `onNodeCreate`, `onDocumentChange` — ver
[Plugins](./plugins.md)) a los eventos reales del `EditorEngine`, así que un
bus externo pasado por prop ve tanto los eventos del core como los de
cualquier plugin instalado — es el mismo objeto, no una copia filtrada.

## Reaccionar vs. interceptar

El bus es puramente de **notificación después del hecho** — reaccionar a un
cambio ya ocurrido (analítica, auto-guardado, revalidar accesibilidad) es el
caso soportado y es el único documentado aquí. **No existe hoy ningún
mecanismo para interceptar o cancelar una acción antes de que ocurra** (no hay
equivalente a `preventDefault()` sobre un evento del bus, ni un evento
"antes de" para ninguna de las mutaciones del catálogo de arriba). Si tu
integración necesita bloquear una mutación bajo una condición (por ejemplo,
impedir borrar cierto nodo), esa validación debe vivir antes de llamar al
método de `EditorEngine` correspondiente, no como un handler del bus.

## Referencias

Código fuente: `packages/engine/src/events/bus.ts`,
`packages/engine/src/events/types.ts`, `packages/engine/src/editor/editor-engine.ts`,
`packages/engine/src/engine/create-engine.ts`,
`packages/vue/src/nodes/ModalNode.vue` (declaración de `KivEventMap` propia),
`packages/plugin-a11y/src/index.ts`, `packages/plugin-seo/src/index.ts`,
`packages/plugin-analytics/src/index.test.ts` (catálogo de eventos ad-hoc no
tipados), `packages/vue-editor/src/components/KivEditor.vue` (prop `bus`).
