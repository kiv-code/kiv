<script setup lang="ts">
import type { FieldDescriptor } from "@kivcode/engine";
import type { SocialLink } from "@kivcode/nodes";
import { computed } from "vue";
import IconPicker from "./IconPicker.vue";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
	modelValue?: string;
	/** Part of the common plugin-control contract; unused here. */
	fieldKey?: string;
	descriptor?: FieldDescriptor;
	nodeProps?: Record<string, unknown>;
}>();

const emit = defineEmits<{
	"update:modelValue": [value: string];
}>();

function parse(v: string | undefined): SocialLink[] {
	if (!v) return [];
	try {
		const parsed = JSON.parse(v);
		if (!Array.isArray(parsed)) return [];
		return parsed
			.filter((item): item is SocialLink => !!item && typeof item === "object")
			.map((item) => ({
				platform: String(item.platform ?? ""),
				url: String(item.url ?? ""),
				icon: typeof item.icon === "string" ? item.icon : "",
			}));
	} catch {
		return [];
	}
}

const links = computed(() => parse(props.modelValue));

function commit(next: SocialLink[]): void {
	emit("update:modelValue", JSON.stringify(next));
}

function addLink(): void {
	commit([...links.value, { platform: "", url: "", icon: "" }]);
}

function updateIcon(index: number, icon: string): void {
	commit(links.value.map((l, i) => (i === index ? { ...l, icon } : l)));
}

function updateUrl(index: number, url: string): void {
	commit(links.value.map((l, i) => (i === index ? { ...l, url } : l)));
}

function removeLink(index: number): void {
	commit(links.value.filter((_, i) => i !== index));
}
</script>

<template>
	<div class="kiv-social-links">
		<div v-if="links.length === 0" class="kiv-social-links__empty">
			No links yet.
		</div>
		<div v-for="(link, i) in links" :key="i" class="kiv-social-links__row">
			<IconPicker
				class="kiv-social-links__icon"
				:model-value="link.icon ?? ''"
				:show-extras="false"
				@update:model-value="updateIcon(i, $event)"
			/>
			<input
				type="text"
				class="kiv-input kiv-social-links__url"
				:value="link.url"
				placeholder="https://..."
				@input="updateUrl(i, ($event.target as HTMLInputElement).value)"
			/>
			<button
				type="button"
				class="kiv-social-links__remove"
				title="Remove link"
				@click="removeLink(i)"
			>&times;</button>
		</div>
		<button type="button" class="kiv-social-links__add" @click="addLink">
			+ Add link
		</button>
	</div>
</template>

<style scoped>
.kiv-social-links {
	display: flex;
	flex-direction: column;
	gap: 6px;
}
.kiv-social-links__empty {
	font-size: 0.75rem;
	color: var(--color-text-muted);
	padding: 6px 2px;
}
.kiv-social-links__row {
	display: flex;
	gap: 6px;
	align-items: center;
}
.kiv-social-links__icon {
	flex: 0 0 40px;
}
.kiv-social-links__icon :deep(.kiv-icon-picker__trigger-label) {
	display: none;
}
.kiv-social-links__icon :deep(.kiv-icon-picker__trigger-chevron) {
	display: none;
}
.kiv-social-links__icon :deep(.kiv-icon-picker__trigger) {
	justify-content: center;
	padding: 5px;
}
.kiv-social-links__icon :deep(.kiv-icon-picker__popover) {
	width: 220px;
	right: auto;
}
.kiv-social-links__url {
	flex: 1;
	min-width: 0;
	box-sizing: border-box;
}
.kiv-social-links__remove {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 22px;
	height: 22px;
	flex-shrink: 0;
	border: none;
	border-radius: 5px;
	background: transparent;
	color: var(--color-text-muted);
	font-size: 0.95rem;
	cursor: pointer;
}
.kiv-social-links__remove:hover {
	color: #ef4444;
	background: rgba(239, 68, 68, 0.1);
}
.kiv-social-links__add {
	align-self: flex-start;
	margin-top: 2px;
	padding: 5px 10px;
	border: 1px solid var(--color-border);
	border-radius: 6px;
	background: var(--color-surface-sunken);
	color: var(--color-text-secondary);
	font-size: 0.75rem;
	cursor: pointer;
}
.kiv-social-links__add:hover {
	border-color: var(--color-accent);
	color: var(--color-accent-light);
}
</style>
