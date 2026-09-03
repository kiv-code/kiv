import { containerStyle } from "@kivcode/nodes";
import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface ContainerNodeProps extends KivNodeComponentProps {
	maxWidth?: string;
	padding?: unknown;
	centered?: boolean;
}

export function ContainerNode({
	maxWidth,
	padding,
	centered = true,
	slots,
	id,
	style,
	...rest
}: ContainerNodeProps) {
	// Style comes from the node definition, so this component and the static
	// HTML export can never drift apart.
	const resolved = useMemo(
		() => ({ ...containerStyle({ maxWidth, padding, centered }), ...style }),
		[maxWidth, padding, centered, style],
	);

	return (
		<div id={id} style={resolved} data-kiv-type="container" {...rest}>
			{slots?.default}
		</div>
	);
}
