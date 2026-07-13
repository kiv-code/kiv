import type { ResolveContext } from "@kivcode/engine";
import type { ComputedRef, InjectionKey } from "vue";
import type { VueRegistry } from "./registry";

export interface KivRenderContext {
	registry: VueRegistry;
	resolveCtx: ResolveContext;
}

// Supports both direct value (legacy) and ComputedRef (reactive, from KivRenderer)
export const KIV_CONTEXT_KEY: InjectionKey<
	KivRenderContext | ComputedRef<KivRenderContext>
> = Symbol("kiv-render-context");
