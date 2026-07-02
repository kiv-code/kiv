<script setup lang="ts">
import type { Breakpoint, KivDocument } from "@kiv/engine";
import { provide } from "vue";
import { KIV_CONTEXT_KEY } from "./context";
import KivNodeRenderer from "./KivNodeRenderer.vue";
import type { VueRegistry } from "./registry";

const props = defineProps<{
	document: KivDocument;
	registry: VueRegistry;
	locale?: string;
	breakpoint?: Breakpoint;
}>();

provide(KIV_CONTEXT_KEY, {
	registry: props.registry,
	resolveCtx: {
		locale: props.locale ?? props.document.i18n.default,
		breakpoint: props.breakpoint ?? "base",
		fallbackLocale: props.document.i18n.fallback,
	},
});
</script>

<template>
	<KivNodeRenderer :node="document.root" />
</template>
