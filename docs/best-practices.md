# Buenas prácticas

Esta lista es real: cada punto sale de un bug encontrado y corregido, o de un
patrón que se repitió lo suficiente en el proyecto como para convertirse en
regla. No es una lista de aspiraciones — es la memoria de lo que ya salió mal
una vez.

## Hacer

### Una sola fuente de verdad para cada concepto de campo

Antes de escribir un `FieldDescriptor` a mano, revisar si ya existe un helper
compartido en `packages/nodes/src/*-field(s).ts` que lo resuelva. Si dos nodos
necesitan "casi lo mismo", la respuesta es extender el helper con una opción,
nunca duplicar el `FieldDescriptor` en cada nodo.

```ts
// packages/nodes/src/spacing-field.ts
export function spacingField(
	opts: SpacingFieldOptions = {},
): FieldDescriptor<SpacingBoxValue> {
	return {
		schema: spacingBoxSchema,
		control: "text",
		pluginControl: "spacing-box",
		responsive: opts.responsive ?? true,
		spacingScale: opts.scale ?? SPACING,
		default: { ...DEFAULT_SPACING_BOX, ...opts.default },
	};
}
```

Un nodo que necesita padding no reescribe el control — pide el campo y, si
necesita una escala distinta (una `Section` con espaciados más grandes que un
`Stack`), la pasa como opción:

```ts
padding: spacingField({ scale: SECTION_SPACING, group: "Layout" });
```

Esto es lo que hace posible el **"editar una vez, actualiza en todas partes"**:
`typographyFields()`, `linkFields()` y `spacingField()` no son azúcar sintáctico
— son el único lugar donde existe la definición de "qué es la tipografía de un
nodo" o "qué es un link". Si mañana un campo de tipografía necesita un nuevo
control (por ejemplo, restringir los pesos disponibles a los que la fuente
seleccionada realmente tiene), se cambia en `typography-field.ts` y los ~15
nodos que usan `typographyFields()` lo heredan sin tocarlos:

```ts
// packages/nodes/src/typography-field.ts
weight: f.select(opts.weightOptions ?? DEFAULT_WEIGHTS, {
	label: "Weight",
	default: opts.weightDefault ?? "400",
	responsive: true,
	group: g,
	pluginControl: "font-weight", // narrows a los pesos que la familia elegida realmente ships
});
```

Lo mismo aplica a `linkFields()`: cada nodo clicable (`button`, `card`,
`image`...) pide el mismo par `linkType`/`href` y el mismo `resolveLink()` para
convertirlos en atributos reales, en vez de que cada nodo reinvente su propia
noción de "a dónde navega esto".

### `withDefaults()` en cualquier prop booleana con default `true`

Vue coacciona un prop booleano omitido a `false` (no a `undefined`) si no tiene
default explícito. Encontrado dos veces en este proyecto (`ContainerNode.vue`
con `centered`, `ModalNode.vue` con `showTrigger`/`closeOnOverlay`/
`closeOnEscape`/`showCloseButton`/`preventScroll`), ambas veces rompiendo
silenciosamente el comportamiento por defecto.

```ts
// mal — omitir el prop se comporta como `false`, no como "sin especificar"
const props = defineProps<{ centered?: boolean }>();

// bien
const props = withDefaults(defineProps<{ centered?: boolean }>(), {
	centered: true,
});
```

### Mantener `toHtml()` y el componente Vue en paridad exacta

Son dos implementaciones del mismo nodo — una para SSR/export
(`renderToHtml()`), otra para el editor y el renderer en vivo
(`@kivcode/vue`). Un cambio visual en una sin la otra es un bug de export
silencioso que ningún typecheck detecta, porque ambas compilan igual de bien
por separado.

### Ids deterministas en cualquier código que construya un árbol de nodos programáticamente

Templates, migraciones y seeds nunca deben usar `Date.now()` ni contadores
globales entre llamadas para generar `id`. La unicidad al insertar se resuelve
en el punto de inserción (`cloneNodeTree()`), no en la construcción del árbol
— así un template puede definirse una sola vez como constante y usarse muchas
veces sin colisiones.

### Batchear mutaciones continuas

Drag, sliders y color pickers deben envolver su secuencia de cambios con
`startBatch()`/`endBatch()` (o el composable `useContinuousEdit`), para que un
gesto completo sea un solo paso de undo en vez de docenas:

```ts
// packages/vue-editor/src/inspector/controls/ColorGradientControl.vue
const { start, end } = useContinuousEdit(store);

function patch(partial: Partial<ColorOrGradientValue>) {
	start();
	emit("update:modelValue", { ...value.value, ...partial });
}
```

### Verificar en navegador, no solo con tests

Varios bugs reales de este proyecto (el ícono de trigger del modal nunca se
renderizaba pese a que el `computed` existía; un nodo invisible en el canvas
del editor pese a tener auto-open activo) solo eran detectables abriendo el
editor real — typecheck y tests pasaban limpios en ambos casos porque
verificaban la lógica, no lo que terminaba en el DOM.

## El patrón open-at-the-edges: tokens conocidos, valores crudos como escape hatch

`spacingField`, `resolveFontStack` y las escalas de `packages/nodes/src/scales.ts`
comparten la misma regla: **un valor conocido (token/id) se resuelve a través de
una escala o un provider; un valor no reconocido pasa sin tocar.** Ningún campo
de estilo es una lista cerrada que bloquee al usuario cuando el diseño de
verdad necesita algo fuera de la escala.

```ts
// packages/engine/src/fonts/types.ts
export function resolveFontStack(
	value: unknown,
	fonts: KivFont[],
	fallback = "inherit",
): string {
	if (value === undefined || value === null || value === "") return fallback;
	const key = String(value);
	// id conocido → stack real del provider; cualquier otra cosa (un stack
	// crudo escrito a mano) pasa sin tocar.
	return fonts.find((fnt) => fnt.id === key)?.stack ?? key;
}
```

`SpacingBoxValue` sigue el mismo principio del lado del dato: cada lado guarda
*o* un token de escala (`"md"`) *o* una longitud CSS cruda (`"2.5rem"`), y el
control resuelve cuál es cuál sin que el nodo necesite saberlo. Al diseñar un
campo nuevo con una escala propia, replicar esta forma — nunca forzar al
usuario a elegir entre "solo tokens" o "solo texto libre".

## `Responsive<T>` y `Localizable<T>`: ejes independientes, nunca mezclados

Ver [Arquitectura](./architecture.md) para la regla completa. En código, son
dos wrappers distintos sobre el mismo valor (`ResponsiveObject<T>` con
`base`/`sm`/`md`/`lg`/`xl`, y `LocalizedObject<T>` con `$t`), y la resolución
siempre corre responsive primero, locale después:

```ts
// packages/engine/src/resolver/resolve-node.ts
export function resolveProps(
	props: Record<string, unknown>,
	ctx: ResolveContext,
): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(props)) {
		const afterResponsive = resolveResponsive(value, ctx.breakpoint);
		out[key] = resolveLocalized(afterResponsive, ctx.locale, ctx.fallbackLocale);
	}
	return out;
}
```

Un mismo prop puede ser responsive y localizable a la vez (un texto que cambia
de tamaño por breakpoint y de idioma por locale), pero nunca se combinan en un
solo wrapper — sería ambiguo si `{ base: {...}, $t: {...} }` significa "un
`$t` por breakpoint" o "un breakpoint por `$t`". `resolveResponsive()` hereda
mobile-first (si `lg` no está definido, cae al valor definido más cercano hacia
abajo — `md`, luego `sm`, luego `base`); `resolveLocalized()` cae al
`fallbackLocale` si el locale activo no tiene traducción. Ambas funciones
devuelven el valor sin tocar si no reconocen el shape (`isResponsive`/
`isLocalized` primero) — el mismo patrón open-at-the-edges de arriba, aplicado
al modelo de datos en vez de a una escala de estilos.

## Evitar

- **No dupliques el Inspector.** El Inspector de Kiv es deliberadamente único y
  genérico (`KivInspector.vue` + `FieldControl.vue`) — la tentación de "un panel
  especial para este nodo" casi siempre se resuelve mejor con un control de
  campo custom (`pluginControl`, ver
  [Crear un control de Inspector](./creating-an-inspector-control.md)).
- **No hardcodees CSS que ya existe como escala/token compartido**
  (`SPACING`, `LETTER_SPACING`, `LINE_HEIGHT` en
  `packages/nodes/src/scales.ts`) — usa la escala, no el valor mágico.
- **No metas lógica de negocio específica de un consumidor en
  `@kivcode/nodes`.** Un nodo atado a datos/backend de un proyecto específico
  vive en el paquete de ese proyecto (ver [Migración](./migration.md)), no en
  el núcleo.
- **No asumas que un prop pasado a un template/nodo realmente se usa.** La
  auditoría encontró varios templates de contenido pasando props que el nodo
  destino simplemente ignoraba (`action`/`color` en vez de `href`/`textColor`,
  `height` en un nodo que solo tiene `width`+`aspectRatio`). Verificar contra
  el `fields` real del nodo, no contra lo que "suena razonable".
- **No spread un valor de campo sin normalizarlo primero.** Un valor legacy
  (string plano de antes de que el campo existiera como objeto) spreadeado
  directamente itera sus caracteres como índices de array y corrompe el
  objeto. Por eso `normalizeSpacingBox()` y `normalizeColorOrGradient()`
  existen — cualquier control nuevo sobre un campo con historia debe pasar por
  su normalizador, no por `{ ...modelValue, ...partial }` a ciegas:

```ts
// packages/vue-editor/src/inspector/controls/ColorGradientControl.vue
const value = computed(() => normalizeColorOrGradient(props.modelValue));
```

- **No migres datos de producción de forma destructiva** al integrar Kiv en un
  proyecto existente — ver el principio rector completo en
  [Migración](./migration.md).
