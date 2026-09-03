import { columnStyle } from "@kivcode/nodes";
import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface ColumnNodeProps extends KivNodeComponentProps {
	span?: string;
	offset?: string;
	alignSelf?: string;
	padding?: unknown;
}

export function ColumnNode({
	span,
	offset,
	alignSelf,
	padding,
	slots,
	id,
	style,
	...rest
}: ColumnNodeProps) {
	// Style comes from the node definition, so this component and the static
	// HTML export can never drift apart.
	const resolved = useMemo(
		() => ({ ...columnStyle({ span, offset, alignSelf, padding }), ...style }),
		[span, offset, alignSelf, padding, style],
	);

	return (
		<div id={id} style={resolved} data-kiv-type="column" {...rest}>
			{slots?.default}
		</div>
	);
}
