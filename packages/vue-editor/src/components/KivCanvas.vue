<script setup lang="ts">
import type { Breakpoint, KivNode, Registry } from "@kivcode/engine";
import {
	cloneNodeTree,
	deserializeNode,
	findNode,
	serializeNode,
} from "@kivcode/engine";
import type { VueRegistry } from "@kivcode/vue";
import { KivRenderer } from "@kivcode/vue";
import { computed, inject, onMounted, onUnmounted, ref, watch } from "vue";
import { useInlineEdit } from "../composables/useInlineEdit";
import {
	EDITOR_EXTENSIONS_KEY,
	EDITOR_STORE_KEY,
	KIV_TREE_FOCUS_SEARCH_KEY,
} from "../store/context";
import { insertNodeNearSelection } from "../utils/insert-node";
import { getNodeLabelShort } from "../utils/node-labels";
import { createPaletteNode, paletteItemByType } from "../utils/palette-items";
import { mergeResponsiveValue } from "../utils/responsive-value";
import {
	collectNodeIds,
	findParentLocation,
	isDescendant,
} from "../utils/tree";

const props = defineProps<{
	registry: VueRegistry;
	engineRegistry?: Registry;
}>();

const store = inject(EDITOR_STORE_KEY);
const extensions = inject(EDITOR_EXTENSIONS_KEY, null);
const focusTreeSearch = inject(KIV_TREE_FOCUS_SEARCH_KEY, null);

const canvasRef = ref<HTMLElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);
const rootRef = ref<HTMLElement | null>(null);
const hoveredId = ref<string | null>(null);

function isLocked(id: string): boolean {
	return store?.isLocked(id) ?? false;
}

const breakpoint = computed<Breakpoint>(
	() => (store?.breakpoint.value ?? "base") as Breakpoint,
);
const locale = computed(() => store?.locale.value);
const zoom = computed(() => store?.zoom.value ?? 1);

const CANVAS_WIDTHS: Record<string, string> = {
	base: "390px",
	sm: "640px",
	md: "768px",
	lg: "1280px",
	xl: "100%",
};
const BP_LABELS: Record<string, string> = {
	base: "Mobile · 390px",
	sm: "Small · 640px",
	md: "Tablet · 768px",
	lg: "Desktop · 1280px",
	xl: "Wide · Full",
};

const canvasWidth = computed(() => CANVAS_WIDTHS[breakpoint.value] ?? "100%");
const bpLabel = computed(() => BP_LABELS[breakpoint.value] ?? "");

const {
	onCanvasDblClick,
	deactivate,
	activateById,
	toolbarVisible,
	toolbarTop,
	toolbarLeft,
	formatBold,
	formatItalic,
	formatLink,
} = store
	? useInlineEdit(store)
	: {
			onCanvasDblClick: () => {},
			deactivate: () => {},
			activateById: () => {},
			toolbarVisible: ref(false),
			toolbarTop: ref(0),
			toolbarLeft: ref(0),
			formatBold: () => {},
			formatItalic: () => {},
			formatLink: () => {},
		};

// ── Pan (space+drag or middle-mouse-drag) ───────────────────────────────────
const spacePressed = ref(false);
const isPanning = ref(false);
let panStart: {
	x: number;
	y: number;
	scrollLeft: number;
	scrollTop: number;
} | null = null;

function onPanMove(e: MouseEvent) {
	if (!isPanning.value || !panStart || !rootRef.value) return;
	rootRef.value.scrollLeft = panStart.scrollLeft - (e.clientX - panStart.x);
	rootRef.value.scrollTop = panStart.scrollTop - (e.clientY - panStart.y);
}
function onPanUp() {
	isPanning.value = false;
	panStart = null;
	window.removeEventListener("mousemove", onPanMove);
	window.removeEventListener("mouseup", onPanUp);
}
function onCanvasMouseDown(e: MouseEvent) {
	if (!rootRef.value) return;
	if (e.button === 1 || (e.button === 0 && spacePressed.value)) {
		e.preventDefault();
		isPanning.value = true;
		panStart = {
			x: e.clientX,
			y: e.clientY,
			scrollLeft: rootRef.value.scrollLeft,
			scrollTop: rootRef.value.scrollTop,
		};
		window.addEventListener("mousemove", onPanMove);
		window.addEventListener("mouseup", onPanUp);
	}
}

// ── Zoom (⌘+scroll, ⌘0 reset) ────────────────────────────────────────────────
function onCanvasWheel(e: WheelEvent) {
	if (!store || !(e.metaKey || e.ctrlKey)) return;
	e.preventDefault();
	store.setZoom(store.zoom.value - e.deltaY * 0.001);
}

// ── Selection / click ────────────────────────────────────────────────────────
function onCanvasClick(e: MouseEvent) {
	if (spacePressed.value || isPanning.value) return;
	const active = document.activeElement as HTMLElement | null;
	if (active?.contentEditable === "true") return;
	const target = (e.target as HTMLElement).closest(
		"[data-kiv-node-id]",
	) as HTMLElement | null;
	const id = target?.dataset.kivNodeId ?? null;
	if (id && isLocked(id)) return;
	if (id && e.shiftKey) {
		store?.toggleSelect(id);
		return;
	}
	store?.select(id);
	if (!id) deactivate();
}

function onCanvasDblClickGuarded(e: MouseEvent) {
	const target = (e.target as HTMLElement).closest(
		"[data-kiv-node-id]",
	) as HTMLElement | null;
	const id = target?.dataset.kivNodeId;
	if (id && isLocked(id)) return;
	onCanvasDblClick(e);
}

function onCanvasMouseMove(e: MouseEvent) {
	const target = (e.target as HTMLElement).closest(
		"[data-kiv-node-id]",
	) as HTMLElement | null;
	hoveredId.value = target?.dataset.kivNodeId ?? null;
}

function onCanvasMouseLeave() {
	hoveredId.value = null;
}

// ── Overlay labels ─────────────────────────────────────────────────────────────
interface OverlayItem {
	id: string;
	type: string;
	label: string;
	top: number;
	left: number;
	width: number;
	selected: boolean;
}

const overlayItems = computed((): OverlayItem[] => {
	const frame = canvasRef.value;
	const stage = stageRef.value;
	if (!frame || !stage) return [];
	void zoom.value; // geometry depends on the current zoom level too
	void store?.document.value; // and on the document — a node can resize without a selection/zoom change
	const items: OverlayItem[] = [];
	const selectedIds = new Set(store?.selectedIds.value ?? []);

	const ids = new Set<string>();
	if (hoveredId.value) ids.add(hoveredId.value);
	for (const id of selectedIds) ids.add(id);

	const stageRect = stage.getBoundingClientRect();

	for (const id of ids) {
		const el = frame.querySelector(
			`[data-kiv-node-id="${id}"]`,
		) as HTMLElement | null;
		if (!el) continue;
		const type = (el.dataset.kivType ??
			el.querySelector("[data-kiv-type]")?.getAttribute("data-kiv-type") ??
			id.split("-")[0]) as string;
		const elRect = el.getBoundingClientRect();
		items.push({
			id,
			type,
			label: getNodeLabelShort(type, store?.registry),
			top: elRect.top - stageRect.top,
			left: elRect.left - stageRect.left,
			width: elRect.width,
			selected: selectedIds.has(id),
		});
	}
	return items;
});

// ── Resize handles (Image: width, Section: min-height) ──────────────────────
const RESIZABLE_TYPES = new Set(["image", "section"]);

const resizableInfo = computed(() => {
	const nodes = store?.selectedNodes.value ?? [];
	if (nodes.length !== 1) return null;
	const node = nodes[0];
	if (!node || !RESIZABLE_TYPES.has(node.type)) return null;
	const frame = canvasRef.value;
	const stage = stageRef.value;
	if (!frame || !stage) return null;
	void zoom.value;
	void store?.document.value; // geometry must re-derive after any prop edit resizes the node
	const el = frame.querySelector(
		`[data-kiv-node-id="${node.id}"]`,
	) as HTMLElement | null;
	if (!el) return null;
	const stageRect = stage.getBoundingClientRect();
	const elRect = el.getBoundingClientRect();
	return {
		id: node.id,
		type: node.type,
		top: elRect.top - stageRect.top,
		left: elRect.left - stageRect.left,
		width: elRect.width,
		height: elRect.height,
	};
});

function onResizeMouseDown(e: MouseEvent, edge: "right" | "bottom") {
	e.preventDefault();
	e.stopPropagation();
	const info = resizableInfo.value;
	if (!store || !info) return;
	const startX = e.clientX;
	const startY = e.clientY;
	const startWidth = info.width;
	const startHeight = info.height;
	const frameWidth =
		canvasRef.value?.getBoundingClientRect().width ?? startWidth;
	const zoomFactor = store.zoom.value || 1;
	const nodeId = info.id;

	store.startBatch();

	function onMove(ev: MouseEvent) {
		if (!store) return;
		if (edge === "right") {
			const deltaPx = (ev.clientX - startX) / zoomFactor;
			const newWidthPx = Math.max(20, startWidth + deltaPx);
			const pct = Math.min(
				100,
				Math.max(1, Math.round((newWidthPx / frameWidth) * 100)),
			);
			const node = findNode(store.document.value, nodeId)?.node;
			const merged = mergeResponsiveValue(
				node?.props.width,
				breakpoint.value,
				`${pct}%`,
			);
			store.updateProps(nodeId, { width: merged });
		} else {
			const deltaPx = (ev.clientY - startY) / zoomFactor;
			const newHeightPx = Math.max(40, startHeight + deltaPx);
			store.updateProps(nodeId, { minHeight: `${Math.round(newHeightPx)}px` });
		}
	}
	function onUp() {
		window.removeEventListener("mousemove", onMove);
		window.removeEventListener("mouseup", onUp);
		store?.endBatch();
	}
	window.addEventListener("mousemove", onMove);
	window.addEventListener("mouseup", onUp);
}

// ── Clipboard (copy / cut / paste) ──────────────────────────────────────────
const clipboard = ref<string | null>(null);

function copySelected() {
	const selected = store?.selected.value;
	if (!store || !selected) return;
	const raw = findNode(store.document.value, selected.id)?.node;
	if (!raw) return;
	clipboard.value = serializeNode(raw);
}

function cutSelected() {
	const selected = store?.selected.value;
	if (!store || !selected || isLocked(selected.id)) return;
	copySelected();
	store.removeNode(selected.id);
}

function pasteClipboard() {
	if (!store || !clipboard.value) return;
	const node = deserializeNode(clipboard.value);
	if (!node) return;
	const clone = cloneNodeTree(node);
	insertNodeNearSelection(store, clone);
	store.select(clone.id);
}

// ── Tree navigation / reorder / indent-outdent ──────────────────────────────
function navigateSibling(direction: 1 | -1) {
	if (!store) return;
	const selected = store.selected.value;
	if (!selected) return;
	const doc = store.document.value;
	const loc = findParentLocation(doc.root, selected.id);
	if (!loc) return;
	const siblings = loc.parent.slots?.[loc.slot] ?? [];
	const target = siblings[loc.index + direction];
	if (!target) return;
	store.select(target.id);
}

function moveSelected(direction: "up" | "down") {
	if (!store) return;
	const selected = store.selected.value;
	if (!selected || isLocked(selected.id)) return;
	const doc = store.document.value;
	const loc = findParentLocation(doc.root, selected.id);
	if (!loc) return;
	const newIndex = direction === "up" ? loc.index - 1 : loc.index + 1;
	const siblings = loc.parent.slots?.[loc.slot] ?? [];
	if (newIndex < 0 || newIndex >= siblings.length) return;
	store.moveNode(selected.id, loc.parent.id, loc.slot, newIndex);
}

function indentSelected() {
	if (!store) return;
	const selected = store.selected.value;
	if (!selected || isLocked(selected.id)) return;
	const doc = store.document.value;
	const loc = findParentLocation(doc.root, selected.id);
	if (!loc || loc.index === 0) return;
	const prevSibling = loc.parent.slots?.[loc.slot]?.[loc.index - 1];
	if (!prevSibling) return;
	const slotName = Object.keys(prevSibling.slots ?? {})[0];
	if (!slotName) return;
	const targetIndex = prevSibling.slots?.[slotName]?.length ?? 0;
	store.moveNode(selected.id, prevSibling.id, slotName, targetIndex);
}

function outdentSelected() {
	if (!store) return;
	const selected = store.selected.value;
	if (!selected || isLocked(selected.id)) return;
	const doc = store.document.value;
	const loc = findParentLocation(doc.root, selected.id);
	if (!loc) return;
	const grandLoc = findParentLocation(doc.root, loc.parent.id);
	if (!grandLoc) return; // parent is already the root — nothing to outdent into
	store.moveNode(
		selected.id,
		grandLoc.parent.id,
		grandLoc.slot,
		grandLoc.index + 1,
	);
}

// ── Canvas drag & drop (from palette or an existing node) ───────────────────
interface InsertionLine {
	top: number;
	left: number;
	width: number;
}
interface DropLocation {
	parentId: string;
	slot: string;
	index: number;
}

const insertionLine = ref<InsertionLine | null>(null);

function computeDropTarget(
	clientY: number,
): (DropLocation & InsertionLine) | null {
	const frame = canvasRef.value;
	const stage = stageRef.value;
	if (!frame || !stage || !store) return null;
	const doc = store.document.value;
	const els = Array.from(
		frame.querySelectorAll<HTMLElement>("[data-kiv-node-id]"),
	);
	let best: { el: HTMLElement; dist: number; before: boolean } | null = null;
	for (const el of els) {
		const rect = el.getBoundingClientRect();
		const mid = rect.top + rect.height / 2;
		const dist = Math.abs(clientY - mid);
		if (!best || dist < best.dist) best = { el, dist, before: clientY < mid };
	}
	if (!best) return null;
	const id = best.el.dataset.kivNodeId;
	if (!id) return null;

	const stageRect = stage.getBoundingClientRect();
	const rect = best.el.getBoundingClientRect();
	const top = (best.before ? rect.top : rect.bottom) - stageRect.top;
	const left = rect.left - stageRect.left;
	const width = rect.width;

	if (id === doc.root.id) {
		const slotName = Object.keys(doc.root.slots ?? {})[0] ?? "default";
		return {
			parentId: doc.root.id,
			slot: slotName,
			index: doc.root.slots?.[slotName]?.length ?? 0,
			top,
			left,
			width,
		};
	}

	// Check if the closest element is a container (has slots with children or
	// an empty default slot). The middle 50% strip — between 25 % and 75 % of
	// the element's height — drops inside the container as a child; the top
	// and bottom edges insert as a sibling before / after the element.
	const closestLoc = findNode(doc, id);
	const closestSlots = closestLoc?.node.slots;
	const hasDefaultSlot = closestSlots && "default" in closestSlots;
	const relY = rect.height > 0 ? (clientY - rect.top) / rect.height : 0.5;
	const inMiddleStrip = relY > 0.25 && relY < 0.75;

	if (hasDefaultSlot && inMiddleStrip) {
		const children = closestSlots?.default ?? [];
		return {
			parentId: id,
			slot: "default",
			index: children.length,
			top: rect.bottom - stageRect.top,
			left,
			width,
		};
	}

	const loc = findParentLocation(doc.root, id);
	if (!loc) return null;
	return {
		parentId: loc.parent.id,
		slot: loc.slot,
		index: best.before ? loc.index : loc.index + 1,
		top,
		left,
		width,
	};
}

function onFrameDragOver(e: DragEvent) {
	e.preventDefault();
	const target = computeDropTarget(e.clientY);
	insertionLine.value = target
		? { top: target.top, left: target.left, width: target.width }
		: null;
}

function onFrameDragLeave() {
	insertionLine.value = null;
}

function moveManyPreservingOrder(
	ids: readonly string[],
	parentId: string,
	slot: string,
	index: number,
) {
	if (!store) return;
	const ordered = collectNodeIds(store.document.value.root).filter((id) =>
		ids.includes(id),
	);
	store.startBatch();
	let insertAt = index;
	for (const id of ordered) {
		if (isLocked(id)) continue;
		store.moveNode(id, parentId, slot, insertAt);
		insertAt++;
	}
	store.endBatch();
}

function onFrameDrop(e: DragEvent) {
	e.preventDefault();
	insertionLine.value = null;
	if (!store || !e.dataTransfer) return;
	const target = computeDropTarget(e.clientY);
	if (!target) return;

	const paletteType = e.dataTransfer.getData("application/x-kiv-node-type");
	if (paletteType) {
		const node = createPaletteNode(
			paletteType,
			props.engineRegistry,
			paletteItemByType(paletteType)?.hasDefaultSlot,
		);
		store.addNode(target.parentId, target.slot, node, target.index);
		store.select(node.id);
		return;
	}

	const draggedId = e.dataTransfer.getData("text/plain");
	if (!draggedId) return;
	const doc = store.document.value;
	if (draggedId === doc.root.id || draggedId === target.parentId) return;
	if (isLocked(draggedId)) return;
	const draggedNode = findNode(doc, draggedId)?.node;
	if (draggedNode && isDescendant(draggedNode, target.parentId)) return;

	const selectedIds = store.selectedIds.value;
	if (selectedIds.length > 1 && selectedIds.includes(draggedId)) {
		moveManyPreservingOrder(
			selectedIds,
			target.parentId,
			target.slot,
			target.index,
		);
	} else {
		store.moveNode(draggedId, target.parentId, target.slot, target.index);
	}
}

// ── Keyboard shortcuts ─────────────────────────────────────────────────────────
const shortcutsOpen = ref(false);

function onKeydown(e: KeyboardEvent) {
	const tag = (document.activeElement as HTMLElement)?.tagName;
	const isEditing =
		(document.activeElement as HTMLElement)?.contentEditable === "true";
	if (isEditing || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT")
		return;

	if (e.code === "Space") {
		e.preventDefault();
		spacePressed.value = true;
		return;
	}

	const selected = store?.selected.value;
	const selectedIds = store?.selectedIds.value ?? [];
	const meta = e.metaKey || e.ctrlKey;

	// First, check plugin-registered shortcuts
	if (extensions) {
		for (const sc of extensions.getKeyboardShortcuts()) {
			if (sc.keys === e.key.toLowerCase() || sc.keys === e.code) {
				e.preventDefault();
				sc.onTrigger();
				return;
			}
		}
	}

	if (meta && e.key === "/") {
		e.preventDefault();
		shortcutsOpen.value = true;
		return;
	}
	if (e.key === "Escape" && shortcutsOpen.value) {
		shortcutsOpen.value = false;
		return;
	}
	if (meta && e.key.toLowerCase() === "s") {
		e.preventDefault();
		store?.bus.emit("document.save", { document: store.document.value });
		return;
	}
	if (meta && e.key.toLowerCase() === "f") {
		e.preventDefault();
		focusTreeSearch?.();
		return;
	}
	if (meta && e.key.toLowerCase() === "a") {
		e.preventDefault();
		store?.selectAll();
		return;
	}
	if (meta && e.key.toLowerCase() === "c") {
		e.preventDefault();
		copySelected();
		return;
	}
	if (meta && e.key.toLowerCase() === "x") {
		e.preventDefault();
		cutSelected();
		return;
	}
	if (meta && e.key.toLowerCase() === "v") {
		e.preventDefault();
		pasteClipboard();
		return;
	}
	if (meta && e.key === "]") {
		e.preventDefault();
		indentSelected();
		return;
	}
	if (meta && e.key === "[") {
		e.preventDefault();
		outdentSelected();
		return;
	}
	if (meta && e.key === "ArrowUp") {
		e.preventDefault();
		moveSelected("up");
		return;
	}
	if (meta && e.key === "ArrowDown") {
		e.preventDefault();
		moveSelected("down");
		return;
	}
	if (meta && e.key === "0") {
		e.preventDefault();
		store?.resetZoom();
		return;
	}
	if (!meta && e.key === "ArrowUp") {
		e.preventDefault();
		navigateSibling(-1);
		return;
	}
	if (!meta && e.key === "ArrowDown") {
		e.preventDefault();
		navigateSibling(1);
		return;
	}
	if (e.key === "Enter" && selected && !isLocked(selected.id)) {
		e.preventDefault();
		if (canvasRef.value) activateById(canvasRef.value, selected.id);
		return;
	}
	if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length) {
		e.preventDefault();
		store?.removeMany(selectedIds);
		return;
	}
	if (e.key === "d" && meta && selected && !isLocked(selected.id)) {
		e.preventDefault();
		store?.duplicateNode(selected.id);
		return;
	}
	if (e.key === "z" && meta && !e.shiftKey) {
		e.preventDefault();
		store?.undo();
		return;
	}
	if (e.key === "z" && meta && e.shiftKey) {
		e.preventDefault();
		store?.redo();
		return;
	}
	if (e.key === "Escape") store?.select(null);
}

function onKeyup(e: KeyboardEvent) {
	if (e.code === "Space") spacePressed.value = false;
}

onMounted(() => {
	window.addEventListener("keydown", onKeydown);
	window.addEventListener("keyup", onKeyup);
});
onUnmounted(() => {
	window.removeEventListener("keydown", onKeydown);
	window.removeEventListener("keyup", onKeyup);
	window.removeEventListener("mousemove", onPanMove);
	window.removeEventListener("mouseup", onPanUp);
});

watch(
	() => store?.selectedIds.value,
	(newIds, oldIds) => {
		const frame = canvasRef.value;
		if (!frame) return;
		for (const oldId of oldIds ?? []) {
			if (newIds?.includes(oldId)) continue;
			const prev = frame.querySelector(
				`[data-kiv-node-id="${oldId}"]`,
			) as HTMLElement | null;
			if (prev && prev.getAttribute("data-kiv-editing") !== "true") {
				prev.style.outline = "";
				prev.style.outlineOffset = "";
			}
		}
		for (const newId of newIds ?? []) {
			if (oldIds?.includes(newId)) continue;
			const next = frame.querySelector(
				`[data-kiv-node-id="${newId}"]`,
			) as HTMLElement | null;
			if (next && next.getAttribute("data-kiv-editing") !== "true") {
				next.style.outline = "2px solid #6366f1";
				next.style.outlineOffset = "-2px";
			}
		}
	},
);

const SHORTCUT_TABLE: { keys: string; action: string }[] = [
	{ keys: "⌘C", action: "Copy selected node" },
	{ keys: "⌘X", action: "Cut selected node" },
	{ keys: "⌘V", action: "Paste node near selection" },
	{ keys: "⌘A", action: "Select all nodes" },
	{ keys: "⌘F", action: "Focus tree search" },
	{ keys: "⌘S", action: "Save (emits document.save)" },
	{ keys: "⌘/", action: "Show this shortcut reference" },
	{ keys: "↑ / ↓", action: "Select previous/next sibling" },
	{ keys: "⌘↑ / ⌘↓", action: "Move selected node up/down" },
	{ keys: "⌘] / ⌘[", action: "Indent / outdent selected node" },
	{ keys: "Enter", action: "Start inline editing" },
	{ keys: "⌘D", action: "Duplicate selected node" },
	{ keys: "Delete / ⌫", action: "Delete selected node(s)" },
	{ keys: "⌘Z / ⌘⇧Z", action: "Undo / redo" },
	{ keys: "⌘+scroll", action: "Zoom canvas" },
	{ keys: "⌘0", action: "Reset zoom" },
	{ keys: "Space+drag", action: "Pan canvas" },
	{ keys: "Escape", action: "Clear selection" },
];
</script>

<template>
	<div
		ref="rootRef"
		class="kiv-canvas"
		:class="{ 'kiv-canvas--pannable': spacePressed, 'kiv-canvas--panning': isPanning }"
		@click.stop="onCanvasClick"
		@dblclick.stop="onCanvasDblClickGuarded"
		@mousemove="onCanvasMouseMove"
		@mouseleave="onCanvasMouseLeave"
		@mousedown="onCanvasMouseDown"
		@wheel="onCanvasWheel"
	>
		<div class="kiv-canvas__bp-label">
			{{ bpLabel }}
			<span v-if="zoom !== 1" class="kiv-canvas__zoom-label">{{ Math.round(zoom * 100) }}%</span>
		</div>
		<div ref="stageRef" class="kiv-canvas__stage" :style="{ transform: `scale(${zoom})` }">
			<div
				ref="canvasRef"
				class="kiv-canvas__frame"
				:style="{ width: canvasWidth }"
				@dragover="onFrameDragOver"
				@dragleave="onFrameDragLeave"
				@drop="onFrameDrop"
			>
				<KivRenderer
					v-if="store"
					:document="store.document.value"
					:registry="registry"
					:breakpoint="breakpoint"
					:locale="locale"
					:editor-mode="true"
					:media="store.media"
					:services="store.services"
				/>
			</div>

			<!-- Node label overlays (visual only) -->
			<template v-for="item in overlayItems" :key="item.id">
				<div
					class="kiv-canvas__label"
					:class="{ 'kiv-canvas__label--selected': item.selected }"
					:style="{ top: `${item.top}px`, left: `${item.left}px` }"
				>{{ item.label }}</div>
			</template>

			<!-- Drop insertion indicator -->
			<div
				v-if="insertionLine"
				class="kiv-canvas__insertion-line"
				:style="{ top: `${insertionLine.top}px`, left: `${insertionLine.left}px`, width: `${insertionLine.width}px` }"
			/>

			<!-- Resize handles (Image: width, Section: min-height) -->
			<template v-if="resizableInfo">
				<div
					v-if="resizableInfo.type === 'image'"
					class="kiv-canvas__resize-handle kiv-canvas__resize-handle--right"
					:style="{ top: `${resizableInfo.top + resizableInfo.height / 2}px`, left: `${resizableInfo.left + resizableInfo.width}px` }"
					@mousedown="onResizeMouseDown($event, 'right')"
				/>
				<div
					v-if="resizableInfo.type === 'section'"
					class="kiv-canvas__resize-handle kiv-canvas__resize-handle--bottom"
					:style="{ top: `${resizableInfo.top + resizableInfo.height}px`, left: `${resizableInfo.left + resizableInfo.width / 2}px` }"
					@mousedown="onResizeMouseDown($event, 'bottom')"
				/>
			</template>
		</div>

		<!-- Keyboard shortcut reference (⌘/) -->
		<Teleport to="body">
			<div v-if="shortcutsOpen" class="kiv-shortcuts-backdrop" @click="shortcutsOpen = false">
				<div class="kiv-shortcuts-modal" @click.stop>
					<div class="kiv-shortcuts-modal__header">Keyboard shortcuts</div>
					<div class="kiv-shortcuts-modal__list">
						<div v-for="row in SHORTCUT_TABLE" :key="row.action" class="kiv-shortcuts-modal__row">
							<kbd>{{ row.keys }}</kbd>
							<span>{{ row.action }}</span>
						</div>
					</div>
				</div>
			</div>
		</Teleport>

		<!-- Light formatting toolbar for HTML inline-edit fields (rich-text) -->
		<Teleport to="body">
			<div
				v-if="toolbarVisible"
				class="kiv-inline-toolbar"
				:style="{ top: `${toolbarTop}px`, left: `${toolbarLeft}px` }"
			>
				<button
					type="button"
					class="kiv-inline-toolbar__btn"
					title="Bold"
					@mousedown.prevent="formatBold"
				><strong>B</strong></button>
				<button
					type="button"
					class="kiv-inline-toolbar__btn"
					title="Italic"
					@mousedown.prevent="formatItalic"
				><em>I</em></button>
				<button
					type="button"
					class="kiv-inline-toolbar__btn"
					title="Link"
					@mousedown.prevent="formatLink"
				>🔗</button>
			</div>
		</Teleport>
	</div>
</template>

<style scoped>
.kiv-canvas {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	overflow: auto;
	background-color: var(--color-surface-base);
	background-image: radial-gradient(circle, var(--color-border) 1px, transparent 1px);
	background-size: 24px 24px;
}
.kiv-canvas--pannable { cursor: grab; }
.kiv-canvas--panning { cursor: grabbing; }
.kiv-canvas__bp-label {
	flex-shrink: 0;
	text-align: center;
	padding: 8px 0 0;
	font-size: 0.68rem;
	color: var(--color-text-muted);
	letter-spacing: 0.04em;
	font-variant-numeric: tabular-nums;
}
.kiv-canvas__zoom-label {
	margin-left: 6px;
	opacity: 0.75;
}
.kiv-canvas__stage {
	flex: 1;
	position: relative;
	display: flex;
	justify-content: center;
	align-items: flex-start;
	padding: 16px 24px 48px;
	transform-origin: top center;
	transition: transform 0.08s ease-out;
}
.kiv-canvas__frame {
	background: #fff;
	box-shadow: var(--shadow-canvas-frame);
	border-radius: 8px;
	overflow: hidden;
	min-height: 480px;
	transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Label overlays — positioned relative to .kiv-canvas__stage */
.kiv-canvas__label {
	position: absolute;
	z-index: 100;
	transform: translateY(-100%);
	background: #6366f1;
	color: #fff;
	font-size: 10px;
	font-weight: 600;
	font-family: ui-sans-serif, system-ui, sans-serif;
	padding: 2px 6px;
	border-radius: 3px 3px 0 0;
	white-space: nowrap;
	line-height: 1.6;
	opacity: 0.9;
	pointer-events: none;
	user-select: none;
}
.kiv-canvas__label--selected { opacity: 1; }

/* Drop insertion indicator */
.kiv-canvas__insertion-line {
	position: absolute;
	z-index: 101;
	height: 2px;
	background: #6366f1;
	box-shadow: 0 0 6px rgba(99, 102, 241, 0.6);
	pointer-events: none;
	border-radius: 2px;
}

/* Resize handles */
.kiv-canvas__resize-handle {
	position: absolute;
	z-index: 102;
	width: 10px;
	height: 10px;
	margin: -5px;
	background: #6366f1;
	border: 2px solid #fff;
	border-radius: 50%;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}
.kiv-canvas__resize-handle--right { cursor: ew-resize; }
.kiv-canvas__resize-handle--bottom { cursor: ns-resize; }

/* Keyboard shortcut modal */
.kiv-shortcuts-backdrop {
	position: fixed;
	inset: 0;
	z-index: 9999;
	background: rgba(0, 0, 0, 0.55);
	display: flex;
	align-items: center;
	justify-content: center;
}
.kiv-shortcuts-modal {
	width: 420px;
	max-height: 70vh;
	overflow-y: auto;
	background: var(--color-surface-raised);
	border: 1px solid var(--color-border);
	border-radius: 12px;
	box-shadow: 0 24px 80px rgba(0, 0, 0, 0.7);
	color: var(--color-text-primary);
	font-family: ui-sans-serif, system-ui, sans-serif;
}
.kiv-shortcuts-modal__header {
	padding: 14px 16px;
	font-size: 0.85rem;
	font-weight: 600;
	border-bottom: 1px solid var(--color-border);
}
.kiv-shortcuts-modal__list {
	padding: 8px 16px 16px;
	display: flex;
	flex-direction: column;
	gap: 6px;
}
.kiv-shortcuts-modal__row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	font-size: 0.78rem;
	color: var(--color-text-secondary);
}
.kiv-shortcuts-modal__row kbd {
	background: var(--color-surface-overlay);
	border: 1px solid var(--color-border);
	border-radius: 4px;
	padding: 2px 6px;
	font-size: 0.72rem;
	font-family: inherit;
	color: var(--color-text-primary);
	white-space: nowrap;
}

/* Light formatting toolbar for HTML inline-edit fields */
.kiv-inline-toolbar {
	position: fixed;
	z-index: 9999;
	display: flex;
	gap: 2px;
	padding: 4px;
	background: var(--color-surface-raised);
	border: 1px solid var(--color-border);
	border-radius: 8px;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}
.kiv-inline-toolbar__btn {
	width: 26px;
	height: 26px;
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	border-radius: 5px;
	background: transparent;
	color: var(--color-text-primary);
	font-size: 0.8rem;
	cursor: pointer;
}
.kiv-inline-toolbar__btn:hover {
	background: var(--color-surface-overlay);
}
</style>
