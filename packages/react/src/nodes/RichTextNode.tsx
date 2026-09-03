import { useMemo } from "react";
import { useKivTypography } from "../hooks/useKivTypography";
import type { KivNodeComponentProps } from "../node-props";

export interface RichTextNodeProps extends KivNodeComponentProps {
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

export function RichTextNode({
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
}: RichTextNodeProps) {
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
	const richStyle = useMemo(
		() => ({ ...resolved, ...style }),
		[resolved, style],
	);

	return (
		<div
			id={id}
			style={richStyle}
			className="kiv-rich-text"
			data-kiv-type="rich-text"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: content is editor-authored rich text, same trust boundary as the Vue renderer's v-html
			dangerouslySetInnerHTML={{ __html: content ?? "" }}
			{...rest}
		/>
	);
}
