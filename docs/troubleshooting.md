# Troubleshooting

> 🚧 Pendiente de redactar en forma completa — los primeros 3 casos ya son reales
> (extraídos de bugs encontrados y corregidos durante la auditoría de este
> proyecto), no hipotéticos. Seguir agregando casos reales a medida que aparezcan,
> nunca casos inventados "por si acaso".

## "Cambié un campo por defecto a `true` pero el nodo se comporta como si fuera `false`"

Causa casi segura: el prop es un `boolean` declarado solo por tipo
(`miProp?: boolean`) sin `withDefaults()`. Vue coacciona un prop booleano omitido
a `false`, no a `undefined`, cuando no tiene default explícito — así que
cualquier chequeo `props.miProp !== false` sigue evaluando `false` cuando el
prop simplemente no se pasó. Solución: `withDefaults(defineProps<...>(), {
miProp: true })`. Casos reales ya encontrados en este proyecto:
`ContainerNode.vue` (`centered`), `ModalNode.vue` (`showTrigger`,
`closeOnOverlay`, `closeOnEscape`, `showCloseButton`, `preventScroll`).

## "Configuré un campo en el Inspector pero no tiene ningún efecto visual"

Verificar, en este orden:
1. ¿El nombre del campo en `fields` coincide **exactamente** con el nombre que
   lee `toHtml()`/el componente Vue? (bug real encontrado: un nodo `icon` con
   campo `name`/`size` en un template, cuando el nodo en realidad lee
   `icon`/`iconSize`).
2. ¿El componente Vue realmente usa ese prop en su `<template>`, o solo lo
   declara/calcula en un `computed` que nunca se renderiza? (bug real
   encontrado: `triggerIcon` del nodo `modal` — el `computed` existía, el
   `<template>` nunca lo mostraba).
3. ¿El valor por defecto del campo coincide con lo que el componente asume
   cuando el prop es `undefined`? (relacionado con el caso de arriba sobre
   booleans, pero aplica a cualquier tipo).

## "El editor no refleja el comportamiento real de una funcionalidad (autoplay, auto-open, etc.)"

Revisar si esa funcionalidad está deliberadamente deshabilitada en modo editor
(`inject(KIV_EDITOR_MODE_KEY)`) — es un patrón intencional de Kiv (no interrumpir
la edición con comportamiento en vivo), pero si no hay ninguna señal visual de
que está deshabilitada, es una falla de UX, no un bug funcional. Ver el patrón de
placeholder agregado al nodo `modal` (auto-open + trigger oculto) como referencia
de cómo comunicar esto dentro del propio canvas en vez de dejar el nodo
silenciosamente invisible/inerte.

## "Vi `[object Object]` en un campo de color"

Síntoma: el swatch o el input de un color muestra literalmente el texto
`[object Object]` en vez de un valor de color. Casi siempre significa que un
valor legado (guardado como string plano, de antes de que el campo pasara a
ser un objeto `{ solid, alpha, ... }` o de gradiente) llegó sin normalizar a
donde se espera un string — por ejemplo, interpolado directo en un `:style` o
concatenado en un `toHtml()`.

`normalizeColorOrGradient()` (`packages/nodes/src/color-gradient.ts`) existe
exactamente para esto, y `ColorGradientControl.vue` lo usa antes de tocar el
valor:

```ts
// packages/vue-editor/src/inspector/controls/ColorGradientControl.vue
const value = computed(() => normalizeColorOrGradient(props.modelValue));
```

El comentario del propio control es explícito sobre el riesgo relacionado:
nunca hagas `{ ...modelValue, ...partial }` a ciegas sobre un valor de color —
si `modelValue` resulta ser un string legado, el spread lo itera carácter por
carácter como si fuera un array y corrompe el objeto resultante. Cualquier
control o `toHtml()` nuevo que lea un campo de color debe pasar por el
normalizador correspondiente, no asumir la forma del objeto.

## "Elegí una fuente pero no cambió nada visualmente"

Un `fontFamily` guarda un **id** (`"montserrat"`), no un stack CSS — el id se
resuelve a un stack real vía `resolveFontStack(value, fonts)`
(`packages/engine/src/fonts/types.ts`). Si nada cambia visualmente, revisar en
este orden:

1. **¿El `fonts` del engine llegó al componente que renderiza?** `fonts` no se
   propaga solo — hay que pasarlo explícitamente tanto a `KivRenderer`
   (`<KivRenderer :fonts="engine.fonts" />`) como al canvas del editor (que lo
   toma de `store.fonts`, alimentado a su vez por `KivEditor.vue` desde
   `props.engine?.fonts`). Sin ese prop, todo cae a `systemFontProvider` — solo
   Sans/Serif/Mono genéricos — y cualquier id custom no resuelve a nada
   reconocible.
2. **¿El `FontProvider.list()` incluye ese id?** `resolveFontStack()` hace
   `fonts.find((fnt) => fnt.id === key)?.stack ?? key` — si el id no está en la
   lista del provider, la función devuelve el id tal cual como si fuera un
   stack CSS crudo (`"montserrat"` como `font-family` no es un nombre de
   familia válido, así que el navegador cae a su fuente por defecto en
   silencio, sin error visible).
3. Confirmar que el provider realmente carga la fuente en la página —
   `stylesheet()` debe devolver el `@import`/`@font-face` correspondiente, y
   `KivRenderer` lo inyecta una sola vez (`FONT_CSS_ID`). Un id correctamente
   resuelto a un stack que la página nunca cargó también renderiza con el
   fallback del navegador.

## "Apliqué un template y perdí mis traducciones"

Ya corregido: `applyTemplate()` en `KivEditor.vue` preserva explícitamente el
`i18n` del documento actual en vez de tomar el del template.

```ts
// packages/vue-editor/src/components/KivEditor.vue
function applyTemplate(template: PageTemplate): void {
	// Un template aporta contenido, no configuración de idioma — todos los
	// built-in traen un i18n de relleno { default: "en", supported: ["en"] }.
	// Tomarlo tal cual colapsaría un documento multi-locale a un solo idioma.
	store.loadDocument({
		...template.document,
		i18n: store.document.value.i18n ?? template.document.i18n,
	});
}
```

Si ves este síntoma en una versión del proyecto anterior a este fix, la causa
raíz era exactamente esa: `applyTemplate()` sobreescribía `i18n` con el del
template en vez de conservar el del documento activo. En versiones actuales,
el `i18n` del template solo se usa como fallback cuando el documento activo
no tiene ninguno (documento nuevo/vacío).

## Falla una migración de esquema (`migrateDocument`)

`@kivcode/engine` versiona la forma de un `KivDocument` con `schemaVersion`.
`migrateDocument()` (`packages/engine/src/migrations/`) recibe un documento y
lo lleva a `CURRENT_SCHEMA_VERSION`, aplicando en cadena cada paso registrado
en `migrations` (`{ from: number, ... }`) desde la versión del documento hasta
la actual. Si ya está en la versión actual, lo devuelve sin tocar
(`result === input`, sin clonar).

Dos formas de falla, ambas deliberadas (no bugs):

- **El documento es más nuevo que el engine** (`schemaVersion` mayor que
  `CURRENT_SCHEMA_VERSION`) — lanza un error explícito. Significa que el
  documento fue producido por una versión de `@kivcode/engine` más reciente que
  la instalada; la solución es actualizar el paquete, nunca "arreglar" el
  documento a mano.
- **Falta un paso de migración** para alguna versión intermedia entre la del
  documento y la actual — lanza indicando que no encontró la migración
  correspondiente. Esto solo debería pasar si el registro de `migrations` está
  incompleto (cada versión de `1` hasta `CURRENT_SCHEMA_VERSION - 1` debe tener
  su `from` correspondiente), no por nada que un consumidor externo pueda
  causar.

Como consumidor de Kiv, el patrón correcto es simple: pasar cualquier
documento cargado de almacenamiento por `migrateDocument()` antes de montarlo
en el editor o el renderer, y tratar ambos errores como una señal de mismatch
de versión entre el dato guardado y el paquete instalado — no como algo que se
recupera silenciosamente reparando el documento en el consumidor.

## (Sección en construcción)

Agregar aquí cualquier caso nuevo con: síntoma exacto que ve el usuario, causa
raíz confirmada (no una hipótesis), solución o workaround.
