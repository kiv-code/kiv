import {
	GAP,
	RADIUS,
	resolveSpacingStyle,
	SHADOW,
	SPACING,
} from "@kivcode/nodes";
import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface StackNodeProps extends KivNodeComponentProps {
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
}

export function StackNode({
	direction,
	gap,
	align,
	justify,
	wrap,
	paddingY,
	paddingX,
	marginY,
	marginX,
	paddingBox,
	marginBox,
	background,
	borderRadius,
	shadow,
	borderTopWidth,
	borderRightWidth,
	borderBottomWidth,
	borderLeftWidth,
	borderStyle,
	borderColor,
	slots,
	id,
	style,
	...rest
}: StackNodeProps) {
	const stackStyle = useMemo(() => {
		const borderWidths = {
			top: borderTopWidth ?? 0,
			right: borderRightWidth ?? 0,
			bottom: borderBottomWidth ?? 0,
			left: borderLeftWidth ?? 0,
		};
		const hasBorder = Object.values(borderWidths).some((w) => w > 0);
		const bStyle = borderStyle ?? "solid";
		const bColor = borderColor ?? "#e2e8f0";
		const py = SPACING[paddingY ?? "none"] ?? "0";
		const px = SPACING[paddingX ?? "none"] ?? "0";
		const my = SPACING[marginY ?? "none"] ?? "0";
		const mx = SPACING[marginX ?? "none"] ?? "0";

		return {
			display: "flex" as const,
			flexDirection: (direction === "row" ? "row" : "column") as
				| "row"
				| "column",
			gap: GAP[gap ?? "md"] ?? "16px",
			alignItems: align ?? "flex-start",
			justifyContent: justify ?? "flex-start",
			flexWrap: (wrap ? "wrap" : "nowrap") as "wrap" | "nowrap",
			// Per-side override, shared with every other node that needs this
			// escape hatch (see packages/nodes/src/spacing-field.ts). Empty side
			// falls back to the Y/X shorthand above.
			...resolveSpacingStyle("padding", paddingBox, {
				top: py,
				right: px,
				bottom: py,
				left: px,
			}),
			...resolveSpacingStyle("margin", marginBox, {
				top: my,
				right: mx,
				bottom: my,
				left: mx,
			}),
			background:
				background && background !== "transparent" ? background : undefined,
			borderRadius: RADIUS[borderRadius ?? "none"] ?? "0",
			boxShadow: SHADOW[shadow ?? "none"] ?? "none",
			borderTop: borderWidths.top
				? `${borderWidths.top}px ${bStyle} ${bColor}`
				: undefined,
			borderRight: borderWidths.right
				? `${borderWidths.right}px ${bStyle} ${bColor}`
				: undefined,
			borderBottom: borderWidths.bottom
				? `${borderWidths.bottom}px ${bStyle} ${bColor}`
				: undefined,
			borderLeft: borderWidths.left
				? `${borderWidths.left}px ${bStyle} ${bColor}`
				: undefined,
			boxSizing: hasBorder ? ("border-box" as const) : undefined,
			...style,
		};
	}, [
		direction,
		gap,
		align,
		justify,
		wrap,
		paddingY,
		paddingX,
		marginY,
		marginX,
		paddingBox,
		marginBox,
		background,
		borderRadius,
		shadow,
		borderTopWidth,
		borderRightWidth,
		borderBottomWidth,
		borderLeftWidth,
		borderStyle,
		borderColor,
		style,
	]);

	return (
		<div id={id} style={stackStyle} data-kiv-type="stack" {...rest}>
			{slots?.default}
		</div>
	);
}
