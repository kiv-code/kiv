<script setup lang="ts">
import type { KivFont } from "@kivcode/engine";
import { computed, inject } from "vue";
import { EDITOR_STORE_KEY } from "../../store/context";

const props = defineProps<{ modelValue?: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const store = inject(EDITOR_STORE_KEY, null);

// Only the typefaces the host project registered. A project that configures no
// provider gets the generic system families rather than an invented list, so a
// document can never name a font the page will not load.
const fonts = computed<KivFont[]>(() => store?.fonts?.list() ?? []);

const selected = computed(() =>
	fonts.value.find((f) => f.id === props.modelValue),
);
</script>

<template>
	<div class="kiv-font-picker">
		<select
			class="kiv-input"
			:value="modelValue ?? ''"
			@change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
		>
			<option value="">Inherit</option>
			<option v-for="font in fonts" :key="font.id" :value="font.id">
				{{ font.label }}
			</option>
		</select>
		<!-- Rendered in the family itself, so the choice is legible at a glance. -->
		<p
			v-if="selected"
			class="kiv-font-picker__preview"
			:style="{ fontFamily: selected.stack }"
		>
			Ag — the quick brown fox
		</p>
		<p v-else-if="!fonts.length" class="kiv-font-picker__empty">
			This project registers no fonts. Pass <code>fonts</code> to createEngine.
		</p>
	</div>
</template>

<style scoped>
.kiv-font-picker {
	display: flex;
	flex-direction: column;
	gap: 4px;
}
.kiv-font-picker__preview {
	margin: 0;
	padding: 4px 6px;
	font-size: 0.9rem;
	line-height: 1.3;
	border-radius: 4px;
	background: var(--color-surface-sunken);
	color: var(--color-text-primary);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}
.kiv-font-picker__empty {
	margin: 0;
	font-size: 0.6rem;
	line-height: 1.4;
	color: var(--color-text-muted);
}
</style>
