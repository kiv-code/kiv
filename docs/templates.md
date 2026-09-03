# Sistema de Templates

Kiv tiene **dos sistemas de templates distintos**, sin relación de código entre
ellos más allá de compartir el modelo `KivNode`/`KivDocument`. Confundirlos es
el error más común: uno **reemplaza** el documento entero, el otro **inserta**
un fragmento junto a la selección actual.

| | Templates de página | Templates de bloque |
|---|---|---|
| Paquete | `@kivcode/engine` | `@kivcode/nodes-interactive` |
| Tipo | `PageTemplate` | `ContentTemplate` |
| Catálogo | `BUILT_IN_TEMPLATES` (5) | `CONTENT_TEMPLATES` (20) |
| Efecto al aplicar | Reemplaza `KivDocument` completo | Inserta un subárbol junto a la selección |
| UI | `KivTemplateBrowser.vue` | `KivBlockLibrary.vue` |
| Acción en el store | `store.loadDocument()` | `cloneNodeTree()` + `insertNodeNearSelection()` |

## 1. Templates de página completa (`@kivcode/engine`)

### `PageTemplate`

Definido en `packages/engine/src/templates/types.ts`:

```ts
export interface PageTemplate {
	id: string;
	name: string;
	description?: string;
	category?: string;
	/** Data URI o URL mostrada en la grilla del browser. Opcional. */
	thumbnail?: string;
	document: KivDocument;
}
```

`document` es un `KivDocument` completo y válido — mismo shape que cualquier
documento que el editor cargaría normalmente, con su propio `schemaVersion`,
`i18n` y árbol `root`.

### `BUILT_IN_TEMPLATES`

Catálogo actual (`packages/engine/src/templates/built-in.ts`), cinco entradas:

```ts
export const BUILT_IN_TEMPLATES: PageTemplate[] = [
	{ id: "blank", name: "Blank page", category: "General", document: blankDocument },
	{ id: "landing", name: "Landing page", category: "Marketing", document: landingDocument },
	{ id: "about", name: "About page", category: "Marketing", document: aboutDocument },
	{ id: "contact", name: "Contact page", category: "Marketing", document: contactDocument },
	{ id: "blog-post", name: "Blog post", category: "Content", document: blogPostDocument },
];
```

Convención de estilo a seguir para uno nuevo: cada nodo del `document` tiene un
**id legible y semántico**, nunca generado aleatoriamente — por ejemplo, en
`landingDocument`: `hero`, `hero-container`, `hero-stack`, `hero-heading`,
`hero-text`, `hero-cta`, `features`, `feature-1`, `feature-1-heading`... Esto
hace que el árbol sea comprensible en el inspector/árbol del editor apenas se
aplica el template, antes de que el usuario renombre nada.

### Cómo agregar uno nuevo

1. Construye el `KivDocument` como una constante en `built-in.ts` (o un archivo
   nuevo si el documento es grande), con ids semánticos por nodo siguiendo la
   convención de arriba.
2. Agrega una entrada a `BUILT_IN_TEMPLATES` con `id` (kebab-case, único),
   `name`, `description`, `category` (agrupa en `KivTemplateBrowser.vue`) y el
   `document`.
3. Opcional: `thumbnail` (data URI o URL) — sin él, el browser cae a un ícono
   genérico.

### Aplicación: `store.loadDocument()` y la preservación de `i18n`

La UI (`KivTemplateBrowser.vue`) emite `apply` con el `PageTemplate` elegido;
`KivEditor.vue` lo recibe en `applyTemplate()`:

```ts
function applyTemplate(template: PageTemplate): void {
	// A template supplies content, not language settings — every built-in ships
	// a boilerplate `{ default: "en", supported: ["en"] }`. Taking it verbatim
	// would collapse a multi-locale document to one locale, hiding the whole
	// translation UI and making later edits overwrite existing `$t` values with
	// plain strings. Keep the document's own i18n.
	store.loadDocument({
		...template.document,
		i18n: store.document.value.i18n ?? template.document.i18n,
	});
}
```

Punto importante para cualquier integración: **`store.document.value.i18n` se
preserva** al aplicar un template — solo se usa `template.document.i18n` como
fallback si el documento actual no tenía uno. Un documento multi-locale que
aplica un template no pierde sus locales ni sus valores `$t` existentes; solo
gana el árbol de nodos del template. `loadDocument()` reemplaza el documento en
un único paso de historial (un solo undo revierte la aplicación completa).

## 2. Templates de bloque de contenido (`@kivcode/nodes-interactive`)

### `ContentTemplate`

Definido en `packages/nodes-interactive/src/templates/index.ts`:

```ts
export interface ContentTemplate {
	id: string;
	label: string;
	description: string;
	category:
		| "hero" | "section" | "grid" | "list"
		| "page-block" | "form" | "comparison";
	icon: string;
	create: () => KivNode;
}
```

A diferencia de `PageTemplate`, no hay un documento completo: `create()` es una
función que **construye y devuelve un único `KivNode`** (normalmente un
`section` con un árbol de hijos debajo) cada vez que se llama.

### `CONTENT_TEMPLATES`

Catálogo actual de 20 bloques (`packages/nodes-interactive/src/templates/content-templates.ts`,
re-exportado como el array `CONTENT_TEMPLATES` desde `templates/index.ts`):
Hero, Header, Feature Grid, CTA Banner, Banner, Testimonials, Logo Cloud, FAQ,
Pricing, Comparison, Stats, Cards, Callout, Gallery, Timeline, Contact,
Newsletter, Footer, Agenda/Schedule, Team Grid.

### Por qué son composición pura, nunca lógica nueva

Cada `ContentTemplate` se construye **exclusivamente combinando nodos ya
existentes** de `@kivcode/nodes`/`@kivcode/nodes-interactive` — nunca introduce un
concepto que ningún nodo interpreta. Si un template "necesita" algo que ningún
nodo cubre, la respuesta correcta es escribir el nodo que falta primero (ver
[Crear un Node](./creating-a-node.md)), no improvisar una prop ad-hoc dentro
del template. Este proyecto encontró y corrigió justamente ese bug: props
`action`/`color`/`height`/`name` en varios templates que los nodos
correspondientes simplemente no leían — el template compilaba y se insertaba
sin error, pero una parte del bloque no tenía ningún efecto visual.

### Ids deterministas

`create()` debe producir el mismo árbol cada vez que se llama — nada de
`Date.now()` ni contadores globales que persistan entre llamadas. El patrón
real usado en `content-templates.ts` es un builder con contador local por
llamada:

```ts
function createNodeBuilder() {
	const counts: Record<string, number> = {};
	return function node(
		type: string,
		props: Record<string, unknown> = {},
		slots: Record<string, KivNode[]> = {},
	): KivNode {
		const n = (counts[type] ?? 0) + 1;
		counts[type] = n;
		// el primer nodo de un tipo usa el nombre plano; los siguientes, un sufijo
		return { id: n === 1 ? type : `${type}-${n}`, type, props, slots };
	};
}

export function heroTemplate(): KivNode {
	const node = createNodeBuilder();
	return node("section", { align: "center" }, {
		default: [
			node("heading", { level: "1", text: "Build Something Amazing" }),
			node("text", { text: "..." }),
			node("spacer", { height: "md" }),
			node("button", { /* ... */ }),
		],
	});
}
```

La unicidad real contra lo que ya existe en el documento **no** es
responsabilidad del template — se resuelve en el punto de inserción, con
`cloneNodeTree()` (mismo mecanismo que usa copiar/pegar o duplicar un nodo en
el canvas).

### Inserción: `KivBlockLibrary.vue`

`KivBlockLibrary.vue` recibe el array `templates: ContentTemplate[]`, agrupa
por `category` para las pestañas de filtro y, al elegir un bloque, emite
`insert`. `KivEditor.vue` lo maneja así:

```ts
function insertBlock(template: ContentTemplate): void {
	const node = cloneNodeTree(template.create());
	insertNodeNearSelection(store, node);
	store.select(node.id);
}
```

`cloneNodeTree()` (de `@kivcode/engine`) regenera todos los ids del subárbol para
que no colisionen con nodos ya presentes en el documento — es el mismo paso que
se aplica al duplicar un nodo existente en el canvas
(`KivCanvas.vue` usa exactamente el mismo `cloneNodeTree()` +
`insertNodeNearSelection()` para su acción de duplicar). `insertNodeNearSelection()`
(`packages/vue-editor/src/utils/insert-node.ts`) decide el punto de inserción
relativo a la selección actual del store.

`KivBlockLibrary.vue` también respeta `disabledNodeTypes` (el mismo mapa que
usa `KivNodePalette.vue`): si el árbol que devuelve `create()` contiene en
cualquier nivel un tipo de nodo deshabilitado, el bloque completo aparece
bloqueado en la UI — insertar un bloque "Contact form" es tan inválido como
insertar un `form` suelto si ese tipo está deshabilitado para el proyecto.

### Categorías

`category` en `ContentTemplate` es un enum cerrado de siete valores (ver arriba).
`KivBlockLibrary.vue` deriva la lista de pestañas de filtro recorriendo
`props.templates` en orden y tomando la primera aparición de cada `category` —
no hay una lista de categorías separada que mantener sincronizada. Agregar una
categoría nueva implica extender el tipo unión de `ContentTemplate["category"]`
en `packages/nodes-interactive/src/templates/index.ts`; la UI la recoge sola en
cuanto algún template la use.

### Cómo agregar uno nuevo

1. Escribe una función `miBloqueTemplate(): KivNode` en
   `content-templates.ts`, usando `createNodeBuilder()` y componiendo
   únicamente nodos ya existentes.
2. Expórtala desde `templates/index.ts` y agrégala al array `CONTENT_TEMPLATES`
   con `id`, `label`, `description`, `category`, `icon`, `create: miBloqueTemplate`.
3. Verifica que cada prop que usas en el árbol es una que el nodo real
   interpreta — no asumas el nombre, revisa el `FieldDescriptor` del nodo en
   `@kivcode/nodes` (ver el bug real mencionado arriba).
4. Confirma que `create()` es determinista (sin `Date.now()`, sin estado que
   sobreviva entre llamadas fuera del builder local).

## Referencias

Código fuente: `packages/engine/src/templates/` (`types.ts`, `built-in.ts`),
`packages/nodes-interactive/src/templates/` (`index.ts`,
`content-templates.ts`), `packages/vue-editor/src/components/KivTemplateBrowser.vue`,
`packages/vue-editor/src/components/KivBlockLibrary.vue`,
`packages/vue-editor/src/components/KivEditor.vue` (`applyTemplate`,
`insertBlock`), `packages/vue-editor/src/utils/insert-node.ts`.
