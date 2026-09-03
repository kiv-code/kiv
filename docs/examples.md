# Ejemplos

Casos reales, cada uno apuntando a código que corre en este repo hoy —
`apps/demos/vue/` es el demo interno de Kiv, no algo que un consumidor copie
tal cual (ver [Migración](./migration.md) para qué separar de un demo al
integrar en un proyecto real), pero el flujo que muestra es real.

## Registrar tu propio `FontProvider`

El editor solo ofrece las fuentes que el proyecto host declara — nunca inventa
un typeface que la página no vaya a cargar. `apps/demos/vue/src/App.vue`
implementa uno concreto:

```ts
import { createEngine, type FontProvider } from "@kivcode/engine";

const demoFontProvider: FontProvider = {
	list: () => [
		{
			id: "montserrat",
			label: "Montserrat",
			stack: '"Montserrat", system-ui, sans-serif',
			weights: [400, 500, 600, 700, 800, 900],
			italic: true,
			category: "sans",
		},
		{
			id: "jetbrains",
			label: "JetBrains Mono",
			stack: '"JetBrains Mono", ui-monospace, monospace',
			weights: [400, 500, 700],
			category: "mono",
		},
	],
	// CSS que la página necesita para que estas fuentes carguen — KivRenderer
	// la inyecta una sola vez.
	stylesheet: () =>
		"@import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400..900;1,400..900&family=JetBrains+Mono:wght@400;500;700&display=swap');",
};

const engine = createEngine({
	nodes: [...ALL_NODES, ...ALL_INTERACTIVE_NODES],
	fonts: { provider: demoFontProvider },
});
```

El `fonts` del engine tiene que llegar tanto al renderer en vivo como al canvas
del editor — ninguno de los dos lo asume automáticamente:

```vue
<KivRenderer :document="doc" :registry="engine.registry" :fonts="engine.fonts" />
```

Dentro de `@kivcode/vue-editor`, `KivEditor.vue` ya hace este cableado por ti a
partir del `engine` que le pasas (`fonts: props.engine?.fonts ?? null`), y
`FontPicker.vue` lee la lista vía `store.fonts?.list()` — si no configuras un
provider, cae a `systemFontProvider` (Sans/Serif/Mono genéricos), nunca a una
lista inventada.

## Exportar una página a HTML estático con `renderToHtml()`

El botón "Export HTML" del demo (`apps/demos/vue/src/App.vue`) resuelve el
documento actual a HTML sin Vue ni DOM, útil para SSR/export/email:

```ts
import { renderToHtml } from "@kivcode/engine";

function exportHtml() {
	const body = renderToHtml(doc.value, {
		registry: engine.registry,
		locale: previewLocale.value,
		breakpoint: exportBreakpoint.value, // export = un solo breakpoint fijo, sin media queries
	});

	// renderToHtml() solo produce el HTML de cada nodo vía su propio toHtml() —
	// las variables de tema, el reset y las clases .kiv-hover-* (los :hover no
	// se pueden inlinear) viven en el stylesheet global de la app, así que
	// hay que inyectarlas a mano para que el export no se vea sin estilos.
	const html = `<!doctype html>
<html lang="${doc.value.i18n.default}">
<head><meta charset="utf-8"><style>${engine.css()}\n${HOVER_EFFECTS_CSS}</style></head>
<body>${body}</body>
</html>`;
}
```

El punto clave: `toHtml()` es responsabilidad de cada nodo (ver
[Buenas prácticas](./best-practices.md#mantener-tohtml-y-el-componente-vue-en-paridad-exacta)
sobre mantenerlo en paridad con el componente Vue), y un tipo de nodo sin
`toHtml()` registrado cae a un `<div>` en vez de romper el export completo.

## Un nodo custom mínimo

Walkthrough completo en [Crear un Node](./creating-a-node.md). La forma
mínima: schema de campos + defaults, nunca un componente — cada renderer
provee el suyo:

```ts
import { defineNode, f } from "@kivcode/engine";

export const calloutNode = defineNode({
	type: "callout",
	category: "content",
	label: "Callout",
	fields: {
		text: f.text({ label: "Text", default: "" }),
		tone: f.select(["info", "warning", "danger"], {
			label: "Tone",
			default: "info",
		}),
	},
	toHtml: (props) => `<div class="kiv-callout kiv-callout--${props.tone}">${props.text}</div>`,
});
```

Este nodo se registra en el `registry` del engine (o vía `createEngine({
nodes })`) y necesita, además, un `CalloutNode.vue` en el paquete renderer que
lo monte con las mismas props — es la mitad que este documento resume; la
guía completa explica `slots`, `slotConstraints` y metadata de editor.

## Un control de Inspector custom

Walkthrough completo en
[Crear un control de Inspector](./creating-an-inspector-control.md). Un
control real y compacto, `SelectControl.vue`, ilustra la forma mínima:
recibe `modelValue` + las `options` que declaró el `FieldDescriptor`, emite
`update:modelValue`, y no sabe nada del nodo que lo está usando — el mismo
control sirve para el `align` de un texto o el `tone` de un callout.

```vue
<script setup lang="ts">
const props = defineProps<{ modelValue?: string; options?: string[] }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
</script>

<template>
	<select :value="modelValue" @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)">
		<option v-for="opt in options" :key="opt" :value="opt">{{ opt }}</option>
	</select>
</template>
```

Un control que necesita estado propio o lógica de normalización — como
`ColorGradientControl.vue`, que resuelve un valor legado string vs. el shape
de gradiente actual — se registra con `pluginControl` en el `FieldDescriptor`
en vez de con `control`, y el Inspector genérico lo resuelve igual: nunca hace
falta un inspector dedicado por tipo de nodo (ver
[Buenas prácticas](./best-practices.md#evitar)).
