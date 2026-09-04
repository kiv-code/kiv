<script setup lang="ts">
import { cardStyle, hoverEffectClass } from "@kivcode/nodes";
import { computed } from "vue";

const props = defineProps<{
	background?: unknown;
	borderRadius?: string;
	padding?: unknown;
	margin?: unknown;
	width?: string;
	height?: string;
	alignItems?: string;
	justifyContent?: string;
	shadow?: string;
	shadowColor?: string;
	borderWidth?: number;
	borderColor?: string;
	highlighted?: boolean;
	hoverEffect?: string;
	hoverGlowColor?: string;
}>();

// Style comes from the node definition, so this component and the static HTML
// export can never drift apart.
const style = computed(() => cardStyle({ ...props }));
const hoverClass = computed(() => hoverEffectClass(props.hoverEffect));
</script>

<template>
	<div :style="style" :class="hoverClass" data-kiv-type="card">
		<slot />
	</div>
</template>
