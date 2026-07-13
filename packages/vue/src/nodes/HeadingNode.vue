<script setup lang="ts">
import {
	HEADING_LEVEL_SIZE,
	LETTER_SPACING,
	LINE_HEIGHT,
	resolveTextPaintStyle,
} from "@kivcode/nodes";
import { computed } from "vue";

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
}>();

const tag = computed(() => `h${props.level ?? "2"}`);

const headingStyle = computed(() => ({
	fontSize: `${props.size ?? HEADING_LEVEL_SIZE[props.level ?? "2"] ?? 36}px`,
	fontWeight: props.weight ?? "700",
	...resolveTextPaintStyle(props.color, "inherit"),
	textAlign: (props.align ?? "left") as "left" | "center" | "right" | "justify",
	lineHeight: LINE_HEIGHT[props.lineHeight ?? "normal"] ?? "1.4",
	letterSpacing: LETTER_SPACING[props.letterSpacing ?? "normal"] ?? "0em",
	textTransform: (props.transform ?? "none") as
		| "none"
		| "uppercase"
		| "lowercase"
		| "capitalize",
	margin: "0",
}));
</script>

<template>
	<component :is="tag" :style="headingStyle" data-kiv-type="heading">{{ text }}</component>
</template>
