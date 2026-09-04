import {
	hoverEffectClass,
	cardStyle as resolveCardStyle,
} from "@kivcode/nodes";
import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface CardNodeProps extends KivNodeComponentProps {
	background?: unknown;
	borderRadius?: string;
	padding?: unknown;
	margin?: unknown;
	width?: string;
	height?: string;
	alignItems?: string;
	justifyContent?: string;
	shadow?: string;
	shadowColor?: string;
	borderWidth?: number;
	borderColor?: string;
	highlighted?: boolean;
	hoverEffect?: string;
	hoverGlowColor?: string;
}

export function CardNode({
	background,
	borderRadius,
	padding,
	margin,
	width,
	height,
	alignItems,
	justifyContent,
	shadow,
	shadowColor,
	borderWidth,
	borderColor,
	highlighted,
	hoverEffect,
	hoverGlowColor,
	slots,
	id,
	style,
	...rest
}: CardNodeProps) {
	// Style comes from the node definition, so this component and the static
	// HTML export can never drift apart.
	const cardStyle = useMemo(
		() => ({
			...resolveCardStyle({
				background,
				borderRadius,
				padding,
				margin,
				width,
				height,
				alignItems,
				justifyContent,
				shadow,
				shadowColor,
				borderWidth,
				borderColor,
				highlighted,
				hoverGlowColor,
			}),
			...style,
		}),
		[
			background,
			borderRadius,
			padding,
			margin,
			width,
			height,
			alignItems,
			justifyContent,
			shadow,
			shadowColor,
			borderWidth,
			borderColor,
			highlighted,
			hoverGlowColor,
			style,
		],
	);
	const hoverClass = hoverEffectClass(hoverEffect);

	return (
		<div
			id={id}
			style={cardStyle}
			className={hoverClass}
			data-kiv-type="card"
			{...rest}
		>
			{slots?.default}
		</div>
	);
}
