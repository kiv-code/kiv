import { defineNode, f, tokenRef } from "@kiv/engine";

export const sectionNode = defineNode({
	type: "section",
	category: "layout",
	fields: {
		// Background
		background: f.color({
			label: "Background color",
			default: "transparent",
			responsive: true,
		}),
		backgroundImage: f.text({ label: "Background image URL" }),
		backgroundVideo: f.text({ label: "Background video URL" }),
		backgroundSize: f.select(["cover", "contain", "auto"], {
			label: "Background size",
			default: "cover",
		}),
		backgroundPosition: f.select(["center", "top", "bottom", "left", "right"], {
			label: "Background position",
			default: "center",
		}),

		// Overlay
		overlay: f.boolean({ label: "Overlay", default: false }),
		overlayColor: f.color({
			label: "Overlay color",
			default: "rgba(0,0,0,0.4)",
		}),
		overlayOpacity: f.number({ label: "Overlay opacity (0-1)", default: 0.4 }),

		// Gradient
		gradient: f.text({ label: "Gradient (CSS value)" }),

		// Filters
		blur: f.select(["none", "sm", "md", "lg"], {
			label: "Backdrop blur",
			default: "none",
		}),
		opacity: f.number({ label: "Opacity (0-1)", default: 1 }),

		// Spacing
		paddingY: f.select(["none", "sm", "md", "lg", "xl"], {
			label: "Padding Y",
			default: "lg",
			responsive: true,
		}),
		paddingX: f.select(["none", "sm", "md", "lg", "xl"], {
			label: "Padding X",
			default: "md",
			responsive: true,
		}),
		marginY: f.select(["none", "sm", "md", "lg", "xl"], {
			label: "Margin Y",
			default: "none",
			responsive: true,
		}),

		// Border
		borderWidth: f.select(["0", "1", "2", "4"], {
			label: "Border width",
			default: "0",
		}),
		borderColor: f.color({
			label: "Border color",
			default: tokenRef("colors", "border"),
		}),
		borderRadius: f.select(["none", "sm", "md", "lg", "full"], {
			label: "Border radius",
			default: "none",
		}),

		// Shadow
		shadow: f.select(["none", "sm", "md", "lg"], {
			label: "Shadow",
			default: "none",
		}),

		// Layout
		fullWidth: f.boolean({ label: "Full width", default: true }),
		minHeight: f.text({ label: "Min height (CSS value)" }),
	},
});
