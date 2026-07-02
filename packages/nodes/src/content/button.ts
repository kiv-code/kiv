import { defineNode, f } from "@kiv/engine";

export const buttonNode = defineNode({
	type: "button",
	category: "content",
	fields: {
		label: f.text({ label: "Label", localizable: true }),
		href: f.text({ label: "Href", default: "#" }),
		target: f.select(["_self", "_blank"], {
			label: "Target",
			default: "_self",
		}),
		// anchor = scroll to #id | external = <a> with target | internal = SPA router link
		linkType: f.select(["internal", "external", "anchor"], {
			label: "Link type",
			default: "internal",
		}),
		variant: f.select(["primary", "secondary", "ghost", "outline"], {
			label: "Variant",
			default: "primary",
		}),
		size: f.select(["sm", "md", "lg"], { label: "Size", default: "md" }),
		fullWidth: f.boolean({
			label: "Full width",
			default: false,
			responsive: true,
		}),
	},
});
