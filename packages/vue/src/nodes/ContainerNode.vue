<script setup lang="ts">
import { containerStyle } from "@kivcode/nodes";
import { computed } from "vue";

const props = withDefaults(
	defineProps<{
		maxWidth?: string;
		padding?: unknown;
		centered?: boolean;
		gap?: string;
	}>(),
	{ centered: true },
);

// Style comes from the node definition, so this component and the static HTML
// export can never drift apart.
const style = computed(() => containerStyle({ ...props }));
</script>

<template>
	<div :style="style" data-kiv-type="container">
		<slot />
	</div>
</template>
