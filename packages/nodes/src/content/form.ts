import { defineNode, f } from "@kivcode/engine";
import { escapeHtml, styleToString } from "../html-utils";
import { GAP } from "../scales";

export const formNode = defineNode({
	type: "form",
	category: "content",
	label: "Form",
	icon: "clipboard-list",
	slotConstraints: { default: ["form-field"] },
	toHtml(props, children) {
		const layout = String(props.layout ?? "stacked");
		const gap = GAP[String(props.gap ?? "md")] ?? "16px";
		const style = styleToString({
			display: layout === "grid-2" ? "grid" : "flex",
			gridTemplateColumns: layout === "grid-2" ? "1fr 1fr" : undefined,
			flexDirection: layout === "stacked" ? "column" : undefined,
			flexWrap: layout === "inline" ? "wrap" : undefined,
			alignItems: layout === "inline" ? "flex-end" : undefined,
			gap,
		});
		const action = escapeHtml(props.submitUrl ?? "");
		const method = String(props.method ?? "post");
		const submitLabel = escapeHtml(props.submitLabel ?? "Submit");
		return `<form action="${action}" method="${method}" style="${style}" data-kiv-type="form">${children.default ?? ""}<button type="submit" style="${styleToString({ gridColumn: layout === "grid-2" ? "1 / -1" : undefined })}">${submitLabel}</button></form>`;
	},
	fields: {
		submitLabel: f.text({
			label: "Submit Button Label",
			default: "Submit",
			localizable: true,
			group: "Content",
		}),
		submitUrl: f.text({ label: "Submit URL (endpoint)", group: "Behavior" }),
		method: f.select(["post", "get"], {
			label: "Method",
			default: "post",
			group: "Behavior",
		}),
		successMessage: f.text({
			label: "Success Message",
			default: "Thank you!",
			localizable: true,
			group: "Behavior",
		}),
		errorMessage: f.text({
			label: "Error Message",
			default: "Something went wrong.",
			localizable: true,
			group: "Behavior",
		}),
		layout: f.select(["stacked", "inline", "grid-2"], {
			label: "Layout",
			default: "stacked",
			group: "Layout",
		}),
		gap: f.select(["sm", "md", "lg"], {
			label: "Field Gap",
			default: "md",
			group: "Layout",
		}),
	},
});
