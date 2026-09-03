import type { KivEventMap } from "@kivcode/engine";
import { resolveLink } from "@kivcode/nodes";
import { type ElementType, useContext, useMemo } from "react";
import { KivBusContext } from "../bus";
import { KivEditorModeContext } from "../editor-mode";
import { KivLinkContext } from "../link";

/**
 * The one place link behaviour lives for every clickable node. Owns router
 * selection, anchor scrolling, the bus emit and the editor-mode guard, so
 * Button, Link and Social Icons behave identically instead of each shipping
 * its own subtly different version. Mirrors the Vue composable of the same name.
 */
export function useKivLink(
	props: Record<string, unknown>,
	options: {
		event?: keyof KivEventMap;
		payload?: () => Record<string, unknown>;
	} = {},
) {
	const isEditorMode = useContext(KivEditorModeContext);
	const bus = useContext(KivBusContext);
	// Next.js consumers pass their `Link` via KivRenderer's `linkComponent`
	// prop — that's what makes an internal link a client-side navigation
	// instead of a full page load.
	const RouterLinkLike = useContext(KivLinkContext);

	const link = useMemo(() => resolveLink(props), [props]);

	// Only an internal route belongs to the router. Handing it an anchor or an
	// absolute external URL makes it try to resolve them as app routes.
	const useRouter =
		!isEditorMode && link.type === "internal" && !!RouterLinkLike;

	// `ElementType` rather than the link-component type: `href` is supplied
	// through the `attrs` spread, so a narrower type would demand it as a
	// static prop at every call site.
	/** `a`, the host's link component, or `span` when there's no action. */
	const tag: ElementType =
		link.type === "none"
			? "span"
			: useRouter && RouterLinkLike
				? RouterLinkLike
				: "a";

	const attrs: Record<string, unknown> =
		link.type === "none" || isEditorMode
			? {}
			: useRouter
				? { href: link.href }
				: { href: link.href, target: link.target, rel: link.rel };

	function onClick(e: React.MouseEvent) {
		if (isEditorMode) {
			e.preventDefault();
			return;
		}
		if (options.event) {
			bus?.emit(options.event, (options.payload?.() ?? {}) as never);
		}
		if (link.type !== "anchor") return;
		// An anchor scrolls the page rather than navigating to it, so the
		// browser's default jump is suppressed in favour of a smooth scroll.
		e.preventDefault();
		if (!link.anchorId) return;
		document.getElementById(link.anchorId)?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	}

	return { link, tag, attrs, onClick, isEditorMode };
}
