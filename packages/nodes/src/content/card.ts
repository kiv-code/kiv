import { defineNode, f } from "@kivcode/engine";
import { borderVisualFields, uniformBorderFields } from "../border-field";
import {
	colorOrGradientField,
	resolveBackgroundPaint,
} from "../color-gradient";
import { hoverEffectClass, hoverGlowStyle } from "../hover-effects";
import { hoverFields } from "../hover-field";
import { styleToString } from "../html-utils";
import { fromScale, RADIUS, SHADOW } from "../scales";
import { resolveSpacingStyle, spacingField } from "../spacing-field";

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
		const style = styleToString({
			background: resolveBackgroundPaint(props.background, "#ffffff"),
			borderRadius: fromScale(RADIUS, props.borderRadius ?? "lg", "16px"),
			// A legacy string value ("lg") normalizes to a uniform box, so old
			// documents keep rendering without a migration step.
			...resolveSpacingStyle("padding", props.padding, "32px"),
			boxShadow: fromScale(SHADOW, props.shadow ?? "md", "none"),
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
		padding: spacingField({
			label: "Padding",
			group: "Style",
			default: { top: "lg", right: "lg", bottom: "lg", left: "lg" },
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
