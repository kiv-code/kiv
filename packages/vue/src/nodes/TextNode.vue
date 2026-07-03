<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
	content?: string;
	color?: string;
	size?: string;
	align?: string;
	lineHeight?: string;
}>();

const textStyle = computed(() => ({
	color: props.color ?? "var(--kiv-colors-foreground)",
	fontSize: `var(--kiv-fontSize-${props.size ?? "base"})`,
	textAlign: (props.align ?? "left") as "left" | "center" | "right" | "justify",
	lineHeight: props.lineHeight ?? "1.6",
	margin: "0",
}));
</script>

<template>
	<p :style="textStyle" data-kiv-type="text">{{ content }}</p>
</template>
