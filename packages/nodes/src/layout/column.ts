import { defineNode, f } from "@kiv/engine";
import { styleToString } from "../html-utils";
import { SPACING } from "../scales";
import { resolveSpacingStyle, spacingBoxField } from "../spacing-field";

export const columnNode = defineNode({
	type: "column",
	category: "layout",
	toHtml(props, children) {
		const s: Record<string, string | undefined> = {};
		if (props.span && props.span !== "auto")
			s.gridColumn = `span ${props.span}`;
		if (props.offset && props.offset !== "0")
			s.gridColumnStart = String(Number(props.offset) + 1);
		if (props.alignSelf && props.alignSelf !== "auto")
			s.alignSelf = String(props.alignSelf);
		const px =
			props.paddingX && props.paddingX !== "none"
				? SPACING[String(props.paddingX)]
				: undefined;
		const py =
			props.paddingY && props.paddingY !== "none"
				? SPACING[String(props.paddingY)]
				: undefined;
		// Per-side override, shared with every other node that needs this
		// escape hatch (see packages/nodes/src/spacing-field.ts). Empty side
		// falls back to the Padding X/Y shorthand above.
		Object.assign(
			s,
			resolveSpacingStyle("padding", props.paddingBox, {
				top: py,
				right: px,
				bottom: py,
				left: px,
			}),
		);
		return `<div style="${styleToString(s)}" data-kiv-type="column">${children.default ?? ""}</div>`;
	},
	fields: {
		span: f.select(
			["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "auto"],
			{
				label: "Span",
				default: "auto",
				responsive: true,
				group: "Layout",
			},
		),
		offset: f.select(
			["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
			{
				label: "Offset",
				default: "0",
				responsive: true,
				group: "Layout",
			},
		),
		alignSelf: f.select(
			["auto", "flex-start", "center", "flex-end", "stretch"],
			{
				label: "Align self",
				default: "auto",
				responsive: true,
				group: "Layout",
			},
		),
		paddingX: f.select(["none", "xs", "sm", "md", "lg"], {
			label: "Padding X",
			default: "none",
			responsive: true,
			group: "Spacing",
		}),
		paddingY: f.select(["none", "xs", "sm", "md", "lg"], {
			label: "Padding Y",
			default: "none",
			responsive: true,
			group: "Spacing",
		}),
		paddingBox: spacingBoxField({
			label: "Padding (per side)",
			group: "Spacing",
			hint: "Overrides Padding X/Y for individual sides. Empty side = use the shorthand above.",
		}),
	},
});
