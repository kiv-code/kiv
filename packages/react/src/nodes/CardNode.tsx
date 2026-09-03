import {
	hoverEffectClass,
	hoverGlowStyle,
	RADIUS,
	resolveBackgroundPaint,
	resolveSpacingStyle,
	SHADOW,
} from "@kivcode/nodes";
import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface CardNodeProps extends KivNodeComponentProps {
	background?: unknown;
	borderRadius?: string;
	padding?: unknown;
	shadow?: string;
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
	shadow,
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
	const cardStyle = useMemo(
		() => ({
			background: resolveBackgroundPaint(background, "#ffffff"),
			borderRadius: RADIUS[borderRadius ?? "lg"] ?? "16px",
			// A legacy string value ("lg") normalizes to a uniform box, so old
			// documents keep rendering without a migration step.
			...resolveSpacingStyle("padding", padding, "32px"),
			boxShadow: SHADOW[shadow ?? "md"] ?? "none",
			borderWidth: borderWidth ? `${borderWidth}px` : undefined,
			borderStyle: borderWidth ? ("solid" as const) : undefined,
			borderColor: borderWidth ? (borderColor ?? "#e2e8f0") : undefined,
			outline: highlighted ? "2px solid #6366f1" : undefined,
			outlineOffset: highlighted ? "2px" : undefined,
			...hoverGlowStyle(hoverGlowColor),
			...style,
		}),
		[
			background,
			borderRadius,
			padding,
			shadow,
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
