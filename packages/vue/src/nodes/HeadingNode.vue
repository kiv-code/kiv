<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
	text?: string;
	level?: string;
	color?: string;
	align?: string;
	size?: string; // override font-size token
}>();

const tag = computed(() => `h${props.level ?? "2"}`);

// Font size hierarchy via CSS — responsive via clamp
const SIZE_MAP: Record<string, string> = {
	"1": "clamp(1.75rem, 4vw, 3rem)",
	"2": "clamp(1.4rem, 3vw, 2.25rem)",
	"3": "clamp(1.15rem, 2.5vw, 1.75rem)",
	"4": "clamp(1rem, 2vw, 1.375rem)",
	"5": "1.125rem",
	"6": "1rem",
};

const headingStyle = computed(() => ({
	color: props.color ?? "var(--kiv-colors-foreground)",
	textAlign: (props.align ?? "left") as "left" | "center" | "right",
	fontSize: props.size
		? `var(--kiv-fontSize-${props.size})`
		: (SIZE_MAP[props.level ?? "2"] ?? "1.5rem"),
	lineHeight: "1.2",
	margin: "0",
	fontWeight: "700",
}));
</script>

<template>
	<component :is="tag" :style="headingStyle" data-kiv-type="heading">
		{{ text }}
	</component>
</template>
