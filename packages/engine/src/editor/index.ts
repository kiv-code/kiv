export {
	addNode,
	cloneDocument,
	duplicateNode,
	findNode,
	moveNode,
	type NodeLocation,
	nodeIdExists,
	removeNode,
	renameNode,
	updateNodeProps,
} from "./document-ops";
export { EditorEngine } from "./editor-engine";
export {
	HistoryManager,
	type HistoryMeta,
	type HistoryOptions,
} from "./history";
export { type SelectionListener, SelectionState } from "./selection";
export type {
	AddNodeInput,
	DocumentMutations,
	EditorEngineOptions,
	MoveNodeInput,
} from "./types";
