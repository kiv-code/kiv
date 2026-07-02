import type { ResolveContext } from "@kiv/engine";
import type { InjectionKey } from "vue";
import type { VueRegistry } from "./registry";

export interface KivRenderContext {
	registry: VueRegistry;
	resolveCtx: ResolveContext;
}

export const KIV_CONTEXT_KEY: InjectionKey<KivRenderContext> =
	Symbol("kiv-render-context");
