import { defineNode, f } from "@kivcode/engine";
import { styleToString } from "../html-utils";
import { fromScale, SPACING } from "../scales";
import { sizeField } from "../size-field";

export const spacerNode = defineNode({
	type: "spacer",
	category: "layout",
	label: "Spacer",
	icon: "move-vertical",
	toHtml(props) {
		const style = styleToString({
			height: fromScale(SPACING, props.height ?? "md", "16px"),
			width: "100%",
		});
		return `<div style="${style}" data-kiv-type="spacer"></div>`;
	},
	fields: {
		// A spacer exists to be an arbitrary gap, so a 7-step scale was the main
		// reason authors reached for raw CSS here. Old token values still render
		// correctly through `fromScale`.
		height: sizeField({
			label: "Height",
			default: "16px",
			group: "Layout",
			units: [
				{ unit: "px", min: 0, max: 400, step: 2 },
				{ unit: "vh", min: 0, max: 100, step: 1 },
			],
		}),
		showDividerOnCanvas: f.boolean({
			label: "Show Guide in Editor",
			default: true,
			group: "Editor",
		}),
	},
});
