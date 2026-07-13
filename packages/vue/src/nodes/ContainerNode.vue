<script setup lang="ts">
import { MAX_WIDTH, resolveSpacingStyle, SPACING } from "@kivcode/nodes";
import { computed } from "vue";

const props = withDefaults(
	defineProps<{
		maxWidth?: string;
		paddingX?: string;
		paddingY?: string;
		paddingBox?: unknown;
		centered?: boolean;
	}>(),
	{ centered: true },
);

const containerStyle = computed(() => {
	const paddingX = SPACING[props.paddingX ?? "md"] ?? "16px";
	const paddingY = SPACING[props.paddingY ?? "none"] ?? "0";
	return {
		maxWidth: MAX_WIDTH[props.maxWidth ?? "lg"] ?? "1024px",
		marginLeft: props.centered ? "auto" : undefined,
		marginRight: props.centered ? "auto" : undefined,
		width: "100%",
		// Per-side override, shared with every other node that needs this
		// escape hatch (see packages/nodes/src/spacing-field.ts). Empty side
		// falls back to the Padding X/Y shorthand above.
		...resolveSpacingStyle("padding", props.paddingBox, {
			top: paddingY,
			right: paddingX,
			bottom: paddingY,
			left: paddingX,
		}),
	};
});
</script>

<template>
	<div :style="containerStyle" data-kiv-type="container">
		<slot />
	</div>
</template>
