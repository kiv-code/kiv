<script setup lang="ts">
import type { Breakpoint, FieldDescriptor } from "@kivcode/engine";
import { computed, inject } from "vue";
import { EDITOR_EXTENSIONS_KEY } from "../store/context";
import BooleanControl from "./controls/BooleanControl.vue";
import ColorControl from "./controls/ColorControl.vue";
import NumberControl from "./controls/NumberControl.vue";
import SelectControl from "./controls/SelectControl.vue";
import TextareaControl from "./controls/TextareaControl.vue";
import TextControl from "./controls/TextControl.vue";

const props = defineProps<{
	fieldKey: string;
	descriptor: FieldDescriptor;
	modelValue: unknown;
	breakpoint?: Breakpoint;
	locale?: string;
	/** The whole node's props — lets a control depend on a sibling field, e.g.
	 * the weight control narrowing its options to the chosen font's real cuts. */
	nodeProps?: Record<string, unknown>;
}>();

const extensions = inject(EDITOR_EXTENSIONS_KEY, null);

// Everything derived from `descriptor` must be computed, not a one-shot const:
// Vue reuses a FieldControl instance when two nodes share a field key inside the
// same group, so a plain const would keep the PREVIOUS node's control/label —
// e.g. Card's gradient `background` rendering with Stack's plain-color control,
// which writes an object into a string prop and surfaces as "[object Object]".
const pluginControlKey = computed(
	() => props.descriptor.pluginControl ?? props.descriptor.control,
);
const customControl = computed(() =>
	pluginControlKey.value
		? extensions?.getFieldControl(pluginControlKey.value)
		: undefined,
);

const emit = defineEmits<{ "update:modelValue": [value: unknown] }>();

const label = computed(() => props.descriptor.label ?? props.fieldKey);

const selectOptions = computed(
	() => props.descriptor.options?.map((o) => String(o.value)) ?? [],
);

const BP_SHORT: Record<string, string> = {
	base: "",
	sm: "SM",
	md: "MD",
	lg: "LG",
	xl: "XL",
};
const bpBadge = computed(() =>
	props.descriptor.responsive && props.breakpoint && props.breakpoint !== "base"
		? (BP_SHORT[props.breakpoint] ?? "")
		: "",
);
const localeBadge = computed(() =>
	props.locale ? props.locale.toUpperCase() : "",
);
</script>

<template>
	<div class="kiv-field">
		<!-- Label row: label on left, badges on right (never overlaps the control) -->
		<div v-if="descriptor.control !== 'boolean'" class="kiv-field__label-row">
			<span class="kiv-field__label">{{ label }}</span>
			<span class="kiv-field__badges">
				<span v-if="localeBadge" class="kiv-field__locale-badge">{{ localeBadge }}</span>
				<span v-if="bpBadge" class="kiv-field__bp-badge">{{ bpBadge }}</span>
			</span>
		</div>
		<!-- Custom plugin control (if registered for this field type) -->
		<component
			:is="customControl"
			v-if="customControl"
			:model-value="modelValue"
			:field-key="fieldKey"
			:descriptor="descriptor"
			:node-props="nodeProps"
			@update:model-value="emit('update:modelValue', $event)"
		/>
		<!-- For boolean we pass the badge separately so BooleanControl can show it inline -->
		<BooleanControl
			v-else-if="descriptor.control === 'boolean'"
			:label="label"
			:bp-badge="bpBadge"
			:model-value="(modelValue as boolean | undefined)"
			@update:model-value="emit('update:modelValue', $event)"
		/>
		<ColorControl
			v-else-if="descriptor.control === 'color'"
			:model-value="(modelValue as string | undefined)"
			@update:model-value="emit('update:modelValue', $event)"
		/>
		<SelectControl
			v-else-if="descriptor.control === 'select'"
			:model-value="(modelValue as string | undefined)"
			:options="selectOptions"
			@update:model-value="emit('update:modelValue', $event)"
		/>
		<NumberControl
			v-else-if="descriptor.control === 'number'"
			:model-value="(modelValue as number | undefined)"
			@update:model-value="emit('update:modelValue', $event)"
		/>
		<TextareaControl
			v-else-if="descriptor.control === 'textarea'"
			:model-value="(modelValue as string | undefined)"
			:placeholder="descriptor.placeholder"
			@update:model-value="emit('update:modelValue', $event)"
		/>
		<TextControl
			v-else
			:model-value="(modelValue as string | undefined)"
			@update:model-value="emit('update:modelValue', $event)"
		/>
		<!-- Node authors write these to disambiguate overlapping fields (e.g. how
		     `paddingBox` interacts with the `paddingX/Y` shorthand). Rendering them
		     is what makes those pairs legible instead of looking duplicated. -->
		<p v-if="descriptor.hint" class="kiv-field__hint">{{ descriptor.hint }}</p>
	</div>
</template>

<style scoped>
.kiv-field {
	display: flex;
	flex-direction: column;
	gap: 4px;
}
.kiv-field__label-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 6px;
}
.kiv-field__label {
	font-size: 0.65rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.07em;
	color: var(--color-text-secondary);
}

.kiv-field__hint {
	margin: 0.25rem 0 0;
	font-size: 0.65rem;
	line-height: 1.4;
	color: var(--color-text-secondary);
	opacity: 0.8;
}
.kiv-field__badges {
	display: flex;
	align-items: center;
	gap: 4px;
	flex-shrink: 0;
}
.kiv-field__bp-badge {
	font-size: 0.55rem;
	font-weight: 700;
	padding: 1px 5px;
	border-radius: 3px;
	background: var(--color-accent-muted);
	color: var(--color-accent-light);
	letter-spacing: 0.04em;
	flex-shrink: 0;
}
.kiv-field__locale-badge {
	font-size: 0.55rem;
	font-weight: 700;
	padding: 1px 5px;
	border-radius: 3px;
	background: rgba(52, 211, 153, 0.16);
	color: #6ee7b7;
	letter-spacing: 0.04em;
	flex-shrink: 0;
}
</style>
