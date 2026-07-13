<script setup lang="ts">
import type { Breakpoint, FieldDescriptor } from "@kivcode/engine";
import { inject } from "vue";
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
}>();

const extensions = inject(EDITOR_EXTENSIONS_KEY, null);

// Check if a plugin has registered a custom control for this field type
const pluginControlKey =
	props.descriptor.pluginControl ?? props.descriptor.control;
const customControl = pluginControlKey
	? extensions?.getFieldControl(pluginControlKey)
	: undefined;

const emit = defineEmits<{ "update:modelValue": [value: unknown] }>();

const label = props.descriptor.label ?? props.fieldKey;

const selectOptions =
	props.descriptor.options?.map((o) => String(o.value)) ?? [];

const BP_SHORT: Record<string, string> = {
	base: "",
	sm: "SM",
	md: "MD",
	lg: "LG",
	xl: "XL",
};
const bpBadge =
	props.descriptor.responsive && props.breakpoint && props.breakpoint !== "base"
		? (BP_SHORT[props.breakpoint] ?? "")
		: "";
const localeBadge = props.locale ? props.locale.toUpperCase() : "";
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
