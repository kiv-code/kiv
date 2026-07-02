import { defineNode, f } from "@kiv/engine";

export const pageNode = defineNode({
	type: "page",
	category: "layout",
	fields: {
		lang: f.text({ label: "Language", default: "en" }),
	},
});
