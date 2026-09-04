import { layerStyle } from "@kivcode/nodes";
import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface LayerNodeProps extends KivNodeComponentProps {
	zIndex?: number;
	clipPath?: string;
	background?: unknown;
	padding?: unknown;
	alignItems?: string;
	justifyContent?: string;
}

export function LayerNode({
	zIndex,
	clipPath,
	background,
	padding,
	alignItems,
	justifyContent,
	slots,
	id,
	style,
	...rest
}: LayerNodeProps) {
	const resolved = useMemo(
		() => ({
			...layerStyle({
				zIndex,
				clipPath,
				background,
				padding,
				alignItems,
				justifyContent,
			}),
			...style,
		}),
		[zIndex, clipPath, background, padding, alignItems, justifyContent, style],
	);

	return (
		<div id={id} style={resolved} data-kiv-type="layer" {...rest}>
			{slots?.default}
		</div>
	);
}
