import { defineNode, f } from "@kivcode/engine";
import { escapeHtml, styleToString } from "../html-utils";
import { linkAttrs, linkFields, resolveLink } from "../link-field";
import {
	BUTTON_RADIUS,
	BUTTON_SIZE,
	BUTTON_VARIANT,
	fromScale,
} from "../scales";
import { resolveTypographyStyle, typographyFields } from "../typography-field";

const typo = typographyFields({
	group: "Style",
	defaultSize: 16,
	weightDefault: "500",
});

/** Resolves the inline-mode link's text style through the shared typography
 * resolver. Only used when `display === "inline"` — button mode keeps its own
 * fixed weight/family, mirroring Button. */
export function resolveLinkTypographyStyle(props: {
	fontFamily?: string;
	fontSize?: number;
	weight?: string;
	color?: unknown;
}): Record<string, string | undefined> {
	return resolveTypographyStyle(
		{
			fontFamily: props.fontFamily,
			size: props.fontSize,
			weight: props.weight,
			color: props.color,
		},
		{ size: 16, weight: "500", colorFallback: "#6366f1" },
	);
}

export const linkNode = defineNode({
	type: "link",
	category: "content",
	label: "Link",
	description: "Inline or button-style hyperlink",
	toHtml(props, children) {
		const link = linkAttrs(resolveLink(props), escapeHtml);
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
				borderRadius: fromScale(
					BUTTON_RADIUS,
					props.buttonRadius ?? "md",
					"6px",
				),
				lineHeight: "1",
				whiteSpace: "nowrap",
				background: variant.background,
				color: variant.color,
				border: variant.border,
			});
		} else {
			const typoStyle = resolveLinkTypographyStyle(props);
			style = styleToString({
				color: typoStyle.color,
				textDecoration: props.underline !== false ? "underline" : "none",
				fontWeight: typoStyle.fontWeight,
				fontSize: typoStyle.fontSize,
				fontFamily: typoStyle.fontFamily,
			});
		}

		return `<a${link} style="${style}" data-kiv-type="link">${content}</a>`;
	},
	fields: {
		text: f.text({
			label: "Text",
			localizable: true,
			inline: true,
			group: "Content",
		}),
		...linkFields({ group: "Content", default: "internal" }),
		display: f.select(["inline", "button"], {
			label: "Display as",
			default: "inline",
			group: "Style",
		}),
		// Inline style fields
		fontFamily: {
			...typo.fontFamily,
			showIf: { field: "display", equals: "inline" },
		},
		color: {
			...f.color({ label: "Color", default: "#6366f1" }),
			group: "Style",
			showIf: { field: "display", equals: "inline" },
		},
		underline: f.boolean({
			label: "Underline",
			default: true,
			group: "Style",
			showIf: { field: "display", equals: "inline" },
		}),
		weight: { ...typo.weight, showIf: { field: "display", equals: "inline" } },
		// Named `fontSize` (not `size`) because `size` is already the button-mode
		// size preset below (xs..xl) — the two fields are mutually exclusive via
		// `showIf`, but they can't share a key in one flat `fields` object.
		fontSize: { ...typo.size, showIf: { field: "display", equals: "inline" } },
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
