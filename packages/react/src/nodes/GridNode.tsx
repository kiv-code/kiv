import { GAP, resolveSpacingStyle, SPACING } from "@kivcode/nodes";
import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface GridNodeProps extends KivNodeComponentProps {
	columns?: string;
	gap?: string;
	rowGap?: string;
	alignItems?: string;
	paddingX?: string;
	paddingY?: string;
	paddingBox?: unknown;
}

export function GridNode({
	columns,
	gap,
	rowGap,
	alignItems,
	paddingX,
	paddingY,
	paddingBox,
	slots,
	id,
	style,
	...rest
}: GridNodeProps) {
	const gridStyle = useMemo(() => {
		const px = paddingX && paddingX !== "none" ? SPACING[paddingX] : undefined;
		const py = paddingY && paddingY !== "none" ? SPACING[paddingY] : undefined;
		return {
			display: "grid" as const,
			gridTemplateColumns: `repeat(${columns ?? "1"}, minmax(0, 1fr))`,
			columnGap: GAP[gap ?? "md"] ?? "16px",
			rowGap: GAP[rowGap ?? "md"] ?? "16px",
			alignItems: alignItems ?? "stretch",
			// Per-side override, shared with every other node that needs this
			// escape hatch (see packages/nodes/src/spacing-field.ts). Empty side
			// falls back to the Padding X/Y shorthand above.
			...resolveSpacingStyle("padding", paddingBox, {
				top: py,
				right: px,
				bottom: py,
				left: px,
			}),
			...style,
		};
	}, [columns, gap, rowGap, alignItems, paddingX, paddingY, paddingBox, style]);

	return (
		<div id={id} style={gridStyle} data-kiv-type="grid" {...rest}>
			{slots?.default}
		</div>
	);
}
