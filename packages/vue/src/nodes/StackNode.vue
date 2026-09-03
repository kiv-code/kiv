<script setup lang="ts">
import { stackStyle } from "@kivcode/nodes";
import { computed } from "vue";

const props = defineProps<{
	direction?: string;
	gap?: string;
	align?: string;
	justify?: string;
	wrap?: boolean;
	padding?: unknown;
	margin?: unknown;
	background?: string;
	borderRadius?: string;
	shadow?: string;
	borderTopWidth?: number;
	borderRightWidth?: number;
	borderBottomWidth?: number;
	borderLeftWidth?: number;
	borderStyle?: string;
	borderColor?: string;
}>();

// Style comes from the node definition, so this component and the static HTML
// export can never drift apart.
const style = computed(() => stackStyle({ ...props }));
</script>

<template>
	<div :style="style" data-kiv-type="stack">
		<slot />
	</div>
</template>
