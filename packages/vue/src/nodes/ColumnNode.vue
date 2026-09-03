<script setup lang="ts">
import { columnStyle } from "@kivcode/nodes";
import { computed } from "vue";

const props = defineProps<{
	span?: string;
	offset?: string;
	alignSelf?: string;
	padding?: unknown;
}>();

// Style comes from the node definition, so this component and the static HTML
// export can never drift apart.
const style = computed(() => columnStyle({ ...props }));
</script>

<template>
	<div :style="style" data-kiv-type="column">
		<slot />
	</div>
</template>
