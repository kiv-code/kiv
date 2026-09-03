import { defineNode, f } from "@kivcode/engine";
import {
	colorOrGradientField,
	resolveBackgroundPaint,
	resolveSolidColor,
	resolveTextPaintStyle,
} from "../color-gradient";
import { hoverEffectClass, hoverGlowStyle } from "../hover-effects";
import { hoverFields } from "../hover-field";
import { escapeHtml, normalizeSvgIconSize, styleToString } from "../html-utils";
import { resolveIcon } from "../icons";
import { linkAttrs, linkFields, resolveLink } from "../link-field";
import {
	BUTTON_RADIUS,
	BUTTON_SIZE,
	BUTTON_VARIANT,
	type ButtonSizeStyle,
	type ButtonVariantStyle,
	fromScale,
} from "../scales";
import { resolveSpacingStyle, spacingField } from "../spacing-field";
import { resolveTypographyStyle, typographyFields } from "../typography-field";

const hover = hoverFields({
	effects: ["none", "lift", "grow", "glow", "fade", "underline"],
});

const typo = typographyFields({
	group: "Typography",
	weightDefault: "600",
});

/** Resolves the button label's font family + weight through the shared
 * typography resolver — the two aspects that were previously hand-rolled (a
 * hardcoded "inherit" family and a weight `<select>` restricted to 400-700).
 * Size stays driven by the `size` preset (it also controls padding), so it is
 * intentionally excluded from this resolver. */
export function resolveButtonTypographyStyle(props: {
	fontFamily?: string;
	fontWeight?: string;
}): Record<string, string | undefined> {
	const resolved = resolveTypographyStyle(
		{ fontFamily: props.fontFamily, weight: props.fontWeight },
		{ weight: "600" },
	);
	return { fontFamily: resolved.fontFamily, fontWeight: resolved.fontWeight };
}

const DEFAULT_SIZE: ButtonSizeStyle = { padding: "9px 20px", fontSize: "14px" };
const DEFAULT_VARIANT: ButtonVariantStyle = {
	background: "#6366f1",
	color: "#ffffff",
	border: "2px solid transparent",
};

export const buttonNode = defineNode({
	type: "button",
	category: "content",
	label: "Button",
	description: "CTA with primary, secondary, ghost styles",
	toHtml(props) {
		const variant =
			BUTTON_VARIANT[String(props.variant ?? "primary")] ?? DEFAULT_VARIANT;
		const sizing = BUTTON_SIZE[String(props.size ?? "md")] ?? DEFAULT_SIZE;
		const icon = typeof props.icon === "string" ? props.icon.trim() : "";
		const hasIcon = icon.length > 0;
		const resolvedIconSvg = hasIcon ? resolveIcon(icon) : null;
		const iconIsSvg = hasIcon && (icon.startsWith("<") || !!resolvedIconSvg);
		const iconSize = props.iconSize ?? 16;
		const iconColor = (props.iconColor as string | undefined) || "";

		const background = resolveBackgroundPaint(
			props.background,
			variant.background,
		);
		const color = resolveSolidColor(props.textColor, variant.color);
		const border = props.customBorderColor
			? `2px solid ${props.customBorderColor}`
			: variant.border;
		const [sizingPadY, sizingPadX] = sizing.padding.split(" ");
		const paddingFallback = variant.textDecoration
			? { top: "0", right: "0", bottom: "0", left: "0" }
			: {
					top: sizingPadY,
					right: sizingPadX,
					bottom: sizingPadY,
					left: sizingPadX,
				};

		const style = styleToString({
			display: hasIcon ? "inline-flex" : "inline-block",
			alignItems: hasIcon ? "center" : undefined,
			justifyContent: hasIcon ? "center" : undefined,
			gap: hasIcon ? "0.5em" : undefined,
			width: props.fullWidth ? "100%" : undefined,
			...resolveSpacingStyle("padding", props.paddingBox, paddingFallback),
			fontSize: sizing.fontSize,
			...resolveButtonTypographyStyle(props),
			textAlign: String(props.align ?? "center"),
			borderRadius: fromScale(BUTTON_RADIUS, props.borderRadius ?? "md", "6px"),
			textDecoration: variant.textDecoration ?? "none",
			lineHeight: "1",
			whiteSpace: "nowrap",
			background,
			backgroundOrigin: "border-box",
			color,
			border,
			...hoverGlowStyle(props.hoverGlowColor),
		});

		const hoverClass = hoverEffectClass(props.hoverEffect);
		const classAttr = hoverClass ? ` class="${hoverClass}"` : "";

		const link = linkAttrs(resolveLink(props), escapeHtml);

		const iconStyle =
			`font-size:${iconSize}px` +
			(iconColor ? `;color:${escapeHtml(iconColor)}` : "");
		const iconHtml = hasIcon
			? iconIsSvg
				? `<span class="kiv-btn-icon" style="${iconStyle}">${normalizeSvgIconSize(resolvedIconSvg || icon)}</span>`
				: `<i class="${escapeHtml(icon)} kiv-btn-icon" style="${iconStyle}" aria-hidden="true"></i>`
			: "";
		const labelStyle = styleToString(
			resolveTextPaintStyle(props.textColor, variant.color),
		);
		const label =
			props.label !== undefined
				? `<span style="${labelStyle}">${escapeHtml(props.label)}</span>`
				: "";
		const inner =
			props.iconPosition === "right"
				? `${label}${iconHtml}`
				: `${iconHtml}${label}`;

		return `<a${link}${classAttr} style="${style}" data-kiv-type="button">${inner}</a>`;
	},
	fields: {
		label: f.text({
			label: "Label",
			localizable: true,
			inline: true,
			group: "Content",
		}),
		icon: f.text({
			label: "Icon",
			default: "",
			group: "Content",
			pluginControl: "icon-picker",
		}),
		iconPosition: f.select(["left", "right"], {
			label: "Icon position",
			default: "left",
			group: "Content",
		}),
		...linkFields({ default: "none" }),
		variant: f.select(["primary", "secondary", "ghost", "outline", "link"], {
			label: "Variant",
			default: "primary",
			group: "Style",
		}),
		background: colorOrGradientField({ label: "Background", group: "Colors" }),
		textColor: colorOrGradientField({ label: "Text color", group: "Colors" }),
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
		paddingBox: spacingField({
			label: "Padding (per side)",
			group: "Style",
			hint: "Overrides the size preset's padding for individual sides.",
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
		fontFamily: typo.fontFamily,
		fontWeight: typo.weight,
		hoverEffect: hover.hoverEffect,
		hoverGlowColor: hover.hoverGlowColor,
	},
});
