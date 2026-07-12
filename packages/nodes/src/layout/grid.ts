import { defineNode, f } from "@kiv/engine";
import { gapField } from "../gap-field";
import { styleToString } from "../html-utils";
import { GAP, SPACING } from "../scales";
import { resolveSpacingStyle, spacingBoxField } from "../spacing-field";

export const gridNode = defineNode({
	type: "grid",
	category: "layout",
	toHtml(props, children) {
		const paddingX =
			props.paddingX && props.paddingX !== "none"
				? SPACING[String(props.paddingX)]
				: undefined;
		const paddingY =
			props.paddingY && props.paddingY !== "none"
				? SPACING[String(props.paddingY)]
				: undefined;
		const style = styleToString({
			display: "grid",
			gridTemplateColumns: `repeat(${props.columns ?? "1"}, minmax(0, 1fr))`,
			columnGap: GAP[String(props.gap ?? "md")] ?? "16px",
			rowGap: GAP[String(props.rowGap ?? "md")] ?? "16px",
			alignItems: String(props.alignItems ?? "stretch"),
			...resolveSpacingStyle("padding", props.paddingBox, {
				top: paddingY,
				right: paddingX,
				bottom: paddingY,
				left: paddingX,
			}),
		});
		return `<div style="${style}" data-kiv-type="grid">${children.default ?? ""}</div>`;
	},
	fields: {
		columns: f.select(["1", "2", "3", "4", "6", "12"], {
			label: "Columns",
			default: "12",
			responsive: true,
			group: "Layout",
		}),
		gap: gapField(),
		rowGap: gapField({ default: "md" }),
		alignItems: f.select(["start", "center", "end", "stretch"], {
			label: "Align items",
			default: "stretch",
			group: "Layout",
		}),
		paddingX: f.select(["none", "xs", "sm", "md", "lg", "xl"], {
			label: "Padding X",
			default: "none",
			responsive: true,
			group: "Spacing",
		}),
		paddingY: f.select(["none", "xs", "sm", "md", "lg", "xl"], {
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
