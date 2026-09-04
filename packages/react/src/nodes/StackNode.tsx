import { stackStyle } from "@kivcode/nodes";
import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface StackNodeProps extends KivNodeComponentProps {
	direction?: string;
	gap?: string;
	align?: string;
	justify?: string;
	wrap?: boolean;
	padding?: unknown;
	margin?: unknown;
	background?: string;
	borderRadius?: string;
	shadow?: string;
	shadowColor?: string;
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
	padding,
	margin,
	background,
	borderRadius,
	shadow,
	shadowColor,
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
	// Style comes from the node definition, so this component and the static
	// HTML export can never drift apart.
	const resolved = useMemo(
		() => ({
			...stackStyle({
				direction,
				gap,
				align,
				justify,
				wrap,
				padding,
				margin,
				background,
				borderRadius,
				shadow,
				shadowColor,
				borderTopWidth,
				borderRightWidth,
				borderBottomWidth,
				borderLeftWidth,
				borderStyle,
				borderColor,
			}),
			...style,
		}),
		[
			direction,
			gap,
			align,
			justify,
			wrap,
			padding,
			margin,
			background,
			borderRadius,
			shadow,
			shadowColor,
			borderTopWidth,
			borderRightWidth,
			borderBottomWidth,
			borderLeftWidth,
			borderStyle,
			borderColor,
			style,
		],
	);

	return (
		<div id={id} style={resolved} data-kiv-type="stack" {...rest}>
			{slots?.default}
		</div>
	);
}
