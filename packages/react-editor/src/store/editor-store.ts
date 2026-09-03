import type {
	Breakpoint,
	EventBus,
	FontProvider,
	KivDocument,
	KivNode,
	MediaProvider,
	Registry,
	Responsive,
	SeoMeta,
	ServicesContainer,
} from "@kivcode/engine";
import { EditorEngine } from "@kivcode/engine";
import { useEffect, useMemo, useState } from "react";
import { findNodeById } from "../utils/tree";

const HISTORY_LIMIT = 50;

export interface EditorStoreOptions {
	/** Shared bus (e.g. `engine.bus`) so plugins can observe editor mutations. Creates its own if omitted. */
	bus?: EventBus;
	/** MediaProvider (e.g. `engine.media`) so the canvas preview and the media-picker field control can resolve/browse assets. */
	media?: MediaProvider | null;
	/** FontProvider (e.g. `engine.fonts`) so the font picker offers only typefaces this project ships. */
	fonts?: FontProvider | null;
	/** Services container (e.g. `engine.services`) so the canvas preview's FormNode can submit via services.api. */
	services?: ServicesContainer | null;
}

/**
 * Unlike the Vue store (whose consumers read `.value` off Vue refs), every
 * field here is a plain value — a React hook's return object is already
 * fresh each render, so there's no need for Vue's ref-boxing plumbing.
 */
export interface EditorStore {
	registry: Registry;
	document: KivDocument;
	/** First selected node, or null. Kept for single-select call sites — always in sync with `selectedIds`. */
	selected: KivNode | null;
	/** All currently selected nodes, in selection order. */
	selectedNodes: KivNode[];
	selectedIds: readonly string[];
	canUndo: boolean;
	canRedo: boolean;
	breakpoint: Breakpoint;
	locale: string;
	/** Canvas zoom level, 0.25–2 (25%–200%). UI-only — not part of the document. */
	zoom: number;
	bus: EventBus;
	/** MediaProvider from `createEngine({ media })`, or null when none is configured. */
	media: MediaProvider | null;
	/** FontProvider from `createEngine({ fonts })`, or null when none is configured. */
	fonts: FontProvider | null;
	/** ServicesContainer from `createEngine({ services })`, or null when none is configured. */
	services: ServicesContainer | null;
	/** Replaces the whole selection with a single id (or clears it with null). */
	select(id: string | null): void;
	/** Adds/removes `id` from the current selection without touching the rest (shift-click). */
	toggleSelect(id: string): void;
	/** Selects every node in the document (except the root). */
	selectAll(): void;
	clearSelection(): void;
	isLocked(id: string): boolean;
	setBreakpoint(bp: Breakpoint): void;
	setLocale(locale: string): void;
	updateProps(id: string, patch: Record<string, unknown>): void;
	/** Applies the same prop patch to every id, as a single undo step. */
	updatePropsMany(ids: readonly string[], patch: Record<string, unknown>): void;
	renameNode(id: string, newId: string): void;
	canUseId(id: string): boolean;
	addNode(
		parentId: string,
		slotName: string,
		node: KivNode,
		index?: number,
	): void;
	removeNode(id: string): void;
	/** Removes every id, as a single undo step. */
	removeMany(ids: readonly string[]): void;
	duplicateNode(id: string): void;
	moveNode(
		id: string,
		targetParentId: string,
		targetSlot: string,
		targetIndex: number,
	): void;
	setLocked(id: string, locked: boolean): void;
	setVisible(id: string, visible: Responsive<boolean>): void;
	/** Merges a patch into the document's page-level SEO metadata (title, description, OG, …). */
	updateSeoMeta(patch: Partial<SeoMeta>): void;
	/** Replaces the whole document (e.g. applying a page template) as a single undo step. */
	loadDocument(document: KivDocument): void;
	setZoom(zoom: number): void;
	resetZoom(): void;
	startBatch(): void;
	endBatch(): void;
	undo(): void;
	redo(): void;
}

/**
 * React wrapper around the framework-agnostic `EditorEngine` — bridges its
 * bus into React state. Call this ONCE, at the root of the editor (mirrors
 * where the Vue port calls `useEditorStore` in `KivEditor`'s `setup()`), and
 * pass the result down via `EditorStoreContext.Provider`. `initialDocument`
 * and `registry` are only read on the very first render — later changes to
 * those arguments are ignored, same as Vue's non-reactive constructor args.
 */
export function useEditorStore(
	initialDocument: KivDocument,
	registry: Registry,
	options: EditorStoreOptions = {},
): EditorStore {
	const [engine] = useState(
		() =>
			new EditorEngine(initialDocument, {
				historyLimit: HISTORY_LIMIT,
				bus: options.bus,
			}),
	);

	const [document, setDocument] = useState<KivDocument>(engine.document);
	const [canUndo, setCanUndo] = useState(engine.canUndo);
	const [canRedo, setCanRedo] = useState(engine.canRedo);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
	const [breakpoint, setBreakpointState] = useState<Breakpoint>("lg");
	const [locale, setLocaleState] = useState<string>(
		initialDocument.i18n?.default ?? "en",
	);
	const [zoom, setZoomState] = useState(1);

	// biome-ignore lint/correctness/useExhaustiveDependencies: `engine` is stable for the store's whole lifetime (created once via useState's lazy initializer above) — this subscribes exactly once, mirroring the Vue store's non-reactive `engine.bus.on(...)` calls in its own one-time setup
	useEffect(() => {
		const offHistory = engine.bus.on("history.changed", (state) => {
			setDocument(engine.document);
			setCanUndo(state.canUndo);
			setCanRedo(state.canRedo);
		});
		const offSelection = engine.bus.on("selection.changed", (state) => {
			setSelectedId(state.ids[0] ?? null);
			setSelectedIds(state.ids);
		});
		return () => {
			offHistory();
			offSelection();
		};
	}, []);

	// `document` isn't read directly in the callback below, but the node it
	// points to only changes when the document does — same dependency the Vue
	// version's `computed` declares via its `void document.value` read.
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally re-derives on `document` changes, not just `selectedId`
	const selected = useMemo<KivNode | null>(() => {
		if (!selectedId) return null;
		return engine.findNode(selectedId)?.node ?? null;
	}, [selectedId, document]);

	const selectedNodes = useMemo<KivNode[]>(() => {
		const nodes: KivNode[] = [];
		for (const id of selectedIds) {
			const node = findNodeById(document.root, id);
			if (node) nodes.push(node);
		}
		return nodes;
	}, [document, selectedIds]);

	function select(id: string | null) {
		if (id === null) engine.selection.clear();
		else engine.selection.select(id);
	}

	function toggleSelect(id: string) {
		engine.selection.toggle(id);
	}

	function selectAll() {
		function collect(node: KivNode, ids: string[], isRoot: boolean) {
			if (!isRoot) ids.push(node.id);
			for (const children of Object.values(node.slots ?? {})) {
				for (const child of children) collect(child, ids, false);
			}
		}
		const ids: string[] = [];
		collect(document.root, ids, true);
		engine.selection.replace(ids);
	}

	function clearSelection() {
		engine.selection.clear();
	}

	function isLocked(id: string): boolean {
		return engine.findNode(id)?.node.locked === true;
	}

	function setBreakpoint(bp: Breakpoint) {
		setBreakpointState(bp);
	}

	function setLocale(next: string) {
		setLocaleState(next);
	}

	function updateProps(id: string, patch: Record<string, unknown>) {
		engine.updateNodeProps(id, patch);
	}

	function updatePropsMany(
		ids: readonly string[],
		patch: Record<string, unknown>,
	) {
		engine.startBatch();
		for (const id of ids) engine.updateNodeProps(id, patch);
		engine.endBatch();
	}

	function rename(id: string, newId: string) {
		engine.renameNode(id, newId);
	}

	function canUseId(id: string): boolean {
		return engine.canUseId(id, selectedId ?? undefined);
	}

	function add(
		parentId: string,
		slotName: string,
		node: KivNode,
		index?: number,
	) {
		engine.addNode({ parentId, slot: slotName, node, index });
	}

	function remove(id: string) {
		engine.removeNode(id);
	}

	function removeMany(ids: readonly string[]) {
		engine.startBatch();
		for (const id of ids) engine.removeNode(id);
		engine.endBatch();
	}

	function duplicate(id: string) {
		engine.duplicateNode(id);
	}

	function move(
		id: string,
		targetParentId: string,
		targetSlot: string,
		targetIndex: number,
	) {
		engine.moveNode({ id, targetParentId, targetSlot, targetIndex });
	}

	function setLocked(id: string, locked: boolean) {
		engine.setNodeFlags(id, { locked });
	}

	function setVisible(id: string, visible: Responsive<boolean>) {
		engine.setNodeFlags(id, { visible });
	}

	function loadDocument(next: KivDocument) {
		engine.loadDocument(next);
	}

	function updateSeoMeta(patch: Partial<SeoMeta>) {
		engine.updateSeoMeta(patch);
	}

	function setZoom(next: number) {
		setZoomState(Math.min(2, Math.max(0.25, next)));
	}

	function resetZoom() {
		setZoomState(1);
	}

	function startBatch() {
		engine.startBatch();
	}

	function endBatch() {
		engine.endBatch();
	}

	function undo() {
		engine.undo();
	}

	function redo() {
		engine.redo();
	}

	return {
		document,
		selected,
		selectedNodes,
		selectedIds,
		canUndo,
		canRedo,
		breakpoint,
		locale,
		zoom,
		bus: engine.bus,
		media: options.media ?? null,
		fonts: options.fonts ?? null,
		services: options.services ?? null,
		registry,
		select,
		toggleSelect,
		selectAll,
		clearSelection,
		isLocked,
		setBreakpoint,
		setLocale,
		updateProps,
		updatePropsMany,
		renameNode: rename,
		canUseId,
		addNode: add,
		removeNode: remove,
		removeMany,
		duplicateNode: duplicate,
		moveNode: move,
		setLocked,
		setVisible,
		updateSeoMeta,
		loadDocument,
		setZoom,
		resetZoom,
		startBatch,
		endBatch,
		undo,
		redo,
	};
}
