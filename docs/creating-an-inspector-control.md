# Crear un control de Inspector

El Inspector de Kiv es deliberadamente **único y genérico**
(`KivInspector.vue` + `FieldControl.vue`, en
`packages/vue-editor/src/inspector/`) — no existen ni deben existir
inspectores dedicados por tipo de nodo. Cuando un campo necesita una UI
distinta a los controles base (`text`, `textarea`, `number`, `select`,
`boolean`, `color`), la respuesta es registrar un control custom
(`pluginControl`), nunca un inspector paralelo para ese nodo.

## 1. Cuándo un control custom es la respuesta correcta

`FieldControl.vue` ya resuelve, según `descriptor.control`
(`FieldControl` de `@kivcode/engine`: `"text" | "textarea" | "number" |
"select" | "boolean" | "color"`), uno de seis controles base. Si el campo cabe
en uno de esos seis, **no hace falta un control custom** — solo declararlo así
en el `FieldDescriptor` del nodo.

Un control custom hace falta cuando la edición necesita algo que esos seis no
cubren: una unidad de medida con slider y auto/custom (`size-slider`), un
selector de tipografías del proyecto (`font-picker`), un selector de weight
acoplado al font elegido (`font-weight`), un editor de tabla, un selector de
gradiente, etc. — todos ya existen en
`packages/vue-editor/src/inspector/controls/` y sirven de plantilla.

## 2. `pluginControl` en un `FieldDescriptor`

`FieldDescriptor` (`packages/engine/src/schema/field.ts`) tiene un campo
opcional para esto:

```ts
export interface FieldDescriptor<T = unknown> {
	schema: ZodType;
	control: FieldControl;
	// ...
	/**
	 * Override the control with a plugin-registered custom control name.
	 * If set, the editor checks extension points for a control with this name
	 * and renders it instead of the default control type.
	 */
	pluginControl?: string;
	// campos de configuración específicos de ciertos controles built-in:
	sliderUnits?: ReadonlyArray<{ unit: string; min: number; max: number; step?: number }>;
	spacingScale?: Readonly<Record<string, string>>;
	allowAuto?: boolean;
	autoLabel?: string;
}
```

`FieldControl.vue` resuelve el nombre de control con
`descriptor.pluginControl ?? descriptor.control`, y si `pluginControl` está
seteado y hay un componente registrado bajo ese nombre en `EditorExtensions`,
renderiza ese componente **en lugar** del control base — incluso si `control`
sigue apuntando a algo como `"text"` (útil como fallback cuando el plugin no
está registrado: el campo sigue siendo editable con el control base).

Ejemplo real, del `FieldDescriptor` de un campo de tamaño libre:

```ts
minHeight: {
	schema: z.string().optional(),
	control: "text",
	pluginControl: "size-slider",
	sliderUnits: [
		{ unit: "px", min: 0, max: 800, step: 1 },
		{ unit: "%", min: 0, max: 100, step: 1 },
	],
	allowAuto: true,
	autoLabel: "auto",
	label: "Min height",
},
```

## 3. Registrar el control

`extensions.addFieldControl(name, Component)` — normalmente desde
`KivEditor.vue`, que registra todos los controles built-in del propio paquete
al montarse:

```ts
const extensions = new EditorExtensions();
extensions.addFieldControl("icon-picker", IconPicker);
extensions.addFieldControl("font-picker", FontPicker);
extensions.addFieldControl("font-weight", FontWeightControl);
extensions.addFieldControl("color-gradient", ColorGradientControl);
extensions.addFieldControl("size-slider", SizeSliderControl);
extensions.addFieldControl("spacing-box", SpacingBoxControl);
extensions.addFieldControl("media-picker", MediaPicker);
extensions.addFieldControl("table-editor", TableEditor);
extensions.addFieldControl("pricing-editor", PricingEditor);
extensions.addFieldControl("social-links-editor", SocialLinksEditor);
provide(EDITOR_EXTENSIONS_KEY, extensions);
```

Un plugin externo hace lo mismo desde su `onEditorReady(extensions)` (recibido
cuando `KivEditor` tiene una prop `engine` — ver [Editor](./editor.md)):

```ts
export function myPlugin() {
	return {
		name: "my-plugin",
		onEditorReady(extensions) {
			extensions.addFieldControl("opacity-slider", OpacitySlider);
		},
	};
}
```

Ejemplos reales que siguen exactamente este patrón, cada uno una plantilla
válida según el caso: `icon-picker`, `font-picker`, `font-weight`,
`color-gradient`, `size-slider`, `spacing-box`, `media-picker`, `table-editor`,
`pricing-editor`, `social-links-editor` — todos en
`packages/vue-editor/src/inspector/controls/`.

## 4. Props/eventos que el control debe implementar

No hay un tipo `PluginFieldControlProps` compartido y exportado — `ComponentDef`
en `@kivcode/engine` es literalmente `unknown` (el engine no conoce Vue/React;
ver [Arquitectura](./architecture.md)). Cada control declara sus propios props
con `defineProps`, y `FieldControl.vue` los alimenta así, siempre:

```vue
<component
	:is="customControl"
	v-if="customControl"
	:model-value="modelValue"
	:field-key="fieldKey"
	:descriptor="descriptor"
	:node-props="nodeProps"
	@update:model-value="emit('update:modelValue', $event)"
/>
```

Es decir, un control custom **recibe siempre** estas cuatro props (aunque
declare solo las que use — Vue no exige declarar props que no le interesan) y
**debe emitir** `update:modelValue`:

- `modelValue: unknown` — el valor actual del campo (ya resuelto para el
  breakpoint/locale activos).
- `fieldKey: string` — la clave del prop en el nodo.
- `descriptor: FieldDescriptor` — el descriptor completo; de ahí vienen
  `sliderUnits`, `allowAuto`, `label`, etc.
- `nodeProps?: Record<string, unknown>` — **todos** los props del nodo, no
  solo este campo. Existe para que un control dependa de un campo hermano.
  Ejemplo real, `FontWeightControl.vue`, que narrows sus opciones de weight al
  font elegido en el campo `fontFamily` del mismo nodo:

  ```ts
  const props = defineProps<{
  	modelValue?: string;
  	nodeProps?: Record<string, unknown>;
  }>();

  const weights = computed(() =>
  	fontWeights(props.nodeProps?.fontFamily, store?.fonts?.list() ?? []),
  );
  ```

  Sin `nodeProps`, este control no tendría forma de saber qué familia está
  eligiendo el usuario en otro campo del mismo nodo.

- Evento: `emit("update:modelValue", value)` — como cualquier `v-model` de
  Vue. Es el único contrato de escritura hacia el store; el control nunca
  llama `store.updateProps` directamente, deja que quien lo contiene (el
  `FieldControl` padre, y más arriba el inspector) propague el cambio.

Un control puede además `inject(EDITOR_STORE_KEY, null)` si necesita datos del
proyecto — `FontPicker.vue` lo hace para leer `store.fonts.list()` y ofrecer
solo las tipografías que el proyecto anfitrión registró:

```ts
const store = inject(EDITOR_STORE_KEY, null);
const fonts = computed<KivFont[]>(() => store?.fonts?.list() ?? []);
```

## 5. Controles de arrastre continuo — `useContinuousEdit`

Un slider o color picker dispara un evento `input` por cada tick del gesto.
Sin agrupar esos ticks, cada uno se convierte en un paso de undo independiente
— soltar el mouse después de arrastrar un slider debería deshacerse con un
solo Cmd+Z, no con veinte. Este fue un bug real encontrado y corregido en este
proyecto; el patrón para no reintroducirlo es `useContinuousEdit`
(`packages/vue-editor/src/composables/useContinuousEdit.ts`):

```ts
const store = inject(EDITOR_STORE_KEY, null);
const { start, end } = useContinuousEdit(store);
```

- Llamar `start()` en el primer tick del gesto — dentro del mismo handler que
  emite `update:modelValue`, sin condición extra: `start()` es un no-op si ya
  hay un batch activo (`if (active || !store) return;`), así que se puede
  llamar en cada tick sin abrir batches anidados.
- Agregar `@change="end"` en el elemento raíz del control (o en el `<input>`
  mismo) — `change` en un `<input type="range">`/`<input type="color">` se
  dispara exactamente una vez, al soltar.

Ejemplo real, `SizeSliderControl.vue`:

```ts
function onSlider(e: Event) {
	start();
	commit(Number((e.target as HTMLInputElement).value), activeUnit.value);
}
```

```vue
<div class="kiv-size-slider" @change="end">
	<!-- ... input type="range" con @input="onSlider" ... -->
</div>
```

`useContinuousEdit` también limpia el batch en `blur` de la ventana (por si el
usuario suelta el drag fuera del elemento) y en `onBeforeUnmount` del propio
composable — un control nuevo no necesita reimplementar ninguna de esas dos
salvaguardas, vienen incluidas.

## 6. Ejemplo completo — slider de opacidad 0–1

Un control nuevo, `opacity-slider`, para un campo `opacity: number` entre 0 y
1, siguiendo los mismos cuatro pasos anteriores.

**Declarar el campo con `pluginControl`:**

```ts
// en el defineNode() del nodo que lo necesite
opacity: {
	schema: z.number().min(0).max(1).optional(),
	control: "number",
	pluginControl: "opacity-slider",
	default: 1,
	label: "Opacity",
	group: "Layout",
},
```

**El componente del control**
(`packages/vue-editor/src/inspector/controls/OpacitySlider.vue` si viviera en
el propio paquete, o en el paquete del plugin que lo registre):

```vue
<script setup lang="ts">
import { computed, inject } from "vue";
import { useContinuousEdit } from "../../composables/useContinuousEdit";
import { EDITOR_STORE_KEY } from "../../store/context";

const props = defineProps<{
	modelValue?: number;
}>();
const emit = defineEmits<{ "update:modelValue": [value: number] }>();

const store = inject(EDITOR_STORE_KEY, null);
const { start, end } = useContinuousEdit(store);

// Igual que SizeSliderControl: un nodo puede no tener el prop seteado todavía
// (creado antes de que el campo existiera) — mostrar 1 (opaco) en vez de 0.
const value = computed(() => props.modelValue ?? 1);
const percentLabel = computed(() => `${Math.round(value.value * 100)}%`);

function onSlider(e: Event) {
	start();
	const next = Number((e.target as HTMLInputElement).value);
	emit("update:modelValue", next);
}
</script>

<template>
	<div class="kiv-opacity-slider" @change="end">
		<input
			type="range"
			class="kiv-opacity-slider__range"
			min="0"
			max="1"
			step="0.01"
			:value="value"
			@input="onSlider"
		/>
		<span class="kiv-opacity-slider__value">{{ percentLabel }}</span>
	</div>
</template>

<style scoped>
.kiv-opacity-slider {
	display: flex;
	align-items: center;
	gap: 8px;
}
.kiv-opacity-slider__range {
	flex: 1;
	accent-color: var(--color-accent);
	height: 4px;
	cursor: pointer;
}
.kiv-opacity-slider__value {
	flex-shrink: 0;
	width: 36px;
	text-align: right;
	font-size: 0.72rem;
	font-variant-numeric: tabular-nums;
	color: var(--color-text-secondary);
}
</style>
```

**Registrarlo:**

```ts
// KivEditor.vue, junto a los demás addFieldControl, o en onEditorReady de un plugin externo
import OpacitySlider from "../inspector/controls/OpacitySlider.vue";

extensions.addFieldControl("opacity-slider", OpacitySlider);
```

Con eso, cualquier campo que declare `pluginControl: "opacity-slider"` en su
`FieldDescriptor` renderiza este control en el inspector, con undo agrupado
por gesto y sin tocar `FieldControl.vue` ni el core del editor.
