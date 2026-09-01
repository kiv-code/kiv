import {
	HEADING_LEVEL_SIZE,
	LETTER_SPACING,
	LINE_HEIGHT,
	resolveTextPaintStyle,
} from "@kivcode/nodes";
import { createElement, type ReactElement, useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface HeadingNodeProps extends KivNodeComponentProps {
	text?: string;
	level?: string;
	size?: number;
	weight?: string;
	color?: unknown;
	align?: string;
	lineHeight?: string;
	letterSpacing?: string;
	transform?: string;
}

export function HeadingNode({
	text,
	level,
	size,
	weight,
	color,
	align,
	lineHeight,
	letterSpacing,
	transform,
	id,
	style,
	...rest
}: HeadingNodeProps): ReactElement {
	const tag = `h${level ?? "2"}`;

	const headingStyle = useMemo(
		() => ({
			fontSize: `${size ?? HEADING_LEVEL_SIZE[level ?? "2"] ?? 36}px`,
			fontWeight: weight ?? "700",
			...resolveTextPaintStyle(color, "inherit"),
			textAlign: (align ?? "left") as "left" | "center" | "right" | "justify",
			lineHeight: LINE_HEIGHT[lineHeight ?? "normal"] ?? "1.4",
			letterSpacing: LETTER_SPACING[letterSpacing ?? "normal"] ?? "0em",
			textTransform: (transform ?? "none") as
				| "none"
				| "uppercase"
				| "lowercase"
				| "capitalize",
			margin: "0",
			...style,
		}),
		[
			level,
			size,
			weight,
			color,
			align,
			lineHeight,
			letterSpacing,
			transform,
			style,
		],
	);

	return createElement(
		tag,
		{ id, style: headingStyle, "data-kiv-type": "heading", ...rest },
		text,
	);
}
