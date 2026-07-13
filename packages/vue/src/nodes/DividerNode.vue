<script setup lang="ts">
import { SPACING } from "@kivcode/nodes";
import { computed } from "vue";

const props = defineProps<{
	lineStyle?: string;
	color?: string;
	thickness?: number;
	width?: string;
	alignment?: string;
	spacing?: string;
}>();

const lineDivStyle = computed(() => ({
	height: "0px",
	width: props.width === "full" ? "100%" : (props.width ?? "100%"),
	borderTop: `${props.thickness ?? 1}px ${props.lineStyle ?? "solid"} ${props.color ?? "#d1d5db"}`,
	flexShrink: 0,
}));

const JUSTIFY_BY_ALIGNMENT: Record<string, string> = {
	left: "flex-start",
	center: "center",
	right: "flex-end",
};

const wrapperStyle = computed(() => ({
	display: "flex" as const,
	width: "100%",
	paddingTop: SPACING[props.spacing ?? "md"] ?? "16px",
	paddingBottom: SPACING[props.spacing ?? "md"] ?? "16px",
	justifyContent: JUSTIFY_BY_ALIGNMENT[props.alignment ?? "center"] ?? "center",
}));
</script>

<template>
	<div :style="wrapperStyle" data-kiv-type="divider">
		<div :style="lineDivStyle" />
	</div>
</template>
