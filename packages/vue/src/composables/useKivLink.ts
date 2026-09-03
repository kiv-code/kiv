import type { KivEventMap } from "@kivcode/engine";
import { resolveLink } from "@kivcode/nodes";
import { computed, getCurrentInstance, inject, type Ref } from "vue";
import { KIV_BUS_KEY } from "../bus";
import { KIV_EDITOR_MODE_KEY } from "../editor-mode";

/**
 * The one place link behaviour lives for every clickable node. Owns router
 * detection, anchor scrolling, the bus emit and the editor-mode guard, so
 * Button, Link and Social Icons behave identically instead of each shipping
 * its own subtly different version.
 */
export function useKivLink(
	props: Ref<Record<string, unknown>>,
	options: {
		event?: keyof KivEventMap;
		payload?: () => Record<string, unknown>;
	} = {},
) {
	const isEditorMode = inject(KIV_EDITOR_MODE_KEY, false);
	const bus = inject(KIV_BUS_KEY, null);

	const link = computed(() => resolveLink(props.value));

	// Detect Vue Router WITHOUT depending on it and WITHOUT resolveComponent(),
	// which warns to the console whenever the name isn't found — even when the
	// result is never used. A plain lookup in the app's registered components is
	// silent: if the consumer's app installed vue-router, `RouterLink` is there;
	// otherwise this is undefined and we fall back to a plain <a>.
	// @kivcode/vue never imports vue-router.
	const routerLink = computed(() => {
		// Only an internal route belongs to the router. Handing it an anchor or
		// an absolute external URL makes it try to resolve them as app routes.
		if (isEditorMode || link.value.type !== "internal") return undefined;
		const components = getCurrentInstance()?.appContext.components;
		return components?.RouterLink ?? components?.["router-link"];
	});

	/** `a`, `RouterLink`, or `span` when the node has no action at all. */
	const tag = computed(() => {
		if (link.value.type === "none") return "span";
		return routerLink.value ?? "a";
	});

	const attrs = computed(() => {
		if (link.value.type === "none") return {};
		// Inside the editor a live href would navigate away mid-edit.
		if (isEditorMode) return {};
		if (routerLink.value) return { to: link.value.href };
		return {
			href: link.value.href,
			target: link.value.target,
			rel: link.value.rel,
		};
	});

	function onClick(e: MouseEvent) {
		if (isEditorMode) {
			e.preventDefault();
			return;
		}
		if (options.event) {
			bus?.emit(options.event, (options.payload?.() ?? {}) as never);
		}
		const { type, anchorId } = link.value;
		if (type !== "anchor") return;
		// An anchor scrolls the page rather than navigating to it, so the
		// browser's default jump is suppressed in favour of a smooth scroll.
		e.preventDefault();
		if (!anchorId) return;
		document.getElementById(anchorId)?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	}

	return { link, tag, attrs, onClick, isEditorMode };
}
