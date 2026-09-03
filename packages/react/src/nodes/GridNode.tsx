import { gridStyle } from "@kivcode/nodes";
import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface GridNodeProps extends KivNodeComponentProps {
	columns?: string;
	gap?: string;
	rowGap?: string;
	alignItems?: string;
	padding?: unknown;
}

export function GridNode({
	columns,
	gap,
	rowGap,
	alignItems,
	padding,
	slots,
	id,
	style,
	...rest
}: GridNodeProps) {
	// Style comes from the node definition, so this component and the static
	// HTML export can never drift apart.
	const resolved = useMemo(
		() => ({
			...gridStyle({ columns, gap, rowGap, alignItems, padding }),
			...style,
		}),
		[columns, gap, rowGap, alignItems, padding, style],
	);

	return (
		<div id={id} style={resolved} data-kiv-type="grid" {...rest}>
			{slots?.default}
		</div>
	);
}
