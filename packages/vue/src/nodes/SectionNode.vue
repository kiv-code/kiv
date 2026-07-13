<script setup lang="ts">
import {
	BLUR,
	RADIUS,
	resolveBackgroundPaint,
	resolveSolidColor,
	resolveSpacingStyle,
	SECTION_SPACING,
	SHADOW,
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
	paddingY?: string;
	paddingX?: string;
	paddingBox?: unknown;
	marginY?: string;
	marginBox?: unknown;
	borderWidth?: string;
	borderColor?: string;
	borderRadius?: string;
	shadow?: string;
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
	const paddingY =
		props.paddingY && props.paddingY !== "none"
			? (SECTION_SPACING[props.paddingY] ?? props.paddingY)
			: undefined;
	const paddingX =
		props.paddingX && props.paddingX !== "none"
			? (SECTION_SPACING[props.paddingX] ?? props.paddingX)
			: undefined;
	const marginY =
		props.marginY && props.marginY !== "none"
			? (SECTION_SPACING[props.marginY] ?? props.marginY)
			: undefined;
	// Per-side overrides, shared with every other node that needs this escape
	// hatch (see packages/nodes/src/spacing-field.ts). Empty side falls back
	// to the Padding/Margin X/Y shorthand above.
	Object.assign(
		s,
		resolveSpacingStyle("padding", props.paddingBox, {
			top: paddingY,
			right: paddingX,
			bottom: paddingY,
			left: paddingX,
		}),
		resolveSpacingStyle("margin", props.marginBox, {
			top: marginY,
			bottom: marginY,
		}),
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
		s.boxShadow = SHADOW[props.shadow] ?? props.shadow;
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

const contentStyle = computed(() => ({
	alignItems:
		props.alignItems && props.alignItems !== "flex-start"
			? props.alignItems
			: undefined,
	justifyContent:
		props.justifyContent && props.justifyContent !== "flex-start"
			? props.justifyContent
			: undefined,
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
