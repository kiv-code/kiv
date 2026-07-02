import { defineNode, f } from "@kiv/engine";

export const columnNode = defineNode({
	type: "column",
	category: "layout",
	fields: {
		span: f.select(
			["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "auto"],
			{ label: "Span", default: "auto", responsive: true },
		),
		offset: f.select(
			["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
			{ label: "Offset", default: "0", responsive: true },
		),
	},
});
