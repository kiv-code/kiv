<script setup lang="ts">
import type { KivNode } from "@kiv/engine";
import { inject, ref } from "vue";
import { EDITOR_STORE_KEY } from "../store/context";
import { getNodeIcon } from "../utils/node-icons";

const props = defineProps<{ node: KivNode; depth?: number }>();
const store = inject(EDITOR_STORE_KEY);

const allChildren = (node: KivNode): KivNode[] =>
	Object.values(node.slots ?? {}).flat();

// ── DnD state ────────────────────────────────────────────────────────────────
// "dragover" position: null | "before" | "inside" | "after"
const dropZone = ref<"before" | "inside" | "after" | null>(null);

function onDragStart(e: DragEvent) {
	e.dataTransfer?.setData("text/plain", props.node.id);
	if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
	// Small delay so the browser snapshot captures the element before opacity changes
	setTimeout(() => {
		(e.target as HTMLElement).style.opacity = "0.4";
	}, 0);
}

function onDragEnd(e: DragEvent) {
	(e.target as HTMLElement).style.opacity = "";
	dropZone.value = null;
}

function onDragOver(e: DragEvent) {
	e.preventDefault();
	if (!e.dataTransfer) return;
	e.dataTransfer.dropEffect = "move";

	const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
	const y = e.clientY - rect.top;
	const h = rect.height;

	if (y < h * 0.25) dropZone.value = "before";
	else if (y > h * 0.75) dropZone.value = "after";
	else dropZone.value = "inside";
}

function onDragLeave() {
	dropZone.value = null;
}

function onDrop(e: DragEvent) {
	e.preventDefault();
	const draggedId = e.dataTransfer?.getData("text/plain");
	dropZone.value = null;

	if (!draggedId || draggedId === props.node.id || !store) return;

	// Prevent dropping a parent onto its own descendant
	function isDescendant(parent: KivNode, targetId: string): boolean {
		return allChildren(parent).some(
			(c) => c.id === targetId || isDescendant(c, targetId),
		);
	}
	if (isDescendant(props.node, draggedId)) return;

	const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
	const y = e.clientY - rect.top;
	const h = rect.height;
	const zone = y < h * 0.25 ? "before" : y > h * 0.75 ? "after" : "inside";

	const doc = store.document.value;

	function findParent(
		current: KivNode,
		targetId: string,
	): { parent: KivNode; slot: string; index: number } | null {
		for (const [slot, children] of Object.entries(current.slots ?? {})) {
			for (let i = 0; i < children.length; i++) {
				const child = children[i];
				if (!child) continue;
				if (child.id === targetId) return { parent: current, slot, index: i };
				const found = findParent(child, targetId);
				if (found) return found;
			}
		}
		return null;
	}

	if (zone === "inside") {
		// Move dragged inside this node's first slot
		const slots = Object.keys(props.node.slots ?? {});
		const slotName = slots[0] ?? "default";
		const children = props.node.slots?.[slotName] ?? [];
		store.moveNode(draggedId, props.node.id, slotName, children.length);
	} else {
		// Move before or after this node within its parent's slot
		const loc = findParent(doc.root, props.node.id);
		if (!loc) return;
		const targetIndex = zone === "before" ? loc.index : loc.index + 1;
		store.moveNode(draggedId, loc.parent.id, loc.slot, targetIndex);
	}
}
</script>

<template>
	<div class="kiv-tree-node">
		<div
			class="kiv-tree-node__drop-before"
			:class="{ active: dropZone === 'before' }"
		/>
		<button
			class="kiv-tree-node__label"
			:class="{
				'kiv-tree-node__label--selected': store?.selected.value?.id === node.id,
				'kiv-tree-node__label--drop-inside': dropZone === 'inside',
			}"
			:style="{ paddingLeft: `${10 + (depth ?? 0) * 14}px` }"
			type="button"
			draggable="true"
			@click="store?.select(node.id)"
			@dragstart="onDragStart"
			@dragend="onDragEnd"
			@dragover="onDragOver"
			@dragleave="onDragLeave"
			@drop="onDrop"
		>
			<span class="kiv-tree-node__drag-handle" aria-hidden="true">
				<svg width="8" height="12" viewBox="0 0 8 12" fill="none">
					<circle cx="2" cy="2" r="1" fill="currentColor"/>
					<circle cx="6" cy="2" r="1" fill="currentColor"/>
					<circle cx="2" cy="6" r="1" fill="currentColor"/>
					<circle cx="6" cy="6" r="1" fill="currentColor"/>
					<circle cx="2" cy="10" r="1" fill="currentColor"/>
					<circle cx="6" cy="10" r="1" fill="currentColor"/>
				</svg>
			</span>
			<span class="kiv-tree-node__icon">{{ getNodeIcon(node.type) }}</span>
			<span class="kiv-tree-node__type">{{ node.type }}</span>
			<span v-if="allChildren(node).length" class="kiv-tree-node__count">
				{{ allChildren(node).length }}
			</span>
		</button>
		<div
			class="kiv-tree-node__drop-after"
			:class="{ active: dropZone === 'after' }"
		/>
		<KivTreeNode
			v-for="child in allChildren(node)"
			:key="child.id"
			:node="child"
			:depth="(depth ?? 0) + 1"
		/>
	</div>
</template>

<style scoped>
.kiv-tree-node__label {
	display: flex;
	align-items: center;
	gap: 6px;
	width: 100%;
	padding-top: 3px;
	padding-bottom: 3px;
	padding-right: 8px;
	background: none;
	border: none;
	cursor: pointer;
	text-align: left;
	font-size: 0.78rem;
	white-space: nowrap;
	overflow: hidden;
	color: var(--color-text-secondary);
	font-family: inherit;
	transition: background 0.1s, color 0.1s;
}
.kiv-tree-node__label:hover {
	background: #1a1d2a;
	color: var(--color-text-primary);
}
.kiv-tree-node__label--selected {
	background: rgba(99, 102, 241, 0.12);
	color: #a5b4fc;
}
.kiv-tree-node__label--drop-inside {
	background: rgba(99, 102, 241, 0.18) !important;
	outline: 1px solid rgba(99, 102, 241, 0.5);
	outline-offset: -1px;
}

/* Drag handle — only visible on hover */
.kiv-tree-node__drag-handle {
	flex-shrink: 0;
	width: 12px;
	color: transparent;
	cursor: grab;
	display: flex;
	align-items: center;
	transition: color 0.1s;
}
.kiv-tree-node__label:hover .kiv-tree-node__drag-handle {
	color: var(--color-text-muted);
}
.kiv-tree-node__label:active .kiv-tree-node__drag-handle {
	cursor: grabbing;
}

.kiv-tree-node__icon {
	width: 16px;
	text-align: center;
	flex-shrink: 0;
	font-size: 0.7rem;
	opacity: 0.7;
}
.kiv-tree-node__type {
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	font-weight: 500;
}
.kiv-tree-node__count {
	font-size: 0.65rem;
	background: #1e2130;
	color: var(--color-text-muted);
	border-radius: 10px;
	padding: 0 5px;
	min-width: 16px;
	text-align: center;
	flex-shrink: 0;
}
.kiv-tree-node__label--selected .kiv-tree-node__count {
	background: rgba(99, 102, 241, 0.2);
	color: #818cf8;
}

/* Drop indicators */
.kiv-tree-node__drop-before,
.kiv-tree-node__drop-after {
	height: 2px;
	margin: 0 8px;
	border-radius: 1px;
	background: transparent;
	transition: background 0.1s;
}
.kiv-tree-node__drop-before.active,
.kiv-tree-node__drop-after.active {
	background: var(--color-accent);
}
</style>
