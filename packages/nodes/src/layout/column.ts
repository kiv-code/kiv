import { defineNode, f } from "@kivcode/engine";
import { styleToString } from "../html-utils";
import { resolveSpacingStyle, spacingField } from "../spacing-field";

/** Shared by `toHtml` and both framework renderers — one source of truth. */
export function columnStyle(
	props: Record<string, unknown>,
): Record<string, string | undefined> {
	// The parent Grid's `align-items: stretch` only stretches this column div
	// to the row's full height — a Card (or any block child) inside it still
	// sizes to its own content, which is why cards with different amounts of
	// text used to end up visibly different heights in the same row. A grid
	// container's items stretch to fill it on BOTH axes by default (unlike
	// flex, which only stretches the cross axis), so this one declaration
	// makes a single feature child (a Card, a Stack) fill the column with no
	// extra height rule needed on the child itself.
	const s: Record<string, string | undefined> = { display: "grid" };
	if (props.span && props.span !== "auto") s.gridColumn = `span ${props.span}`;
	if (props.offset && props.offset !== "0")
		s.gridColumnStart = String(Number(props.offset) + 1);
	if (props.alignSelf && props.alignSelf !== "auto")
		s.alignSelf = String(props.alignSelf);
	Object.assign(s, resolveSpacingStyle("padding", props.padding, {}));
	return s;
}

export const columnNode = defineNode({
	type: "column",
	category: "layout",
	label: "Column",
	description: "Column slot inside a Grid",
	toHtml(props, children) {
		return `<div style="${styleToString(columnStyle(props))}" data-kiv-type="column">${children.default ?? ""}</div>`;
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
		padding: spacingField({ label: "Padding", group: "Spacing" }),
	},
});
