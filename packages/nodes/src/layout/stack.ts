import { defineNode, f } from "@kiv/engine";
import { borderVisualFields } from "../border-field";
import { gapField } from "../gap-field";
import { styleToString } from "../html-utils";
import { RADIUS, SHADOW, SPACING } from "../scales";
import { resolveSpacingStyle, spacingBoxField } from "../spacing-field";

const border = borderVisualFields({
	shadowOptions: ["none", "sm", "md", "lg"],
});

export const stackNode = defineNode({
	type: "stack",
	category: "layout",
	toHtml(props, children) {
		const borderWidths = {
			top: Number(props.borderTopWidth ?? 0),
			right: Number(props.borderRightWidth ?? 0),
			bottom: Number(props.borderBottomWidth ?? 0),
			left: Number(props.borderLeftWidth ?? 0),
		};
		const hasBorder = Object.values(borderWidths).some((w) => w > 0);
		const borderStyle = String(props.borderStyle ?? "solid");
		const borderColor = String(props.borderColor ?? "#e2e8f0");

		const paddingY = SPACING[String(props.paddingY ?? "none")] ?? "0";
		const paddingX = SPACING[String(props.paddingX ?? "none")] ?? "0";
		const marginY = SPACING[String(props.marginY ?? "none")] ?? "0";
		const marginX = SPACING[String(props.marginX ?? "none")] ?? "0";
		const style = styleToString({
			display: "flex",
			flexDirection: props.direction === "row" ? "row" : "column",
			gap: SPACING[String(props.gap ?? "md")] ?? "16px",
			alignItems: String(props.align ?? "flex-start"),
			justifyContent: String(props.justify ?? "flex-start"),
			flexWrap: props.wrap ? "wrap" : "nowrap",
			...resolveSpacingStyle("padding", props.paddingBox, {
				top: paddingY,
				right: paddingX,
				bottom: paddingY,
				left: paddingX,
			}),
			...resolveSpacingStyle("margin", props.marginBox, {
				top: marginY,
				right: marginX,
				bottom: marginY,
				left: marginX,
			}),
			background:
				props.background && props.background !== "transparent"
					? String(props.background)
					: undefined,
			borderRadius: RADIUS[String(props.borderRadius ?? "none")] ?? "0",
			boxShadow: SHADOW[String(props.shadow ?? "none")] ?? "none",
			borderTop: borderWidths.top
				? `${borderWidths.top}px ${borderStyle} ${borderColor}`
				: undefined,
			borderRight: borderWidths.right
				? `${borderWidths.right}px ${borderStyle} ${borderColor}`
				: undefined,
			borderBottom: borderWidths.bottom
				? `${borderWidths.bottom}px ${borderStyle} ${borderColor}`
				: undefined,
			borderLeft: borderWidths.left
				? `${borderWidths.left}px ${borderStyle} ${borderColor}`
				: undefined,
			boxSizing: hasBorder ? "border-box" : undefined,
		});
		return `<div style="${style}" data-kiv-type="stack">${children.default ?? ""}</div>`;
	},
	fields: {
		direction: f.select(["column", "row"], {
			label: "Direction",
			default: "column",
			responsive: true,
			group: "Layout",
		}),
		gap: gapField(),
		align: f.select(
			["flex-start", "center", "flex-end", "stretch", "baseline"],
			{
				label: "Align items",
				default: "flex-start",
				responsive: true,
				group: "Layout",
			},
		),
		justify: f.select(
			[
				"flex-start",
				"center",
				"flex-end",
				"space-between",
				"space-around",
				"space-evenly",
			],
			{
				label: "Justify content",
				default: "flex-start",
				responsive: true,
				group: "Layout",
			},
		),
		wrap: f.boolean({
			label: "Wrap",
			default: false,
			responsive: true,
			group: "Layout",
		}),
		paddingY: f.select(["none", "xs", "sm", "md", "lg", "xl"], {
			label: "Padding Y",
			default: "none",
			responsive: true,
			group: "Spacing",
		}),
		paddingX: f.select(["none", "xs", "sm", "md", "lg", "xl"], {
			label: "Padding X",
			default: "none",
			responsive: true,
			group: "Spacing",
		}),
		marginY: f.select(["none", "xs", "sm", "md", "lg", "xl"], {
			label: "Margin Y",
			default: "none",
			responsive: true,
			group: "Spacing",
		}),
		marginX: f.select(["none", "xs", "sm", "md", "lg", "xl"], {
			label: "Margin X",
			default: "none",
			responsive: true,
			group: "Spacing",
		}),
		paddingBox: spacingBoxField({
			label: "Padding (per side)",
			group: "Spacing",
			hint: "Overrides Padding X/Y for individual sides.",
		}),
		marginBox: spacingBoxField({
			label: "Margin (per side)",
			group: "Spacing",
			hint: "Overrides Margin X/Y for individual sides.",
		}),
		background: f.color({
			label: "Background",
			default: "transparent",
			group: "Style",
		}),
		borderRadius: border.borderRadius,
		shadow: border.shadow,
		borderTopWidth: f.number({
			label: "Border top (px)",
			default: 0,
			group: "Border",
		}),
		borderRightWidth: f.number({
			label: "Border right (px)",
			default: 0,
			group: "Border",
		}),
		borderBottomWidth: f.number({
			label: "Border bottom (px)",
			default: 0,
			group: "Border",
		}),
		borderLeftWidth: f.number({
			label: "Border left (px)",
			default: 0,
			group: "Border",
		}),
		borderStyle: f.select(["solid", "dashed", "dotted", "double"], {
			label: "Border style",
			default: "solid",
			group: "Border",
		}),
		borderColor: f.color({
			label: "Border color",
			default: "#e2e8f0",
			group: "Border",
		}),
	},
});
