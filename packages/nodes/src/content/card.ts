import { defineNode, f } from "@kivcode/engine";
import { borderVisualFields, uniformBorderFields } from "../border-field";
import {
	colorOrGradientField,
	resolveBackgroundPaint,
} from "../color-gradient";
import { hoverEffectClass, hoverGlowStyle } from "../hover-effects";
import { hoverFields } from "../hover-field";
import { styleToString } from "../html-utils";
import { RADIUS, SHADOW, SPACING } from "../scales";
import { resolveSpacingStyle, spacingBoxField } from "../spacing-field";

const hover = hoverFields({ effects: ["none", "lift", "grow", "glow"] });
const border = borderVisualFields({
	radiusOptions: ["none", "sm", "md", "lg", "xl"],
	radiusDefault: "lg",
	shadowDefault: "md",
});
const borderUniform = uniformBorderFields({
	group: "Style",
	widthLabel: "Border Width",
	colorLabel: "Border Color",
});

export const cardNode = defineNode({
	type: "card",
	category: "content",
	label: "Card",
	icon: "square",
	slotConstraints: {
		default: ["heading", "text", "button", "icon", "image", "stack", "divider"],
	},
	toHtml(props, children) {
		const padding = SPACING[String(props.padding ?? "lg")] ?? "32px";
		const style = styleToString({
			background: resolveBackgroundPaint(props.background, "#ffffff"),
			borderRadius: RADIUS[String(props.borderRadius ?? "lg")] ?? "16px",
			...resolveSpacingStyle("padding", props.paddingBox, padding),
			boxShadow: SHADOW[String(props.shadow ?? "md")] ?? "none",
			borderWidth: props.borderWidth ? `${props.borderWidth}px` : undefined,
			borderStyle: props.borderWidth ? "solid" : undefined,
			borderColor: props.borderWidth
				? String(props.borderColor ?? "#e2e8f0")
				: undefined,
			outline: props.highlighted ? "2px solid #6366f1" : undefined,
			outlineOffset: props.highlighted ? "2px" : undefined,
			...hoverGlowStyle(props.hoverGlowColor),
		});
		const hoverClass = hoverEffectClass(props.hoverEffect);
		const classAttr = hoverClass ? ` class="${hoverClass}"` : "";
		return `<div style="${style}"${classAttr} data-kiv-type="card">${children.default ?? ""}</div>`;
	},
	fields: {
		background: colorOrGradientField({ label: "Background", group: "Style" }),
		borderRadius: border.borderRadius,
		padding: f.select(["sm", "md", "lg", "xl"], {
			label: "Padding",
			default: "lg",
			group: "Style",
		}),
		paddingBox: spacingBoxField({
			label: "Padding (per side)",
			group: "Style",
			hint: "Overrides Padding for individual sides. Empty side = use the shorthand above.",
		}),
		shadow: border.shadow,
		borderWidth: borderUniform.borderWidth,
		borderColor: borderUniform.borderColor,
		highlighted: f.boolean({
			label: "Highlighted (featured)",
			default: false,
			group: "Style",
		}),
		hoverEffect: hover.hoverEffect,
		hoverGlowColor: hover.hoverGlowColor,
	},
});
