import { defineNode, f } from "@kivcode/engine";
import { styleToString } from "../html-utils";
import { sizeField } from "../size-field";

/**
 * Shared by `toHtml` and both framework renderers — one source of truth.
 * A relative box; its `layer` children fill it edge-to-edge (see
 * `layerStyle`) so each one can show a different `clip-path` cutout of the
 * same area — the way a hero banner layers a color shape over a photo.
 */
export function zStackStyle(
	props: Record<string, unknown>,
): Record<string, string | undefined> {
	return {
		position: "relative",
		minHeight: props.minHeight ? String(props.minHeight) : undefined,
		overflow: props.overflow === "visible" ? undefined : "hidden",
	};
}

export const zStackNode = defineNode({
	type: "z-stack",
	category: "layout",
	label: "Layered Stack",
	description:
		"Overlapping layers — a color shape over a photo, a badge over an image.",
	slotConstraints: { default: ["layer"] },
	toHtml(props, children) {
		return `<div style="${styleToString(zStackStyle(props))}" data-kiv-type="z-stack">${children.default ?? ""}</div>`;
	},
	fields: {
		minHeight: sizeField({
			label: "Min height",
			default: "400px",
			units: [
				{ unit: "px", min: 0, max: 1200, step: 10 },
				{ unit: "vh", min: 0, max: 100, step: 1 },
			],
		}),
		overflow: f.select(["hidden", "visible"], {
			label: "Overflow",
			default: "hidden",
			group: "Layout",
			hint: "Visible lets a layer's own content spill outside the stack's box.",
		}),
	},
});
