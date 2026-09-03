import { defineNode, f } from "@kivcode/engine";
import { borderColorField, borderVisualFields } from "../border-field";
import {
	colorOrGradientField,
	resolveBackgroundPaint,
	resolveSolidColor,
} from "../color-gradient";
import { escapeHtml, styleToString } from "../html-utils";
import { BLUR, fromScale, RADIUS, SECTION_SPACING, SHADOW } from "../scales";
import { sizeField } from "../size-field";
import { resolveSpacingStyle, spacingField } from "../spacing-field";

function isGradient(value: unknown): boolean {
	return (
		!!value &&
		typeof value === "object" &&
		(value as { type?: string }).type === "gradient"
	);
}

const border = borderVisualFields({ group: "Border" });

export const sectionNode = defineNode({
	type: "section",
	category: "layout",
	label: "Section",
	description: "Full-width section with rich background options",
	toHtml(props, children) {
		const s: Record<string, string | undefined> = {
			position: "relative",
			width: "100%",
			display: "flex",
			flexDirection: "column",
		};
		const solidBg = resolveSolidColor(props.background, "");
		if (solidBg) s.backgroundColor = solidBg;
		if (props.backgroundImage) {
			s.backgroundImage = `url(${props.backgroundImage})`;
			s.backgroundSize = String(props.backgroundSize ?? "cover");
			s.backgroundPosition = String(props.backgroundPosition ?? "center");
		}
		if (isGradient(props.background)) {
			s.backgroundImage = resolveBackgroundPaint(props.background, "");
			s.backgroundOrigin = "border-box";
		}
		if (props.opacity !== undefined && props.opacity !== 1) {
			s.opacity = String(props.opacity);
		}
		// Section keeps its own, larger rhythm: the same `lg` token is 64px here
		// and 32px on a Stack, which is why the scale travels with the field.
		Object.assign(
			s,
			// `{}` fallback = emit no declaration for an empty side, which is
			// distinct from an explicit "0" and keeps margin collapsing intact.
			resolveSpacingStyle("padding", props.padding, {}, SECTION_SPACING),
			resolveSpacingStyle("margin", props.margin, {}, SECTION_SPACING),
		);
		if (props.borderWidth && props.borderWidth !== "0") {
			s.borderWidth = `${props.borderWidth}px`;
			s.borderStyle = "solid";
			if (props.borderColor) s.borderColor = String(props.borderColor);
		}
		if (props.borderRadius && props.borderRadius !== "none") {
			s.borderRadius =
				RADIUS[String(props.borderRadius)] ?? String(props.borderRadius);
		}
		if (props.shadow && props.shadow !== "none") {
			s.boxShadow = SHADOW[String(props.shadow)] ?? String(props.shadow);
		}
		if (props.minHeight) s.minHeight = String(props.minHeight);

		let videoHtml = "";
		if (props.backgroundVideo) {
			const videoWrapStyle = styleToString({
				position: "absolute",
				inset: "0",
				overflow: "hidden",
				pointerEvents: "none",
			});
			videoHtml = `<div class="kiv-section__video-bg" style="${videoWrapStyle}"><video autoplay muted loop playsinline src="${escapeHtml(props.backgroundVideo)}" style="width: 100%; height: 100%; object-fit: cover;"></video></div>`;
		}

		let blurHtml = "";
		const blurAmount = fromScale(BLUR, props.blur ?? "none", "0");
		if (blurAmount !== "0") {
			const blurStyle = styleToString({
				position: "absolute",
				inset: "0",
				backdropFilter: `blur(${blurAmount})`,
				pointerEvents: "none",
				zIndex: "0",
			});
			blurHtml = `<div style="${blurStyle}"></div>`;
		}

		let overlayHtml = "";
		if (props.overlay) {
			const overlayStyle = styleToString({
				position: "absolute",
				inset: "0",
				pointerEvents: "none",
				background: resolveBackgroundPaint(
					props.overlayColor,
					"rgba(0, 0, 0, 0.4)",
				),
			});
			overlayHtml = `<div class="kiv-section__overlay" style="${overlayStyle}"></div>`;
		}

		const contentStyle = styleToString({
			position: "relative",
			zIndex: "1",
			display: "flex",
			flexDirection: "column",
			width: "100%",
			flex: "1",
			alignItems:
				props.alignItems && props.alignItems !== "flex-start"
					? String(props.alignItems)
					: undefined,
			justifyContent:
				props.justifyContent && props.justifyContent !== "flex-start"
					? String(props.justifyContent)
					: undefined,
		});

		return `<section style="${styleToString(s)}" data-kiv-type="section" class="kiv-section">${videoHtml}${blurHtml}${overlayHtml}<div class="kiv-section__content" style="${contentStyle}">${children.default ?? ""}</div></section>`;
	},
	fields: {
		background: colorOrGradientField({
			label: "Background",
			group: "Background",
		}),
		backgroundImage: f.text({
			label: "Background image URL",
			group: "Background",
			pluginControl: "media-picker",
		}),
		backgroundVideo: f.text({
			label: "Background video URL",
			group: "Background",
			pluginControl: "media-picker",
		}),
		backgroundSize: f.select(["cover", "contain", "auto"], {
			label: "Background size",
			default: "cover",
			group: "Background",
		}),
		backgroundPosition: f.select(["center", "top", "bottom", "left", "right"], {
			label: "Background position",
			default: "center",
			group: "Background",
		}),
		overlay: f.boolean({
			label: "Enable overlay",
			default: false,
			group: "Overlay",
		}),
		overlayColor: colorOrGradientField({
			label: "Overlay color",
			group: "Overlay",
			default: { solid: "#000000", alpha: 0.4 },
		}),
		blur: f.select(["none", "sm", "md", "lg"], {
			label: "Backdrop blur",
			default: "none",
			group: "Effects",
		}),
		opacity: f.number({ label: "Opacity (0–1)", default: 1, group: "Effects" }),
		fullWidth: f.boolean({
			label: "Full width",
			default: true,
			group: "Layout",
		}),
		minHeight: sizeField({
			label: "Min height",
			group: "Layout",
			allowAuto: true,
			units: [
				{ unit: "px", min: 0, max: 1200, step: 10 },
				{ unit: "vh", min: 0, max: 100, step: 1 },
				{ unit: "%", min: 0, max: 100, step: 1 },
			],
		}),
		padding: spacingField({
			label: "Padding",
			group: "Layout",
			scale: SECTION_SPACING,
			default: { top: "lg", bottom: "lg" },
		}),
		margin: spacingField({
			label: "Margin",
			group: "Layout",
			scale: SECTION_SPACING,
		}),
		alignItems: f.select(["flex-start", "center", "flex-end", "stretch"], {
			label: "Align horizontal",
			default: "flex-start",
			responsive: true,
			group: "Layout",
		}),
		justifyContent: f.select(
			["flex-start", "center", "flex-end", "space-between", "space-around"],
			{
				label: "Align vertical",
				default: "flex-start",
				responsive: true,
				group: "Layout",
			},
		),
		borderWidth: f.select(["0", "1", "2", "4"], {
			label: "Border width",
			default: "0",
			group: "Border",
		}),
		borderColor: borderColorField({ group: "Border" }),
		borderRadius: border.borderRadius,
		shadow: border.shadow,
	},
});
