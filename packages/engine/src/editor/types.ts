import type { EventBus } from "../events";
import type { KivNode } from "../types";

export interface AddNodeInput {
	parentId: string;
	slot: string;
	node: KivNode;
	index?: number;
}

export interface MoveNodeInput {
	id: string;
	targetParentId: string;
	targetSlot: string;
	targetIndex: number;
}

/** Document-mutating operations exposed by EditorEngine. Each commits a new history snapshot and emits its matching event. */
export interface DocumentMutations {
	addNode(input: AddNodeInput): void;
	removeNode(id: string): void;
	moveNode(input: MoveNodeInput): void;
	updateNodeProps(id: string, patch: Record<string, unknown>): void;
	/** No-op if `newId` is empty, unchanged, or already taken. Returns whether the rename happened. */
	renameNode(id: string, newId: string): boolean;
	duplicateNode(id: string): void;
}

export interface EditorEngineOptions {
	/** Max number of undo snapshots kept. Defaults to 50. */
	historyLimit?: number;
	/** Bus used to emit mutation/selection/history events. Creates its own if omitted. */
	bus?: EventBus;
}

declare module "../events/types" {
	interface KivEventMap {
		"node.created": { id: string; parentId: string; slot: string };
		"node.removed": { id: string };
		"node.moved": {
			id: string;
			targetParentId: string;
			targetSlot: string;
			targetIndex: number;
		};
		"node.propsChanged": { id: string; patch: Record<string, unknown> };
		"node.renamed": { id: string; newId: string };
		"node.duplicated": { id: string };
		"selection.changed": { ids: readonly string[] };
		"history.changed": { canUndo: boolean; canRedo: boolean };
	}
}
