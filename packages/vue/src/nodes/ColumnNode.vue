<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
	span?: string;
	offset?: string;
}>();

const columnStyle = computed(() => {
	const s: Record<string, string> = {};
	if (props.span && props.span !== "auto") {
		s["grid-column"] = `span ${props.span}`;
	}
	if (props.offset && props.offset !== "0") {
		s["grid-column-start"] = String(Number(props.offset) + 1);
	}
	return s;
});
</script>

<template>
	<div :style="columnStyle" data-kiv-type="column">
		<slot />
	</div>
</template>
