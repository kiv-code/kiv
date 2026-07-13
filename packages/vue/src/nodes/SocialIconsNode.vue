<script setup lang="ts">
import {
	GAP,
	hoverEffectClass,
	hoverGlowStyle,
	parseSocialLinks,
	RADIUS,
	resolveIcon,
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

const PLATFORM_ICON: Record<string, string> = {
	twitter: "fa6-brands:x-twitter",
	x: "fa6-brands:x-twitter",
	facebook: "fa6-brands:facebook",
	instagram: "fa6-brands:instagram",
	linkedin: "fa6-brands:linkedin",
	youtube: "fa6-brands:youtube",
	github: "fa6-brands:github",
	tiktok: "fa6-brands:tiktok",
	whatsapp: "fa6-brands:whatsapp",
	email: "fa6-regular:envelope",
};

const SHAPE_RADIUS: Record<string, string> = {
	none: "0",
	circle: RADIUS.full ?? "9999px",
	square: "0",
	rounded: RADIUS.md ?? "8px",
};

const socialLinks = computed(() => parseSocialLinks(props.links));
const hoverClass = computed(() => hoverEffectClass(props.hoverEffect));

const wrapperStyle = computed(() => ({
	display: "flex" as const,
	alignItems: "center" as const,
	gap: GAP[props.gap ?? "sm"] ?? "8px",
}));

function iconSvg(platform: string): string | null {
	const name = PLATFORM_ICON[platform.toLowerCase()];
	return name ? resolveIcon(name) : null;
}

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
			:aria-label="link.platform"
			:class="hoverClass"
			:style="itemStyle()"
		>
			<span v-if="iconSvg(link.platform)" class="kiv-social-icons__svg" v-html="iconSvg(link.platform)" />
			<span v-else aria-hidden="true">{{ link.platform.slice(0, 1).toUpperCase() }}</span>
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
