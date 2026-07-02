<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
	columns?: string;
	gap?: string;
}>();

const gridStyle = computed(() => ({
	display: "grid",
	"grid-template-columns": `repeat(${props.columns ?? "12"}, minmax(0, 1fr))`,
	gap: `var(--kiv-spacing-${props.gap ?? "md"})`,
}));
</script>

<template>
	<div :style="gridStyle" data-kiv-type="grid">
		<slot />
	</div>
</template>
