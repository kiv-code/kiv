import type { ComponentType, ReactNode } from "react";
import { createContext } from "react";

/**
 * The Vue renderer auto-detects an installed vue-router and swaps in
 * RouterLink for internal links; @kivcode/react has no equivalent runtime
 * detection (React has no global component registry to probe). Instead,
 * a Next.js (or any router-aware) consumer passes its own link component —
 * typically `next/link`'s `Link` — through KivRenderer's `linkComponent`
 * prop. ButtonNode/LinkNode use it for internal navigation and fall back to
 * a plain `<a>` when it's absent (e.g. the editor canvas, or a consumer with
 * no client-side router).
 *
 * Contract: the component must accept `href` and `children`, mirroring
 * `next/link`'s public props — that's the only shape ButtonNode/LinkNode rely on.
 */
export interface KivLinkComponentProps {
	href: string;
	children?: ReactNode;
	[key: string]: unknown;
}

export const KivLinkContext =
	createContext<ComponentType<KivLinkComponentProps> | null>(null);
