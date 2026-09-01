import {
	BLUR,
	RADIUS,
	resolveBackgroundPaint,
	resolveSolidColor,
	resolveSpacingStyle,
	SECTION_SPACING,
	SHADOW,
} from "@kivcode/nodes";
import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

function isGradient(value: unknown): boolean {
	return (
		!!value &&
		typeof value === "object" &&
		(value as { type?: string }).type === "gradient"
	);
}

export interface SectionNodeProps extends KivNodeComponentProps {
	background?: unknown;
	backgroundImage?: string;
	backgroundVideo?: string;
	backgroundSize?: string;
	backgroundPosition?: string;
	overlay?: boolean;
	overlayColor?: unknown;
	blur?: string;
	opacity?: number;
	paddingY?: string;
	paddingX?: string;
	paddingBox?: unknown;
	marginY?: string;
	marginBox?: unknown;
	borderWidth?: string;
	borderColor?: string;
	borderRadius?: string;
	shadow?: string;
	fullWidth?: boolean;
	minHeight?: string;
	alignItems?: string;
	justifyContent?: string;
}

export function SectionNode({
	background,
	backgroundImage,
	backgroundVideo,
	backgroundSize,
	backgroundPosition,
	overlay,
	overlayColor,
	blur,
	opacity,
	paddingY,
	paddingX,
	paddingBox,
	marginY,
	marginBox,
	borderWidth,
	borderColor,
	borderRadius,
	shadow,
	minHeight,
	alignItems,
	justifyContent,
	// Declared on the schema for parity with the Vue original, which never
	// reads it either (no full-bleed-vs-contained distinction is actually
	// rendered there — the section is already 100% width unconditionally).
	fullWidth: _fullWidth,
	slots,
	id,
	style,
	...rest
}: SectionNodeProps) {
	const sectionStyle = useMemo(() => {
		const s: Record<string, string | undefined> = {};

		const solidBg = resolveSolidColor(background, "");
		if (solidBg) s.backgroundColor = solidBg;
		if (backgroundImage) {
			s.backgroundImage = `url(${backgroundImage})`;
			s.backgroundSize = backgroundSize ?? "cover";
			s.backgroundPosition = backgroundPosition ?? "center";
		}
		// Gradient wins over an image background, matching the previous
		// (pre-migration) precedence of the standalone "gradient" field.
		if (isGradient(background)) {
			s.backgroundImage = resolveBackgroundPaint(background, "");
			// Default background-origin is padding-box: paired with a border
			// (borderWidth > 0), the gradient sizes to the smaller padding-box
			// area then tiles to fill the border strip, leaving a visible seam.
			s.backgroundOrigin = "border-box";
		}
		if (opacity !== undefined && opacity !== 1) {
			s.opacity = String(opacity);
		}
		const py =
			paddingY && paddingY !== "none"
				? (SECTION_SPACING[paddingY] ?? paddingY)
				: undefined;
		const px =
			paddingX && paddingX !== "none"
				? (SECTION_SPACING[paddingX] ?? paddingX)
				: undefined;
		const my =
			marginY && marginY !== "none"
				? (SECTION_SPACING[marginY] ?? marginY)
				: undefined;
		// Per-side overrides, shared with every other node that needs this
		// escape hatch (see packages/nodes/src/spacing-field.ts). Empty side
		// falls back to the Padding/Margin X/Y shorthand above.
		Object.assign(
			s,
			resolveSpacingStyle("padding", paddingBox, {
				top: py,
				right: px,
				bottom: py,
				left: px,
			}),
			resolveSpacingStyle("margin", marginBox, { top: my, bottom: my }),
		);
		if (borderWidth && borderWidth !== "0") {
			s.borderWidth = `${borderWidth}px`;
			s.borderStyle = "solid";
			if (borderColor) s.borderColor = borderColor;
		}
		if (borderRadius && borderRadius !== "none") {
			s.borderRadius = RADIUS[borderRadius] ?? borderRadius;
		}
		if (shadow && shadow !== "none") {
			s.boxShadow = SHADOW[shadow] ?? shadow;
		}
		if (minHeight) {
			s.minHeight = minHeight;
		}

		return {
			position: "relative" as const,
			width: "100%",
			display: "flex" as const,
			flexDirection: "column" as const,
			...s,
			...style,
		};
	}, [
		background,
		backgroundImage,
		backgroundSize,
		backgroundPosition,
		opacity,
		paddingY,
		paddingX,
		paddingBox,
		marginY,
		marginBox,
		borderWidth,
		borderColor,
		borderRadius,
		shadow,
		minHeight,
		style,
	]);

	const bgBlurStyle = useMemo(() => {
		const amount = BLUR[blur ?? "none"] ?? "0";
		if (amount === "0") return null;
		return {
			position: "absolute" as const,
			inset: "0",
			backdropFilter: `blur(${amount})`,
			pointerEvents: "none" as const,
			zIndex: "0",
		};
	}, [blur]);

	const contentStyle = useMemo(
		() => ({
			position: "relative" as const,
			zIndex: 1,
			display: "flex" as const,
			flexDirection: "column" as const,
			width: "100%",
			flex: 1,
			alignItems:
				alignItems && alignItems !== "flex-start" ? alignItems : undefined,
			justifyContent:
				justifyContent && justifyContent !== "flex-start"
					? justifyContent
					: undefined,
		}),
		[alignItems, justifyContent],
	);

	return (
		<section id={id} style={sectionStyle} data-kiv-type="section" {...rest}>
			{backgroundVideo && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						overflow: "hidden",
						pointerEvents: "none",
					}}
				>
					<video
						autoPlay
						muted
						loop
						playsInline
						src={backgroundVideo}
						style={{ width: "100%", height: "100%", objectFit: "cover" }}
					/>
				</div>
			)}
			{bgBlurStyle && <div style={bgBlurStyle} />}
			{overlay && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						pointerEvents: "none",
						background: resolveBackgroundPaint(
							overlayColor,
							"rgba(0, 0, 0, 0.4)",
						),
					}}
				/>
			)}
			<div style={contentStyle}>{slots?.default}</div>
		</section>
	);
}
