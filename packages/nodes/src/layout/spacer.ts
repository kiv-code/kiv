import { defineNode, f } from "@kivcode/engine";
import { styleToString } from "../html-utils";
import { SPACING } from "../scales";

export const spacerNode = defineNode({
	type: "spacer",
	category: "layout",
	label: "Spacer",
	icon: "move-vertical",
	toHtml(props) {
		const style = styleToString({
			height: SPACING[String(props.height ?? "md")] ?? "16px",
			width: "100%",
		});
		return `<div style="${style}" data-kiv-type="spacer"></div>`;
	},
	fields: {
		height: f.select(["xs", "sm", "md", "lg", "xl", "2xl", "3xl"], {
			label: "Height",
			default: "md",
			responsive: true,
			group: "Layout",
		}),
		showDividerOnCanvas: f.boolean({
			label: "Show Guide in Editor",
			default: true,
			group: "Editor",
		}),
	},
});
