import { defineNode, f } from "@kivcode/engine";
import { gapField } from "../gap-field";
import { styleToString } from "../html-utils";
import { fromScale, GAP } from "../scales";
import { resolveSpacingStyle, spacingField } from "../spacing-field";

/** Shared by `toHtml` and both framework renderers — one source of truth. */
export function gridStyle(
	props: Record<string, unknown>,
): Record<string, string | undefined> {
	return {
		display: "grid",
		gridTemplateColumns: `repeat(${props.columns ?? "1"}, minmax(0, 1fr))`,
		columnGap: fromScale(GAP, props.gap ?? "md", "16px"),
		rowGap: fromScale(GAP, props.rowGap ?? "md", "16px"),
		alignItems: String(props.alignItems ?? "stretch"),
		...resolveSpacingStyle("padding", props.padding, {}),
	};
}

export const gridNode = defineNode({
	type: "grid",
	category: "layout",
	label: "Grid",
	description: "Responsive multi-column grid layout",
	toHtml(props, children) {
		return `<div style="${styleToString(gridStyle(props))}" data-kiv-type="grid">${children.default ?? ""}</div>`;
	},
	fields: {
		// Counts beyond the divisors of 12 are uncommon but real — a row of 5, 7
		// or 9 logos is a normal design, and a closed set of divisors made those
		// layouts impossible to express at all.
		columns: f.select(
			["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "12"],
			{
				label: "Columns",
				default: "12",
				responsive: true,
				group: "Layout",
			},
		),
		gap: gapField(),
		rowGap: gapField({ default: "md" }),
		alignItems: f.select(["start", "center", "end", "stretch"], {
			label: "Align items",
			default: "stretch",
			group: "Layout",
		}),
		padding: spacingField({ label: "Padding", group: "Spacing" }),
	},
});
