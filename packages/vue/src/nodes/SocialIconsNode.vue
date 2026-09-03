<script setup lang="ts">
import {
	GAP,
	hoverEffectClass,
	hoverGlowStyle,
	parseSocialLinks,
	RADIUS,
	resolveSocialLinkDisplay,
} from "@kivcode/nodes";
import { computed } from "vue";

const props = defineProps<{
	links?: string;
	size?: number;
	gap?: string;
	shape?: string;
	color?: string;
	backgroundColor?: string;
	hoverEffect?: string;
	hoverGlowColor?: string;
}>();

const SHAPE_RADIUS: Record<string, string> = {
	none: "0",
	circle: RADIUS.full ?? "9999px",
	square: "0",
	rounded: RADIUS.md ?? "8px",
};

const socialLinks = computed(() =>
	parseSocialLinks(props.links).map((link) => ({
		...link,
		...resolveSocialLinkDisplay(link),
	})),
);
const hoverClass = computed(() => hoverEffectClass(props.hoverEffect));

const wrapperStyle = computed(() => ({
	display: "flex" as const,
	alignItems: "center" as const,
	gap: GAP[props.gap ?? "sm"] ?? "8px",
}));

function itemStyle() {
	const size = props.size ?? 20;
	return {
		display: "inline-flex" as const,
		alignItems: "center" as const,
		justifyContent: "center" as const,
		width: `${size * 2}px`,
		height: `${size * 2}px`,
		fontSize: `${size}px`,
		color: props.color ?? "#000000",
		background: props.backgroundColor ?? "transparent",
		borderRadius: SHAPE_RADIUS[props.shape ?? "circle"] ?? "0",
		...hoverGlowStyle(props.hoverGlowColor),
	};
}
</script>

<template>
	<div :style="wrapperStyle" data-kiv-type="social-icons">
		<a
			v-for="(link, i) in socialLinks"
			:key="`${link.platform}-${i}`"
			:href="link.url"
			target="_blank"
			rel="noopener noreferrer"
			:aria-label="link.label"
			:class="hoverClass"
			:style="itemStyle()"
		>
			<span v-if="link.svg" class="kiv-social-icons__svg" v-html="link.svg" />
			<span v-else aria-hidden="true">{{ link.label.slice(0, 1).toUpperCase() }}</span>
		</a>
	</div>
</template>

<style scoped>
.kiv-social-icons__svg :deep(svg) {
	width: 1em;
	height: 1em;
	display: block;
}
</style>
