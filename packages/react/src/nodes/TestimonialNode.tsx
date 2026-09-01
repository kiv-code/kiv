import {
	RADIUS,
	renderStars,
	resolveIcon,
	SHADOW,
	SPACING,
} from "@kivcode/nodes";
import { useContext, useMemo } from "react";
import { KivMediaContext } from "../media";
import type { KivNodeComponentProps } from "../node-props";

export interface TestimonialNodeProps extends KivNodeComponentProps {
	quote?: string;
	authorName?: string;
	authorRole?: string;
	avatar?: string;
	rating?: number;
	layout?: string;
	quoteMarkStyle?: string;
}

export function TestimonialNode({
	quote,
	authorName,
	authorRole,
	avatar,
	rating,
	layout,
	quoteMarkStyle,
	id,
	style,
	...rest
}: TestimonialNodeProps) {
	const media = useContext(KivMediaContext);
	const resolvedAvatar = media?.resolve(avatar ?? "", {}) ?? avatar ?? "";

	const isCard = (layout ?? "card") === "card";
	const isCentered = layout === "centered";

	const starsHtml = rating ? renderStars(rating) : "";
	const quoteIconSvg =
		(quoteMarkStyle ?? "icon") === "icon" ? resolveIcon("lucide:quote") : null;

	const wrapperStyle = useMemo(
		() => ({
			display: "flex" as const,
			flexDirection: isCentered ? ("column" as const) : ("row" as const),
			alignItems: isCentered ? ("center" as const) : ("flex-start" as const),
			textAlign: isCentered ? ("center" as const) : ("left" as const),
			gap: SPACING.md ?? "16px",
			padding: isCard ? (SPACING.lg ?? "32px") : undefined,
			borderRadius: isCard ? (RADIUS.lg ?? "16px") : undefined,
			boxShadow: isCard ? (SHADOW.md ?? "none") : undefined,
			background: isCard ? "#ffffff" : undefined,
			...style,
		}),
		[isCentered, isCard, style],
	);

	return (
		<figure id={id} style={wrapperStyle} data-kiv-type="testimonial" {...rest}>
			{quoteIconSvg ? (
				<span
					className="kiv-testimonial__quote-icon"
					style={{
						display: "inline-block",
						width: "28px",
						color: "#c7d2fe",
						marginBottom: "8px",
					}}
					// biome-ignore lint/security/noDangerouslySetInnerHtml: resolved icon markup, same trust boundary as the Vue renderer's v-html
					dangerouslySetInnerHTML={{ __html: quoteIconSvg }}
				/>
			) : quoteMarkStyle === "large-glyph" ? (
				<span
					className="kiv-testimonial__quote-glyph"
					style={{
						display: "block",
						fontSize: "48px",
						lineHeight: "1",
						color: "#c7d2fe",
						fontFamily: "Georgia, serif",
					}}
				>
					&ldquo;
				</span>
			) : null}
			<div className="kiv-testimonial__body">
				<p
					style={{ margin: "0 0 12px 0", fontSize: "17px", lineHeight: "1.5" }}
				>
					{quote}
				</p>
				{rating ? (
					<div
						style={{ marginBottom: "12px" }}
						// biome-ignore lint/security/noDangerouslySetInnerHtml: generated star markup, same trust boundary as the Vue renderer's v-html
						dangerouslySetInnerHTML={{ __html: starsHtml }}
					/>
				) : null}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "12px",
						justifyContent: isCentered ? "center" : "flex-start",
					}}
				>
					{avatar && (
						<img
							src={resolvedAvatar}
							alt={authorName ?? ""}
							style={{
								width: "48px",
								height: "48px",
								borderRadius: "9999px",
								objectFit: "cover",
								flexShrink: 0,
							}}
						/>
					)}
					<div style={{ display: "flex", flexDirection: "column" }}>
						<span style={{ fontWeight: 700 }}>{authorName}</span>
						<span style={{ fontSize: "13px", color: "#64748b" }}>
							{authorRole}
						</span>
					</div>
				</div>
			</div>
		</figure>
	);
}
