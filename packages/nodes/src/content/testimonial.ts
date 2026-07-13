import { defineNode, f } from "@kivcode/engine";
import { escapeHtml, normalizeSvgIconSize, styleToString } from "../html-utils";
import { resolveIcon } from "../icons";
import { RADIUS, SHADOW, SPACING } from "../scales";

const STAR_FILLED =
	'<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2.5l3.09 6.26 6.91 1-5 4.87 1.18 6.88L12 18.27l-6.18 3.24L7 14.63l-5-4.87 6.91-1L12 2.5Z"/></svg>';
const STAR_EMPTY =
	'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2.5l3.09 6.26 6.91 1-5 4.87 1.18 6.88L12 18.27l-6.18 3.24L7 14.63l-5-4.87 6.91-1L12 2.5Z"/></svg>';

/** Renders 0-5 stars as inline SVGs. Generated markup only (no user input), safe to inject directly. */
export function renderStars(rating: number): string {
	const clamped = Math.max(0, Math.min(5, Math.round(rating)));
	const stars = Array.from({ length: 5 }, (_, i) =>
		i < clamped ? STAR_FILLED : STAR_EMPTY,
	);
	return `<span style="display:inline-flex;gap:2px;color:#f59e0b;">${stars.join("")}</span>`;
}

function quoteMarkHtml(style: string): string {
	if (style === "icon") {
		const svg = resolveIcon("lucide:quote");
		return svg
			? `<span style="display:inline-block;width:28px;color:#c7d2fe;margin-bottom:8px;">${normalizeSvgIconSize(svg)}</span>`
			: "";
	}
	if (style === "large-glyph") {
		return '<span style="display:block;font-size:48px;line-height:1;color:#c7d2fe;font-family:Georgia,serif;">&ldquo;</span>';
	}
	return "";
}

export const testimonialNode = defineNode({
	type: "testimonial",
	category: "content",
	label: "Testimonial",
	icon: "quote",
	toHtml(props) {
		const layout = String(props.layout ?? "card");
		const rating = Number(props.rating ?? 0);
		const isCard = layout === "card";
		const isCentered = layout === "centered";

		const wrapperStyle = styleToString({
			display: "flex",
			flexDirection: isCentered ? "column" : "row",
			alignItems: isCentered ? "center" : "flex-start",
			textAlign: isCentered ? "center" : "left",
			gap: SPACING.md,
			padding: isCard ? SPACING.lg : undefined,
			borderRadius: isCard ? RADIUS.lg : undefined,
			boxShadow: isCard ? SHADOW.md : undefined,
			background: isCard ? "#ffffff" : undefined,
		});

		const avatarSrc = escapeHtml(props.avatar ?? "");
		const avatarHtml = props.avatar
			? `<img src="${avatarSrc}" alt="${escapeHtml(props.authorName ?? "")}" style="${styleToString({ width: "48px", height: "48px", borderRadius: RADIUS.full, objectFit: "cover", flexShrink: "0" })}" />`
			: "";

		const authorHtml = `<div style="${styleToString({ display: "flex", flexDirection: "column" })}"><span style="${styleToString({ fontWeight: "700" })}">${escapeHtml(props.authorName ?? "")}</span><span style="${styleToString({ fontSize: "13px", color: "#64748b" })}">${escapeHtml(props.authorRole ?? "")}</span></div>`;

		const authorRowStyle = styleToString({
			display: "flex",
			alignItems: "center",
			gap: SPACING.sm,
			justifyContent: isCentered ? "center" : "flex-start",
		});

		const body = `${quoteMarkHtml(String(props.quoteMarkStyle ?? "icon"))}<p style="${styleToString({ margin: "0 0 12px 0", fontSize: "17px", lineHeight: "1.5" })}">${escapeHtml(props.quote ?? "")}</p>${rating > 0 ? `<div style="margin-bottom:12px;">${renderStars(rating)}</div>` : ""}<div style="${authorRowStyle}">${avatarHtml}${authorHtml}</div>`;

		return `<figure style="${wrapperStyle}" data-kiv-type="testimonial">${isCentered ? `<div>${body}</div>` : body}</figure>`;
	},
	fields: {
		quote: f.textarea({ label: "Quote", localizable: true, group: "Content" }),
		authorName: f.text({
			label: "Author Name",
			localizable: true,
			group: "Content",
		}),
		authorRole: f.text({
			label: "Author Role / Company",
			localizable: true,
			group: "Content",
		}),
		avatar: f.text({
			label: "Avatar Image",
			group: "Content",
			pluginControl: "media-picker",
		}),
		rating: f.number({
			label: "Star Rating (0-5, 0 = hidden)",
			default: 0,
			group: "Content",
		}),
		layout: f.select(["card", "minimal", "centered"], {
			label: "Layout",
			default: "card",
			group: "Style",
		}),
		quoteMarkStyle: f.select(["none", "icon", "large-glyph"], {
			label: "Quote Mark",
			default: "icon",
			group: "Style",
		}),
	},
});
