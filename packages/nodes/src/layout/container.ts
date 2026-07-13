import { defineNode, f } from "@kivcode/engine";
import { styleToString } from "../html-utils";
import { MAX_WIDTH, SPACING } from "../scales";
import { resolveSpacingStyle } from "../spacing-field";
import { spacingFields } from "../spacing-fields";

export const containerNode = defineNode({
	type: "container",
	category: "layout",
	label: "Container",
	description: "Centered max-width content wrapper",
	toHtml(props, children) {
		const paddingX = SPACING[String(props.paddingX ?? "md")] ?? "16px";
		const paddingY = SPACING[String(props.paddingY ?? "none")] ?? "0";
		const style = styleToString({
			maxWidth: MAX_WIDTH[String(props.maxWidth ?? "lg")] ?? "1024px",
			marginLeft: props.centered !== false ? "auto" : undefined,
			marginRight: props.centered !== false ? "auto" : undefined,
			width: "100%",
			// Per-side override, shared with every other node that needs this
			// escape hatch (see packages/nodes/src/spacing-field.ts). Empty side
			// falls back to the Padding X/Y shorthand above.
			...resolveSpacingStyle("padding", props.paddingBox, {
				top: paddingY,
				right: paddingX,
				bottom: paddingY,
				left: paddingX,
			}),
		});
		return `<div style="${style}" data-kiv-type="container">${children.default ?? ""}</div>`;
	},
	fields: {
		// Responsive: a wide container on desktop can still want a narrower one
		// on mobile without a separate node.
		maxWidth: f.select(["xs", "sm", "md", "lg", "xl", "2xl", "full"], {
			label: "Max width",
			default: "lg",
			responsive: true,
			group: "Layout",
		}),
		...spacingFields({ group: "Layout", paddingXDefault: "md" }),
		centered: f.boolean({ label: "Centered", default: true, group: "Layout" }),
	},
});
