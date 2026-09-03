import type { Breakpoint, Registry } from "@kivcode/engine";
import {
	cloneNodeTree,
	deserializeNode,
	findNode,
	serializeNode,
} from "@kivcode/engine";
import type { ReactRegistry } from "@kivcode/react";
import { KivRenderer } from "@kivcode/react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useInlineEdit } from "../composables/useInlineEdit";
import {
	EditorExtensionsContext,
	EditorStoreContext,
	KivTreeFocusSearchContext,
} from "../store/context";
import type { EditorStore } from "../store/editor-store";
import { insertNodeNearSelection } from "../utils/insert-node";
import { getNodeLabelShort } from "../utils/node-labels";
import { createPaletteNode, paletteItemByType } from "../utils/palette-items";
import { mergeResponsiveValue } from "../utils/responsive-value";
import {
	collectNodeIds,
	findParentLocation,
	isDescendant,
} from "../utils/tree";

export interface KivCanvasProps {
	registry: ReactRegistry;
	engineRegistry?: Registry;
}

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

// ── Overlay labels ───────────────────────────────────────────────────────────
interface OverlayItem {
	id: string;
	type: string;
	label: string;
	top: number;
	left: number;
	width: number;
	selected: boolean;
}

// ── Resize handles (Image: width, Section: min-height) ──────────────────────
const RESIZABLE_TYPES = new Set(["image", "section"]);

interface ResizableInfo {
	id: string;
	type: string;
	top: number;
	left: number;
	width: number;
	height: number;
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

/**
 * The store is only ever absent if `KivCanvas` is rendered outside its
 * provider — a misuse, not a state this component needs to render UI for.
 * Gating here (rather than threading `store: EditorStore | null` through
 * every handler below, as the Vue original's `store?.` does) lets every hook
 * in `KivCanvasInner` assume a non-null store, so `useInlineEdit(store)` can
 * be called unconditionally instead of conditionally like the Vue setup
 * function's ternary — conditionally calling a hook isn't legal in React.
 */
export function KivCanvas(props: KivCanvasProps) {
	const store = useContext(EditorStoreContext);
	if (!store) return null;
	return <KivCanvasInner {...props} store={store} />;
}

interface KivCanvasInnerProps extends KivCanvasProps {
	store: EditorStore;
}

function KivCanvasInner({
	registry,
	engineRegistry,
	store,
}: KivCanvasInnerProps) {
	const extensions = useContext(EditorExtensionsContext);
	const focusTreeSearch = useContext(KivTreeFocusSearchContext);

	const canvasRef = useRef<HTMLDivElement | null>(null);
	const stageRef = useRef<HTMLDivElement | null>(null);
	const rootRef = useRef<HTMLDivElement | null>(null);
	const [hoveredId, setHoveredId] = useState<string | null>(null);

	function isLocked(id: string): boolean {
		return store.isLocked(id);
	}

	const breakpoint = (store.breakpoint ?? "base") as Breakpoint;
	const locale = store.locale;
	const zoom = store.zoom;

	const canvasWidth = CANVAS_WIDTHS[breakpoint] ?? "100%";
	const bpLabel = BP_LABELS[breakpoint] ?? "";

	const {
		onCanvasDblClick: onInlineDblClick,
		deactivate,
		activateById,
		toolbarVisible,
		toolbarTop,
		toolbarLeft,
		formatBold,
		formatItalic,
		formatLink,
	} = useInlineEdit(store);

	// ── Pan (space+drag or middle-mouse-drag) ─────────────────────────────────
	const [spacePressed, setSpacePressed] = useState(false);
	const [isPanning, setIsPanning] = useState(false);
	const panStartRef = useRef<{
		x: number;
		y: number;
		scrollLeft: number;
		scrollTop: number;
	} | null>(null);

	// Stable identities (empty deps — only ever read refs/stable setters) so
	// the add/remove listener pairs below always match, even across renders
	// that happen mid-drag (e.g. the `setIsPanning(true)` in
	// `onCanvasMouseDown`).
	const onPanMove = useCallback((e: MouseEvent) => {
		const start = panStartRef.current;
		if (!start || !rootRef.current) return;
		rootRef.current.scrollLeft = start.scrollLeft - (e.clientX - start.x);
		rootRef.current.scrollTop = start.scrollTop - (e.clientY - start.y);
	}, []);
	const onPanUp = useCallback(() => {
		setIsPanning(false);
		panStartRef.current = null;
		window.removeEventListener("mousemove", onPanMove);
		window.removeEventListener("mouseup", onPanUp);
		// biome-ignore lint/correctness/useExhaustiveDependencies: self-referential (removes its own listener) — `onPanUp` can't be its own dependency; `onPanMove` is included and is itself a stable empty-deps callback
	}, [onPanMove]);

	function onCanvasMouseDown(e: React.MouseEvent) {
		if (!rootRef.current) return;
		if (e.button === 1 || (e.button === 0 && spacePressed)) {
			e.preventDefault();
			setIsPanning(true);
			panStartRef.current = {
				x: e.clientX,
				y: e.clientY,
				scrollLeft: rootRef.current.scrollLeft,
				scrollTop: rootRef.current.scrollTop,
			};
			window.addEventListener("mousemove", onPanMove);
			window.addEventListener("mouseup", onPanUp);
		}
	}

	// ── Zoom (⌘+scroll, ⌘0 reset) ────────────────────────────────────────────
	function onCanvasWheel(e: React.WheelEvent) {
		if (!(e.metaKey || e.ctrlKey)) return;
		e.preventDefault();
		store.setZoom(store.zoom - e.deltaY * 0.001);
	}

	// ── Selection / click ──────────────────────────────────────────────────────
	function onCanvasClick(e: React.MouseEvent) {
		if (spacePressed || isPanning) return;
		const active = document.activeElement as HTMLElement | null;
		if (active?.contentEditable === "true") return;
		const target = (e.target as HTMLElement).closest(
			"[data-kiv-node-id]",
		) as HTMLElement | null;
		const id = target?.dataset.kivNodeId ?? null;
		if (id && isLocked(id)) return;
		if (id && e.shiftKey) {
			store.toggleSelect(id);
			return;
		}
		store.select(id);
		if (!id) deactivate();
	}

	function onCanvasDblClickGuarded(e: React.MouseEvent) {
		const target = (e.target as HTMLElement).closest(
			"[data-kiv-node-id]",
		) as HTMLElement | null;
		const id = target?.dataset.kivNodeId;
		if (id && isLocked(id)) return;
		onInlineDblClick(e.nativeEvent);
	}

	function onCanvasMouseMove(e: React.MouseEvent) {
		const target = (e.target as HTMLElement).closest(
			"[data-kiv-node-id]",
		) as HTMLElement | null;
		setHoveredId(target?.dataset.kivNodeId ?? null);
	}

	function onCanvasMouseLeave() {
		setHoveredId(null);
	}

	// ── Overlay labels — re-measured after every render that could move/resize
	// a node (zoom, document edits, hover/selection changes). ───────────────
	const [overlayItems, setOverlayItems] = useState<OverlayItem[]>([]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: `zoom`/`store.document` are trigger-only — the effect re-measures the live DOM (which they affect) rather than reading them directly
	useEffect(() => {
		const frame = canvasRef.current;
		const stage = stageRef.current;
		if (!frame || !stage) {
			setOverlayItems([]);
			return;
		}
		const items: OverlayItem[] = [];
		const selectedIds = new Set(store.selectedIds);

		const ids = new Set<string>();
		if (hoveredId) ids.add(hoveredId);
		for (const id of selectedIds) ids.add(id);

		const stageRect = stage.getBoundingClientRect();

		for (const id of ids) {
			const el = frame.querySelector(
				`[data-kiv-node-id="${id}"]`,
			) as HTMLElement | null;
			if (!el) continue;
			const type =
				el.dataset.kivType ??
				el.querySelector("[data-kiv-type]")?.getAttribute("data-kiv-type") ??
				id.split("-")[0] ??
				"";
			const elRect = el.getBoundingClientRect();
			items.push({
				id,
				type,
				label: getNodeLabelShort(type, store.registry),
				top: elRect.top - stageRect.top,
				left: elRect.left - stageRect.left,
				width: elRect.width,
				selected: selectedIds.has(id),
			});
		}
		setOverlayItems(items);
	}, [zoom, store.document, store.selectedIds, store.registry, hoveredId]);

	const [resizableInfo, setResizableInfo] = useState<ResizableInfo | null>(
		null,
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: `zoom`/`store.document` are trigger-only — the effect re-measures the live DOM (which they affect) rather than reading them directly
	useEffect(() => {
		const nodes = store.selectedNodes;
		if (nodes.length !== 1) {
			setResizableInfo(null);
			return;
		}
		const node = nodes[0];
		if (!node || !RESIZABLE_TYPES.has(node.type)) {
			setResizableInfo(null);
			return;
		}
		const frame = canvasRef.current;
		const stage = stageRef.current;
		if (!frame || !stage) {
			setResizableInfo(null);
			return;
		}
		const el = frame.querySelector(
			`[data-kiv-node-id="${node.id}"]`,
		) as HTMLElement | null;
		if (!el) {
			setResizableInfo(null);
			return;
		}
		const stageRect = stage.getBoundingClientRect();
		const elRect = el.getBoundingClientRect();
		setResizableInfo({
			id: node.id,
			type: node.type,
			top: elRect.top - stageRect.top,
			left: elRect.left - stageRect.left,
			width: elRect.width,
			height: elRect.height,
		});
	}, [zoom, store.document, store.selectedNodes]);

	function onResizeMouseDown(e: React.MouseEvent, edge: "right" | "bottom") {
		e.preventDefault();
		e.stopPropagation();
		const info = resizableInfo;
		if (!info) return;
		const startX = e.clientX;
		const startY = e.clientY;
		const startWidth = info.width;
		const startHeight = info.height;
		const frameWidth =
			canvasRef.current?.getBoundingClientRect().width ?? startWidth;
		const zoomFactor = store.zoom || 1;
		const nodeId = info.id;

		store.startBatch();

		function onMove(ev: MouseEvent) {
			if (edge === "right") {
				const deltaPx = (ev.clientX - startX) / zoomFactor;
				const newWidthPx = Math.max(20, startWidth + deltaPx);
				const pct = Math.min(
					100,
					Math.max(1, Math.round((newWidthPx / frameWidth) * 100)),
				);
				const node = findNode(store.document, nodeId)?.node;
				const merged = mergeResponsiveValue(
					node?.props.width,
					breakpoint,
					`${pct}%`,
				);
				store.updateProps(nodeId, { width: merged });
			} else {
				const deltaPx = (ev.clientY - startY) / zoomFactor;
				const newHeightPx = Math.max(40, startHeight + deltaPx);
				store.updateProps(nodeId, {
					minHeight: `${Math.round(newHeightPx)}px`,
				});
			}
		}
		function onUp() {
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
			store.endBatch();
		}
		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onUp);
	}

	// ── Clipboard (copy / cut / paste) ────────────────────────────────────────
	const clipboardRef = useRef<string | null>(null);

	function copySelected() {
		const selected = store.selected;
		if (!selected) return;
		const raw = findNode(store.document, selected.id)?.node;
		if (!raw) return;
		clipboardRef.current = serializeNode(raw);
	}

	function cutSelected() {
		const selected = store.selected;
		if (!selected || isLocked(selected.id)) return;
		copySelected();
		store.removeNode(selected.id);
	}

	function pasteClipboard() {
		if (!clipboardRef.current) return;
		const node = deserializeNode(clipboardRef.current);
		if (!node) return;
		const clone = cloneNodeTree(node);
		insertNodeNearSelection(store, clone);
		store.select(clone.id);
	}

	// ── Tree navigation / reorder / indent-outdent ────────────────────────────
	function navigateSibling(direction: 1 | -1) {
		const selected = store.selected;
		if (!selected) return;
		const doc = store.document;
		const loc = findParentLocation(doc.root, selected.id);
		if (!loc) return;
		const siblings = loc.parent.slots?.[loc.slot] ?? [];
		const target = siblings[loc.index + direction];
		if (!target) return;
		store.select(target.id);
	}

	function moveSelected(direction: "up" | "down") {
		const selected = store.selected;
		if (!selected || isLocked(selected.id)) return;
		const doc = store.document;
		const loc = findParentLocation(doc.root, selected.id);
		if (!loc) return;
		const newIndex = direction === "up" ? loc.index - 1 : loc.index + 1;
		const siblings = loc.parent.slots?.[loc.slot] ?? [];
		if (newIndex < 0 || newIndex >= siblings.length) return;
		store.moveNode(selected.id, loc.parent.id, loc.slot, newIndex);
	}

	function indentSelected() {
		const selected = store.selected;
		if (!selected || isLocked(selected.id)) return;
		const doc = store.document;
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
		const selected = store.selected;
		if (!selected || isLocked(selected.id)) return;
		const doc = store.document;
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

	// ── Canvas drag & drop (from palette or an existing node) ─────────────────
	const [insertionLine, setInsertionLine] = useState<InsertionLine | null>(
		null,
	);

	function computeDropTarget(
		clientY: number,
	): (DropLocation & InsertionLine) | null {
		const frame = canvasRef.current;
		const stage = stageRef.current;
		if (!frame || !stage) return null;
		const doc = store.document;
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

	function onFrameDragOver(e: React.DragEvent) {
		e.preventDefault();
		const target = computeDropTarget(e.clientY);
		setInsertionLine(
			target
				? { top: target.top, left: target.left, width: target.width }
				: null,
		);
	}

	function onFrameDragLeave() {
		setInsertionLine(null);
	}

	function moveManyPreservingOrder(
		ids: readonly string[],
		parentId: string,
		slot: string,
		index: number,
	) {
		const ordered = collectNodeIds(store.document.root).filter((id) =>
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

	function onFrameDrop(e: React.DragEvent) {
		e.preventDefault();
		setInsertionLine(null);
		const target = computeDropTarget(e.clientY);
		if (!target) return;

		const paletteType = e.dataTransfer.getData("application/x-kiv-node-type");
		if (paletteType) {
			const node = createPaletteNode(
				paletteType,
				engineRegistry,
				paletteItemByType(paletteType)?.hasDefaultSlot,
			);
			store.addNode(target.parentId, target.slot, node, target.index);
			store.select(node.id);
			return;
		}

		const draggedId = e.dataTransfer.getData("text/plain");
		if (!draggedId) return;
		const doc = store.document;
		if (draggedId === doc.root.id || draggedId === target.parentId) return;
		if (isLocked(draggedId)) return;
		const draggedNode = findNode(doc, draggedId)?.node;
		if (draggedNode && isDescendant(draggedNode, target.parentId)) return;

		const selectedIds = store.selectedIds;
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

	// ── Keyboard shortcuts ───────────────────────────────────────────────────
	const [shortcutsOpen, setShortcutsOpen] = useState(false);

	function onKeydown(e: KeyboardEvent) {
		const active = document.activeElement as HTMLElement | null;
		const tag = active?.tagName;
		const isEditing = active?.contentEditable === "true";
		if (isEditing || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT")
			return;

		if (e.code === "Space") {
			e.preventDefault();
			setSpacePressed(true);
			return;
		}

		const selected = store.selected;
		const selectedIds = store.selectedIds;
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
			setShortcutsOpen(true);
			return;
		}
		if (e.key === "Escape" && shortcutsOpen) {
			setShortcutsOpen(false);
			return;
		}
		if (meta && e.key.toLowerCase() === "s") {
			e.preventDefault();
			store.bus.emit("document.save", { document: store.document });
			return;
		}
		if (meta && e.key.toLowerCase() === "f") {
			e.preventDefault();
			focusTreeSearch();
			return;
		}
		if (meta && e.key.toLowerCase() === "a") {
			e.preventDefault();
			store.selectAll();
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
			store.resetZoom();
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
			if (canvasRef.current) activateById(canvasRef.current, selected.id);
			return;
		}
		if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length) {
			e.preventDefault();
			store.removeMany(selectedIds);
			return;
		}
		if (e.key === "d" && meta && selected && !isLocked(selected.id)) {
			e.preventDefault();
			store.duplicateNode(selected.id);
			return;
		}
		if (e.key === "z" && meta && !e.shiftKey) {
			e.preventDefault();
			store.undo();
			return;
		}
		if (e.key === "z" && meta && e.shiftKey) {
			e.preventDefault();
			store.redo();
			return;
		}
		if (e.key === "Escape") store.select(null);
	}

	function onKeyup(e: KeyboardEvent) {
		if (e.code === "Space") setSpacePressed(false);
	}

	// `onKeydown`/`onKeyup` close over this render's `store`/`extensions`/
	// `shortcutsOpen`/etc., so they're redefined every render — but the
	// window listener must stay attached across renders without
	// re-subscribing. These refs always hold the latest closures; the
	// effect below installs one stable wrapper per listener that just
	// forwards through the ref.
	const onKeydownRef = useRef(onKeydown);
	onKeydownRef.current = onKeydown;
	const onKeyupRef = useRef(onKeyup);
	onKeyupRef.current = onKeyup;

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-once window listeners; dispatch goes through onKeydownRef/onKeyupRef (updated every render above) so handlers always see fresh state without re-subscribing
	useEffect(() => {
		const handleKeydown = (e: KeyboardEvent) => onKeydownRef.current(e);
		const handleKeyup = (e: KeyboardEvent) => onKeyupRef.current(e);
		window.addEventListener("keydown", handleKeydown);
		window.addEventListener("keyup", handleKeyup);
		return () => {
			window.removeEventListener("keydown", handleKeydown);
			window.removeEventListener("keyup", handleKeyup);
			window.removeEventListener("mousemove", onPanMove);
			window.removeEventListener("mouseup", onPanUp);
		};
	}, [onPanMove, onPanUp]);

	// Re-applies the selection outline directly on the rendered DOM nodes
	// (rather than through React state/props) since the renderer's node
	// components are shared with the non-editor renderer and don't know
	// about editor selection at all.
	const prevSelectedIdsRef = useRef<readonly string[]>([]);
	useEffect(() => {
		const newIds = store.selectedIds;
		const oldIds = prevSelectedIdsRef.current;
		const frame = canvasRef.current;
		if (frame) {
			for (const oldId of oldIds) {
				if (newIds.includes(oldId)) continue;
				const prev = frame.querySelector(
					`[data-kiv-node-id="${oldId}"]`,
				) as HTMLElement | null;
				if (prev && prev.getAttribute("data-kiv-editing") !== "true") {
					prev.style.outline = "";
					prev.style.outlineOffset = "";
				}
			}
			for (const newId of newIds) {
				if (oldIds.includes(newId)) continue;
				const next = frame.querySelector(
					`[data-kiv-node-id="${newId}"]`,
				) as HTMLElement | null;
				if (next && next.getAttribute("data-kiv-editing") !== "true") {
					next.style.outline = "2px solid #6366f1";
					next.style.outlineOffset = "-2px";
				}
			}
		}
		prevSelectedIdsRef.current = newIds;
	}, [store.selectedIds]);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: the editing surface itself — click-to-select/pan/zoom are mouse/wheel gestures with no single keyboard equivalent; keyboard interaction (selection, deletion, move, undo/redo, shortcuts) is handled by the window-level keydown listener registered above, not this element
		// biome-ignore lint/a11y/useKeyWithClickEvents: same reason — keyboard interaction is handled by the window-level keydown listener, not an onKeyDown here
		<div
			ref={rootRef}
			className={`kiv-canvas${spacePressed ? " kiv-canvas--pannable" : ""}${
				isPanning ? " kiv-canvas--panning" : ""
			}`}
			onClick={onCanvasClick}
			onDoubleClick={onCanvasDblClickGuarded}
			onMouseMove={onCanvasMouseMove}
			onMouseLeave={onCanvasMouseLeave}
			onMouseDown={onCanvasMouseDown}
			onWheel={onCanvasWheel}
		>
			<div className="kiv-canvas__bp-label">
				{bpLabel}
				{zoom !== 1 && (
					<span className="kiv-canvas__zoom-label">
						{Math.round(zoom * 100)}%
					</span>
				)}
			</div>
			<div
				ref={stageRef}
				className="kiv-canvas__stage"
				style={{ transform: `scale(${zoom})` }}
			>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: native HTML5 drag-and-drop target only (drop-from-palette/tree) — keyboard-driven insertion is available via the "Add node" palette and paste, so dragging isn't the only way in */}
				<div
					ref={canvasRef}
					className="kiv-canvas__frame"
					style={{ width: canvasWidth }}
					onDragOver={onFrameDragOver}
					onDragLeave={onFrameDragLeave}
					onDrop={onFrameDrop}
				>
					<KivRenderer
						document={store.document}
						registry={registry}
						breakpoint={breakpoint}
						locale={locale}
						editorMode
						media={store.media}
						fonts={store.fonts}
						services={store.services}
					/>
				</div>

				{/* Node label overlays (visual only) */}
				{overlayItems.map((item) => (
					<div
						key={item.id}
						className={`kiv-canvas__label${
							item.selected ? " kiv-canvas__label--selected" : ""
						}`}
						style={{ top: `${item.top}px`, left: `${item.left}px` }}
					>
						{item.label}
					</div>
				))}

				{/* Drop insertion indicator */}
				{insertionLine && (
					<div
						className="kiv-canvas__insertion-line"
						style={{
							top: `${insertionLine.top}px`,
							left: `${insertionLine.left}px`,
							width: `${insertionLine.width}px`,
						}}
					/>
				)}

				{/* Resize handles (Image: width, Section: min-height) */}
				{resizableInfo && resizableInfo.type === "image" && (
					// biome-ignore lint/a11y/noStaticElementInteractions: mouse-drag resize handle — same as the Vue original, which has no keyboard-driven resize path either; the width/height fields in the Inspector remain the keyboard-accessible way to set these values
					<div
						className="kiv-canvas__resize-handle kiv-canvas__resize-handle--right"
						style={{
							top: `${resizableInfo.top + resizableInfo.height / 2}px`,
							left: `${resizableInfo.left + resizableInfo.width}px`,
						}}
						onMouseDown={(e) => onResizeMouseDown(e, "right")}
					/>
				)}
				{resizableInfo && resizableInfo.type === "section" && (
					// biome-ignore lint/a11y/noStaticElementInteractions: mouse-drag resize handle — same as the Vue original, which has no keyboard-driven resize path either; the min-height field in the Inspector remains the keyboard-accessible way to set this value
					<div
						className="kiv-canvas__resize-handle kiv-canvas__resize-handle--bottom"
						style={{
							top: `${resizableInfo.top + resizableInfo.height}px`,
							left: `${resizableInfo.left + resizableInfo.width / 2}px`,
						}}
						onMouseDown={(e) => onResizeMouseDown(e, "bottom")}
					/>
				)}
			</div>

			{/* Keyboard shortcut reference (⌘/) */}
			{shortcutsOpen &&
				createPortal(
					<div
						className="kiv-shortcuts-backdrop"
						role="dialog"
						aria-modal="true"
						aria-label="Keyboard shortcuts"
						onClick={() => setShortcutsOpen(false)}
						onKeyDown={(e) => {
							if (e.key === "Escape") setShortcutsOpen(false);
						}}
					>
						{/* biome-ignore lint/a11y/noStaticElementInteractions: click-boundary guard only (stops the backdrop's close-on-click from firing when clicking inside the modal) — not itself an interactive control */}
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: same reason — this is not a keyboard-operable control, just a propagation-stop wrapper */}
						<div
							className="kiv-shortcuts-modal"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="kiv-shortcuts-modal__header">
								Keyboard shortcuts
							</div>
							<div className="kiv-shortcuts-modal__list">
								{SHORTCUT_TABLE.map((row) => (
									<div key={row.action} className="kiv-shortcuts-modal__row">
										<kbd>{row.keys}</kbd>
										<span>{row.action}</span>
									</div>
								))}
							</div>
						</div>
					</div>,
					document.body,
				)}

			{/* Light formatting toolbar for HTML inline-edit fields (rich-text) */}
			{toolbarVisible &&
				createPortal(
					<div
						className="kiv-inline-toolbar"
						style={{ top: `${toolbarTop}px`, left: `${toolbarLeft}px` }}
					>
						<button
							type="button"
							className="kiv-inline-toolbar__btn"
							title="Bold"
							onMouseDown={(e) => {
								e.preventDefault();
								formatBold();
							}}
						>
							<strong>B</strong>
						</button>
						<button
							type="button"
							className="kiv-inline-toolbar__btn"
							title="Italic"
							onMouseDown={(e) => {
								e.preventDefault();
								formatItalic();
							}}
						>
							<em>I</em>
						</button>
						<button
							type="button"
							className="kiv-inline-toolbar__btn"
							title="Link"
							onMouseDown={(e) => {
								e.preventDefault();
								formatLink();
							}}
						>
							🔗
						</button>
					</div>,
					document.body,
				)}
		</div>
	);
}
