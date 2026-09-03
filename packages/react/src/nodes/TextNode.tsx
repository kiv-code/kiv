import { useMemo } from "react";
import { useKivTypography } from "../hooks/useKivTypography";
import type { KivNodeComponentProps } from "../node-props";

export interface TextNodeProps extends KivNodeComponentProps {
	content?: string;
	size?: number;
	weight?: string;
	color?: string;
	align?: string;
	lineHeight?: string;
	letterSpacing?: string;
	transform?: string;
	fontStyle?: string;
	fontFamily?: string;
}

export function TextNode({
	content,
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
}: TextNodeProps) {
	// Style comes from the shared typography resolver, so this component, the
	// static HTML export and every other text node stay in agreement.
	const resolved = useKivTypography({
		size,
		weight,
		color,
		align,
		lineHeight,
		letterSpacing,
		transform,
		fontStyle,
		fontFamily,
	});
	const textStyle = useMemo(
		() => ({ ...resolved, ...style }),
		[resolved, style],
	);

	return (
		<p id={id} style={textStyle} data-kiv-type="text" {...rest}>
			{content}
		</p>
	);
}
