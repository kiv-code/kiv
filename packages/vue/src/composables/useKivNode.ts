import type { KivNode } from "@kivcode/engine";
import { resolveNode } from "@kivcode/engine";
import type { ComputedRef } from "vue";
import { computed, inject } from "vue";
import type { KivRenderContext } from "../context";
import { KIV_CONTEXT_KEY } from "../context";

function unwrapCtx(
	raw: KivRenderContext | ComputedRef<KivRenderContext> | undefined,
): KivRenderContext | undefined {
	if (!raw) return undefined;
	// ComputedRef has a `value` property and an effect symbol
	if ("value" in raw && "effect" in raw)
		return (raw as ComputedRef<KivRenderContext>).value;
	return raw as KivRenderContext;
}

export function useKivNode(node: KivNode) {
	const raw = inject(KIV_CONTEXT_KEY);

	const ctx = computed(() => unwrapCtx(raw));

	const resolved = computed(() => {
		const c = ctx.value;
		if (!c) return { id: node.id, type: node.type, props: node.props };
		return resolveNode(node, c.resolveCtx);
	});

	const locale = computed(() => ctx.value?.resolveCtx.locale ?? "en");
	const breakpoint = computed(() => ctx.value?.resolveCtx.breakpoint ?? "base");

	return { resolved, locale, breakpoint };
}
