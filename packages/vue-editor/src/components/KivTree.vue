<script setup lang="ts">
import type { KivNode } from "@kivcode/engine";
import { computed, inject, nextTick, provide, ref, watch } from "vue";
import { useResizablePanel } from "../composables/useResizablePanel";
import {
	EDITOR_STORE_KEY,
	KIV_TREE_FILTER_KEY,
	KIV_TREE_FOCUS_SEARCH_KEY,
} from "../store/context";
import { getNodeLabel } from "../utils/node-labels";
import KivTreeNode from "./KivTreeNode.vue";

const store = inject(EDITOR_STORE_KEY);
const emit = defineEmits<{ openPalette: [] }>();

const filterQuery = ref("");
provide(KIV_TREE_FILTER_KEY, filterQuery);

const filterInputRef = ref<HTMLInputElement | null>(null);
const bodyRef = ref<HTMLElement | null>(null);
provide(KIV_TREE_FOCUS_SEARCH_KEY, () => filterInputRef.value?.focus());

function countNodes(node: KivNode): number {
	const children = Object.values(node.slots ?? {}).flat();
	return 1 + children.reduce((sum, c) => sum + countNodes(c), 0);
}
const nodeCount = computed(() =>
	store ? countNodes(store.document.value.root) : 0,
);

function countMatches(node: KivNode, q: string): number {
	let count =
		node.id.toLowerCase().includes(q) ||
		getNodeLabel(node.type, store?.registry).toLowerCase().includes(q)
			? 1
			: 0;
	for (const children of Object.values(node.slots ?? {})) {
		for (const child of children) count += countMatches(child, q);
	}
	return count;
}
const matchCount = computed<number | null>(() => {
	const q = filterQuery.value.trim().toLowerCase();
	if (!q || !store) return null;
	return countMatches(store.document.value.root, q);
});

function clearFilter() {
	filterQuery.value = "";
}

watch(filterQuery, async (q) => {
	if (!q.trim()) return;
	await nextTick();
	bodyRef.value
		?.querySelector('[data-kiv-tree-match="true"]')
		?.scrollIntoView({ block: "nearest" });
});

const { width, startResize } = useResizablePanel({
	storageKey: "kiv-editor:tree-width",
	defaultWidth: 220,
	min: 180,
	max: 420,
	edge: "right",
});
</script>

<template>
	<aside class="kiv-tree" :style="{ width: `${width}px`, minWidth: `${width}px` }">
		<div class="kiv-tree__header">
			<div class="kiv-tree__header-row">
				<span>Structure</span>
				<span class="kiv-tree__count">{{ nodeCount }}</span>
			</div>
			<div class="kiv-tree__filter-row">
				<input
					ref="filterInputRef"
					v-model="filterQuery"
					type="text"
					class="kiv-tree__filter"
					placeholder="Filter nodes..."
					spellcheck="false"
					autocomplete="off"
					@keydown.esc="clearFilter"
				/>
				<span v-if="matchCount !== null" class="kiv-tree__match-count">
					{{ matchCount }} match{{ matchCount === 1 ? "" : "es" }}
				</span>
			</div>
		</div>
		<div v-if="store" ref="bodyRef" class="kiv-tree__body">
			<KivTreeNode :node="store.document.value.root" :depth="0" />
		</div>
		<div class="kiv-tree__footer">
			<button
				type="button"
				class="kiv-tree__add-btn"
				@click="emit('openPalette')"
			>
				<svg width="11" height="11" viewBox="0 0 11 11" fill="none">
					<path d="M5.5 1v9M1 5.5h9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
				</svg>
				Add node
			</button>
		</div>
		<div class="kiv-tree__resize-handle" @mousedown="startResize" />
	</aside>
</template>

<style scoped>
.kiv-tree {
	position: relative;
	flex-shrink: 0;
	border-right: 1px solid var(--color-border);
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background: var(--color-surface-raised);
}
.kiv-tree__header {
	padding: 8px 10px;
	border-bottom: 1px solid var(--color-border);
}
.kiv-tree__header-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 6px;
	font-size: 0.65rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	color: var(--color-text-secondary);
}
.kiv-tree__count {
	font-size: 0.6rem;
	font-weight: 600;
	text-transform: none;
	letter-spacing: normal;
	background: var(--color-surface-overlay);
	color: var(--color-text-muted);
	border-radius: 8px;
	padding: 1px 6px;
}
.kiv-tree__filter-row {
	position: relative;
}
.kiv-tree__match-count {
	position: absolute;
	right: 7px;
	top: 50%;
	transform: translateY(-50%);
	font-size: 0.6rem;
	color: var(--color-text-muted);
	pointer-events: none;
	white-space: nowrap;
}
.kiv-tree__filter {
	width: 100%;
	box-sizing: border-box;
	background: var(--color-surface-base);
	border: 1px solid var(--color-border);
	border-radius: 5px;
	color: var(--color-text-primary);
	font-size: 0.72rem;
	font-family: inherit;
	padding: 4px 52px 4px 7px;
	outline: none;
	transition: border-color 0.12s;
}
.kiv-tree__filter:focus { border-color: var(--color-accent); }
.kiv-tree__filter::placeholder { color: var(--color-text-muted); }
.kiv-tree__body {
	flex: 1;
	overflow-y: auto;
	padding: 4px 0;
}
.kiv-tree__body::-webkit-scrollbar { width: 3px; }
.kiv-tree__body::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 2px; }
.kiv-tree__footer {
	border-top: 1px solid var(--color-border);
	padding: 6px 8px;
}
.kiv-tree__add-btn {
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 5px;
	padding: 5px 8px;
	border: 1px dashed var(--color-border);
	border-radius: 5px;
	background: transparent;
	color: var(--color-text-muted);
	font-size: 0.75rem;
	font-family: inherit;
	cursor: pointer;
	transition: border-color 0.12s, color 0.12s, background 0.12s;
}
.kiv-tree__add-btn:hover,
.kiv-tree__add-btn.active {
	border-color: var(--color-accent);
	color: var(--color-accent-light);
	background: var(--color-accent-muted);
}

.kiv-tree__resize-handle {
	position: absolute;
	top: 0;
	right: -3px;
	bottom: 0;
	width: 6px;
	cursor: col-resize;
	z-index: 5;
}
.kiv-tree__resize-handle::after {
	content: "";
	position: absolute;
	top: 0;
	bottom: 0;
	left: 2px;
	width: 2px;
	border-radius: 1px;
	background: transparent;
	transition: background 0.12s;
}
.kiv-tree__resize-handle:hover::after {
	background: var(--color-accent);
}

</style>
