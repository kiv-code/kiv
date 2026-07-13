import type { KivNode } from "@kivcode/engine";
import type { EditorStore } from "../store/editor-store";
import { findParentLocation } from "./tree";

/**
 * Smart insert: if the current selection has slots, appends `node` as its
 * last child. If the selection is a leaf, inserts `node` right after it in
 * its parent. With no selection, appends to the root's first slot.
 */
export function insertNodeNearSelection(
	store: EditorStore,
	node: KivNode,
): void {
	const selected = store.selected.value;
	const doc = store.document.value;

	if (selected) {
		const slots = Object.keys(selected.slots ?? {});
		if (slots.length > 0) {
			const slotName = slots[0] ?? "default";
			const children = selected.slots?.[slotName] ?? [];
			store.addNode(selected.id, slotName, node, children.length);
			return;
		}
		const loc = findParentLocation(doc.root, selected.id);
		if (loc) {
			store.addNode(loc.parent.id, loc.slot, node, loc.index + 1);
			return;
		}
	}
	const slotName = Object.keys(doc.root.slots ?? {})[0] ?? "default";
	const children = doc.root.slots?.[slotName] ?? [];
	store.addNode(doc.root.id, slotName, node, children.length);
}
