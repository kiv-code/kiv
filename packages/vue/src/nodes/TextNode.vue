<script setup lang="ts">
import { LETTER_SPACING, LINE_HEIGHT } from "@kivcode/nodes";
import { computed } from "vue";

const props = defineProps<{
	content?: string;
	size?: number;
	weight?: string;
	color?: string;
	align?: string;
	lineHeight?: string;
	letterSpacing?: string;
}>();

const textStyle = computed(() => ({
	fontSize: `${props.size ?? 16}px`,
	fontWeight: props.weight ?? "400",
	color: props.color ?? "inherit",
	textAlign: (props.align ?? "left") as "left" | "center" | "right" | "justify",
	lineHeight: LINE_HEIGHT[props.lineHeight ?? "relaxed"] ?? "1.6",
	letterSpacing: LETTER_SPACING[props.letterSpacing ?? "normal"] ?? "0em",
	margin: "0",
}));
</script>

<template>
	<p :style="textStyle" data-kiv-type="text">{{ content }}</p>
</template>
