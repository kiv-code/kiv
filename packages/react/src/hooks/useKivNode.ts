import type { KivNode } from "@kivcode/engine";
import { resolveNode } from "@kivcode/engine";
import { useContext, useMemo } from "react";
import { KivContext } from "../context";

/** Resolves a node's props for the active locale/breakpoint. Used by node
 * components that need to resolve a nested value themselves (rare — most
 * just read the already-resolved props KivNodeRenderer spreads onto them). */
export function useKivNode(node: KivNode) {
	const ctx = useContext(KivContext);

	const resolved = useMemo(
		() =>
			ctx
				? resolveNode(node, ctx.resolveCtx)
				: { id: node.id, type: node.type, props: node.props },
		[node, ctx],
	);

	return {
		resolved,
		locale: ctx?.resolveCtx.locale ?? "en",
		breakpoint: ctx?.resolveCtx.breakpoint ?? "base",
	};
}
