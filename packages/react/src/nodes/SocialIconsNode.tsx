import {
	GAP,
	hoverEffectClass,
	hoverGlowStyle,
	parseSocialLinks,
	RADIUS,
	resolveSocialLinkDisplay,
} from "@kivcode/nodes";
import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

const SHAPE_RADIUS: Record<string, string> = {
	none: "0",
	circle: RADIUS.full ?? "9999px",
	square: "0",
	rounded: RADIUS.md ?? "8px",
};

export interface SocialIconsNodeProps extends KivNodeComponentProps {
	links?: string;
	size?: number;
	gap?: string;
	shape?: string;
	color?: string;
	backgroundColor?: string;
	hoverEffect?: string;
	hoverGlowColor?: string;
}

export function SocialIconsNode({
	links,
	size,
	gap,
	shape,
	color,
	backgroundColor,
	hoverEffect,
	hoverGlowColor,
	id,
	style,
	...rest
}: SocialIconsNodeProps) {
	const socialLinks = useMemo(
		() =>
			parseSocialLinks(links).map((link) => ({
				...link,
				...resolveSocialLinkDisplay(link),
			})),
		[links],
	);
	const hoverClass = hoverEffectClass(hoverEffect);

	const wrapperStyle = useMemo(
		() => ({
			display: "flex" as const,
			alignItems: "center" as const,
			gap: GAP[gap ?? "sm"] ?? "8px",
			...style,
		}),
		[gap, style],
	);

	const itemStyle = useMemo(() => {
		const px = size ?? 20;
		return {
			display: "inline-flex" as const,
			alignItems: "center" as const,
			justifyContent: "center" as const,
			width: `${px * 2}px`,
			height: `${px * 2}px`,
			fontSize: `${px}px`,
			color: color ?? "#000000",
			background: backgroundColor ?? "transparent",
			borderRadius: SHAPE_RADIUS[shape ?? "circle"] ?? "0",
			...hoverGlowStyle(hoverGlowColor),
		};
	}, [size, color, backgroundColor, shape, hoverGlowColor]);

	return (
		<div id={id} style={wrapperStyle} data-kiv-type="social-icons" {...rest}>
			{socialLinks.map((link, i) => (
				<a
					// biome-ignore lint/suspicious/noArrayIndexKey: links have no stable identity, mirrors the Vue original's `${platform}-${i}` key
					key={`${link.platform}-${i}`}
					href={link.url}
					target="_blank"
					rel="noopener noreferrer"
					aria-label={link.label}
					className={hoverClass}
					style={itemStyle}
				>
					{link.svg ? (
						<span
							className="kiv-social-icons__svg"
							// biome-ignore lint/security/noDangerouslySetInnerHtml: resolved icon markup, same trust boundary as the Vue renderer's v-html
							dangerouslySetInnerHTML={{ __html: link.svg }}
						/>
					) : (
						<span aria-hidden="true">
							{link.label.slice(0, 1).toUpperCase()}
						</span>
					)}
				</a>
			))}
		</div>
	);
}
