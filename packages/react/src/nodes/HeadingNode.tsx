import { HEADING_LEVEL_SIZE } from "@kivcode/nodes";
import { createElement, type ReactElement, useMemo } from "react";
import { useKivTypography } from "../hooks/useKivTypography";
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
	fontStyle?: string;
	fontFamily?: string;
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
	fontStyle,
	fontFamily,
	id,
	style,
	...rest
}: HeadingNodeProps): ReactElement {
	const tag = `h${level ?? "2"}`;

	// Style comes from the shared typography resolver, so this component, the
	// static HTML export and every other text node stay in agreement.
	const resolved = useKivTypography(
		{
			size,
			weight,
			color,
			align,
			lineHeight,
			letterSpacing,
			transform,
			fontStyle,
			fontFamily,
		},
		{
			size: HEADING_LEVEL_SIZE[level ?? "2"] ?? 36,
			weight: "700",
			colorFallback: "inherit",
			lineHeightFallback: "normal",
		},
	);
	const headingStyle = useMemo(
		() => ({ ...resolved, ...style }),
		[resolved, style],
	);

	return createElement(
		tag,
		{ id, style: headingStyle, "data-kiv-type": "heading", ...rest },
		text,
	);
}
