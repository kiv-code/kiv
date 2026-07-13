import { defineNode, f } from "@kivcode/engine";
import { escapeHtml, styleToString } from "../html-utils";
import { BUTTON_RADIUS, BUTTON_SIZE, BUTTON_VARIANT } from "../scales";

export const linkNode = defineNode({
	type: "link",
	category: "content",
	label: "Link",
	description: "Inline or button-style hyperlink",
	toHtml(props, children) {
		const href = escapeHtml(props.href ?? "#");
		const target = String(props.target ?? "_self");
		const rel = target === "_blank" ? ' rel="noopener noreferrer"' : "";
		// Slotted children (icon/image/text nodes) win over the flat `text`
		// field — the field is only a fallback for links with no children,
		// which keeps documents saved before slots existed rendering unchanged.
		const slotContent = children?.default;
		const content = slotContent
			? slotContent
			: props.text !== undefined
				? escapeHtml(props.text)
				: "Link";
		const isButton = props.display === "button";

		let style: string;
		if (isButton) {
			const variant = BUTTON_VARIANT[String(props.variant ?? "primary")] ?? {
				background: "#6366f1",
				color: "#ffffff",
				border: "2px solid transparent",
			};
			const sizing = BUTTON_SIZE[String(props.size ?? "md")] ?? {
				padding: "9px 20px",
				fontSize: "14px",
			};
			style = styleToString({
				display: "inline-block",
				padding: sizing.padding,
				fontSize: sizing.fontSize,
				fontWeight: "600",
				fontFamily: "inherit",
				textAlign: "center",
				textDecoration: variant.textDecoration ?? "none",
				borderRadius:
					BUTTON_RADIUS[String(props.buttonRadius ?? "md")] ?? "6px",
				lineHeight: "1",
				whiteSpace: "nowrap",
				background: variant.background,
				color: variant.color,
				border: variant.border,
			});
		} else {
			style = styleToString({
				color: String(props.textColor ?? "#6366f1"),
				textDecoration: props.underline !== false ? "underline" : "none",
				fontWeight: String(props.fontWeight ?? "500"),
				fontSize: String(props.fontSize ?? "inherit"),
			});
		}

		return `<a href="${href}" target="${escapeHtml(target)}"${rel} style="${style}" data-kiv-type="link">${content}</a>`;
	},
	fields: {
		text: f.text({
			label: "Text",
			localizable: true,
			inline: true,
			group: "Content",
		}),
		href: f.text({ label: "URL", default: "#", group: "Content" }),
		target: f.select(["_self", "_blank"], {
			label: "Open in",
			default: "_self",
			group: "Content",
		}),
		display: f.select(["inline", "button"], {
			label: "Display as",
			default: "inline",
			group: "Style",
		}),
		// Inline style fields
		textColor: f.color({
			label: "Color",
			default: "#6366f1",
			group: "Style",
			showIf: { field: "display", equals: "inline" },
		}),
		underline: f.boolean({
			label: "Underline",
			default: true,
			group: "Style",
			showIf: { field: "display", equals: "inline" },
		}),
		fontWeight: f.select(["400", "500", "600", "700"], {
			label: "Weight",
			default: "500",
			group: "Style",
			showIf: { field: "display", equals: "inline" },
		}),
		fontSize: f.text({
			label: "Font size",
			default: "inherit",
			group: "Style",
			showIf: { field: "display", equals: "inline" },
		}),
		// Button-style fields
		variant: f.select(["primary", "secondary", "ghost", "outline", "link"], {
			label: "Variant",
			default: "primary",
			group: "Style",
			showIf: { field: "display", equals: "button" },
		}),
		size: f.select(["xs", "sm", "md", "lg", "xl"], {
			label: "Size",
			default: "md",
			group: "Style",
			showIf: { field: "display", equals: "button" },
		}),
		buttonRadius: f.select(["none", "sm", "md", "lg", "xl", "full"], {
			label: "Border radius",
			default: "md",
			group: "Style",
			showIf: { field: "display", equals: "button" },
		}),
	},
});
