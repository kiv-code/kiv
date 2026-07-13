<script setup lang="ts">
import type { FieldDescriptor, MediaAsset } from "@kivcode/engine";
import { computed, inject, ref } from "vue";
import KivMediaBrowser from "../../components/KivMediaBrowser.vue";
import { EDITOR_STORE_KEY } from "../../store/context";

const props = withDefaults(
	defineProps<{
		modelValue?: string;
		descriptor?: FieldDescriptor;
	}>(),
	{ modelValue: "" },
);

const emit = defineEmits<{
	"update:modelValue": [value: string];
}>();

const store = inject(EDITOR_STORE_KEY, null);
const media = computed(() => store?.media ?? null);
const browserOpen = ref(false);

function selectAsset(asset: MediaAsset) {
	emit("update:modelValue", asset.url);
	browserOpen.value = false;
}

function clear() {
	emit("update:modelValue", "");
}
</script>

<template>
	<div class="kiv-media-picker">
		<div v-if="modelValue" class="kiv-media-picker__preview">
			<img :src="modelValue" alt="" class="kiv-media-picker__thumb" />
			<button
				type="button"
				class="kiv-media-picker__clear"
				title="Clear"
				@click="clear"
			>
				&times;
			</button>
		</div>
		<input
			type="text"
			class="kiv-media-picker__input"
			:value="modelValue"
			:placeholder="descriptor?.placeholder ?? 'https://…'"
			@input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
		/>
		<button
			type="button"
			class="kiv-media-picker__browse"
			:disabled="!media"
			@click="browserOpen = true"
		>
			Browse Media
		</button>
		<p v-if="!media" class="kiv-media-picker__hint">
			No media provider configured — paste a URL directly.
		</p>
		<KivMediaBrowser
			:open="browserOpen"
			:media="media"
			@close="browserOpen = false"
			@select="selectAsset"
		/>
	</div>
</template>

<style scoped>
.kiv-media-picker {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.kiv-media-picker__preview {
	position: relative;
	width: 100%;
	height: 72px;
	border-radius: 6px;
	overflow: hidden;
	background: var(--color-surface-sunken);
}
.kiv-media-picker__thumb {
	width: 100%;
	height: 100%;
	object-fit: cover;
	display: block;
}
.kiv-media-picker__clear {
	position: absolute;
	top: 4px;
	right: 4px;
	width: 20px;
	height: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(0, 0, 0, 0.55);
	border: none;
	border-radius: 50%;
	color: #fff;
	cursor: pointer;
	line-height: 1;
	font-size: 0.9rem;
}
.kiv-media-picker__clear:hover {
	background: rgba(0, 0, 0, 0.75);
}

.kiv-media-picker__input {
	width: 100%;
	padding: 5px 8px;
	background: var(--color-surface-base);
	border: 1px solid var(--color-border);
	border-radius: 5px;
	color: var(--color-text-primary);
	font-size: 0.72rem;
	font-family: inherit;
	outline: none;
	box-sizing: border-box;
}
.kiv-media-picker__input:focus {
	border-color: var(--color-accent);
}

.kiv-media-picker__browse {
	width: 100%;
	padding: 6px 8px;
	background: var(--color-surface-overlay);
	border: 1px solid var(--color-border);
	border-radius: 5px;
	color: var(--color-text-primary);
	font-size: 0.72rem;
	font-weight: 600;
	font-family: inherit;
	cursor: pointer;
}
.kiv-media-picker__browse:hover:not(:disabled) {
	border-color: var(--color-accent);
}
.kiv-media-picker__browse:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.kiv-media-picker__hint {
	margin: 0;
	font-size: 0.65rem;
	color: var(--color-text-muted);
}
</style>
