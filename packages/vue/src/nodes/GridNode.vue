<script setup lang="ts">
import { gridStyle } from "@kivcode/nodes";
import { computed } from "vue";

const props = defineProps<{
	columns?: string;
	gap?: string;
	rowGap?: string;
	alignItems?: string;
	padding?: unknown;
}>();

// Style comes from the node definition, so this component and the static HTML
// export can never drift apart.
const style = computed(() => gridStyle({ ...props }));
</script>

<template>
	<div :style="style" data-kiv-type="grid">
		<slot />
	</div>
</template>
