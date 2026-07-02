import { defineNode, f } from "@kiv/engine";

export const imageNode = defineNode({
	type: "image",
	category: "media",
	fields: {
		src: f.text({ label: "Src" }),
		alt: f.text({ label: "Alt text", localizable: true }),
		fit: f.select(["cover", "contain", "fill", "none"], {
			label: "Object fit",
			default: "cover",
		}),
		aspectRatio: f.select(["auto", "1/1", "4/3", "16/9", "21/9"], {
			label: "Aspect ratio",
			default: "auto",
		}),
	},
});
