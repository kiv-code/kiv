<script setup lang="ts">
import {
	GAP,
	RADIUS,
	resolveSpacingStyle,
	SHADOW,
	SPACING,
} from "@kivcode/nodes";
import { computed } from "vue";

const props = defineProps<{
	direction?: string;
	gap?: string;
	align?: string;
	justify?: string;
	wrap?: boolean;
	paddingY?: string;
	paddingX?: string;
	marginY?: string;
	marginX?: string;
	paddingBox?: unknown;
	marginBox?: unknown;
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

const stackStyle = computed(() => {
	const borderWidths = {
		top: props.borderTopWidth ?? 0,
		right: props.borderRightWidth ?? 0,
		bottom: props.borderBottomWidth ?? 0,
		left: props.borderLeftWidth ?? 0,
	};
	const hasBorder = Object.values(borderWidths).some((w) => w > 0);
	const borderStyle = props.borderStyle ?? "solid";
	const borderColor = props.borderColor ?? "#e2e8f0";
	const paddingY = SPACING[props.paddingY ?? "none"] ?? "0";
	const paddingX = SPACING[props.paddingX ?? "none"] ?? "0";
	const marginY = SPACING[props.marginY ?? "none"] ?? "0";
	const marginX = SPACING[props.marginX ?? "none"] ?? "0";

	return {
		display: "flex" as const,
		flexDirection: (props.direction === "row" ? "row" : "column") as
			| "row"
			| "column",
		gap: GAP[props.gap ?? "md"] ?? "16px",
		alignItems: props.align ?? "flex-start",
		justifyContent: props.justify ?? "flex-start",
		flexWrap: (props.wrap ? "wrap" : "nowrap") as "wrap" | "nowrap",
		// Per-side override, shared with every other node that needs this
		// escape hatch (see packages/nodes/src/spacing-field.ts). Empty side
		// falls back to the Y/X shorthand above.
		...resolveSpacingStyle("padding", props.paddingBox, {
			top: paddingY,
			right: paddingX,
			bottom: paddingY,
			left: paddingX,
		}),
		...resolveSpacingStyle("margin", props.marginBox, {
			top: marginY,
			right: marginX,
			bottom: marginY,
			left: marginX,
		}),
		background:
			props.background && props.background !== "transparent"
				? props.background
				: undefined,
		borderRadius: RADIUS[props.borderRadius ?? "none"] ?? "0",
		boxShadow: SHADOW[props.shadow ?? "none"] ?? "none",
		borderTop: borderWidths.top
			? `${borderWidths.top}px ${borderStyle} ${borderColor}`
			: undefined,
		borderRight: borderWidths.right
			? `${borderWidths.right}px ${borderStyle} ${borderColor}`
			: undefined,
		borderBottom: borderWidths.bottom
			? `${borderWidths.bottom}px ${borderStyle} ${borderColor}`
			: undefined,
		borderLeft: borderWidths.left
			? `${borderWidths.left}px ${borderStyle} ${borderColor}`
			: undefined,
		boxSizing: hasBorder ? ("border-box" as const) : undefined,
	};
});
</script>

<template>
	<div :style="stackStyle" data-kiv-type="stack">
		<slot />
	</div>
</template>
