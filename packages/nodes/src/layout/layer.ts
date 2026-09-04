import { defineNode, f } from "@kivcode/engine";
import {
	colorOrGradientField,
	resolveBackgroundPaint,
} from "../color-gradient";
import { styleToString } from "../html-utils";
import { resolveSpacingStyle, spacingField } from "../spacing-field";

/** Shared by `toHtml` and both framework renderers — one source of truth. */
export function layerStyle(
	props: Record<string, unknown>,
): Record<string, string | undefined> {
	return {
		position: "absolute",
		inset: "0",
		zIndex: props.zIndex !== undefined ? String(props.zIndex) : undefined,
		clipPath: props.clipPath ? String(props.clipPath) : undefined,
		background: props.background
			? resolveBackgroundPaint(props.background, "")
			: undefined,
		display: "flex",
		flexDirection: "column",
		alignItems: String(props.alignItems ?? "stretch"),
		justifyContent: String(props.justifyContent ?? "flex-start"),
		...resolveSpacingStyle("padding", props.padding, {}),
	};
}

export const layerNode = defineNode({
	type: "layer",
	category: "layout",
	label: "Layer",
	description:
		"One layer inside a Layered Stack — fills the stack, optionally clipped to a shape.",
	toHtml(props, children) {
		return `<div style="${styleToString(layerStyle(props))}" data-kiv-type="layer">${children.default ?? ""}</div>`;
	},
	fields: {
		zIndex: f.number({ label: "Order (z-index)", default: 0, group: "Layout" }),
		background: colorOrGradientField({
			label: "Background",
			group: "Style",
			hint: "Lets a layer BE the colored shape — pair with a clip path instead of nesting a Card inside it.",
		}),
		padding: spacingField({ label: "Padding", group: "Layout" }),
		clipPath: f.text({
			label: "Clip path",
			default: "",
			group: "Layout",
			hint: "Raw CSS clip-path, e.g. polygon(0 0, 100% 0, 80% 100%, 0 100%) or path('M0,0 ...'). Empty = fills the whole stack.",
		}),
		alignItems: f.select(["flex-start", "center", "flex-end", "stretch"], {
			label: "Align horizontal",
			default: "stretch",
			group: "Layout",
		}),
		justifyContent: f.select(
			["flex-start", "center", "flex-end", "space-between"],
			{
				label: "Align vertical",
				default: "flex-start",
				group: "Layout",
			},
		),
	},
});
