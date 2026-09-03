import type { EventBus } from "../events";
import { createEventBus } from "../events";
import { migrateDocument } from "../migrations";
import type { KivDocument, KivNode, SeoMeta } from "../types";
import {
	addNode as addNodeOp,
	cloneDocument,
	duplicateNode as duplicateNodeOp,
	findNode as findNodeOp,
	moveNode as moveNodeOp,
	type NodeLocation,
	nodeIdExists,
	removeNode as removeNodeOp,
	renameNode as renameNodeOp,
	setNodeFlags as setNodeFlagsOp,
	updateNodeProps as updateNodePropsOp,
	updateSeoMeta as updateSeoMetaOp,
} from "./document-ops";
import { HistoryManager } from "./history";
import { SelectionState } from "./selection";
import type {
	AddNodeInput,
	DocumentMutations,
	EditorEngineOptions,
	MoveNodeInput,
} from "./types";

/**
 * Framework-agnostic editor state: document + selection + history.
 * No Vue/React imports — consumers subscribe through `bus` to react to changes.
 */
export class EditorEngine implements DocumentMutations {
	readonly selection = new SelectionState();
	readonly bus: EventBus;
	private readonly history: HistoryManager<KivDocument>;
	private batchDepth = 0;
	private pendingBatchSnapshot: KivDocument | null = null;
	private batchDirty = false;

	constructor(document: KivDocument, options: EditorEngineOptions = {}) {
		this.bus = options.bus ?? createEventBus();
		this.history = new HistoryManager(
			cloneDocument(migrateDocument(document)),
			{ limit: options.historyLimit },
		);
		this.selection.onChange((ids) => {
			this.bus.emit("selection.changed", { ids });
		});
	}

	get document(): KivDocument {
		return this.history.present;
	}

	get canUndo(): boolean {
		return this.history.canUndo;
	}

	get canRedo(): boolean {
		return this.history.canRedo;
	}

	findNode(id: string): NodeLocation | null {
		return findNodeOp(this.document, id);
	}

	/** True if `id` is free to use, or belongs to `currentId` (renaming a node to its own id is always allowed). */
	canUseId(id: string, currentId?: string): boolean {
		const trimmed = id.trim();
		if (!trimmed) return false;
		if (trimmed === currentId) return true;
		return !nodeIdExists(this.document, trimmed);
	}

	addNode(input: AddNodeInput): void {
		const { parentId, slot, node, index } = input;
		this.commit(addNodeOp(this.document, parentId, slot, node, index), {
			type: "node.created",
			id: node.id,
		});
		this.bus.emit("node.created", { id: node.id, parentId, slot });
	}

	removeNode(id: string): void {
		this.commit(removeNodeOp(this.document, id), {
			type: "node.removed",
			id,
		});
		if (this.selection.has(id)) this.selection.remove(id);
		this.bus.emit("node.removed", { id });
	}

	moveNode(input: MoveNodeInput): void {
		const { id, targetParentId, targetSlot, targetIndex } = input;
		this.commit(
			moveNodeOp(this.document, id, targetParentId, targetSlot, targetIndex),
			{ type: "node.moved", id },
		);
		this.bus.emit("node.moved", {
			id,
			targetParentId,
			targetSlot,
			targetIndex,
		});
	}

	updateNodeProps(id: string, patch: Record<string, unknown>): void {
		this.commit(updateNodePropsOp(this.document, id, patch), {
			type: "node.propsChanged",
			id,
		});
		this.bus.emit("node.propsChanged", { id, patch });
	}

	renameNode(id: string, newId: string): boolean {
		const trimmed = newId.trim();
		if (!trimmed || trimmed === id) return false;
		if (nodeIdExists(this.document, trimmed)) return false;
		this.commit(renameNodeOp(this.document, id, trimmed), {
			type: "node.renamed",
			id,
		});
		if (this.selection.has(id)) {
			this.selection.remove(id);
			this.selection.add(trimmed);
		}
		this.bus.emit("node.renamed", { id, newId: trimmed });
		return true;
	}

	duplicateNode(id: string): void {
		this.commit(duplicateNodeOp(this.document, id), {
			type: "node.duplicated",
			id,
		});
		this.bus.emit("node.duplicated", { id });
	}

	setNodeFlags(
		id: string,
		patch: Partial<Pick<KivNode, "locked" | "visible">>,
	): void {
		this.commit(setNodeFlagsOp(this.document, id, patch), {
			type: "node.flagsChanged",
			id,
		});
		this.bus.emit("node.flagsChanged", { id });
	}

	/** Merges a patch into the document's page-level SEO metadata (title, description, OG, …). */
	updateSeoMeta(patch: Partial<SeoMeta>): void {
		this.commit(updateSeoMetaOp(this.document, patch), {
			type: "document.seoChanged",
		});
		this.bus.emit("document.seoChanged", { patch });
	}

	/**
	 * Replaces the entire document (e.g. applying a page template) as a single
	 * undo step. Clears the selection, since node ids from the previous
	 * document are no longer guaranteed to exist.
	 */
	loadDocument(document: KivDocument): void {
		this.commit(cloneDocument(migrateDocument(document)), {
			type: "document.loaded",
		});
		this.selection.clear();
		this.bus.emit("document.loaded", { document: this.document });
	}

	/** True while a batch opened with `startBatch()` hasn't been closed yet. */
	get isBatching(): boolean {
		return this.batchDepth > 0;
	}

	/**
	 * Opens (or nests into) a batch: mutations committed until the matching
	 * `endBatch()` update the live document immediately but collapse into a
	 * single undo step instead of one step per mutation. Safe to nest — only
	 * the outermost `startBatch`/`endBatch` pair records the undo step.
	 */
	startBatch(): void {
		if (this.batchDepth === 0) {
			this.pendingBatchSnapshot = cloneDocument(this.document);
			this.batchDirty = false;
		}
		this.batchDepth++;
	}

	/** Closes a batch opened with `startBatch()`. No-op if none is open. */
	endBatch(): void {
		if (this.batchDepth === 0) return;
		this.batchDepth--;
		if (this.batchDepth === 0) {
			if (this.batchDirty && this.pendingBatchSnapshot) {
				this.history.commitBatch(this.pendingBatchSnapshot, {
					type: "batch",
				});
				this.emitHistoryChanged();
			}
			this.pendingBatchSnapshot = null;
			this.batchDirty = false;
		}
	}

	undo(): void {
		if (this.history.undo() === null) return;
		this.emitHistoryChanged();
	}

	redo(): void {
		if (this.history.redo() === null) return;
		this.emitHistoryChanged();
	}

	private commit(
		next: KivDocument,
		meta: { type: string; [key: string]: unknown },
	): void {
		if (this.batchDepth > 0) {
			this.batchDirty = true;
			this.history.replacePresent(next, meta);
		} else {
			this.history.push(next, meta);
		}
		this.emitHistoryChanged();
	}

	private emitHistoryChanged(): void {
		this.bus.emit("history.changed", {
			canUndo: this.canUndo,
			canRedo: this.canRedo,
		});
	}
}
