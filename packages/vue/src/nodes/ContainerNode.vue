<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
	maxWidth?: string;
	paddingX?: string;
	centered?: boolean;
}>();

const maxWidthMap: Record<string, string> = {
	sm: "640px",
	md: "768px",
	lg: "1024px",
	xl: "1280px",
	"2xl": "1536px",
	full: "100%",
};

const containerStyle = computed(() => ({
	"max-width": maxWidthMap[props.maxWidth ?? "lg"] ?? "1024px",
	"margin-left": props.centered !== false ? "auto" : undefined,
	"margin-right": props.centered !== false ? "auto" : undefined,
	"padding-left": `var(--kiv-spacing-${props.paddingX ?? "md"})`,
	"padding-right": `var(--kiv-spacing-${props.paddingX ?? "md"})`,
}));
</script>

<template>
	<div :style="containerStyle" data-kiv-type="container">
		<slot />
	</div>
</template>
