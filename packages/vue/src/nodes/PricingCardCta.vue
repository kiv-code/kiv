<script setup lang="ts">
import type { PricingTier } from "@kivcode/nodes";
import { computed, type StyleValue } from "vue";
import { useKivLink } from "../composables/useKivLink";

/**
 * One pricing card's CTA — its own component so `useKivLink` (router
 * detection, anchor scroll, editor-mode guard) runs per tier instead of once
 * for the whole node. Each tier can point somewhere different; a tier with no
 * link of its own falls back to the node-level `linkType`/`href`.
 */
const props = defineProps<{
	tier: PricingTier;
	fallbackLinkType?: string;
	fallbackHref?: string;
	label: string;
	style?: StyleValue;
}>();

const linkProps = computed(() => ({
	linkType:
		props.tier.ctaLinkType || props.tier.ctaHref
			? props.tier.ctaLinkType
			: props.fallbackLinkType,
	href:
		props.tier.ctaLinkType || props.tier.ctaHref
			? props.tier.ctaHref
			: props.fallbackHref,
}));

const { tag, attrs, onClick } = useKivLink(linkProps);
</script>

<template>
	<component :is="tag" v-bind="attrs" :style="style" @click="onClick">{{ label }}</component>
</template>
