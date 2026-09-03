import { defineNode, f } from "@kivcode/engine";
import { hoverEffectClass, hoverGlowStyle } from "../hover-effects";
import { hoverFields } from "../hover-field";
import { escapeHtml, normalizeSvgIconSize, styleToString } from "../html-utils";
import { resolveIcon } from "../icons";
import { fromScale, GAP, RADIUS } from "../scales";

export interface SocialLink {
	platform: string;
	url: string;
	/** Explicit icon pick from the shared icon picker. Falls back to
	 * `PLATFORM_ICON[platform]` for links saved before this field existed. */
	icon?: string;
}

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

/**
 * The single source of truth for turning a link into an icon + accessible
 * label — shared by `toHtml` and both framework renderers so they can never
 * drift into re-implementing (and forgetting to update) this logic apart.
 */
export function resolveSocialLinkDisplay(link: SocialLink): {
	svg: string | null;
	label: string;
} {
	const iconSource = link.icon || PLATFORM_ICON[link.platform.toLowerCase()];
	const svg = iconSource ? resolveIcon(iconSource) : null;
	const colonIdx = iconSource?.indexOf(":") ?? -1;
	const derivedName = iconSource
		? colonIdx > 0
			? iconSource.slice(colonIdx + 1)
			: iconSource
		: "";
	const label = link.platform || derivedName || "Social link";
	return { svg, label };
}

/** Leniently parses the links JSON text field — invalid/empty input never throws, it just renders nothing. */
export function parseSocialLinks(raw: unknown): SocialLink[] {
	if (typeof raw !== "string" || !raw.trim()) return [];
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter(
			(item): item is SocialLink =>
				!!item &&
				typeof item === "object" &&
				typeof item.platform === "string" &&
				typeof item.url === "string",
		);
	} catch {
		return [];
	}
}

const SHAPE_RADIUS: Record<string, string> = {
	none: "0",
	circle: RADIUS.full ?? "9999px",
	square: "0",
	rounded: RADIUS.md ?? "8px",
};

const hover = hoverFields({
	effects: ["none", "lift", "grow", "glow"],
	defaultEffect: "lift",
});

export const socialIconsNode = defineNode({
	type: "social-icons",
	category: "content",
	label: "Social Icons",
	icon: "share-2",
	toHtml(props) {
		const links = parseSocialLinks(props.links);
		const size = Number(props.size ?? 20);
		const shape = String(props.shape ?? "circle");
		const color = String(props.color ?? "#000000");
		const backgroundColor = String(props.backgroundColor ?? "transparent");
		const hoverClass = hoverEffectClass(props.hoverEffect);
		const wrapperStyle = styleToString({
			display: "flex",
			alignItems: "center",
			gap: fromScale(GAP, props.gap ?? "sm", "8px"),
		});
		const itemsHtml = links
			.map((link) => {
				const { svg, label } = resolveSocialLinkDisplay(link);
				const iconHtml = svg
					? normalizeSvgIconSize(svg)
					: `<span aria-hidden="true">${escapeHtml(label.slice(0, 1).toUpperCase())}</span>`;
				const itemStyle = styleToString({
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					width: `${size * 2}px`,
					height: `${size * 2}px`,
					fontSize: `${size}px`,
					color,
					background: backgroundColor,
					borderRadius: SHAPE_RADIUS[shape] ?? "0",
					...hoverGlowStyle(props.hoverGlowColor),
				});
				const classAttr = hoverClass ? ` class="${hoverClass}"` : "";
				return `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(label)}" style="${itemStyle}"${classAttr}>${iconHtml}</a>`;
			})
			.join("");
		return `<div style="${wrapperStyle}" data-kiv-type="social-icons">${itemsHtml}</div>`;
	},
	fields: {
		links: f.text({
			label: "Links",
			default: "[]",
			hint: "Pick an icon and paste the profile URL for each link.",
			group: "Content",
			pluginControl: "social-links-editor",
		}),
		size: f.number({ label: "Icon Size", default: 20, group: "Style" }),
		gap: f.select(["xs", "sm", "md", "lg"], {
			label: "Gap",
			default: "sm",
			group: "Style",
		}),
		shape: f.select(["none", "circle", "square", "rounded"], {
			label: "Background Shape",
			default: "circle",
			group: "Style",
		}),
		color: f.color({ label: "Icon Color", default: "#000000", group: "Style" }),
		backgroundColor: f.color({
			label: "Background Color",
			default: "transparent",
			group: "Style",
		}),
		hoverEffect: hover.hoverEffect,
		hoverGlowColor: hover.hoverGlowColor,
	},
});
