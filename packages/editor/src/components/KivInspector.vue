<script setup lang="ts">
import type { FieldDescriptor, Registry } from "@kiv/engine";
import { computed, inject } from "vue";
import FieldControl from "../inspector/FieldControl.vue";
import { EDITOR_STORE_KEY } from "../store/context";

const props = defineProps<{ registry: Registry }>();
const store = inject(EDITOR_STORE_KEY);

const GROUP_ORDER = [
	"Layout",
	"Typography",
	"Content",
	"Background",
	"Overlay",
	"Effects",
	"Border",
	"Link",
	"Style",
	"General",
];

interface GroupedField {
	key: string;
	descriptor: FieldDescriptor;
}

const groupedFields = computed(() => {
	const node = store?.selected.value;
	if (!node || !props.registry.has(node.type)) return [];

	const compiled = props.registry.get(node.type);
	if (!compiled) return [];
	const groups = new Map<string, GroupedField[]>();

	for (const [key, descriptor] of Object.entries(compiled.fields)) {
		const g = descriptor.group ?? "General";
		if (!groups.has(g)) groups.set(g, []);
		groups.get(g)?.push({ key, descriptor });
	}

	return GROUP_ORDER.filter((g) => groups.has(g)).map((g) => ({
		name: g,
		fields: groups.get(g) ?? [],
	}));
});
</script>

<template>
	<aside class="kiv-inspector">
		<div class="kiv-inspector__header">Inspector</div>

		<div v-if="!store?.selected.value" class="kiv-inspector__empty">
			<div class="kiv-inspector__empty-icon">
				<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<rect x="3" y="3" width="18" height="18" rx="2"/>
					<path d="M3 9h18M9 21V9"/>
				</svg>
			</div>
			<p>Select a node to inspect</p>
		</div>

		<template v-else>
			<div class="kiv-inspector__node-header">
				<span class="kiv-inspector__node-badge">{{ store.selected.value.type }}</span>
				<span class="kiv-inspector__node-id">#{{ store.selected.value.id }}</span>
			</div>
			<div class="kiv-inspector__groups">
				<details
					v-for="group in groupedFields"
					:key="group.name"
					class="kiv-inspector__group"
					open
				>
					<summary class="kiv-inspector__group-title">
						<svg class="kiv-inspector__chevron" width="10" height="10" viewBox="0 0 10 10" fill="none">
							<path d="M3 2l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
						{{ group.name }}
					</summary>
					<div class="kiv-inspector__group-fields">
						<FieldControl
							v-for="field in group.fields"
							:key="field.key"
							:field-key="field.key"
							:descriptor="field.descriptor"
							:model-value="store.selected.value!.props[field.key]"
							@update:model-value="store.updateProps(store.selected.value!.id, { [field.key]: $event })"
						/>
					</div>
				</details>
			</div>
		</template>
	</aside>
</template>

<style scoped>
.kiv-inspector {
	width: 260px;
	min-width: 260px;
	flex-shrink: 0;
	border-left: 1px solid #1e2130;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background: #16181f;
	color: #e2e8f0;
}
.kiv-inspector__header {
	padding: 8px 12px;
	font-size: 0.65rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	color: var(--color-text-secondary);
	border-bottom: 1px solid #1e2130;
	background: #16181f;
}
.kiv-inspector__empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10px;
	padding: 40px 16px;
	color: var(--color-text-muted);
	font-size: 0.78rem;
	text-align: center;
}
.kiv-inspector__empty-icon { color: var(--color-border); }
.kiv-inspector__empty p { margin: 0; }

.kiv-inspector__node-header {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	border-bottom: 1px solid #1e2130;
	background: #13151c;
}
.kiv-inspector__node-badge {
	display: inline-block;
	padding: 2px 8px;
	background: rgba(99, 102, 241, 0.2);
	color: #a5b4fc;
	border-radius: 4px;
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.02em;
}
.kiv-inspector__node-id {
	color: var(--color-text-muted);
	font-size: 0.65rem;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.kiv-inspector__groups {
	flex: 1;
	overflow-y: auto;
}
.kiv-inspector__groups::-webkit-scrollbar { width: 3px; }
.kiv-inspector__groups::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 2px; }

.kiv-inspector__group {
	border-bottom: 1px solid #1a1d2a;
}

.kiv-inspector__group-title {
	padding: 6px 12px;
	font-size: 0.65rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--color-text-secondary);
	cursor: pointer;
	user-select: none;
	background: #13151c;
	list-style: none;
	display: flex;
	align-items: center;
	gap: 6px;
	transition: color 0.1s;
}
.kiv-inspector__group-title:hover { color: var(--color-text-primary); }
.kiv-inspector__group-title::-webkit-details-marker { display: none; }

.kiv-inspector__chevron {
	flex-shrink: 0;
	color: var(--color-border);
	transition: transform 0.15s;
}
details[open] .kiv-inspector__chevron {
	transform: rotate(90deg);
}

.kiv-inspector__group-fields {
	padding: 10px 12px;
	display: flex;
	flex-direction: column;
	gap: 10px;
}
</style>
