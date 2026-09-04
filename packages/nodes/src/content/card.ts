import { defineNode, f } from "@kivcode/engine";
import { borderVisualFields, uniformBorderFields } from "../border-field";
import {
	colorOrGradientField,
	resolveBackgroundPaint,
} from "../color-gradient";
import { hoverEffectClass, hoverGlowStyle } from "../hover-effects";
import { hoverFields } from "../hover-field";
import { styleToString } from "../html-utils";
import { fromScale, RADIUS, resolveShadow } from "../scales";
import { sizeField } from "../size-field";
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

/**
 * Shared by `toHtml` and both framework renderers — one source of truth.
 * `width`/`height` + `alignItems`/`justifyContent` are what turn a Card into
 * a fixed-size, centered badge (a numbered circle, an icon avatar) instead
 * of only ever being a content box that grows with its children.
 */
export function cardStyle(
	props: Record<string, unknown>,
): Record<string, string | undefined> {
	return {
		display: "flex",
		flexDirection: "column",
		alignItems: String(props.alignItems ?? "stretch"),
		justifyContent: String(props.justifyContent ?? "flex-start"),
		width: props.width ? String(props.width) : undefined,
		height: props.height ? String(props.height) : undefined,
		flexShrink: props.width || props.height ? "0" : undefined,
		background: resolveBackgroundPaint(props.background, "#ffffff"),
		borderRadius: fromScale(RADIUS, props.borderRadius ?? "lg", "16px"),
		// A legacy string value ("lg") normalizes to a uniform box, so old
		// documents keep rendering without a migration step.
		...resolveSpacingStyle("padding", props.padding, "32px"),
		// Open at the edges like every other spacing field: a scale token
		// resolves through SPACING, anything else (e.g. a raw "-24px" to pull a
		// badge up over the card below it) passes through untouched.
		...resolveSpacingStyle("margin", props.margin, {}),
		boxShadow: resolveShadow(
			String(props.shadow ?? "md"),
			props.shadowColor ? String(props.shadowColor) : undefined,
		),
		borderWidth: props.borderWidth ? `${props.borderWidth}px` : undefined,
		borderStyle: props.borderWidth ? "solid" : undefined,
		borderColor: props.borderWidth
			? String(props.borderColor ?? "#e2e8f0")
			: undefined,
		outline: props.highlighted ? "2px solid #6366f1" : undefined,
		outlineOffset: props.highlighted ? "2px" : undefined,
		...hoverGlowStyle(props.hoverGlowColor),
	};
}

export const cardNode = defineNode({
	type: "card",
	category: "content",
	label: "Card",
	icon: "square",
	slotConstraints: {
		default: ["heading", "text", "button", "icon", "image", "stack", "divider"],
	},
	toHtml(props, children) {
		const style = styleToString(cardStyle(props));
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
		margin: spacingField({
			label: "Margin",
			group: "Layout",
			hint: "A negative value (e.g. -24px) lets a badge card overlap the element after it — a later sibling paints on top of an earlier one by default, no z-index needed.",
		}),
		width: sizeField({
			label: "Width",
			default: "",
			allowAuto: true,
			group: "Layout",
			hint: "Empty = grows with content. Set width and height equal (with Border radius = full) for a circular badge.",
		}),
		height: sizeField({
			label: "Height",
			default: "",
			allowAuto: true,
			group: "Layout",
		}),
		alignItems: f.select(["flex-start", "center", "flex-end", "stretch"], {
			label: "Align horizontal",
			default: "stretch",
			group: "Layout",
		}),
		justifyContent: f.select(
			["flex-start", "center", "flex-end", "space-between"],
			{
				label: "Align vertical",
				default: "flex-start",
				group: "Layout",
			},
		),
		shadow: border.shadow,
		shadowColor: border.shadowColor,
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
