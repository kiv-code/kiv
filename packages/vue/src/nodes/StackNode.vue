<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
	direction?: string;
	gap?: string;
	align?: string;
	justify?: string;
	wrap?: boolean;
}>();

const stackStyle = computed(() => ({
	display: "flex" as const,
	flexDirection: (props.direction === "horizontal" ? "row" : "column") as
		| "row"
		| "column",
	gap: `var(--kiv-spacing-${props.gap ?? "md"})`,
	alignItems: props.align ?? "stretch",
	justifyContent: props.justify ?? "flex-start",
	flexWrap: (props.wrap ? "wrap" : "nowrap") as "wrap" | "nowrap",
}));
</script>

<template>
	<div :style="stackStyle" data-kiv-type="stack">
		<slot />
	</div>
</template>
