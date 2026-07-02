import { defineNode, f } from "@kiv/engine";

export const gridNode = defineNode({
	type: "grid",
	category: "layout",
	fields: {
		columns: f.select(["1", "2", "3", "4", "6", "12"], {
			label: "Columns",
			default: "12",
			responsive: true,
		}),
		gap: f.select(["none", "sm", "md", "lg", "xl"], {
			label: "Gap",
			default: "md",
			responsive: true,
		}),
	},
});
