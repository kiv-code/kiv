import { defineNode, f } from "@kivcode/engine";
import { escapeHtml, styleToString } from "../html-utils";
import { resolveTypographyStyle, typographyFields } from "../typography-field";

const typo = typographyFields();

export const textNode = defineNode({
	type: "text",
	category: "content",
	label: "Text",
	description: "Paragraph or inline text block",
	toHtml(props) {
		const style = styleToString(resolveTypographyStyle(props));
		const content =
			props.content !== undefined ? escapeHtml(props.content) : "";
		return `<p style="${style}" data-kiv-type="text">${content}</p>`;
	},
	fields: {
		content: f.textarea({
			label: "Content",
			localizable: true,
			inline: true,
			group: "Content",
		}),
		size: typo.size,
		weight: typo.weight,
		color: typo.color,
		align: typo.align,
		lineHeight: typo.lineHeight,
		letterSpacing: typo.letterSpacing,
	},
});
