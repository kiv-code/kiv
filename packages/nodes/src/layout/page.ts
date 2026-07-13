import { defineNode, f } from "@kivcode/engine";
import { escapeHtml } from "../html-utils";

export const pageNode = defineNode({
	type: "page",
	category: "layout",
	label: "Page",
	description: "The document root",
	toHtml(props, children) {
		const lang = props.lang ? ` lang="${escapeHtml(props.lang)}"` : "";
		return `<div${lang} data-kiv-type="page">${children.default ?? ""}</div>`;
	},
	fields: {
		lang: f.text({ label: "Language", default: "en", group: "General" }),
	},
});
