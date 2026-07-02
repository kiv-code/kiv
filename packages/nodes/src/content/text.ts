import { defineNode, f, tokenRef } from "@kiv/engine";

export const textNode = defineNode({
	type: "text",
	category: "content",
	fields: {
		content: f.textarea({ label: "Content", localizable: true }),
		color: f.color({
			label: "Color",
			default: tokenRef("colors", "foreground"),
		}),
		size: f.select(["sm", "base", "lg", "xl"], {
			label: "Size",
			default: "base",
			responsive: true,
		}),
		align: f.select(["left", "center", "right"], {
			label: "Align",
			default: "left",
			responsive: true,
		}),
	},
});
