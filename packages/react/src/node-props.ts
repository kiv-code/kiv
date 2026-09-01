import type { CSSProperties, DragEventHandler, ReactNode } from "react";

/**
 * Every registered node component receives its resolved `props` spread in,
 * plus this fixed set of renderer-supplied props. `slots` replaces Vue's
 * named `<slot>` outlets: KivNodeRenderer has already recursively rendered
 * each child KivNode, so a node component just places `slots.default` (or
 * any other named slot) where it wants children to appear — it never walks
 * the tree itself.
 */
export interface KivNodeComponentProps {
	id: string;
	"data-kiv-node-id": string;
	"data-kiv-hidden"?: string;
	draggable?: boolean;
	style?: CSSProperties;
	onDragStart?: DragEventHandler;
	slots?: Record<string, ReactNode[]>;
	// Node-specific fields arrive as additional untyped props (resolved from
	// the KivNode's `props` bag) — each node component's own prop interface
	// narrows the ones it actually reads.
	[key: string]: unknown;
}
