<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
	columns?: string; // "1" | "2" | "3" | "4" | "6" | "12"
	gap?: string;
	smColumns?: string;
	mdColumns?: string;
	lgColumns?: string;
}>();

// Responsive grid: collapses to 1 col on mobile unless overridden
const gridStyle = computed(() => ({
	display: "grid",
	gap: `var(--kiv-spacing-${props.gap ?? "md"})`,
}));

// CSS custom property drives the column count — overridden at each breakpoint
const colVar = computed(() => ({
	"--kiv-grid-cols": props.columns ?? "1",
	"--kiv-grid-cols-sm": props.smColumns ?? props.columns ?? "1",
	"--kiv-grid-cols-md":
		props.mdColumns ?? props.smColumns ?? props.columns ?? "1",
	"--kiv-grid-cols-lg":
		props.lgColumns ??
		props.mdColumns ??
		props.smColumns ??
		props.columns ??
		"1",
}));
</script>

<template>
	<div
		class="kiv-grid"
		:style="{ ...gridStyle, ...colVar }"
		data-kiv-type="grid"
	>
		<slot />
	</div>
</template>

<style>
.kiv-grid {
	grid-template-columns: repeat(var(--kiv-grid-cols, 1), minmax(0, 1fr));
}
@media (min-width: 640px) {
	.kiv-grid {
		grid-template-columns: repeat(var(--kiv-grid-cols-sm, var(--kiv-grid-cols, 1)), minmax(0, 1fr));
	}
}
@media (min-width: 768px) {
	.kiv-grid {
		grid-template-columns: repeat(var(--kiv-grid-cols-md, var(--kiv-grid-cols-sm, var(--kiv-grid-cols, 1))), minmax(0, 1fr));
	}
}
@media (min-width: 1024px) {
	.kiv-grid {
		grid-template-columns: repeat(var(--kiv-grid-cols-lg, var(--kiv-grid-cols-md, var(--kiv-grid-cols-sm, var(--kiv-grid-cols, 1)))), minmax(0, 1fr));
	}
}
</style>
