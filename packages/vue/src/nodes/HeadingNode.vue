<script setup lang="ts">
import { HEADING_LEVEL_SIZE } from "@kivcode/nodes";
import { computed } from "vue";
import { useKivTypography } from "../composables/useKivTypography";

const props = defineProps<{
	text?: string;
	level?: string;
	size?: number;
	weight?: string;
	color?: unknown;
	align?: string;
	lineHeight?: string;
	letterSpacing?: string;
	transform?: string;
	fontStyle?: string;
	fontFamily?: string;
}>();

const tag = computed(() => `h${props.level ?? "2"}`);

// Style comes from the shared typography resolver, so this component, the
// static HTML export and every other text node stay in agreement.
const headingStyle = useKivTypography(
	computed(() => ({ ...props })),
	{
		size: HEADING_LEVEL_SIZE[props.level ?? "2"] ?? 36,
		weight: "700",
		colorFallback: "inherit",
		lineHeightFallback: "normal",
	},
);
</script>

<template>
	<component :is="tag" :style="headingStyle" data-kiv-type="heading">{{ text }}</component>
</template>
