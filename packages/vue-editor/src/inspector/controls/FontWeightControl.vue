<script setup lang="ts">
import { fontWeights } from "@kivcode/engine";
import { computed, inject } from "vue";
import { EDITOR_STORE_KEY } from "../../store/context";

const props = defineProps<{
	modelValue?: string;
	nodeProps?: Record<string, unknown>;
}>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const store = inject(EDITOR_STORE_KEY, null);

/**
 * Narrowed to the cuts the selected family actually ships. Offering a 900 a
 * font doesn't have makes the browser synthesise a fake bold — it renders, so
 * nothing looks broken, it just looks subtly wrong.
 */
const weights = computed(() =>
	fontWeights(props.nodeProps?.fontFamily, store?.fonts?.list() ?? []),
);

const LABELS: Record<number, string> = {
	100: "Thin",
	200: "Extra Light",
	300: "Light",
	400: "Regular",
	500: "Medium",
	600: "Semi Bold",
	700: "Bold",
	800: "Extra Bold",
	900: "Black",
};
</script>

<template>
	<select
		class="kiv-input"
		:value="modelValue ?? ''"
		@change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
	>
		<option v-for="w in weights" :key="w" :value="String(w)">
			{{ w }} · {{ LABELS[w] ?? "" }}
		</option>
	</select>
</template>
