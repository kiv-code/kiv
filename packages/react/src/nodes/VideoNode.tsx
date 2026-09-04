import { RADIUS, resolveShadow } from "@kivcode/nodes";
import { type ReactNode, useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface VideoNodeProps extends KivNodeComponentProps {
	src?: string;
	provider?: string;
	videoId?: string;
	poster?: string;
	caption?: string;
	noSourceText?: string;
	aspectRatio?: string;
	borderRadius?: string;
	shadow?: string;
	shadowColor?: string;
	autoplay?: boolean;
	controls?: boolean;
	loop?: boolean;
	muted?: boolean;
}

function embedUrl(provider: string, videoId: string): string {
	if (provider === "youtube") {
		return `https://www.youtube-nocookie.com/embed/${videoId}`;
	}
	if (provider === "vimeo") {
		return `https://player.vimeo.com/video/${videoId}`;
	}
	if (provider === "loom") {
		return `https://www.loom.com/embed/${videoId}`;
	}
	return "";
}

export function VideoNode({
	src,
	provider,
	videoId,
	poster,
	caption,
	noSourceText,
	aspectRatio,
	borderRadius,
	shadow,
	shadowColor,
	autoplay,
	controls,
	loop,
	muted,
	id,
	style,
	...rest
}: VideoNodeProps) {
	const isHtml5 = provider === "html5";

	const rawSrc = useMemo(() => {
		const resolvedProvider = provider ?? "youtube";
		if (resolvedProvider === "custom" || resolvedProvider === "html5")
			return src ?? "";
		return embedUrl(resolvedProvider, videoId ?? "");
	}, [provider, videoId, src]);

	const iframeSrc = useMemo(() => {
		if (isHtml5 || !rawSrc) return "";
		const params = new URLSearchParams();
		if (autoplay) params.set("autoplay", "1");
		if (loop) params.set("loop", "1");
		if (muted) params.set("mute", "1");
		if (controls !== undefined && !controls) params.set("controls", "0");
		const qs = params.toString();
		return qs ? `${rawSrc}?${qs}` : rawSrc;
	}, [isHtml5, rawSrc, autoplay, loop, muted, controls]);

	const showsControls = controls !== false;

	const containerStyle = useMemo(
		() => ({
			position: "relative" as const,
			width: "100%",
			paddingBottom: aspectRatio === "4/3" ? "75%" : "56.25%",
			height: 0,
			overflow: "hidden" as const,
			borderRadius: RADIUS[borderRadius ?? "none"] ?? "0",
			boxShadow: resolveShadow(shadow ?? "none", shadowColor || undefined),
		}),
		[aspectRatio, borderRadius, shadow, shadowColor],
	);

	const mediaStyle = {
		position: "absolute" as const,
		inset: 0,
		width: "100%",
		height: "100%",
		border: 0,
	};

	let body: ReactNode;
	if (isHtml5 && rawSrc) {
		body = (
			<div style={containerStyle} data-kiv-type="video">
				<video
					style={mediaStyle}
					controls={showsControls}
					autoPlay={autoplay}
					loop={loop}
					muted={muted}
					poster={poster || undefined}
				>
					<source src={rawSrc} />
				</video>
			</div>
		);
	} else if (iframeSrc) {
		body = (
			<div style={containerStyle} data-kiv-type="video">
				<iframe
					src={iframeSrc}
					style={mediaStyle}
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
					title="Video"
				/>
			</div>
		);
	} else {
		body = (
			<div style={containerStyle} data-kiv-type="video">
				<p style={{ padding: "1rem", textAlign: "center", color: "#999" }}>
					{noSourceText ?? "No video source configured"}
				</p>
			</div>
		);
	}

	// Vue's fallthrough attrs (id, data-kiv-node-id, draggable, onDragStart, ...)
	// land on the single template root — the <figure> — not the inner div.
	return (
		<figure id={id} style={{ margin: 0, ...style }} {...rest}>
			{body}
			{caption && (
				<figcaption
					style={{
						paddingTop: "8px",
						fontSize: "14px",
						color: "#64748b",
						textAlign: "center",
					}}
				>
					{caption}
				</figcaption>
			)}
		</figure>
	);
}
