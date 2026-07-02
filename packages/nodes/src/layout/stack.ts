import { defineNode, f } from "@kiv/engine";

export const stackNode = defineNode({
	type: "stack",
	category: "layout",
	fields: {
		direction: f.select(["vertical", "horizontal"], {
			label: "Direction",
			default: "vertical",
			responsive: true,
		}),
		gap: f.select(["none", "sm", "md", "lg", "xl"], {
			label: "Gap",
			default: "md",
			responsive: true,
		}),
		align: f.select(["start", "center", "end", "stretch"], {
			label: "Align items",
			default: "start",
			responsive: true,
		}),
		justify: f.select(["start", "center", "end", "between", "around"], {
			label: "Justify content",
			default: "start",
			responsive: true,
		}),
		wrap: f.boolean({ label: "Wrap", default: false }),
	},
});
