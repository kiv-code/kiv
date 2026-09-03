<script setup lang="ts">
import {
	parseSelectOptions,
	resolveFormFieldTypographyStyle,
} from "@kivcode/nodes";
import { computed } from "vue";

const props = defineProps<{
	fieldType?: string;
	name?: string;
	label?: string;
	placeholder?: string;
	required?: boolean;
	options?: string;
	fontFamily?: string;
	size?: number;
	weight?: string;
	color?: string;
}>();

const selectOptions = computed(() => parseSelectOptions(props.options));
const fieldName = computed(() => props.name ?? "field");
const labelStyle = computed(() =>
	resolveFormFieldTypographyStyle({
		fontFamily: props.fontFamily,
		size: props.size,
		weight: props.weight,
		color: props.color,
	}),
);
</script>

<template>
	<div class="kiv-form-field" data-kiv-type="form-field">
		<label v-if="label" :for="fieldName" :style="labelStyle">{{ label }}</label>
		<textarea
			v-if="fieldType === 'textarea'"
			:id="fieldName"
			:name="fieldName"
			:placeholder="placeholder"
			:required="required"
		/>
		<select v-else-if="fieldType === 'select'" :id="fieldName" :name="fieldName" :required="required">
			<option v-for="opt in selectOptions" :key="opt" :value="opt">{{ opt }}</option>
		</select>
		<input
			v-else-if="fieldType === 'checkbox'"
			:id="fieldName"
			type="checkbox"
			:name="fieldName"
			:required="required"
		/>
		<input
			v-else
			:id="fieldName"
			:type="fieldType ?? 'text'"
			:name="fieldName"
			:placeholder="placeholder"
			:required="required"
		/>
	</div>
</template>

<style scoped>
.kiv-form-field {
	display: flex;
	flex-direction: column;
	gap: 4px;
}
.kiv-form-field input,
.kiv-form-field select,
.kiv-form-field textarea {
	font: inherit;
	padding: 8px 10px;
	border: 1px solid #cbd5e1;
	border-radius: 6px;
}
</style>
