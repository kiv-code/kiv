import { BUTTON_RADIUS, BUTTON_SIZE, BUTTON_VARIANT } from "@kivcode/nodes";
import { useContext, useMemo } from "react";
import { KivLinkContext } from "../link";
import type { KivNodeComponentProps } from "../node-props";

export interface LinkNodeProps extends KivNodeComponentProps {
	text?: string;
	href?: string;
	target?: string;
	display?: string;
	variant?: string;
	size?: string;
	buttonRadius?: string;
	textColor?: string;
	underline?: boolean;
	fontWeight?: string;
	fontSize?: string;
}

export function LinkNode({
	text,
	href,
	target,
	display,
	variant,
	size,
	buttonRadius,
	textColor,
	underline,
	fontWeight,
	fontSize,
	slots,
	id,
	style,
	...rest
}: LinkNodeProps) {
	const isButton = display === "button";

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
			color: textColor ?? "#6366f1",
			textDecoration: underline !== false ? "underline" : "none",
			fontWeight: fontWeight ?? "500",
			fontSize: fontSize ?? "inherit",
			...style,
		};
	}, [
		isButton,
		variant,
		size,
		buttonRadius,
		textColor,
		underline,
		fontWeight,
		fontSize,
		style,
	]);

	// Next.js consumers pass their `Link` via KivRenderer's `linkComponent`
	// prop; that's what powers client-side navigation for non-`_blank`
	// links. Everything else falls back to a plain <a>.
	const RouterLinkLike = useContext(KivLinkContext);
	const useRouterLink = target !== "_blank" && !!RouterLinkLike;

	if (useRouterLink && RouterLinkLike) {
		return (
			<RouterLinkLike
				id={id}
				href={href ?? "/"}
				style={linkStyle}
				data-kiv-type="link"
				{...rest}
			>
				{slots?.default ?? text ?? "Link"}
			</RouterLinkLike>
		);
	}

	return (
		<a
			id={id}
			href={href ?? "#"}
			target={target ?? "_self"}
			rel={target === "_blank" ? "noopener noreferrer" : undefined}
			style={linkStyle}
			data-kiv-type="link"
			{...rest}
		>
			{slots?.default ?? text ?? "Link"}
		</a>
	);
}
