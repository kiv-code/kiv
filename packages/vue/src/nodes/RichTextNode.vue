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

const richStyle = computed(() => ({
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
	<div :style="richStyle" class="kiv-rich-text" data-kiv-type="rich-text" v-html="content ?? ''" />
</template>

<style scoped>
.kiv-rich-text :deep(p) {
	margin: 0 0 0.5em;
}
.kiv-rich-text :deep(p:last-child) {
	margin-bottom: 0;
}
.kiv-rich-text :deep(ul),
.kiv-rich-text :deep(ol) {
	padding-left: 1.5em;
	margin: 0.5em 0;
}
.kiv-rich-text :deep(li) {
	margin-bottom: 0.25em;
}
.kiv-rich-text :deep(a) {
	color: #6366f1;
	text-decoration: underline;
}
</style>
