<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
	direction?: string; // "vertical" | "horizontal"
	gap?: string;
	align?: string;
	justify?: string;
	wrap?: boolean;
	// Responsive: collapse horizontal stacks to vertical on mobile
	smDirection?: string;
	mdDirection?: string;
}>();

const stackStyle = computed(() => ({
	display: "flex" as const,
	gap: `var(--kiv-spacing-${props.gap ?? "md"})`,
	alignItems: props.align ?? "stretch",
	justifyContent: props.justify ?? "flex-start",
	flexWrap: (props.wrap ? "wrap" : "nowrap") as "wrap" | "nowrap",
	"--kiv-stack-dir": props.direction === "horizontal" ? "row" : "column",
	"--kiv-stack-dir-sm":
		props.smDirection === "horizontal"
			? "row"
			: props.smDirection === "vertical"
				? "column"
				: "var(--kiv-stack-dir)",
	"--kiv-stack-dir-md":
		props.mdDirection === "horizontal"
			? "row"
			: props.mdDirection === "vertical"
				? "column"
				: "var(--kiv-stack-dir-sm)",
}));
</script>

<template>
	<div class="kiv-stack" :style="stackStyle" data-kiv-type="stack">
		<slot />
	</div>
</template>

<style>
.kiv-stack {
	flex-direction: var(--kiv-stack-dir, column);
}
@media (min-width: 640px) {
	.kiv-stack {
		flex-direction: var(--kiv-stack-dir-sm, var(--kiv-stack-dir, column));
	}
}
@media (min-width: 768px) {
	.kiv-stack {
		flex-direction: var(--kiv-stack-dir-md, var(--kiv-stack-dir-sm, var(--kiv-stack-dir, column)));
	}
}
</style>
