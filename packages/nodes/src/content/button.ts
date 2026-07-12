import { defineNode, f } from "@kiv/engine";
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
import {
	BUTTON_RADIUS,
	BUTTON_SIZE,
	BUTTON_VARIANT,
	type ButtonSizeStyle,
	type ButtonVariantStyle,
} from "../scales";
import { resolveSpacingStyle, spacingBoxField } from "../spacing-field";

const hover = hoverFields({
	effects: ["none", "lift", "grow", "glow", "fade", "underline"],
});

const DEFAULT_SIZE: ButtonSizeStyle = { padding: "9px 20px", fontSize: "14px" };
const DEFAULT_VARIANT: ButtonVariantStyle = {
	background: "#6366f1",
	color: "#ffffff",
	border: "2px solid transparent",
};

export const buttonNode = defineNode({
	type: "button",
	category: "content",
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
			fontWeight: String(props.fontWeight ?? "600"),
			fontFamily: "inherit",
			textAlign: String(props.align ?? "center"),
			borderRadius: BUTTON_RADIUS[String(props.borderRadius ?? "md")] ?? "6px",
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

		const href = escapeHtml(props.href ?? "#");
		const target =
			props.linkType === "external"
				? "_blank"
				: String(props.target ?? "_self");
		const rel = target === "_blank" ? ' rel="noopener noreferrer"' : "";

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

		return `<a href="${href}" target="${escapeHtml(target)}"${rel}${classAttr} style="${style}" data-kiv-type="button">${inner}</a>`;
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
		paddingBox: spacingBoxField({
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
		fontWeight: f.select(["400", "500", "600", "700"], {
			label: "Font weight",
			default: "600",
			group: "Style",
		}),
		hoverEffect: hover.hoverEffect,
		hoverGlowColor: hover.hoverGlowColor,
	},
});
