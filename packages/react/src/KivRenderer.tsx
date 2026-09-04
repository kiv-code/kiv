import type {
	Breakpoint,
	EventBus,
	FontProvider,
	KivDocument,
	MediaProvider,
	ServicesContainer,
} from "@kivcode/engine";
import { HOVER_EFFECTS_CSS } from "@kivcode/nodes";
import { ACCORDION_CSS } from "@kivcode/nodes-interactive";
import { type ComponentType, useEffect, useMemo } from "react";
import { KivBusContext } from "./bus";
import { KivContext } from "./context";
import { KivEditorModeContext } from "./editor-mode";
import { KivFontsContext } from "./fonts";
import { KivNodeRenderer } from "./KivNodeRenderer";
import type { KivLinkComponentProps } from "./link";
import { KivLinkContext } from "./link";
import { KivMediaContext } from "./media";
import type { ReactRegistry } from "./registry";
import { KivServicesContext } from "./services";

export interface KivRendererProps {
	document: KivDocument;
	registry: ReactRegistry;
	locale?: string;
	breakpoint?: Breakpoint;
	editorMode?: boolean;
	/** Optional event bus (from engine.bus). When passed, interactive nodes emit events. */
	bus?: EventBus | null;
	/** Optional MediaProvider (from engine.media). When passed, ImageNode resolves responsive srcset. */
	media?: MediaProvider | null;
	/** Optional FontProvider (from engine.fonts). When passed, text nodes resolve a stored font id to its real stack, and the provider's @font-face/@import is injected once. */
	fonts?: FontProvider | null;
	/** Optional services container (from engine.services). When passed, FormNode submits via services.api. */
	services?: ServicesContainer | null;
	/** Router-aware link component (e.g. Next.js's `Link`) for internal navigation. Falls back to `<a>`. */
	linkComponent?: ComponentType<KivLinkComponentProps> | null;
}

const HOVER_CSS_ID = "kiv-hover-effects-css";
const ACCORDION_CSS_ID = "kiv-accordion-css";
const FONT_CSS_ID = "kiv-fonts-css";

export function KivRenderer({
	document: doc,
	registry,
	locale,
	breakpoint,
	editorMode = false,
	bus = null,
	media = null,
	fonts = null,
	services = null,
	linkComponent = null,
}: KivRendererProps) {
	// Reactive-by-dependency-array — updates when locale/breakpoint props change.
	const ctx = useMemo(
		() => ({
			registry,
			resolveCtx: {
				locale: locale ?? doc.i18n.default,
				breakpoint: (breakpoint ?? "base") as Breakpoint,
				fallbackLocale: doc.i18n.fallback,
			},
		}),
		[registry, locale, breakpoint, doc.i18n.default, doc.i18n.fallback],
	);

	// Hover presets (.kiv-hover-*) need real CSS — `:hover` can't be inlined.
	// Inject it once per document so every KivRenderer instance works out of
	// the box without consumers having to wire it in themselves. useEffect
	// only runs client-side, so this is inert during SSR (Next.js).
	useEffect(() => {
		if (document.getElementById(HOVER_CSS_ID)) return;
		const styleEl = document.createElement("style");
		styleEl.id = HOVER_CSS_ID;
		styleEl.textContent = HOVER_EFFECTS_CSS;
		document.head.appendChild(styleEl);
	}, []);

	useEffect(() => {
		if (document.getElementById(ACCORDION_CSS_ID)) return;
		const styleEl = document.createElement("style");
		styleEl.id = ACCORDION_CSS_ID;
		styleEl.textContent = ACCORDION_CSS;
		document.head.appendChild(styleEl);
	}, []);

	// A font the project ships still needs its @font-face/@import on the page.
	// Injecting it here is what stops the classic "I picked a font and the
	// public page didn't change" — the consumer no longer has to remember a
	// stylesheet.
	useEffect(() => {
		const css = fonts?.stylesheet?.();
		if (!css || typeof document === "undefined") return;
		if (document.getElementById(FONT_CSS_ID)) return;
		const styleEl = document.createElement("style");
		styleEl.id = FONT_CSS_ID;
		styleEl.textContent = css;
		document.head.appendChild(styleEl);
	}, [fonts]);

	return (
		<KivContext.Provider value={ctx}>
			<KivEditorModeContext.Provider value={editorMode}>
				<KivBusContext.Provider value={bus}>
					<KivMediaContext.Provider value={media}>
						<KivFontsContext.Provider value={fonts}>
							<KivServicesContext.Provider value={services}>
								<KivLinkContext.Provider value={linkComponent}>
									<KivNodeRenderer node={doc.root} />
								</KivLinkContext.Provider>
							</KivServicesContext.Provider>
						</KivFontsContext.Provider>
					</KivMediaContext.Provider>
				</KivBusContext.Provider>
			</KivEditorModeContext.Provider>
		</KivContext.Provider>
	);
}
