import type { EventBus } from "../events";
import { createEventBus } from "../events";
import type { KivDocument } from "../types";
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
	updateNodeProps as updateNodePropsOp,
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

	constructor(document: KivDocument, options: EditorEngineOptions = {}) {
		this.bus = options.bus ?? createEventBus();
		this.history = new HistoryManager(cloneDocument(document), {
			limit: options.historyLimit,
		});
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
		this.history.push(next, meta);
		this.emitHistoryChanged();
	}

	private emitHistoryChanged(): void {
		this.bus.emit("history.changed", {
			canUndo: this.canUndo,
			canRedo: this.canRedo,
		});
	}
}
