import { MAX_WIDTH, resolveSpacingStyle, SPACING } from "@kivcode/nodes";
import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface ContainerNodeProps extends KivNodeComponentProps {
	maxWidth?: string;
	paddingX?: string;
	paddingY?: string;
	paddingBox?: unknown;
	centered?: boolean;
}

export function ContainerNode({
	maxWidth,
	paddingX,
	paddingY,
	paddingBox,
	centered = true,
	slots,
	id,
	style,
	...rest
}: ContainerNodeProps) {
	const containerStyle = useMemo(() => {
		const px = SPACING[paddingX ?? "md"] ?? "16px";
		const py = SPACING[paddingY ?? "none"] ?? "0";
		return {
			maxWidth: MAX_WIDTH[maxWidth ?? "lg"] ?? "1024px",
			marginLeft: centered ? "auto" : undefined,
			marginRight: centered ? "auto" : undefined,
			width: "100%",
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
	}, [maxWidth, paddingX, paddingY, paddingBox, centered, style]);

	return (
		<div id={id} style={containerStyle} data-kiv-type="container" {...rest}>
			{slots?.default}
		</div>
	);
}
