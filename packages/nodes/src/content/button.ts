import { defineNode, f } from "@kiv/engine";

export const buttonNode = defineNode({
	type: "button",
	category: "content",
	fields: {
		label: f.text({
			label: "Label",
			localizable: true,
			inline: true,
			group: "Content",
		}),
		// Icon: bring-your-own. Accepts either an icon-font CSS class
		// (e.g. "fa-solid fa-arrow-right", "lucide-check") OR raw inline SVG
		// (e.g. "<svg ...>...</svg>"). The engine ships NO icon library — the
		// consumer loads their own (Font Awesome, Lucide, …) via global CSS.
		icon: f.text({
			label: "Icon (class or SVG)",
			default: "",
			group: "Content",
		}),
		iconPosition: f.select(["left", "right"], {
			label: "Icon position",
			default: "left",
			group: "Content",
		}),
		href: f.text({ label: "Href", default: "#", group: "Link" }),
		target: f.select(["_self", "_blank"], {
			label: "Target",
			default: "_self",
			group: "Link",
		}),
		linkType: f.select(["internal", "external", "anchor"], {
			label: "Link type",
			default: "internal",
			group: "Link",
		}),
		variant: f.select(["primary", "secondary", "ghost", "outline", "link"], {
			label: "Variant",
			default: "primary",
			group: "Style",
		}),
		// ── Colors ────────────────────────────────────────────────────────────
		// Escape hatch: override the variant's theme colors for this one button.
		// The inspector shows only the fields relevant to the chosen type.
		backgroundType: f.select(["solid", "gradient"], {
			label: "Background type",
			default: "solid",
			group: "Colors",
		}),
		// Solid: only when backgroundType === "solid". Empty → inherit variant/theme.
		customBackground: f.color({
			label: "Background",
			default: "",
			group: "Colors",
			showIf: { field: "backgroundType", equals: "solid" },
		}),
		// Gradient: only when backgroundType === "gradient".
		gradientFrom: f.color({
			label: "From",
			default: "#6366f1",
			group: "Colors",
			showIf: { field: "backgroundType", equals: "gradient" },
		}),
		gradientMiddle: f.color({
			label: "Middle (optional)",
			default: "",
			group: "Colors",
			showIf: { field: "backgroundType", equals: "gradient" },
		}),
		gradientTo: f.color({
			label: "To",
			default: "#a855f7",
			group: "Colors",
			showIf: { field: "backgroundType", equals: "gradient" },
		}),
		gradientAngle: f.number({
			label: "Angle (deg)",
			default: 135,
			group: "Colors",
			showIf: { field: "backgroundType", equals: "gradient" },
		}),
		// Text + border apply to both types.
		customColor: f.color({
			label: "Text color",
			default: "",
			group: "Colors",
		}),
		customBorderColor: f.color({
			label: "Border color",
			default: "",
			group: "Colors",
		}),
		size: f.select(["xs", "sm", "md", "lg", "xl"], {
			label: "Size",
			default: "md",
			responsive: true,
			group: "Style",
		}),
		fullWidth: f.boolean({
			label: "Full width",
			default: false,
			responsive: true,
			group: "Style",
		}),
		align: f.select(["left", "center", "right"], {
			label: "Text align",
			default: "center",
			group: "Style",
		}),
		borderRadius: f.select(["none", "sm", "md", "lg", "xl", "full"], {
			label: "Border radius",
			default: "md",
			group: "Style",
		}),
		fontWeight: f.select(["400", "500", "600", "700"], {
			label: "Font weight",
			default: "600",
			group: "Style",
		}),
	},
});
