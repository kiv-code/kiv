import type { KivNode } from "@kiv/engine";
import { resolveNode } from "@kiv/engine";
import { computed, inject } from "vue";
import { KIV_CONTEXT_KEY } from "../context";

/**
 * Provides the current node's resolved props inside a node component.
 * Must be used inside a component that receives a `node` prop and is
 * rendered by KivNodeRenderer.
 */
export function useKivNode(node: KivNode) {
	const ctx = inject(KIV_CONTEXT_KEY);

	const resolved = computed(() => {
		if (!ctx) {
			return { id: node.id, type: node.type, props: node.props };
		}
		return resolveNode(node, ctx.resolveCtx);
	});

	const locale = computed(() => ctx?.resolveCtx.locale ?? "en");
	const breakpoint = computed(() => ctx?.resolveCtx.breakpoint ?? "base");

	return { resolved, locale, breakpoint };
}
