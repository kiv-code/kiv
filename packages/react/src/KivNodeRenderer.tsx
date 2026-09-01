import type { KivNode } from "@kivcode/engine";
import { resolveNode, resolveResponsive } from "@kivcode/engine";
import {
	createElement,
	type DragEvent,
	type ReactNode,
	useContext,
	useMemo,
} from "react";
import { KivContext } from "./context";
import { KivEditorModeContext } from "./editor-mode";

export interface KivNodeRendererProps {
	node: KivNode;
}

export function KivNodeRenderer({ node }: KivNodeRendererProps) {
	const ctx = useContext(KivContext);
	const isEditorMode = useContext(KivEditorModeContext);

	const breakpoint = ctx?.resolveCtx.breakpoint ?? "base";
	// Hidden-for-this-breakpoint nodes render nothing in production, but stay
	// visible-and-dimmed in the editor so they can still be selected and un-hidden.
	const isVisible =
		resolveResponsive<boolean>(node.visible, breakpoint) !== false;
	const shouldRender = isVisible || isEditorMode;

	const resolved = useMemo(
		() =>
			ctx
				? resolveNode(node, ctx.resolveCtx)
				: { id: node.id, type: node.type, props: node.props },
		[node, ctx],
	);

	const Component = ctx?.registry.get(node.type) ?? null;

	// Vue's named `<slot>` outlets, but eager: every child is already a
	// rendered <KivNodeRenderer>, bucketed by slot name. The node component
	// just places `slots.default` (or a named slot) where it wants children.
	// biome-ignore lint/correctness/useExhaustiveDependencies: KivNodeRenderer is this module's own top-level function declaration, not a prop/state value — its identity never changes
	const slots = useMemo(() => {
		const entries = Object.entries(node.slots ?? {});
		const out: Record<string, ReactNode[]> = {};
		for (const [name, children] of entries) {
			out[name] = children.map((child) => (
				<KivNodeRenderer key={child.id} node={child} />
			));
		}
		return out;
	}, [node.slots]);

	if (!shouldRender) return null;

	if (!Component) {
		return <div style={{ display: "none" }} data-kiv-unknown={node.type} />;
	}

	function onDragStart(e: DragEvent) {
		if (!isEditorMode) return;
		e.dataTransfer.setData("text/plain", resolved.id);
		e.dataTransfer.effectAllowed = "move";
	}

	return createElement(Component, {
		...resolved.props,
		id: resolved.id,
		"data-kiv-node-id": resolved.id,
		"data-kiv-hidden": isVisible ? undefined : "true",
		draggable: isEditorMode || undefined,
		style: isEditorMode && !isVisible ? { opacity: 0.35 } : undefined,
		onDragStart,
		slots,
	});
}
