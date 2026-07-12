import { defineNode, f } from "@kiv/engine";
import { escapeHtml, styleToString } from "../html-utils";
import { RADIUS, SHADOW } from "../scales";

function embedUrl(
	provider: string | undefined,
	videoId: string | undefined,
): string {
	if (!videoId) return "";
	if (provider === "youtube") {
		return `https://www.youtube-nocookie.com/embed/${escapeHtml(videoId)}`;
	}
	if (provider === "vimeo") {
		return `https://player.vimeo.com/video/${escapeHtml(videoId)}`;
	}
	if (provider === "loom") {
		return `https://www.loom.com/embed/${escapeHtml(videoId)}`;
	}
	return "";
}

export const videoNode = defineNode({
	type: "video",
	category: "media",
	toHtml(props) {
		const provider = String(props.provider ?? "youtube");
		const videoId = String(props.videoId ?? "");
		const isHtml5 = provider === "html5";
		const src =
			provider === "custom" || isHtml5
				? escapeHtml(props.src ?? "")
				: embedUrl(provider, videoId);

		const containerStyle = styleToString({
			position: "relative",
			width: "100%",
			paddingBottom: props.aspectRatio === "4/3" ? "75%" : "56.25%",
			height: "0",
			overflow: "hidden",
			borderRadius: RADIUS[String(props.borderRadius ?? "none")] ?? "0",
			boxShadow: SHADOW[String(props.shadow ?? "none")] ?? "none",
		});

		const mediaStyle = styleToString({
			position: "absolute",
			inset: "0",
			width: "100%",
			height: "100%",
			border: "0",
		});

		const captionText =
			props.caption !== undefined ? escapeHtml(String(props.caption)) : "";
		const captionHtml = captionText
			? `<figcaption style="padding-top:8px;font-size:14px;color:#64748b;text-align:center;">${captionText}</figcaption>`
			: "";
		const wrap = (inner: string): string =>
			captionHtml
				? `<figure style="margin:0;">${inner}${captionHtml}</figure>`
				: inner;
		const noSourceText = String(
			props.noSourceText ?? "No video source configured",
		);
		const noSource = wrap(
			`<div style="${containerStyle}" data-kiv-type="video"><p style="padding:1rem;text-align:center;color:#999;">${escapeHtml(noSourceText)}</p></div>`,
		);

		if (isHtml5) {
			if (!src) return noSource;
			const attrs = [
				props.controls === false ? "" : "controls",
				props.autoplay ? "autoplay" : "",
				props.loop ? "loop" : "",
				props.muted ? "muted" : "",
			]
				.filter(Boolean)
				.join(" ");
			const posterAttr = props.poster
				? ` poster="${escapeHtml(String(props.poster))}"`
				: "";
			return wrap(
				`<div style="${containerStyle}" data-kiv-type="video"><video style="${mediaStyle}" ${attrs}${posterAttr}><source src="${src}" /></video></div>`,
			);
		}

		const params = new URLSearchParams();
		if (props.autoplay) params.set("autoplay", "1");
		if (props.loop) params.set("loop", "1");
		if (props.muted) params.set("mute", "1");
		if (!props.controls) params.set("controls", "0");
		const queryStr = params.toString();
		const finalSrc = queryStr ? `${src}?${queryStr}` : src;

		if (!finalSrc) return noSource;

		return wrap(
			`<div style="${containerStyle}" data-kiv-type="video"><iframe src="${escapeHtml(finalSrc)}" style="${mediaStyle}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`,
		);
	},
	fields: {
		provider: f.select(["youtube", "vimeo", "html5", "loom", "custom"], {
			label: "Provider",
			default: "youtube",
			group: "Content",
		}),
		videoId: f.text({
			label: "Video ID",
			group: "Content",
			showIf: { field: "provider", equals: ["youtube", "vimeo", "loom"] },
		}),
		src: f.text({
			label: "Video URL",
			group: "Content",
			showIf: { field: "provider", equals: ["custom", "html5"] },
		}),
		poster: f.text({
			label: "Poster image",
			group: "Content",
			showIf: { field: "provider", equals: "html5" },
		}),
		caption: f.text({
			label: "Caption",
			localizable: true,
			group: "Content",
		}),
		noSourceText: f.text({
			label: "No Source Text",
			default: "No video source configured",
			localizable: true,
			group: "Content",
		}),
		aspectRatio: f.select(["16/9", "4/3"], {
			label: "Aspect ratio",
			default: "16/9",
			group: "Style",
		}),
		borderRadius: f.select(["none", "sm", "md", "lg", "xl", "full"], {
			label: "Border radius",
			default: "none",
			group: "Style",
		}),
		shadow: f.select(["none", "sm", "md", "lg"], {
			label: "Shadow",
			default: "none",
			group: "Style",
		}),
		autoplay: f.boolean({
			label: "Autoplay",
			default: false,
			group: "Playback",
		}),
		controls: f.boolean({
			label: "Show controls",
			default: true,
			group: "Playback",
		}),
		loop: f.boolean({ label: "Loop", default: false, group: "Playback" }),
		muted: f.boolean({ label: "Muted", default: false, group: "Playback" }),
	},
});
