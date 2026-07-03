<script setup lang="ts">
import { inject } from "vue";
import { EDITOR_STORE_KEY } from "../store/context";
import KivTreeNode from "./KivTreeNode.vue";

const store = inject(EDITOR_STORE_KEY);
const emit = defineEmits<{ openPalette: [] }>();
</script>

<template>
	<aside class="kiv-tree">
		<div class="kiv-tree__header">
			<span>Structure</span>
		</div>
		<div v-if="store" class="kiv-tree__body">
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
	</aside>
</template>

<style scoped>
.kiv-tree {
	width: 220px;
	min-width: 220px;
	flex-shrink: 0;
	border-right: 1px solid #1e2130;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background: #16181f;
}
.kiv-tree__header {
	padding: 8px 12px;
	font-size: 0.65rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	color: var(--color-text-secondary);
	border-bottom: 1px solid #1e2130;
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.kiv-tree__body {
	flex: 1;
	overflow-y: auto;
	padding: 4px 0;
}
.kiv-tree__body::-webkit-scrollbar { width: 3px; }
.kiv-tree__body::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 2px; }
.kiv-tree__footer {
	border-top: 1px solid #1e2130;
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
	border-color: #6366f1;
	color: #a5b4fc;
	background: rgba(99, 102, 241, 0.08);
}

</style>
