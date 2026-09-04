<script setup lang="ts">
import {
	BLUR,
	RADIUS,
	resolveBackgroundPaint,
	resolveShadow,
	resolveSolidColor,
	resolveSpacingStyle,
	SECTION_SPACING,
} from "@kivcode/nodes";
import { computed } from "vue";

function isGradient(value: unknown): boolean {
	return (
		!!value &&
		typeof value === "object" &&
		(value as { type?: string }).type === "gradient"
	);
}

const props = defineProps<{
	background?: unknown;
	backgroundImage?: string;
	backgroundVideo?: string;
	backgroundSize?: string;
	backgroundPosition?: string;
	overlay?: boolean;
	overlayColor?: unknown;
	blur?: string;
	opacity?: number;
	padding?: unknown;
	margin?: unknown;
	borderWidth?: string;
	borderColor?: string;
	borderRadius?: string;
	shadow?: string;
	shadowColor?: string;
	fullWidth?: boolean;
	minHeight?: string;
	alignItems?: string;
	justifyContent?: string;
}>();

const sectionStyle = computed(() => {
	const s: Record<string, string | undefined> = {};

	const solidBg = resolveSolidColor(props.background, "");
	if (solidBg) s.backgroundColor = solidBg;
	if (props.backgroundImage) {
		s.backgroundImage = `url(${props.backgroundImage})`;
		s.backgroundSize = props.backgroundSize ?? "cover";
		s.backgroundPosition = props.backgroundPosition ?? "center";
	}
	// Gradient wins over an image background, matching the previous
	// (pre-migration) precedence of the standalone "gradient" field.
	if (isGradient(props.background)) {
		s.backgroundImage = resolveBackgroundPaint(props.background, "");
		// Default background-origin is padding-box: paired with a border
		// (borderWidth > 0), the gradient sizes to the smaller padding-box
		// area then tiles to fill the border strip, leaving a visible seam.
		s.backgroundOrigin = "border-box";
	}
	if (props.opacity !== undefined && props.opacity !== 1) {
		s.opacity = String(props.opacity);
	}
	// Section keeps its own, larger rhythm: the same `lg` token is 64px here
	// and 32px on a Stack, which is why the scale travels with the field.
	Object.assign(
		s,
		resolveSpacingStyle("padding", props.padding, {}, SECTION_SPACING),
		resolveSpacingStyle("margin", props.margin, {}, SECTION_SPACING),
	);
	if (props.borderWidth && props.borderWidth !== "0") {
		s.borderWidth = `${props.borderWidth}px`;
		s.borderStyle = "solid";
		if (props.borderColor) s.borderColor = props.borderColor;
	}
	if (props.borderRadius && props.borderRadius !== "none") {
		s.borderRadius = RADIUS[props.borderRadius] ?? props.borderRadius;
	}
	if (props.shadow && props.shadow !== "none") {
		s.boxShadow = resolveShadow(props.shadow, props.shadowColor || undefined);
	}
	if (props.minHeight) {
		s.minHeight = props.minHeight;
	}

	return s;
});

const bgBlurStyle = computed(() => {
	const amount = BLUR[props.blur ?? "none"] ?? "0";
	if (amount === "0") return null;
	return {
		position: "absolute" as const,
		inset: "0",
		backdropFilter: `blur(${amount})`,
		pointerEvents: "none" as const,
		zIndex: "0",
	};
});

// Always declared: a flex column's real browser default is `stretch`, not
// `flex-start` — omitting "flex-start" here silently stretched content
// full-width instead of pinning it to the start.
const contentStyle = computed(() => ({
	alignItems: props.alignItems ?? "flex-start",
	justifyContent: props.justifyContent ?? "flex-start",
}));
</script>

<template>
	<section :style="sectionStyle" data-kiv-type="section" class="kiv-section">
		<div v-if="backgroundVideo" class="kiv-section__video-bg">
			<video autoplay muted loop playsinline :src="backgroundVideo" />
		</div>
		<div v-if="bgBlurStyle" :style="bgBlurStyle" />
		<div
			v-if="overlay"
			class="kiv-section__overlay"
			:style="{ background: resolveBackgroundPaint(overlayColor, 'rgba(0, 0, 0, 0.4)') }"
		/>
		<div class="kiv-section__content" :style="contentStyle">
			<slot />
		</div>
	</section>
</template>

<style scoped>
.kiv-section {
	position: relative;
	width: 100%;
	display: flex;
	flex-direction: column;
}
.kiv-section__overlay {
	position: absolute;
	inset: 0;
	pointer-events: none;
}
.kiv-section__video-bg {
	position: absolute;
	inset: 0;
	overflow: hidden;
	pointer-events: none;
}
.kiv-section__video-bg video {
	width: 100%;
	height: 100%;
	object-fit: cover;
}
.kiv-section__content {
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	width: 100%;
	flex: 1;
}
</style>
