import type { KivDocument, KivNode } from "../types";

/** A node found within a document, together with its parent context. */
export interface NodeLocation {
	node: KivNode;
	parent: KivNode | null;
	slotName: string | null;
	index: number;
}

function findInTree(
	current: KivNode,
	id: string,
	parent: KivNode | null,
	slotName: string | null,
	index: number,
): NodeLocation | null {
	if (current.id === id) return { node: current, parent, slotName, index };
	for (const [slot, children] of Object.entries(current.slots ?? {})) {
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			if (!child) continue;
			const found = findInTree(child, id, current, slot, i);
			if (found) return found;
		}
	}
	return null;
}

export function findNode(doc: KivDocument, id: string): NodeLocation | null {
	return findInTree(doc.root, id, null, null, 0);
}

/** True if any node in the document already uses this id. */
export function nodeIdExists(doc: KivDocument, id: string): boolean {
	return findNode(doc, id) !== null;
}

/** Deep-clones a KivDocument (structure only — no functions). */
export function cloneDocument(doc: KivDocument): KivDocument {
	return JSON.parse(JSON.stringify(doc)) as KivDocument;
}

/**
 * Renames a node's id. Returns a new document.
 * No-op if the new id is empty, unchanged, or already taken by another node.
 */
export function renameNode(
	doc: KivDocument,
	id: string,
	newId: string,
): KivDocument {
	const trimmed = newId.trim();
	if (!trimmed || trimmed === id) return doc;
	if (nodeIdExists(doc, trimmed)) return doc;
	const next = cloneDocument(doc);
	const loc = findNode(next, id);
	if (!loc) return next;
	loc.node.id = trimmed;
	return next;
}

/** Updates props of a node by id. Returns a new document (immutable). */
export function updateNodeProps(
	doc: KivDocument,
	id: string,
	patch: Record<string, unknown>,
): KivDocument {
	const next = cloneDocument(doc);
	const loc = findNode(next, id);
	if (!loc) return next;
	loc.node.props = { ...loc.node.props, ...patch };
	return next;
}

/** Adds a node to a slot of a parent. Returns a new document. */
export function addNode(
	doc: KivDocument,
	parentId: string,
	slotName: string,
	node: KivNode,
	index?: number,
): KivDocument {
	const next = cloneDocument(doc);
	const loc = findNode(next, parentId);
	if (!loc) return next;
	const parent = loc.node;
	if (!parent.slots) parent.slots = {};
	if (!parent.slots[slotName]) parent.slots[slotName] = [];
	const slot = parent.slots[slotName];
	if (!slot) return next;
	const at = index !== undefined ? index : slot.length;
	slot.splice(at, 0, node);
	return next;
}

/** Removes a node by id. Returns a new document. */
export function removeNode(doc: KivDocument, id: string): KivDocument {
	const next = cloneDocument(doc);
	const loc = findNode(next, id);
	if (!loc?.parent || loc.slotName === null) return next;
	const slot = loc.parent.slots?.[loc.slotName];
	if (!slot) return next;
	slot.splice(loc.index, 1);
	return next;
}

/** Deep-clones a node tree, appending a suffix to every id to avoid collisions. */
function reIdNode(node: KivNode, suffix: string): KivNode {
	const newSlots: Record<string, KivNode[]> = {};
	for (const [slot, children] of Object.entries(node.slots ?? {})) {
		newSlots[slot] = children.map((c) => reIdNode(c, suffix));
	}
	return {
		...node,
		id: `${node.id}-${suffix}`,
		slots: Object.keys(newSlots).length ? newSlots : undefined,
	};
}

/** Duplicates a node (with new ids) and inserts it right after the original. */
export function duplicateNode(doc: KivDocument, id: string): KivDocument {
	const loc = findNode(doc, id);
	if (!loc?.parent || loc.slotName === null) return doc;
	const suffix = Math.random().toString(36).slice(2, 6);
	const clone = reIdNode(loc.node, suffix);
	return addNode(doc, loc.parent.id, loc.slotName, clone, loc.index + 1);
}

/** Moves a node to a different parent/slot/index. Returns a new document. */
export function moveNode(
	doc: KivDocument,
	id: string,
	targetParentId: string,
	targetSlot: string,
	targetIndex: number,
): KivDocument {
	const loc = findNode(doc, id);
	if (!loc) return doc;
	const nodeCopy = JSON.parse(JSON.stringify(loc.node)) as KivNode;
	const afterRemove = removeNode(doc, id);
	return addNode(
		afterRemove,
		targetParentId,
		targetSlot,
		nodeCopy,
		targetIndex,
	);
}
