import { RADIUS, resolveBackgroundPaint } from "@kivcode/nodes";
import { useContext, useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";
import { AgendaLayoutContext } from "./AgendaNode";

export interface AgendaItemNodeProps extends KivNodeComponentProps {
	time?: string;
	label?: string;
	title?: string;
	description?: string;
	location?: string;
	image?: string;
	tags?: string;
	bodyBackground?: string;
	highlight?: boolean;
	highlightColor?: string;
	stripeColor?: unknown;
	stripeTextColor?: string;
	stripeFontSize?: string;
	titleFontSize?: string;
	descriptionFontSize?: string;
	hasSpeaker?: boolean;
	speakerLabel?: string;
	speakerName?: string;
	speakerRole?: string;
	speakerAvatar?: string;
}

const avatarStyle = {
	width: "56px",
	height: "56px",
	borderRadius: RADIUS.full,
	objectFit: "cover" as const,
	flexShrink: 0,
	background: "#e2e8f0",
};

export function AgendaItemNode({
	time,
	label,
	title,
	description,
	location,
	image,
	tags,
	bodyBackground,
	highlight,
	highlightColor,
	stripeColor,
	stripeTextColor,
	stripeFontSize,
	titleFontSize,
	descriptionFontSize,
	hasSpeaker,
	speakerLabel,
	speakerName,
	speakerRole,
	speakerAvatar,
	slots,
	id,
	style,
	...rest
}: AgendaItemNodeProps) {
	const layout = useContext(AgendaLayoutContext);
	const isStripe = layout === "stripe" || layout === "timeline";
	const isCard = layout === "card";
	const isCompact = layout === "compact";

	const wrapStyle = useMemo(
		() => ({
			...(highlight
				? { borderLeft: `4px solid ${highlightColor || "#6366f1"}` }
				: {}),
			...style,
		}),
		[highlight, highlightColor, style],
	);

	const stripePaintStyle = useMemo(
		() => ({
			background: resolveBackgroundPaint(stripeColor, "#e2e8f0"),
			color: stripeTextColor || "#0f172a",
			fontSize: stripeFontSize || undefined,
		}),
		[stripeColor, stripeTextColor, stripeFontSize],
	);
	const compactTimePaintStyle = useMemo(
		() => ({
			color: resolveBackgroundPaint(stripeColor, "#6366f1"),
			fontSize: stripeFontSize || undefined,
		}),
		[stripeColor, stripeFontSize],
	);
	const bodyPaintStyle = useMemo(
		() => ({
			background: bodyBackground || "var(--kiv-agenda-body-bg, #eceefb)",
		}),
		[bodyBackground],
	);
	const titlePaintStyle = useMemo(
		() => ({ fontSize: titleFontSize || undefined }),
		[titleFontSize],
	);
	const descriptionPaintStyle = useMemo(
		() => ({ fontSize: descriptionFontSize || undefined }),
		[descriptionFontSize],
	);

	const tagsList = useMemo(() => {
		if (!tags) return [];
		return tags
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean);
	}, [tags]);

	const className = [
		"kiv-agenda-item",
		isStripe && "kiv-agenda-item--stripe",
		isCard && "kiv-agenda-item--card",
		isCompact && "kiv-agenda-item--compact",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div className="kiv-agenda-item__container" id={id} {...rest}>
			<article
				data-kiv-type="agenda-item"
				className={className}
				style={wrapStyle}
			>
				{isCard && image && (
					<img
						src={image}
						alt={title}
						style={{ width: "100%", height: "160px", objectFit: "cover" }}
					/>
				)}

				{isStripe && (
					<div className="kiv-agenda-item__stripe" style={stripePaintStyle}>
						{label ? (
							<>
								{label}
								<br />
								{time}
							</>
						) : (
							time
						)}
					</div>
				)}

				{isCompact && (
					<span
						className="kiv-agenda-item__compact-time"
						style={compactTimePaintStyle}
					>
						{label ? (
							<>
								{label}
								<br />
								{time}
							</>
						) : (
							time
						)}
					</span>
				)}

				<div
					className={`kiv-agenda-item__body${hasSpeaker ? " kiv-agenda-item__body--has-speaker" : ""}`}
					style={bodyPaintStyle}
				>
					<div className="kiv-agenda-item__main">
						{title && (
							<p className="kiv-agenda-item__title" style={titlePaintStyle}>
								{title}
							</p>
						)}
						{description && (
							<p
								className="kiv-agenda-item__desc"
								style={descriptionPaintStyle}
							>
								{description}
							</p>
						)}
						{location && !isCompact && (
							<span className="kiv-agenda-item__loc">
								<svg
									width="12"
									height="12"
									viewBox="0 0 24 24"
									fill="#ff5a3c"
									aria-hidden="true"
								>
									<path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
								</svg>
								{location}
							</span>
						)}
						{tagsList.length > 0 && (
							<div className="kiv-agenda-item__tags">
								{tagsList.map((tag) => (
									<span key={tag} className="kiv-agenda-item__tag">
										{tag}
									</span>
								))}
							</div>
						)}
						{slots?.default}
					</div>
					{hasSpeaker && (
						<div className="kiv-agenda-item__speaker">
							{speakerAvatar ? (
								<img
									src={speakerAvatar}
									alt={speakerName}
									style={avatarStyle}
								/>
							) : (
								<div style={avatarStyle} />
							)}
							<div className="kiv-agenda-item__speaker-meta">
								<span className="kiv-agenda-item__speaker-label">
									{speakerLabel || "Speaker"}
								</span>
								<span className="kiv-agenda-item__speaker-name">
									{speakerName}
								</span>
								<span className="kiv-agenda-item__speaker-role">
									{speakerRole}
								</span>
							</div>
						</div>
					)}
				</div>
			</article>
		</div>
	);
}
