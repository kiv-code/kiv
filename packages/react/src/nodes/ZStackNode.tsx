import { zStackStyle } from "@kivcode/nodes";
import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface ZStackNodeProps extends KivNodeComponentProps {
	minHeight?: string;
	overflow?: string;
}

export function ZStackNode({
	minHeight,
	overflow,
	slots,
	id,
	style,
	...rest
}: ZStackNodeProps) {
	const resolved = useMemo(
		() => ({ ...zStackStyle({ minHeight, overflow }), ...style }),
		[minHeight, overflow, style],
	);

	return (
		<div id={id} style={resolved} data-kiv-type="z-stack" {...rest}>
			{slots?.default}
		</div>
	);
}
