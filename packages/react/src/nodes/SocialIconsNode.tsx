import {
	GAP,
	hoverEffectClass,
	hoverGlowStyle,
	parseSocialLinks,
	RADIUS,
	resolveIcon,
} from "@kivcode/nodes";
import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

const PLATFORM_ICON: Record<string, string> = {
	twitter: "fa6-brands:x-twitter",
	x: "fa6-brands:x-twitter",
	facebook: "fa6-brands:facebook",
	instagram: "fa6-brands:instagram",
	linkedin: "fa6-brands:linkedin",
	youtube: "fa6-brands:youtube",
	github: "fa6-brands:github",
	tiktok: "fa6-brands:tiktok",
	whatsapp: "fa6-brands:whatsapp",
	email: "fa6-regular:envelope",
};

const SHAPE_RADIUS: Record<string, string> = {
	none: "0",
	circle: RADIUS.full ?? "9999px",
	square: "0",
	rounded: RADIUS.md ?? "8px",
};

function iconSvg(platform: string): string | null {
	const name = PLATFORM_ICON[platform.toLowerCase()];
	return name ? resolveIcon(name) : null;
}

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
	const socialLinks = useMemo(() => parseSocialLinks(links), [links]);
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
			{socialLinks.map((link, i) => {
				const svg = iconSvg(link.platform);
				return (
					<a
						// biome-ignore lint/suspicious/noArrayIndexKey: links have no stable identity, mirrors the Vue original's `${platform}-${i}` key
						key={`${link.platform}-${i}`}
						href={link.url}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={link.platform}
						className={hoverClass}
						style={itemStyle}
					>
						{svg ? (
							<span
								className="kiv-social-icons__svg"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: resolved icon markup, same trust boundary as the Vue renderer's v-html
								dangerouslySetInnerHTML={{ __html: svg }}
							/>
						) : (
							<span aria-hidden="true">
								{link.platform.slice(0, 1).toUpperCase()}
							</span>
						)}
					</a>
				);
			})}
		</div>
	);
}
