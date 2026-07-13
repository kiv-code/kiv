<script setup lang="ts">
import type { KivNode } from "@kivcode/engine";
import { computed, inject, ref } from "vue";
import { EDITOR_STORE_KEY, KIV_TREE_FILTER_KEY } from "../store/context";
import { getNodeCategoryTint, getNodeLabel } from "../utils/node-labels";
import { findParentLocation, isDescendant } from "../utils/tree";
import { isHiddenAtBreakpoint } from "../utils/visibility";
import NodeIcon from "./NodeIcon.vue";

const props = defineProps<{ node: KivNode; depth?: number }>();
const store = inject(EDITOR_STORE_KEY);
const filterQuery = inject(KIV_TREE_FILTER_KEY, ref(""));

const allChildren = (node: KivNode): KivNode[] =>
	Object.values(node.slots ?? {}).flat();

// Reactive — recomputes when store.document changes (after move/add/remove)
const children = computed(() => allChildren(props.node));
const collapsed = ref(false);
const isLocked = computed(() => props.node.locked === true);
const isHiddenHere = computed(() =>
	isHiddenAtBreakpoint(props.node.visible, store?.breakpoint.value ?? "base"),
);

function onRowClick(e: MouseEvent) {
	if (e.shiftKey) store?.toggleSelect(props.node.id);
	else store?.select(props.node.id);
}

// ── Filter ───────────────────────────────────────────────────────────────────
const trimmedQuery = computed(() => filterQuery.value.trim().toLowerCase());
const filterActive = computed(() => trimmedQuery.value.length > 0);

function matchesQuery(node: KivNode, q: string): boolean {
	if (
		node.id.toLowerCase().includes(q) ||
		getNodeLabel(node.type, store?.registry).toLowerCase().includes(q)
	) {
		return true;
	}
	return allChildren(node).some((c) => matchesQuery(c, q));
}

// Hides this row entirely when filtering and neither it nor any descendant matches.
const visible = computed(
	() => !filterActive.value || matchesQuery(props.node, trimmedQuery.value),
);
// True when this row itself (not just a descendant) matches the filter — used
// to mark the first real hit so the tree can scroll to it.
const isOwnMatch = computed(
	() =>
		filterActive.value &&
		(props.node.id.toLowerCase().includes(trimmedQuery.value) ||
			getNodeLabel(props.node.type, store?.registry)
				.toLowerCase()
				.includes(trimmedQuery.value)),
);
// While filtering, force every visible branch open so matches aren't hidden
// behind a manually-collapsed ancestor — the user's own collapse state is
// preserved underneath and restored once the filter is cleared.
const effectiveCollapsed = computed(() =>
	filterActive.value ? false : collapsed.value,
);

// ── DnD ──────────────────────────────────────────────────────────────────────
const dropZone = ref<"before" | "inside" | "after" | null>(null);

function onDragStart(e: DragEvent) {
	e.dataTransfer?.setData("text/plain", props.node.id);
	if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
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
	if (!draggedId || draggedId === props.node.id || !store || isLocked.value)
		return;

	if (isDescendant(props.node, draggedId)) return;

	const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
	const y = e.clientY - rect.top;
	const h = rect.height;
	const zone = y < h * 0.25 ? "before" : y > h * 0.75 ? "after" : "inside";
	const doc = store.document.value;

	if (zone === "inside") {
		const slots = Object.keys(props.node.slots ?? {});
		const slotName = slots[0] ?? "default";
		store.moveNode(draggedId, props.node.id, slotName, children.value.length);
	} else {
		const loc = findParentLocation(doc.root, props.node.id);
		if (!loc) return;
		store.moveNode(
			draggedId,
			loc.parent.id,
			loc.slot,
			zone === "before" ? loc.index : loc.index + 1,
		);
	}
}

// ── Context actions ───────────────────────────────────────────────────────────
function moveNode(direction: "up" | "down") {
	if (!store || isLocked.value) return;
	const doc = store.document.value;
	const loc = findParentLocation(doc.root, props.node.id);
	if (!loc) return;
	const newIndex = direction === "up" ? loc.index - 1 : loc.index + 1;
	const siblings = loc.parent.slots?.[loc.slot] ?? [];
	if (newIndex < 0 || newIndex >= siblings.length) return;
	store.moveNode(props.node.id, loc.parent.id, loc.slot, newIndex);
}

const isSelected = () =>
	store?.selectedIds.value.includes(props.node.id) ?? false;
const hasChildren = computed(() => children.value.length > 0);

function duplicate() {
	if (!store || isLocked.value) return;
	store.duplicateNode(props.node.id);
}

// Indent guide lines — one per ancestor level, aligned to that level's icon column.
const guideStep = 14;
const guideBase = 8;
const guideOffsets = computed(() =>
	Array.from(
		{ length: props.depth ?? 0 },
		(_, i) => guideBase + i * guideStep + 7,
	),
);

const categoryTint = computed(() =>
	getNodeCategoryTint(props.node.type, store?.registry),
);
</script>

<template>
	<div v-if="visible" class="ktn">
		<div class="ktn__drop-line" :class="{ active: dropZone === 'before' }" />

		<div
			class="ktn__row"
			:class="{
				'ktn__row--selected': isSelected(),
				'ktn__row--drop-inside': dropZone === 'inside',
			}"
			:style="{ paddingLeft: `${8 + (depth ?? 0) * 14}px` }"
			:draggable="!isLocked"
			:data-kiv-tree-match="isOwnMatch ? 'true' : undefined"
			@click="onRowClick"
			@dragstart="onDragStart"
			@dragend="onDragEnd"
			@dragover="onDragOver"
			@dragleave="onDragLeave"
			@drop="onDrop"
		>
			<span
				v-for="offset in guideOffsets"
				:key="offset"
				class="ktn__guide"
				:style="{ left: `${offset}px` }"
			/>

			<!-- Collapse toggle -->
			<button
				v-if="hasChildren"
				type="button"
				class="ktn__collapse"
				:class="{ 'ktn__collapse--open': !effectiveCollapsed }"
				@click.stop="collapsed = !collapsed"
			>
				<svg width="8" height="8" viewBox="0 0 8 8" fill="none">
					<path d="M2 3l2 2 2-2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</button>
			<span v-else class="ktn__collapse-placeholder" />

			<!-- Drag handle -->
			<span class="ktn__drag" aria-hidden="true">
				<svg width="8" height="10" viewBox="0 0 8 10" fill="none">
					<circle cx="2" cy="2" r="1" fill="currentColor"/>
					<circle cx="6" cy="2" r="1" fill="currentColor"/>
					<circle cx="2" cy="5" r="1" fill="currentColor"/>
					<circle cx="6" cy="5" r="1" fill="currentColor"/>
					<circle cx="2" cy="8" r="1" fill="currentColor"/>
					<circle cx="6" cy="8" r="1" fill="currentColor"/>
				</svg>
			</span>

			<span class="ktn__icon" :style="{ background: categoryTint }">
				<NodeIcon :type="node.type" :size="13" />
			</span>
			<span class="ktn__type">{{ getNodeLabel(node.type, store?.registry) }}</span>
			<span class="ktn__id">#{{ node.id }}</span>
			<span v-if="isLocked" class="ktn__lock" title="Locked">
				<svg width="9" height="9" viewBox="0 0 9 9" fill="none">
					<rect x="1.5" y="4" width="6" height="4" rx="1" stroke="currentColor" stroke-width="1.1"/>
					<path d="M2.5 4V2.8a2 2 0 0 1 4 0V4" stroke="currentColor" stroke-width="1.1"/>
				</svg>
			</span>
			<span v-if="isHiddenHere" class="ktn__hidden-badge" title="Hidden at this breakpoint">
				<svg width="9" height="9" viewBox="0 0 13 13" fill="none">
					<path d="M1.5 6.5S3.8 2.5 6.5 2.5s5 4 5 4-2.3 4-5 4-5-4-5-4Z" stroke="currentColor" stroke-width="1.1"/>
					<line x1="2" y1="11" x2="11" y2="2" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
				</svg>
			</span>
			<span v-if="hasChildren && effectiveCollapsed" class="ktn__count">{{ children.length }}</span>

			<!-- Context actions (visible on hover / selected) -->
			<div class="ktn__actions" @click.stop>
				<button
					type="button"
					class="ktn__action"
					title="Move up"
					:disabled="isLocked"
					@click="moveNode('up')"
				>
					<svg width="9" height="9" viewBox="0 0 9 9" fill="none">
						<path d="M4.5 7V2M2 4.5l2.5-2.5 2.5 2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
				<button
					type="button"
					class="ktn__action"
					title="Move down"
					:disabled="isLocked"
					@click="moveNode('down')"
				>
					<svg width="9" height="9" viewBox="0 0 9 9" fill="none">
						<path d="M4.5 2v5M2 4.5l2.5 2.5 2.5-2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
				<button
					type="button"
					class="ktn__action"
					title="Duplicate"
					:disabled="isLocked"
					@click="duplicate"
				>
					<svg width="9" height="9" viewBox="0 0 9 9" fill="none">
						<rect x="3" y="3" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.1"/>
						<path d="M1 6V1.8a.8.8 0 0 1 .8-.8H6" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
					</svg>
				</button>
				<button
					type="button"
					class="ktn__action ktn__action--danger"
					title="Delete"
					:disabled="isLocked"
					@click="store?.removeNode(node.id)"
				>
					<svg width="9" height="9" viewBox="0 0 9 9" fill="none">
						<path d="M1.5 2.5h6M3.5 2.5V1.5h2v1M7 2.5l-.5 5a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5L2 2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
			</div>
		</div>

		<div class="ktn__drop-line" :class="{ active: dropZone === 'after' }" />

		<template v-if="!effectiveCollapsed">
			<KivTreeNode
				v-for="child in children"
				:key="child.id"
				:node="child"
				:depth="(depth ?? 0) + 1"
			/>
		</template>
	</div>
</template>

<style scoped>
.ktn { }

.ktn__row {
	position: relative;
	display: flex;
	align-items: center;
	gap: 4px;
	width: 100%;
	padding-top: 5px;
	padding-bottom: 5px;
	padding-right: 4px;
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
	border-radius: 4px;
	margin: 0 4px;
}
.ktn__row:hover {
	background: var(--color-surface-overlay);
	color: var(--color-text-primary);
}
.ktn__row--selected {
	background: var(--color-accent-muted);
	color: var(--color-accent-light);
}
.ktn__row--drop-inside {
	background: rgba(99, 102, 241, 0.18) !important;
	outline: 1px solid rgba(99, 102, 241, 0.5);
	outline-offset: -1px;
}

/* Indent guides — one per ancestor level, aligned to that level's icon column */
.ktn__guide {
	position: absolute;
	top: 0;
	bottom: 0;
	width: 1px;
	background: var(--color-border);
	pointer-events: none;
}

/* Collapse toggle */
.ktn__collapse {
	width: 14px;
	height: 14px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: none;
	border: none;
	cursor: pointer;
	color: var(--color-text-muted);
	border-radius: 3px;
	padding: 0;
	transform: rotate(-90deg);
	transition: transform 0.15s, color 0.1s;
}
.ktn__collapse--open { transform: rotate(0deg); }
.ktn__collapse:hover { color: var(--color-text-primary); background: rgba(255,255,255,0.06); }
.ktn__collapse-placeholder { width: 14px; flex-shrink: 0; }

/* Drag handle */
.ktn__drag {
	flex-shrink: 0;
	width: 12px;
	color: transparent;
	cursor: grab;
	display: flex;
	align-items: center;
	transition: color 0.1s;
}
.ktn__row:hover .ktn__drag { color: var(--color-text-muted); }
.ktn__row:active .ktn__drag { cursor: grabbing; }

.ktn__icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 16px;
	height: 16px;
	flex-shrink: 0;
	border-radius: 4px;
	opacity: 0.85;
}
.ktn__type {
	flex-shrink: 0;
	font-weight: 500;
}
.ktn__id {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	font-size: 0.68rem;
	color: var(--color-text-muted);
	transition: flex-basis 0.1s, opacity 0.1s;
}
.ktn__row--selected .ktn__id {
	color: var(--color-accent-light);
	opacity: 0.75;
}
/* The id and the hover actions want the same space — while hovering or
   selected you're about to act on the row, not read its id, so the id
   yields the room instead of squeezing the actions off the edge. */
.ktn__row:hover .ktn__id,
.ktn__row--selected .ktn__id {
	flex: 0 0 0;
	width: 0;
	opacity: 0;
}
.ktn__count {
	font-size: 0.6rem;
	background: var(--color-border);
	color: var(--color-text-muted);
	border-radius: 8px;
	padding: 0 5px;
	min-width: 14px;
	text-align: center;
	flex-shrink: 0;
}
.ktn__lock {
	display: flex;
	align-items: center;
	flex-shrink: 0;
	color: var(--color-text-muted);
}
.ktn__hidden-badge {
	display: flex;
	align-items: center;
	flex-shrink: 0;
	color: var(--color-text-muted);
	opacity: 0.7;
}

/* Context actions — hidden by default, visible on hover/selected */
.ktn__actions {
	display: none;
	align-items: center;
	gap: 1px;
	flex-shrink: 0;
}
.ktn__row:hover .ktn__actions,
.ktn__row--selected .ktn__actions {
	display: flex;
}
.ktn__action {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 18px;
	height: 18px;
	background: none;
	border: none;
	border-radius: 3px;
	cursor: pointer;
	color: var(--color-text-muted);
	transition: background 0.1s, color 0.1s;
	padding: 0;
}
.ktn__action:hover {
	background: rgba(255,255,255,0.08);
	color: var(--color-text-primary);
}
.ktn__action:disabled {
	opacity: 0.3;
	cursor: default;
}
.ktn__action:disabled:hover {
	background: none;
	color: var(--color-text-muted);
}
.ktn__action--danger:hover {
	background: rgba(239, 68, 68, 0.15);
	color: var(--color-danger);
}

/* Drop indicators */
.ktn__drop-line {
	height: 2px;
	margin: 0 6px;
	border-radius: 2px;
	background: transparent;
	transition: background 0.08s;
	position: relative;
}
.ktn__drop-line.active {
	background: #6366f1;
	box-shadow: 0 0 6px rgba(99, 102, 241, 0.6);
}
.ktn__drop-line.active::before {
	content: "";
	position: absolute;
	left: 0;
	top: 50%;
	transform: translateY(-50%);
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: #6366f1;
}
</style>
