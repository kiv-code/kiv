import type { ResolveContext } from "@kivcode/engine";
import { createContext } from "react";
import type { ReactRegistry } from "./registry";

export interface KivRenderContext {
	registry: ReactRegistry;
	resolveCtx: ResolveContext;
}

export const KivContext = createContext<KivRenderContext | null>(null);
