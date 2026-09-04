import { defineNode, f } from "@kivcode/engine";
import { borderSidesFields, borderVisualFields } from "../border-field";
import { resolveBackgroundPaint } from "../color-gradient";
import { gapField } from "../gap-field";
import { styleToString } from "../html-utils";
import { fromScale, GAP, RADIUS, resolveShadow, SHADOW } from "../scales";
import { resolveSpacingStyle, spacingField } from "../spacing-field";

const border = borderVisualFields({
	shadowOptions: ["none", "sm", "md", "lg"],
});
const borderSides = borderSidesFields();

/** Shared by `toHtml` and both framework renderers — one source of truth. */
export function stackStyle(
	props: Record<string, unknown>,
): Record<string, string | undefined> {
	const borderWidths = {
		top: Number(props.borderTopWidth ?? 0),
		right: Number(props.borderRightWidth ?? 0),
		bottom: Number(props.borderBottomWidth ?? 0),
		left: Number(props.borderLeftWidth ?? 0),
	};
	const hasBorder = Object.values(borderWidths).some((w) => w > 0);
	const borderStyle = String(props.borderStyle ?? "solid");
	const borderColor = String(props.borderColor ?? "#e2e8f0");

	return {
		display: "flex",
		flexDirection: props.direction === "row" ? "row" : "column",
		// `gapField` produces GAP tokens, so they have to resolve against GAP —
		// resolving them against SPACING made `xl` render 64px instead of 48px.
		gap: fromScale(GAP, props.gap ?? "md", "16px"),
		alignItems: String(props.align ?? "flex-start"),
		justifyContent: String(props.justify ?? "flex-start"),
		flexWrap: props.wrap ? "wrap" : "nowrap",
		...resolveSpacingStyle("padding", props.padding),
		...resolveSpacingStyle("margin", props.margin),
		background:
			props.background && props.background !== "transparent"
				? resolveBackgroundPaint(props.background)
				: undefined,
		borderRadius: fromScale(RADIUS, props.borderRadius ?? "none", "0"),
		boxShadow: resolveShadow(
			String(props.shadow ?? "none"),
			props.shadowColor ? String(props.shadowColor) : undefined,
		),
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
	};
}

export const stackNode = defineNode({
	type: "stack",
	category: "layout",
	label: "Group",
	description: "Flex group — vertical column or horizontal row",
	toHtml(props, children) {
		return `<div style="${styleToString(stackStyle(props))}" data-kiv-type="stack">${children.default ?? ""}</div>`;
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
		padding: spacingField({ label: "Padding", group: "Spacing" }),
		margin: spacingField({ label: "Margin", group: "Spacing" }),
		background: f.color({
			label: "Background",
			default: "transparent",
			group: "Style",
		}),
		borderRadius: border.borderRadius,
		shadow: border.shadow,
		shadowColor: border.shadowColor,
		...borderSides,
	},
});
