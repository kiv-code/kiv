import {
	BUTTON_RADIUS,
	BUTTON_SIZE,
	BUTTON_VARIANT,
	resolveLinkTypographyStyle,
} from "@kivcode/nodes";
import { useMemo } from "react";
import { useKivLink } from "../hooks/useKivLink";
import type { KivNodeComponentProps } from "../node-props";

export interface LinkNodeProps extends KivNodeComponentProps {
	text?: string;
	href?: string;
	linkType?: string;
	/** Pre-`linkType` documents; read by resolveLink for back-compat. */
	target?: string;
	display?: string;
	variant?: string;
	size?: string;
	buttonRadius?: string;
	fontFamily?: string;
	color?: string;
	underline?: boolean;
	weight?: string;
	fontSize?: number;
}

export function LinkNode({
	text,
	href,
	linkType,
	target,
	display,
	variant,
	size,
	buttonRadius,
	fontFamily,
	color,
	underline,
	weight,
	fontSize,
	slots,
	id,
	style,
	...rest
}: LinkNodeProps) {
	const isButton = display === "button";

	const typoStyle = resolveLinkTypographyStyle({
		fontFamily,
		fontSize,
		weight,
		color,
	});

	const linkStyle = useMemo(() => {
		if (isButton) {
			const v = BUTTON_VARIANT[variant ?? "primary"] ?? {
				background: "#6366f1",
				color: "#ffffff",
				border: "2px solid transparent",
			};
			const s = BUTTON_SIZE[size ?? "md"] ?? {
				padding: "9px 20px",
				fontSize: "14px",
			};
			return {
				display: "inline-block" as const,
				padding: s.padding,
				fontSize: s.fontSize,
				fontWeight: "600" as const,
				fontFamily: "inherit",
				textAlign: "center" as const,
				textDecoration: v.textDecoration ?? "none",
				borderRadius: BUTTON_RADIUS[buttonRadius ?? "md"] ?? "6px",
				lineHeight: "1",
				whiteSpace: "nowrap" as const,
				background: v.background,
				color: v.color,
				border: v.border,
				...style,
			};
		}
		return {
			color: typoStyle.color,
			textDecoration: underline !== false ? "underline" : "none",
			fontWeight: typoStyle.fontWeight,
			fontSize: typoStyle.fontSize,
			fontFamily: typoStyle.fontFamily,
			...style,
		};
	}, [isButton, variant, size, buttonRadius, typoStyle, underline, style]);

	// Same shared link behaviour as Button — this component used to pick the
	// router off `target` alone, which handed anchors and absolute external
	// URLs to the router as if they were app routes.
	const {
		tag: Tag,
		attrs: linkAttrs,
		onClick,
	} = useKivLink({ href, linkType, target });

	return (
		<Tag
			id={id}
			style={linkStyle}
			data-kiv-type="link"
			onClick={onClick}
			{...linkAttrs}
			{...rest}
		>
			{slots?.default ?? text ?? "Link"}
		</Tag>
	);
}
