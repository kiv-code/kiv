<script setup lang="ts">
import type {
	Breakpoint,
	EventBus,
	KivDocument,
	MediaProvider,
	ServicesContainer,
} from "@kivcode/engine";
import { HOVER_EFFECTS_CSS } from "@kivcode/nodes";
import { computed, provide } from "vue";
import { KIV_BUS_KEY } from "./bus";
import { KIV_CONTEXT_KEY } from "./context";
import { KIV_EDITOR_MODE_KEY } from "./editor-mode";
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
provide(KIV_SERVICES_KEY, props.services ?? null);

// Hover presets (.kiv-hover-*) need real CSS — `:hover` can't be inlined.
// Inject it once per document so every KivRenderer instance works out of the
// box without consumers having to wire it in themselves.
const HOVER_CSS_ID = "kiv-hover-effects-css";
if (typeof document !== "undefined" && !document.getElementById(HOVER_CSS_ID)) {
	const styleEl = document.createElement("style");
	styleEl.id = HOVER_CSS_ID;
	styleEl.textContent = HOVER_EFFECTS_CSS;
	document.head.appendChild(styleEl);
}
</script>

<template>
	<KivNodeRenderer :node="document.root" />
</template>
