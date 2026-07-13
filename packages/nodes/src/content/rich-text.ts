import { defineNode, f } from "@kivcode/engine";
import { styleToString } from "../html-utils";
import { resolveTypographyStyle, typographyFields } from "../typography-field";

const typo = typographyFields();

export const richTextNode = defineNode({
	type: "rich-text",
	category: "content",
	label: "Rich Text",
	description: "HTML text block with inline formatting",
	toHtml(props) {
		const style = styleToString(resolveTypographyStyle(props));
		const content = props.content ?? "";
		return `<div style="${style}" data-kiv-type="rich-text">${content}</div>`;
	},
	fields: {
		content: f.textarea({
			label: "Content (HTML)",
			localizable: true,
			inline: true,
			placeholder: "<b>Bold</b>, <i>Italic</i>, <a href='#'>Links</a>…",
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
