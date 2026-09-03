import {
	BUTTON_RADIUS,
	BUTTON_SIZE,
	BUTTON_VARIANT,
	type ButtonSizeStyle,
	type ButtonVariantStyle,
	hoverEffectClass,
	hoverGlowStyle,
	resolveBackgroundPaint,
	resolveButtonTypographyStyle,
	resolveIcon,
	resolveSolidColor,
	resolveSpacingStyle,
	resolveTextPaintStyle,
} from "@kivcode/nodes";
import { useMemo } from "react";
import { useKivLink } from "../hooks/useKivLink";
import type { KivNodeComponentProps } from "../node-props";

const DEFAULT_SIZE: ButtonSizeStyle = { padding: "9px 20px", fontSize: "14px" };
const DEFAULT_VARIANT: ButtonVariantStyle = {
	background: "#6366f1",
	color: "#ffffff",
	border: "2px solid transparent",
};

export interface ButtonNodeProps extends KivNodeComponentProps {
	label?: string;
	icon?: string;
	iconSize?: number;
	iconColor?: string;
	iconPosition?: string;
	href?: string;
	linkType?: string;
	/** Pre-`linkType` documents; read by resolveLink for back-compat. */
	target?: string;
	variant?: string;
	size?: string;
	fullWidth?: boolean;
	align?: string;
	borderRadius?: string;
	fontFamily?: string;
	fontWeight?: string;
	background?: unknown;
	textColor?: unknown;
	paddingBox?: unknown;
	customBorderColor?: string;
	hoverEffect?: string;
	hoverGlowColor?: string;
}

export function ButtonNode({
	label,
	icon,
	iconSize,
	iconColor,
	iconPosition,
	href,
	linkType,
	target,
	variant,
	size,
	fullWidth,
	align,
	borderRadius,
	fontFamily,
	fontWeight,
	background,
	textColor,
	paddingBox,
	customBorderColor,
	hoverEffect,
	hoverGlowColor,
	id,
	style,
	...rest
}: ButtonNodeProps) {
	// Link behaviour (router selection, anchor scroll, bus emit, editor guard)
	// lives in one shared hook so every clickable node behaves the same.
	const {
		tag: Tag,
		attrs: linkAttrs,
		onClick,
		isEditorMode,
	} = useKivLink(
		{ href, linkType, target },
		{
			event: "button.clicked",
			payload: () => ({ nodeId: id, label, href }),
		},
	);

	const sizing = BUTTON_SIZE[size ?? "md"] ?? DEFAULT_SIZE;
	const variantStyle = BUTTON_VARIANT[variant ?? "primary"] ?? DEFAULT_VARIANT;

	const hasIcon = !!icon?.trim();
	const resolvedSvg = resolveIcon(icon ?? "");
	const iconSizePx = iconSize ?? 16;
	const iconIsSvg = (icon?.trim().startsWith("<") ?? false) || !!resolvedSvg;
	const iconContent = resolvedSvg || (icon?.trim().startsWith("<") ? icon : "");
	const iconClass = iconIsSvg ? "" : (icon ?? "");
	const iconOnRight = iconPosition === "right";

	// Per-button escape hatch, shared across every node with solid-or-gradient
	// paint (see packages/nodes/src/color-gradient.ts). Empty solid → inherit
	// variant/theme.
	const bgFinal = resolveBackgroundPaint(background, variantStyle.background);
	// Plain solid fallback for icon inheritance — a gradient text fill only
	// applies to the label span (see labelStyle) via background-clip, which
	// would conflict with the button's own background if applied here.
	const colorFinal = resolveSolidColor(textColor, variantStyle.color);
	const labelStyle = resolveTextPaintStyle(textColor, variantStyle.color);
	const borderFinal = customBorderColor
		? `2px solid ${customBorderColor}`
		: variantStyle.border;
	const hoverClass = hoverEffectClass(hoverEffect);

	// Per-side escape hatch, shared across every node that needs it (see
	// packages/nodes/src/spacing-field.ts). Empty side falls back to the size
	// preset's padding shorthand ("Ypx Xpx").
	const paddingFallback = useMemo(() => {
		if (variantStyle.textDecoration)
			return { top: "0", right: "0", bottom: "0", left: "0" };
		const [y, x] = sizing.padding.split(" ");
		return { top: y, right: x, bottom: y, left: x };
	}, [variantStyle.textDecoration, sizing.padding]);
	const paddingFinal = resolveSpacingStyle(
		"padding",
		paddingBox,
		paddingFallback,
	);

	const buttonStyle = useMemo(
		() => ({
			// Flex when there's an icon so icon + label align with a gap.
			display: hasIcon
				? fullWidth
					? "flex"
					: "inline-flex"
				: fullWidth
					? "block"
					: "inline-block",
			alignItems: hasIcon ? ("center" as const) : undefined,
			justifyContent: hasIcon ? ("center" as const) : undefined,
			gap: hasIcon ? "0.5em" : undefined,
			width: fullWidth ? "100%" : undefined,
			...paddingFinal,
			fontSize: sizing.fontSize,
			...resolveButtonTypographyStyle({ fontFamily, fontWeight }),
			textAlign: (align ?? "center") as "left" | "center" | "right",
			borderRadius: BUTTON_RADIUS[borderRadius ?? "md"] ?? "6px",
			textDecoration: variantStyle.textDecoration ?? "none",
			cursor: isEditorMode ? "default" : "pointer",
			// Broad on purpose: inline styles always win over the .kiv-hover-*
			// class's own `transition`, so this has to cover every property a
			// hover preset might animate, or the preset's :hover state would
			// snap instead of ease.
			transition:
				"opacity 0.15s, background 0.15s, transform 0.18s ease, box-shadow 0.18s ease, filter 0.25s ease",
			lineHeight: "1",
			whiteSpace: "nowrap" as const,
			background: bgFinal,
			// Default background-origin is padding-box: with a 2px transparent
			// border, the gradient gets sized to the smaller padding-box area
			// and then tiles (default background-repeat) to fill the extra
			// border-box strip — a visible seam right at the edges. border-box
			// makes the gradient size to (and paint under) the border directly.
			backgroundOrigin: "border-box" as const,
			color: colorFinal,
			border: borderFinal,
			...hoverGlowStyle(hoverGlowColor),
			...style,
		}),
		[
			hasIcon,
			fullWidth,
			paddingFinal,
			sizing.fontSize,
			fontFamily,
			fontWeight,
			align,
			borderRadius,
			variantStyle.textDecoration,
			isEditorMode,
			bgFinal,
			colorFinal,
			borderFinal,
			hoverGlowColor,
			style,
		],
	);

	const iconEl = hasIcon ? (
		iconIsSvg ? (
			<span
				className="kiv-btn-icon"
				style={{
					fontSize: `${iconSizePx}px`,
					color: iconColor || undefined,
					display: "inline-flex",
					alignItems: "center",
					lineHeight: 0,
				}}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: resolved icon markup, same trust boundary as the Vue renderer's v-html
				dangerouslySetInnerHTML={{ __html: iconContent }}
			/>
		) : (
			<i
				className={`kiv-btn-icon ${iconClass}`}
				style={{ fontSize: `${iconSizePx}px`, color: iconColor || undefined }}
				aria-hidden="true"
			/>
		)
	) : null;

	const children = (
		<>
			{hasIcon && !iconOnRight && iconEl}
			{label && <span style={labelStyle}>{label}</span>}
			{hasIcon && iconOnRight && iconEl}
		</>
	);

	return (
		<Tag
			id={id}
			className={hoverClass}
			style={buttonStyle}
			data-kiv-type="button"
			onClick={onClick}
			{...linkAttrs}
			{...rest}
		>
			{children}
		</Tag>
	);
}
