import { LETTER_SPACING, LINE_HEIGHT } from "@kivcode/nodes";
import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface TextNodeProps extends KivNodeComponentProps {
	content?: string;
	size?: number;
	weight?: string;
	color?: string;
	align?: string;
	lineHeight?: string;
	letterSpacing?: string;
}

export function TextNode({
	content,
	size,
	weight,
	color,
	align,
	lineHeight,
	letterSpacing,
	id,
	style,
	...rest
}: TextNodeProps) {
	const textStyle = useMemo(
		() => ({
			fontSize: `${size ?? 16}px`,
			fontWeight: weight ?? "400",
			color: color ?? "inherit",
			textAlign: (align ?? "left") as "left" | "center" | "right" | "justify",
			lineHeight: LINE_HEIGHT[lineHeight ?? "relaxed"] ?? "1.6",
			letterSpacing: LETTER_SPACING[letterSpacing ?? "normal"] ?? "0em",
			margin: "0",
			...style,
		}),
		[size, weight, color, align, lineHeight, letterSpacing, style],
	);

	return (
		<p id={id} style={textStyle} data-kiv-type="text" {...rest}>
			{content}
		</p>
	);
}
