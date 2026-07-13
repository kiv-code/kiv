<script setup lang="ts">
import { GAP, resolveSpacingStyle, SPACING } from "@kivcode/nodes";
import { computed } from "vue";

const props = defineProps<{
	columns?: string;
	gap?: string;
	rowGap?: string;
	alignItems?: string;
	paddingX?: string;
	paddingY?: string;
	paddingBox?: unknown;
}>();

const gridStyle = computed(() => {
	const paddingX =
		props.paddingX && props.paddingX !== "none"
			? SPACING[props.paddingX]
			: undefined;
	const paddingY =
		props.paddingY && props.paddingY !== "none"
			? SPACING[props.paddingY]
			: undefined;
	return {
		display: "grid" as const,
		gridTemplateColumns: `repeat(${props.columns ?? "1"}, minmax(0, 1fr))`,
		columnGap: GAP[props.gap ?? "md"] ?? "16px",
		rowGap: GAP[props.rowGap ?? "md"] ?? "16px",
		alignItems: props.alignItems ?? "stretch",
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
	<div :style="gridStyle" data-kiv-type="grid">
		<slot />
	</div>
</template>
