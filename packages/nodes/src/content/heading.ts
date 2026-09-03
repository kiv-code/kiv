import { defineNode, f } from "@kivcode/engine";
import { colorOrGradientField } from "../color-gradient";
import { escapeHtml, styleToString } from "../html-utils";
import { HEADING_LEVEL_SIZE } from "../scales";
import { resolveTypographyStyle, typographyFields } from "../typography-field";

const typo = typographyFields({
	group: "Typography",
	weightDefault: "700",
	lineHeightDefault: "normal",
});

export const headingNode = defineNode({
	type: "heading",
	category: "content",
	label: "Heading",
	description: "H1–H6 text with fluid sizing",
	toHtml(props) {
		const level = String(props.level ?? "2");
		const style = styleToString({
			...resolveTypographyStyle(props, {
				size: HEADING_LEVEL_SIZE[level] ?? 36,
				weight: "700",
				colorFallback: "inherit",
				lineHeightFallback: "normal",
			}),
		});
		const text = props.text !== undefined ? escapeHtml(props.text) : "";
		return `<h${level} style="${style}" data-kiv-type="heading">${text}</h${level}>`;
	},
	fields: {
		text: f.text({
			label: "Text",
			localizable: true,
			inline: true,
			group: "Content",
		}),
		level: f.select(["1", "2", "3", "4", "5", "6"], {
			label: "HTML Tag",
			default: "2",
			group: "Typography",
		}),
		fontFamily: typo.fontFamily,
		size: typo.size,
		weight: typo.weight,
		color: colorOrGradientField({
			label: "Color",
			group: "Typography",
			default: { solid: "#000000" },
		}),
		align: typo.align,
		lineHeight: typo.lineHeight,
		letterSpacing: typo.letterSpacing,
		transform: typo.transform,
		fontStyle: typo.fontStyle,
	},
});
