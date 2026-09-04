<script setup lang="ts">
import { zStackStyle } from "@kivcode/nodes";
import { computed } from "vue";

const props = defineProps<{
	minHeight?: string;
	overflow?: string;
}>();

// Style comes from the shared resolver, so this component and the static HTML
// export can never drift apart.
const style = computed(() => zStackStyle({ ...props }));
</script>

<template>
	<div :style="style" data-kiv-type="z-stack">
		<slot />
	</div>
</template>
