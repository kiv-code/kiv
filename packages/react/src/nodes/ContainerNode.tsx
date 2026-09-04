import { containerStyle } from "@kivcode/nodes";
import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface ContainerNodeProps extends KivNodeComponentProps {
	maxWidth?: string;
	padding?: unknown;
	centered?: boolean;
	gap?: string;
}

export function ContainerNode({
	maxWidth,
	padding,
	centered = true,
	gap,
	slots,
	id,
	style,
	...rest
}: ContainerNodeProps) {
	// Style comes from the node definition, so this component and the static
	// HTML export can never drift apart.
	const resolved = useMemo(
		() => ({
			...containerStyle({ maxWidth, padding, centered, gap }),
			...style,
		}),
		[maxWidth, padding, centered, gap, style],
	);

	return (
		<div id={id} style={resolved} data-kiv-type="container" {...rest}>
			{slots?.default}
		</div>
	);
}
