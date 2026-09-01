import { resolveSpacingStyle, SPACING } from "@kivcode/nodes";
import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface ColumnNodeProps extends KivNodeComponentProps {
	span?: string;
	offset?: string;
	alignSelf?: string;
	paddingX?: string;
	paddingY?: string;
	paddingBox?: unknown;
}

export function ColumnNode({
	span,
	offset,
	alignSelf,
	paddingX,
	paddingY,
	paddingBox,
	slots,
	id,
	style,
	...rest
}: ColumnNodeProps) {
	const columnStyle = useMemo(() => {
		const s: Record<string, string | undefined> = {};
		if (span && span !== "auto") s.gridColumn = `span ${span}`;
		if (offset && offset !== "0")
			s.gridColumnStart = String(Number(offset) + 1);
		if (alignSelf && alignSelf !== "auto") s.alignSelf = alignSelf;
		const px = paddingX && paddingX !== "none" ? SPACING[paddingX] : undefined;
		const py = paddingY && paddingY !== "none" ? SPACING[paddingY] : undefined;
		// Per-side override, shared with every other node that needs this
		// escape hatch (see packages/nodes/src/spacing-field.ts). Empty side
		// falls back to the Padding X/Y shorthand above.
		Object.assign(
			s,
			resolveSpacingStyle("padding", paddingBox, {
				top: py,
				right: px,
				bottom: py,
				left: px,
			}),
		);
		return { ...s, ...style };
	}, [span, offset, alignSelf, paddingX, paddingY, paddingBox, style]);

	return (
		<div id={id} style={columnStyle} data-kiv-type="column" {...rest}>
			{slots?.default}
		</div>
	);
}
