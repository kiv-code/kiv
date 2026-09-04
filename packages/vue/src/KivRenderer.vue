<script setup lang="ts">
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
import { computed, provide } from "vue";
import { KIV_BUS_KEY } from "./bus";
import { KIV_CONTEXT_KEY } from "./context";
import { KIV_EDITOR_MODE_KEY } from "./editor-mode";
import { KIV_FONTS_KEY } from "./fonts";
import KivNodeRenderer from "./KivNodeRenderer.vue";
import { KIV_MEDIA_KEY } from "./media";
import type { VueRegistry } from "./registry";
import { KIV_SERVICES_KEY } from "./services";

const props = defineProps<{
	document: KivDocument;
	registry: VueRegistry;
	locale?: string;
	breakpoint?: Breakpoint;
	editorMode?: boolean;
	/** Optional event bus (from engine.bus). When passed, interactive nodes emit events. */
	bus?: EventBus;
	/** Optional MediaProvider (from engine.media). When passed, ImageNode resolves responsive srcset. */
	media?: MediaProvider | null;
	/** Optional FontProvider (from engine.fonts). When passed, text nodes resolve a stored font id to its real stack, and the provider's @font-face/@import is injected once. */
	fonts?: FontProvider | null;
	/** Optional services container (from engine.services). When passed, FormNode submits via services.api. */
	services?: ServicesContainer | null;
}>();

// Reactive provide — updates when breakpoint/locale props change
const ctx = computed(() => ({
	registry: props.registry,
	resolveCtx: {
		locale: props.locale ?? props.document.i18n.default,
		breakpoint: props.breakpoint ?? "base",
		fallbackLocale: props.document.i18n.fallback,
	},
}));

provide(KIV_CONTEXT_KEY, ctx);
provide(KIV_EDITOR_MODE_KEY, props.editorMode ?? false);
provide(KIV_BUS_KEY, props.bus ?? null);
provide(KIV_MEDIA_KEY, props.media ?? null);
provide(KIV_FONTS_KEY, props.fonts ?? null);
provide(KIV_SERVICES_KEY, props.services ?? null);

// Hover presets (.kiv-hover-*) need real CSS — `:hover` can't be inlined.
// Inject it once per document so every KivRenderer instance works out of the
// box without consumers having to wire it in themselves.
// A font the project ships still needs its @font-face/@import on the page.
// Injecting it here is what stops the classic "I picked a font and the public
// page didn't change" — the consumer no longer has to remember a stylesheet.
const FONT_CSS_ID = "kiv-fonts-css";
if (typeof document !== "undefined") {
	const fontCss = props.fonts?.stylesheet?.();
	if (fontCss && !document.getElementById(FONT_CSS_ID)) {
		const el = document.createElement("style");
		el.id = FONT_CSS_ID;
		el.textContent = fontCss;
		document.head.appendChild(el);
	}
}

const HOVER_CSS_ID = "kiv-hover-effects-css";
if (typeof document !== "undefined" && !document.getElementById(HOVER_CSS_ID)) {
	const styleEl = document.createElement("style");
	styleEl.id = HOVER_CSS_ID;
	styleEl.textContent = HOVER_EFFECTS_CSS;
	document.head.appendChild(styleEl);
}

const ACCORDION_CSS_ID = "kiv-accordion-css";
if (
	typeof document !== "undefined" &&
	!document.getElementById(ACCORDION_CSS_ID)
) {
	const styleEl = document.createElement("style");
	styleEl.id = ACCORDION_CSS_ID;
	styleEl.textContent = ACCORDION_CSS;
	document.head.appendChild(styleEl);
}
</script>

<template>
	<KivNodeRenderer :node="document.root" />
</template>
