# Plugins

Un plugin es la forma estándar de extender Kiv sin tocar `@kivcode/engine` ni
`@kivcode/nodes` — registrar controles de campo custom, tabs del Inspector,
botones de toolbar, o simplemente reaccionar al `EventBus`. Se pasa a
`createEngine({ plugins: [...] })` y recibe un `PluginContext` con acceso al
bus, el registry, el theme y (si hay un editor montado) los extension points.

## `KivPlugin`

Definido en `packages/engine/src/plugin/types.ts`:

```ts
export interface KivPlugin {
	name: string;
	install(ctx: PluginContext): void;
	/** Called when an editor mounts and extension points become available. `ctx.editor` is guaranteed to be set. */
	onEditorReady?(ctx: PluginContext): void;
}
```

- `name` identifica al plugin y evita instalarlo dos veces — `createEngine()`
  lanza si dos plugins comparten `name`.
- `install(ctx)` corre inmediatamente al pasar el plugin en `createEngine({
  plugins })` (o al llamar `engine.use(plugin)` a mano después). En este punto
  `ctx.editor` puede no existir todavía — no asumas que hay un editor montado.
- `onEditorReady(ctx)` corre solo cuando efectivamente hay un editor montado
  sobre el engine (`engine.setEditorExtensions(ext)`), y ahí sí `ctx.editor`
  está garantizado. Un plugin puramente de renderizado/SSR (por ejemplo, uno
  que solo escucha el bus para exportar analítica) puede no implementar este
  hook nunca.

### `PluginContext`

```ts
export interface PluginContext {
	bus: EventBus;
	registry: Registry;
	theme: ThemeTokens;
	i18n: I18nConfig | null;
	/** Present only while an editor is mounted. Absent in a pure render/SSR context. */
	editor?: EditorExtensionPoints;
	/** Present only when a MediaProvider is configured via `createEngine({ media })`. */
	media?: MediaProvider;
	/** Injected by the consumer app. Each service is optional — plugins must check before using. */
	services: ServicesContainer;
}
```

`editor` y `media` son opcionales por diseño — un mismo plugin puede correr
tanto en un contexto de solo-render (SSR, export a HTML) como dentro del
editor completo, y debe comportarse razonablemente en ambos. Revisa siempre
`ctx.editor?.` / `ctx.media?.` antes de usarlos.

### `EditorExtensionPoints`

Lo que `ctx.editor` expone una vez montado (`packages/engine/src/plugin/types-editor.ts`):

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

`ComponentDef` es `unknown` a propósito — el engine core nunca conoce Vue ni
React; cada renderer castea ese valor a su propio tipo de componente. Un
plugin que registra UI (`addInspectorTab`, `addPanel`, `addFieldControl`)
está implícitamente acoplado al framework del renderer que lo consume — por
eso `@kivcode/plugin-seo` y `@kivcode/plugin-a11y` traen componentes `.vue`
propios, no componentes agnósticos. `addFieldControl(type, component)` es el
mecanismo detrás de un `pluginControl` en un `FieldDescriptor` (ver
[Crear un control de Inspector](./creating-an-inspector-control.md)).

## Cómo se instala un plugin

`createEngine()` (`packages/engine/src/engine/create-engine.ts`) instala cada
plugin de `options.plugins` en orden, llamando `install(ctx)` con el
`PluginContext` disponible en ese momento (sin `editor` todavía). Cuando el
editor efectivamente se monta y llama `engine.setEditorExtensions(ext)`, el
engine emite `"editor.ready"` en el bus y llama `onEditorReady(ctx)` — ahora
con `ctx.editor` seteado — sobre **todos** los plugins ya instalados, en el
mismo orden:

```ts
import { createEngine } from "@kivcode/engine";
import { seoPlugin } from "@kivcode/plugin-seo";
import { a11yPlugin } from "@kivcode/plugin-a11y";

const engine = createEngine({
	plugins: [seoPlugin({ origin: "https://example.com" }), a11yPlugin()],
});
```

También se puede instalar un plugin después de crear el engine, con
`engine.use(plugin)` — mismo `install(ctx)` inmediato, mismo comportamiento
si el editor ya estaba montado (llama `onEditorReady` también, ver
`create-engine.ts`).

## Ejemplo real 1: `@kivcode/plugin-seo`

Registra una tab "SEO" en el Inspector y sincroniza el `<head>` del documento
en cada guardado (`document.save`, ver [Eventos](./events.md)):

```ts
export function seoPlugin(options: SeoPluginOptions = {}): KivPlugin {
	return {
		name: "seo",
		install(ctx: PluginContext): void {
			ctx.bus.on("document.save", (payload) => {
				const tags = generateMetaTags(payload.document.seo, {
					origin: options.origin,
				});
				applyMetaTagsToHead(tags);
			});
		},
		onEditorReady(ctx: PluginContext): void {
			ctx.editor?.addInspectorTab("seo", SeoInspectorTab);
		},
	};
}
```

Dos cosas a notar: `install()` no toca `ctx.editor` en absoluto (la
sincronización del `<head>` funciona igual en un consumidor que nunca monta
el editor, con tal de que emita `document.save`), y la tab del Inspector solo
se agrega cuando hay editor, en `onEditorReady()`.

## Ejemplo real 2: `@kivcode/plugin-a11y`

Recalcula issues de accesibilidad en cada mutación relevante del documento y
emite un evento propio (`"a11y.checked"`) para que otro consumidor (un badge
de toolbar, por ejemplo) pueda reaccionar sin montar el panel:

```ts
declare module "@kivcode/engine" {
	interface KivEventMap {
		"a11y.checked": { issues: import("./rules").A11yIssue[] };
	}
}

export function a11yPlugin(): KivPlugin {
	let latestDocument: KivDocument | undefined;

	function recheck(ctx: PluginContext): void {
		if (!latestDocument) return;
		ctx.bus.emit("a11y.checked", { issues: checkDocument(latestDocument) });
	}

	return {
		name: "a11y",
		install(ctx: PluginContext): void {
			ctx.bus.on("node.created", () => recheck(ctx));
			ctx.bus.on("node.removed", () => recheck(ctx));
			ctx.bus.on("node.propsChanged", () => recheck(ctx));
		},
		onEditorReady(ctx: PluginContext): void {
			ctx.editor?.addInspectorTab("a11y", A11yPanel);
			ctx.editor?.onDocumentChange((doc) => {
				latestDocument = doc;
				recheck(ctx);
			});
		},
	};
}
```

Patrón a copiar para un plugin propio con eventos: el `declare module
"@kivcode/engine" { interface KivEventMap {...} }` vive junto a la definición
del plugin (mismo archivo), no en un archivo de tipos separado — igual que el
patrón descrito en [Eventos](./events.md) para nodos con estado propio.
`install()` se suscribe a los eventos del engine que necesita para mantener
`latestDocument` al día; `onEditorReady()` conecta `onDocumentChange` (que
solo existe una vez hay editor) para obtener el documento inicial.

## `@kivcode/plugin-analytics`: ejemplo mínimo, no representativo

`packages/plugin-analytics/src/index.ts` es deliberadamente un demo — su
propio `package.json` lo dice explícitamente: *"Minimal example plugin (click
counter)... Not published — see docs/plugins.md for real plugin examples"*.
Sirve para ver el mecanismo más simple posible, `bus.on("*")`, capturando
absolutamente cualquier evento sin declarar ninguno en `KivEventMap`:

```ts
export function analyticsPlugin(options: AnalyticsOptions = {}): KivPlugin {
	const sink = options.sink ?? defaultSink;
	return {
		name: "analytics",
		install(ctx: PluginContext): void {
			ctx.bus.on("*", (event, payload) => {
				if (options.filter && !options.filter(event)) return;
				sink({ event, payload });
			});
		},
	};
}
```

Para un plugin real, usa `@kivcode/plugin-seo`/`@kivcode/plugin-a11y` como
referencia, no este.

## Qué puede hacer un plugin hoy — y qué no

Puede:

- Suscribirse a cualquier evento del bus (incluyendo eventos de dominio no
  tipados en `KivEventMap`, ver [Eventos](./events.md)) y emitir los suyos.
- Registrar tabs de Inspector, paneles, botones de toolbar, items de paleta,
  controles de campo custom (`addFieldControl`) y atajos de teclado — pero
  solo una vez hay un editor montado (`onEditorReady`).
- Leer `ctx.registry` para inspeccionar/registrar nodos, `ctx.theme` para leer
  tokens del theme activo, `ctx.i18n` para la config de idiomas, y
  `ctx.services` para acceder a lo que el consumidor inyectó vía
  `createEngine({ services })` (auth, router, storage, api client — ver
  `types-services.ts`).

No puede:

- **Interceptar o cancelar una mutación antes de que ocurra.** El bus es
  puramente de notificación después del hecho (ver
  [Eventos § Reaccionar vs. interceptar](./events.md#reaccionar-vs-interceptar)).
  No hay un evento "antes de" ni un `preventDefault()`.
- **Registrar nodos nuevos por sí mismo de forma mágica.** `ctx.registry`
  permite registrar, pero el plugin debe importar/definir esos nodos como
  cualquier paquete de `@kivcode/nodes`-compatible (ver
  [Crear un Node](./creating-a-node.md)) — un plugin y un paquete de nodos son
  conceptos ortogonales, ver la sección siguiente.
- **Asumir que `ctx.editor`/`ctx.media` existen en `install()`.** Ambos son
  opcionales y pueden estar ausentes según el contexto (SSR, export, o un
  `MediaProvider` no configurado).

## Plugin vs. paquete de nodos

No son lo mismo, y no siempre hace falta un `KivPlugin` formal:

- Un **paquete de nodos** (como `@kivcode/nodes` mismo, o un paquete propio con
  el mismo shape) exporta un array de `CompiledNode` y se registra con
  `registry.registerMany([...])` — no necesita implementar `install()` ni
  `onEditorReady()` si no agrega ninguna UI ni escucha el bus.
- Un **plugin** es necesario quien quiera engancharse a `EditorExtensionPoints`
  (tabs, controles custom, toolbar) o al `EventBus` de forma reutilizable y
  distribuible — `@kivcode/plugin-seo` no trae ningún nodo nuevo, solo una tab
  y una suscripción al bus.
- Nada impide que un mismo paquete haga ambas cosas: exportar nodos **y** un
  `KivPlugin` que registra un control de campo custom para ellos. La decisión
  es si el paquete necesita algo de `EditorExtensionPoints`/`EventBus` — si
  la respuesta es no, un array de nodos simple es más simple de mantener y
  probar que envolverlo en un plugin sin necesidad.

## Empaquetar un plugin propio

Convención observada en los tres plugins reales del monorepo:

1. Nombre de paquete `@kivcode/plugin-<nombre>` (o el scope de tu organización
   si publicas fuera de este monorepo).
2. Exporta como mínimo una función factory que devuelve un `KivPlugin`
   (`seoPlugin(options)`, `a11yPlugin()`, `analyticsPlugin(options)`) — nunca
   un objeto plano ya instanciado, para permitir opciones de configuración
   por instancia.
3. Si el plugin introduce eventos propios, el `declare module "@kivcode/engine"
   { interface KivEventMap {...} }` vive en el mismo archivo que la factory.
4. Re-exporta cualquier utilidad interna que un consumidor pueda necesitar sin
   pasar por el plugin (`generateMetaTags`, `checkDocument`, etc. en los
   ejemplos reales) — evita que el consumidor tenga que reimplementar lógica
   ya resuelta solo porque no quiere instalar el plugin completo.
5. Único import permitido desde `@kivcode/engine` es su entrypoint público
   (`import type { KivPlugin, PluginContext } from "@kivcode/engine"`) — nunca
   un import profundo a `@kivcode/engine/src/...`.

## Referencias

Código fuente: `packages/engine/src/plugin/types.ts`,
`packages/engine/src/plugin/types-editor.ts`,
`packages/engine/src/plugin/types-media.ts`,
`packages/engine/src/plugin/types-services.ts`,
`packages/engine/src/engine/create-engine.ts`, `packages/plugin-seo/src/index.ts`,
`packages/plugin-a11y/src/index.ts`, `packages/plugin-analytics/src/index.ts`
(contraejemplo de "demo, no núcleo" — ver también `migration.md` para por qué
no se integra tal cual en un proyecto consumidor).
