# Crear un Node

Un nodo de Kiv es una definición pura: `schema` (campos editables) + `defaults` +
opcionalmente `toHtml`. Nunca es un componente — cada renderer (`@kivcode/vue`, a
futuro `@kivcode/react`) provee su propio componente para el mismo `type`. Este
documento recorre el proceso completo con un ejemplo real y pequeño: el nodo
`divider` de `@kivcode/nodes`.

## 1. `defineNode()`

`defineNode()` vive en `@kivcode/engine` y compila una `NodeDefinition` en un
`CompiledNode`: deriva un schema Zod (`z.object({...})`, cada campo envuelto en
`.optional()`) y un objeto `defaults` a partir del `default` de cada
`FieldDescriptor`.

```ts
import { defineNode, f } from "@kivcode/engine";

export const dividerNode = defineNode({
	type: "divider",
	category: "content",
	label: "Divider",
	description: "Horizontal rule with style, color, and spacing options",
	fields: {
		lineStyle: f.select(["solid", "dashed", "dotted", "double"], {
			label: "Style",
			default: "solid",
			group: "Style",
		}),
		color: f.color({ label: "Color", default: "#d1d5db", group: "Style" }),
		thickness: f.number({
			label: "Thickness (px)",
			default: 1,
			responsive: true,
			group: "Style",
		}),
	},
	toHtml(props) {
		/* ver sección 5 */
	},
});
```

Campos de `NodeDefinition` que puedes declarar, además de `fields`: `category`,
`label`, `icon`, `description` (todos usados por la paleta/árbol del editor),
`slotConstraints` (si el nodo acepta hijos y quieres restringir qué tipos —
ver `agendaNode.slotConstraints?.default === ["agenda-item"]` como ejemplo real)
y `toHtml`.

## 2. El vocabulario de campos: `f.*`

`packages/engine/src/schema/fields.ts` expone el objeto `f` con los helpers base.
Los que existen hoy son exactamente estos seis — no hay más:

```ts
export const f = { text, textarea, number, boolean, color, select };
```

- `f.text(opts)` / `f.textarea(opts)` — string, control `"text"`/`"textarea"`.
- `f.number(opts)` — number, control `"number"`.
- `f.boolean(opts)` — boolean, control `"boolean"`.
- `f.color(opts)` — string (hex/rgba), control `"color"`.
- `f.select(values, opts)` — enum tipado; `values` es un array de strings o
  números literales, cada uno se convierte en `{ label, value }`.

Cada helper devuelve un `FieldDescriptor<T>` (definido en
`packages/engine/src/schema/field.ts`), cuyas opciones comunes son: `default`,
`label`, `group` (sección del Inspector), `localizable`, `responsive`, `inline`
(edición directa en el canvas), `showIf: { field, equals }` (visibilidad
condicional en el Inspector, no afecta el schema ni el JSON), `placeholder`,
`hint`, `required`, `hidden`, y `pluginControl` (nombre de un control custom
registrado por un plugin — ver [Plugins](./plugins.md)). Dos opciones más
específicas de un `pluginControl` de tipo slider: `sliderUnits` y `allowAuto`/
`autoLabel`; y `spacingScale` para presets de un `pluginControl: "spacing-box"`.

No declares un `FieldDescriptor` a mano si uno de los helpers de
`@kivcode/nodes` (siguiente sección) ya cubre el concepto — repetir el shape a
mano es la fuente más común de inconsistencia entre nodos.

## 3. Helpers de campo compartidos (`@kivcode/nodes`)

Antes de escribir un campo nuevo, revisa si uno de estos ya resuelve el mismo
concepto. Viven en `packages/nodes/src/*.ts` y son la única fuente de verdad
para lo que se repite entre nodos — si dos nodos necesitan lo mismo, la
respuesta es un helper aquí, no un `FieldDescriptor` duplicado en cada uno.

- **`typography-field.ts` — `typographyFields()` / `resolveTypographyStyle()`.**
  Genera el grupo completo de campos tipográficos (familia, tamaño, peso,
  color, alineación, interlineado, tracking, transform, estilo de fuente) que
  usa la mayoría de los nodos con texto propio, y resuelve ese grupo a un
  objeto de estilos CSS listo para `toHtml()`/el componente Vue. Úsalo en
  cualquier nodo nuevo cuyo contenido sea texto libre en vez de declarar cada
  campo de tipografía suelto — el conjunto exacto de nodos que ya lo adoptaron
  está en movimiento, así que verifica el estado actual en el código en vez de
  asumir una lista fija.
- **`hover-field.ts` — `hoverFields()`.** Campos `hoverEffect`/`hoverGlowColor`
  para cualquier nodo que soporte un efecto visual al pasar el mouse (lift,
  grow, glow...). Úsalo en vez de inventar tu propio enum de efectos.
- **`border-field.ts` — `borderVisualFields()` (+ variantes de color de
  borde).** Radio de borde y sombra con un `select` de escala (`none`..`xl`/
  `full`), en vez de un campo de texto libre para CSS.
- **`spacing-fields.ts` / `spacing-field.ts` — `spacingFields()` /
  `spacingBoxField()`.** Padding/margin, ya sea como un par X/Y sobre una
  escala (`spacingFields()`) o como una caja de 4 lados independientes
  (`spacingBoxField()`, tipo `SpacingBoxValue`). Usa esto en vez de cuatro
  campos de número sueltos para top/right/bottom/left.
- **`align-field.ts` — `alignField()`.** Un `select` de alineación
  (`left`/`center`/`right` por defecto, personalizable).
- **`gap-field.ts` — `gapField()`.** Un `select` de espaciado entre elementos
  hijos sobre la misma escala que `spacingFields()`, responsive por defecto.
- **`size-field.ts` — `sizeField()`.** Un campo de longitud CSS libre
  (`"42px"`, `"60%"`) renderizado como slider + número exacto + tabs de
  unidad, en vez de un `select` cerrado de tamaños. Soporta `allowAuto` para
  un estado "sin declarar" explícito (el radio en la sección 5 de este
  documento usa `sizeField()` para `width`).

## 4. Registrar el nodo

Cada nodo se exporta desde su archivo (`content/divider.ts`), se re-exporta
desde el `index.ts` de su carpeta (`content/index.ts` o `layout/index.ts`), y
finalmente se agrega al array `ALL_NODES` en `packages/nodes/src/index.ts`:

```ts
import { dividerNode } from "./content/divider";
// ...
export const ALL_NODES = [
	pageNode,
	// ...
	dividerNode,
	// ...
] as const;
```

Un consumidor registra todo el catálogo con `registry.registerMany([...ALL_NODES])`
sobre el `Registry` que devuelve `createRegistry()` (o el que trae `createEngine()`).
Si tu nodo vive en tu propio paquete de plugin en vez de en `@kivcode/nodes`
(ver [Migración, paso 3](./migration.md#paso-3--cuándo-escribir-un-nodo-nuevo-vs-cuándo-no)),
el patrón es el mismo: exporta un array equivalente y regístralo junto al resto.

## 5. `toHtml()` — debe tener paridad exacta con el componente Vue

`toHtml` es opcional en `NodeDefinition`, pero si lo omites, `renderToHtml()`
cae a un `<div>` genérico — sin ese `toHtml`, el nodo no se puede exportar a
HTML estático (SSR, export, email) aunque se vea correcto en el editor. Firma:

```ts
export type ToHtml = (
	props: Record<string, unknown>,
	children: Record<string, string>,
	ctx: ToHtmlContext, // { locale, breakpoint }
) => string;
```

`children` es un mapa `slot name → HTML ya concatenado` de los hijos de ese
slot — el nodo no recorre el árbol, solo interpola. Ejemplo real completo
(`dividerNode.toHtml`):

```ts
toHtml(props) {
	const thickness = props.thickness ?? 1;
	const color = escapeHtml(props.color ?? "#d1d5db");
	const lineStyle = escapeHtml(props.lineStyle ?? "solid");
	const width = props.width === "full" ? "100%" : String(props.width ?? "100%");
	const lineHtml = `<div style="height:0px;width:${width};border-top:${thickness}px ${lineStyle} ${color};flex-shrink:0;"></div>`;
	const wrapperStyle = styleToString({
		display: "flex",
		width: "100%",
		paddingTop: fromScale(SPACING, props.spacing ?? "md", "16px"),
		paddingBottom: fromScale(SPACING, props.spacing ?? "md", "16px"),
	});
	return `<div style="${wrapperStyle}" data-kiv-type="divider">${lineHtml}</div>`;
},
```

Cosas a las que prestar atención, todas verificadas en el código real:

- **Siempre escapa texto interpolado** con `escapeHtml()` de `html-utils.ts` —
  cualquier prop de texto libre es contenido de usuario.
- **Siempre incluye `data-kiv-type="<type>"`** en el elemento raíz — es lo que
  `nodes.test.ts` verifica para todos los nodos y lo que permite identificar
  el nodo en el HTML exportado.
- **El nombre del prop en `toHtml`/el componente Vue debe coincidir
  exactamente** con la key del `FieldDescriptor` — un campo declarado como
  `icon`/`iconSize` pero leído como `name`/`size` en el renderer queda
  silenciosamente sin efecto. No hay ningún chequeo de tipos que lo detecte,
  solo un test explícito por nodo.
- Mantener `toHtml()` y el componente Vue en paridad visual **exacta** es
  responsabilidad manual del autor del nodo — no hay generación automática de
  uno a partir del otro. Cualquier prop nueva que agregues al componente Vue
  necesita su reflejo en `toHtml()` en el mismo cambio.

## 6. El componente Vue (`@kivcode/vue`)

Cada nodo tiene un `.vue` en `packages/vue/src/nodes/`, registrado por tipo en
`createDefaultVueRegistry()` (`packages/vue/src/defaultRegistry.ts`):

```ts
export function createDefaultVueRegistry() {
	const registry = createVueRegistry();
	registry.register("divider", DividerNode);
	// ...
	return registry;
}
```

`createVueRegistry()` (`packages/vue/src/registry.ts`) es un mapa simple
`type → Component`; `register()` lanza si el tipo ya existe. Si el nodo tiene
estado propio de interacción (abierto/cerrado, tab activo...), inyecta
`KIV_EDITOR_MODE_KEY`/`KIV_BUS_KEY` para saber si está en modo editor
(interacciones deshabilitadas) — `ModalNode.vue` es la referencia: declara sus
propios eventos vía `declare module "@kivcode/engine" { interface KivEventMap {
"modal.opened": {...}; "modal.closed": {...} } }` y los emite a través del bus
inyectado (ver [Eventos](./events.md)). `packages/react/src/defaultRegistry.ts`
sigue el mismo patrón para el renderer React, con `createReactRegistry()`.

Un ícono de nodo se declara aparte, en `NodeIcon.vue`
(`@kivcode/vue-editor`) — un único componente SVG con un `<template v-if>` por
`type`. Si tu nodo no agrega una rama ahí, cae al fallback genérico (un
diamante); vale la pena agregar un ícono dedicado cuando el nodo es de uso
frecuente en la paleta.

## 7. Errores comunes a evitar

- **`withDefaults()` en props booleanas con default `true`.** Vue coacciona un
  prop booleano omitido a `false`, no a `undefined`, si el componente no
  declara un default explícito con `withDefaults()`. Encontrado dos veces en
  este proyecto (`ContainerNode.vue`, `ModalNode.vue`) — cualquier prop
  booleana cuyo default lógico sea `true` necesita `withDefaults()` explícito
  o el nodo nace "apagado" en el editor sin que nadie lo note.
- **Nombre de prop distinto entre el schema y el consumidor** (ver sección 5)
  — declarar `icon`/`iconSize` pero leer `name`/`size` en `toHtml()` o el
  componente. Sin tests de `toHtml()` por nodo, este tipo de bug pasa
  desapercibido indefinidamente.

## 8. Tests

Como mínimo, cada nodo necesita:

1. **Los defaults satisfacen el propio schema.** Este test ya existe de forma
   genérica para todo `ALL_NODES` en `packages/nodes/src/nodes.test.ts`:

   ```ts
   it("every node's defaults satisfy its own compiled schema", () => {
   	for (const node of ALL_NODES) {
   		const result = node.schema.safeParse(node.defaults);
   		expect(result.success, `${node.type}: ${JSON.stringify(result.error?.issues)}`).toBe(true);
   	}
   });
   ```

   Un nodo nuevo solo necesita agregarse a `ALL_NODES` para quedar cubierto —
   no hace falta escribir este test de nuevo por nodo.

2. **Un test de `toHtml()` por cada rama de comportamiento no trivial.**
   `nodes.test.ts` ya tiene un `describe` por nodo con este patrón; para
   `divider`:

   ```ts
   describe("divider", () => {
   	it("renders the configured line style as a border-top style", () => {
   		const html = dividerNode.toHtml?.(
   			{ lineStyle: "dashed", thickness: 2, color: "#ff0000" },
   			{},
   			ctx,
   		);
   		expect(html).toContain("border-top:2px dashed #ff0000");
   	});

   	it('resolves width "full" to 100%', () => {
   		const html = dividerNode.toHtml?.({ width: "full" }, {}, ctx);
   		expect(html).toContain("width:100%");
   	});
   });
   ```

   `ctx` es el `ToHtmlContext` mínimo compartido por todo el archivo:
   `{ locale: "en", breakpoint: "base" }`. Cada rama condicional real de
   `toHtml()` (un `if`, un valor especial como `"full"`, un flag que agrega/
   quita un elemento) merece su propio `it` — en este proyecto, cada test
   agregado con este patrón encontró o hubiera podido encontrar un bug real
   (nombre de prop equivocado, estilo no aplicado, escape faltante).

## Referencias

Código fuente: `packages/engine/src/schema/define-node.ts`,
`packages/engine/src/schema/field.ts`, `packages/engine/src/schema/fields.ts`,
`packages/nodes/src/*-field(s).ts`, `packages/nodes/src/content/divider.ts` (y
cualquier otro archivo en `content/`/`layout/` como referencia adicional de un
nodo completo), `packages/nodes/src/nodes.test.ts`,
`packages/vue/src/defaultRegistry.ts`, `packages/vue/src/registry.ts`,
`packages/vue-editor/src/components/NodeIcon.vue`.
