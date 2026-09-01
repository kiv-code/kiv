import { LETTER_SPACING, LINE_HEIGHT } from "@kivcode/nodes";
import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface RichTextNodeProps extends KivNodeComponentProps {
	content?: string;
	size?: number;
	weight?: string;
	color?: string;
	align?: string;
	lineHeight?: string;
	letterSpacing?: string;
}

export function RichTextNode({
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
}: RichTextNodeProps) {
	const richStyle = useMemo(
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
