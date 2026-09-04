<script setup lang="ts">
import { layerStyle } from "@kivcode/nodes";
import { computed } from "vue";

const props = defineProps<{
	zIndex?: number;
	clipPath?: string;
	background?: unknown;
	padding?: unknown;
	alignItems?: string;
	justifyContent?: string;
}>();

const style = computed(() => layerStyle({ ...props }));
</script>

<template>
	<div :style="style" data-kiv-type="layer">
		<slot />
	</div>
</template>
