import { SPACING } from "@kivcode/nodes";
import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

const JUSTIFY_BY_ALIGNMENT: Record<string, string> = {
	left: "flex-start",
	center: "center",
	right: "flex-end",
};

export interface DividerNodeProps extends KivNodeComponentProps {
	lineStyle?: string;
	color?: string;
	thickness?: number;
	width?: string;
	alignment?: string;
	spacing?: string;
}

export function DividerNode({
	lineStyle,
	color,
	thickness,
	width,
	alignment,
	spacing,
	id,
	style,
	...rest
}: DividerNodeProps) {
	const lineDivStyle = useMemo(
		() => ({
			height: "0px",
			width: width === "full" ? "100%" : (width ?? "100%"),
			borderTop: `${thickness ?? 1}px ${lineStyle ?? "solid"} ${color ?? "#d1d5db"}`,
			flexShrink: 0,
		}),
		[lineStyle, color, thickness, width],
	);

	const wrapperStyle = useMemo(
		() => ({
			display: "flex" as const,
			width: "100%",
			paddingTop: SPACING[spacing ?? "md"] ?? "16px",
			paddingBottom: SPACING[spacing ?? "md"] ?? "16px",
			justifyContent: JUSTIFY_BY_ALIGNMENT[alignment ?? "center"] ?? "center",
			...style,
		}),
		[spacing, alignment, style],
	);

	return (
		<div id={id} style={wrapperStyle} data-kiv-type="divider" {...rest}>
			<div style={lineDivStyle} />
		</div>
	);
}
