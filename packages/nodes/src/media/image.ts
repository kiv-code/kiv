import { defineNode, f } from "@kiv/engine";
import { borderVisualFields } from "../border-field";
import { hoverEffectClass, hoverGlowStyle } from "../hover-effects";
import { hoverFields } from "../hover-field";
import { escapeHtml, styleToString } from "../html-utils";
import { RADIUS, SHADOW } from "../scales";
import { sizeField } from "../size-field";

const hover = hoverFields({
	effects: ["none", "lift", "grow", "glow", "fade", "grayscale"],
});
const border = borderVisualFields({
	shadowOptions: ["none", "sm", "md", "lg"],
});

export const imageNode = defineNode({
	type: "image",
	category: "media",
	toHtml(props) {
		const style = styleToString({
			objectFit: String(props.fit ?? "cover"),
			aspectRatio:
				props.aspectRatio !== "auto" ? String(props.aspectRatio) : undefined,
			width: String(props.width ?? "100%"),
			maxWidth: "100%",
			display: "block",
			borderRadius: RADIUS[String(props.borderRadius ?? "none")] ?? "0",
			boxShadow: SHADOW[String(props.shadow ?? "none")] ?? "none",
			...hoverGlowStyle(props.hoverGlowColor),
		});
		const hoverClass = hoverEffectClass(props.hoverEffect);
		const classAttr = hoverClass ? ` class="${hoverClass}"` : "";
		const src = escapeHtml(props.src ?? "");
		const alt = escapeHtml(props.alt ?? "");
		return `<img src="${src}" alt="${alt}"${classAttr} style="${style}" data-kiv-type="image" />`;
	},
	fields: {
		src: f.text({
			label: "Source URL",
			group: "Content",
			pluginControl: "media-picker",
		}),
		alt: f.text({ label: "Alt text", localizable: true, group: "Content" }),
		fit: f.select(["cover", "contain", "fill", "none"], {
			label: "Object fit",
			default: "cover",
			group: "Style",
		}),
		aspectRatio: f.select(
			["auto", "1/1", "4/3", "3/2", "16/9", "21/9", "9/16"],
			{
				label: "Aspect ratio",
				default: "auto",
				group: "Style",
			},
		),
		width: sizeField({
			label: "Width",
			default: "100%",
			group: "Style",
			hint: "Any percentage or pixel value — drag the slider or type an exact size.",
		}),
		borderRadius: border.borderRadius,
		shadow: border.shadow,
		hoverEffect: hover.hoverEffect,
		hoverGlowColor: hover.hoverGlowColor,
	},
});
