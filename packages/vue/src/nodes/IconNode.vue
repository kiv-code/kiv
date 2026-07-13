<script setup lang="ts">
import { resolveIcon } from "@kivcode/nodes";
import { computed } from "vue";

const props = defineProps<{
	icon?: string;
	iconSize?: number;
	iconColor?: string;
}>();

const svgContent = computed(() => {
	const icon = props.icon ?? "";
	if (icon.trim().startsWith("<svg")) return icon;
	return resolveIcon(icon) ?? "";
});

const spanStyle = computed(() => ({
	fontSize: `${props.iconSize ?? 24}px`,
	color: props.iconColor || "currentColor",
	display: "inline-flex" as const,
	alignItems: "center" as const,
	justifyContent: "center" as const,
}));
</script>

<template>
	<span v-if="svgContent" :style="spanStyle" data-kiv-type="icon" v-html="svgContent" />
	<span v-else :style="spanStyle" data-kiv-type="icon">
		<i :class="icon" aria-hidden="true" />
	</span>
</template>

<style scoped>
[data-kiv-type="icon"] :deep(svg) {
	width: 1em;
	height: 1em;
	display: block;
	flex-shrink: 0;
}
[data-kiv-type="icon"] :deep(i) {
	display: block;
	flex-shrink: 0;
}
</style>
