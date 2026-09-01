import type { KivNode } from "@kivcode/engine";

export interface ParentLocation {
	parent: KivNode;
	slot: string;
	index: number;
}

/** Finds `targetId`'s parent/slot/index by walking down from `root`. Null if `targetId` is the root itself or absent. */
export function findParentLocation(
	root: KivNode,
	targetId: string,
): ParentLocation | null {
	for (const [slot, children] of Object.entries(root.slots ?? {})) {
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			if (!child) continue;
			if (child.id === targetId) return { parent: root, slot, index: i };
			const found = findParentLocation(child, targetId);
			if (found) return found;
		}
	}
	return null;
}

/** Every node id in the subtree rooted at `node`, `node.id` included. */
export function collectNodeIds(node: KivNode): string[] {
	const ids = [node.id];
	for (const children of Object.values(node.slots ?? {})) {
		for (const child of children) ids.push(...collectNodeIds(child));
	}
	return ids;
}

export function findNodeById(root: KivNode, id: string): KivNode | null {
	if (root.id === id) return root;
	for (const children of Object.values(root.slots ?? {})) {
		for (const child of children) {
			const found = findNodeById(child, id);
			if (found) return found;
		}
	}
	return null;
}

export function isDescendant(parent: KivNode, targetId: string): boolean {
	for (const children of Object.values(parent.slots ?? {})) {
		for (const child of children) {
			if (child.id === targetId || isDescendant(child, targetId)) return true;
		}
	}
	return false;
}
