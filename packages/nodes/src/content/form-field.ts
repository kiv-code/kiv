import { defineNode, f } from "@kiv/engine";
import { escapeHtml, styleToString } from "../html-utils";

export function parseSelectOptions(raw: unknown): string[] {
	if (typeof raw !== "string") return [];
	return raw
		.split(",")
		.map((option) => option.trim())
		.filter((option) => option.length > 0);
}

export const formFieldNode = defineNode({
	type: "form-field",
	category: "content",
	label: "Form Field",
	icon: "text-cursor-input",
	toHtml(props) {
		const fieldType = String(props.fieldType ?? "text");
		const name = escapeHtml(props.name ?? "field");
		const required = props.required ? " required" : "";
		const placeholder =
			props.placeholder !== undefined && props.placeholder !== ""
				? ` placeholder="${escapeHtml(props.placeholder)}"`
				: "";
		const labelHtml =
			props.label !== undefined && props.label !== ""
				? `<label for="${name}" style="${styleToString({ display: "block", marginBottom: "4px", fontSize: "13px", fontWeight: "600" })}">${escapeHtml(props.label)}</label>`
				: "";

		let controlHtml: string;
		if (fieldType === "textarea") {
			controlHtml = `<textarea id="${name}" name="${name}"${placeholder}${required} style="width:100%;"></textarea>`;
		} else if (fieldType === "select") {
			const options = parseSelectOptions(props.options);
			const optionsHtml = options
				.map(
					(option) =>
						`<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`,
				)
				.join("");
			controlHtml = `<select id="${name}" name="${name}"${required} style="width:100%;">${optionsHtml}</select>`;
		} else if (fieldType === "checkbox") {
			controlHtml = `<input id="${name}" type="checkbox" name="${name}"${required} />`;
		} else {
			controlHtml = `<input id="${name}" type="${escapeHtml(fieldType)}" name="${name}"${placeholder}${required} style="width:100%;" />`;
		}

		return `<div data-kiv-type="form-field">${labelHtml}${controlHtml}</div>`;
	},
	fields: {
		fieldType: f.select(
			["text", "email", "tel", "textarea", "select", "checkbox"],
			{
				label: "Field Type",
				default: "text",
				group: "Content",
			},
		),
		name: f.text({
			label: "Field Name (key)",
			default: "field",
			group: "Content",
		}),
		label: f.text({ label: "Label", localizable: true, group: "Content" }),
		placeholder: f.text({
			label: "Placeholder",
			localizable: true,
			group: "Content",
		}),
		required: f.boolean({
			label: "Required",
			default: false,
			group: "Behavior",
		}),
		options: f.text({
			label: "Options (comma-separated, for select)",
			localizable: true,
			group: "Content",
			showIf: { field: "fieldType", equals: "select" },
		}),
	},
});
