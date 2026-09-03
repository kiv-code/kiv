<script setup lang="ts">
import {
	hoverEffectClass,
	hoverGlowStyle,
	RADIUS,
	resolveBackgroundPaint,
	resolveSpacingStyle,
	SHADOW,
} from "@kivcode/nodes";
import { computed } from "vue";

const props = defineProps<{
	background?: unknown;
	borderRadius?: string;
	padding?: unknown;
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
	// A legacy string value ("lg") normalizes to a uniform box, so old
	// documents keep rendering without a migration step.
	...resolveSpacingStyle("padding", props.padding, "32px"),
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
