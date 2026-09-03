import { defineNode, f } from "@kivcode/engine";
import { styleToString } from "../html-utils";
import { fromScale, MAX_WIDTH } from "../scales";
import { resolveSpacingStyle, spacingField } from "../spacing-field";

/**
 * The node's style, computed once and shared by every renderer — `toHtml`, the
 * Vue component and the React component all call this instead of each keeping
 * its own copy of the same arithmetic. Changing the visual contract here
 * updates all three at once.
 */
export function containerStyle(
	props: Record<string, unknown>,
): Record<string, string | undefined> {
	return {
		maxWidth: fromScale(MAX_WIDTH, props.maxWidth ?? "lg", "1024px"),
		marginLeft: props.centered !== false ? "auto" : undefined,
		marginRight: props.centered !== false ? "auto" : undefined,
		width: "100%",
		// One spacing field covers both the uniform and the per-side case;
		// each side holds a scale token or a raw CSS length.
		...resolveSpacingStyle("padding", props.padding, {
			top: "0",
			right: "16px",
			bottom: "0",
			left: "16px",
		}),
	};
}

export const containerNode = defineNode({
	type: "container",
	category: "layout",
	label: "Container",
	description: "Centered max-width content wrapper",
	toHtml(props, children) {
		return `<div style="${styleToString(containerStyle(props))}" data-kiv-type="container">${children.default ?? ""}</div>`;
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
		padding: spacingField({
			label: "Padding",
			group: "Layout",
			default: { right: "md", left: "md" },
		}),
		centered: f.boolean({ label: "Centered", default: true, group: "Layout" }),
	},
});
