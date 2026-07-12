<script setup lang="ts">
import {
	hoverEffectClass,
	hoverGlowStyle,
	RADIUS,
	resolveBackgroundPaint,
	resolveSpacingStyle,
	SHADOW,
	SPACING,
} from "@kiv/nodes";
import { computed } from "vue";

const props = defineProps<{
	background?: unknown;
	borderRadius?: string;
	padding?: string;
	paddingBox?: unknown;
	shadow?: string;
	borderWidth?: number;
	borderColor?: string;
	highlighted?: boolean;
	hoverEffect?: string;
	hoverGlowColor?: string;
}>();

const cardStyle = computed(() => ({
	background: resolveBackgroundPaint(props.background, "#ffffff"),
	borderRadius: RADIUS[props.borderRadius ?? "lg"] ?? "16px",
	// Per-side override, shared with every other node that needs this escape
	// hatch (see packages/nodes/src/spacing-field.ts). Empty side falls back
	// to the Padding shorthand above.
	...resolveSpacingStyle(
		"padding",
		props.paddingBox,
		SPACING[props.padding ?? "lg"] ?? "32px",
	),
	boxShadow: SHADOW[props.shadow ?? "md"] ?? "none",
	borderWidth: props.borderWidth ? `${props.borderWidth}px` : undefined,
	borderStyle: props.borderWidth ? ("solid" as const) : undefined,
	borderColor: props.borderWidth ? (props.borderColor ?? "#e2e8f0") : undefined,
	outline: props.highlighted ? "2px solid #6366f1" : undefined,
	outlineOffset: props.highlighted ? "2px" : undefined,
	...hoverGlowStyle(props.hoverGlowColor),
}));
const hoverClass = computed(() => hoverEffectClass(props.hoverEffect));
</script>

<template>
	<div :style="cardStyle" :class="hoverClass" data-kiv-type="card">
		<slot />
	</div>
</template>
