import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface EmbedNodeProps extends KivNodeComponentProps {
	embedType?: string;
	html?: string;
	iframeUrl?: string;
	height?: number;
	sandboxed?: boolean;
}

export function EmbedNode({
	embedType,
	html,
	iframeUrl,
	height,
	sandboxed = true,
	id,
	style,
	...rest
}: EmbedNodeProps) {
	const isHtml = (embedType ?? "iframe") === "html";

	// Both modes always render through an <iframe>, never raw HTML on the main
	// page DOM — see packages/nodes/src/content/embed.ts's toHtml for the full
	// rationale. `html` mode's srcdoc iframe never gets allow-same-origin (that
	// would hand the embedded script the parent page's own origin); an `iframe`
	// mode src is a genuinely different origin already, so allow-same-origin
	// there only grants the embed its OWN origin, which real embeds often need.
	const sandboxAttr = useMemo(() => {
		if (!sandboxed) return undefined;
		return isHtml
			? "allow-scripts"
			: "allow-scripts allow-same-origin allow-popups allow-forms";
	}, [sandboxed, isHtml]);

	const iframeStyle = useMemo(
		() => ({
			width: "100%",
			height: `${height ?? 400}px`,
			border: "0",
			display: "block" as const,
			...style,
		}),
		[height, style],
	);

	if (isHtml) {
		return (
			<iframe
				id={id}
				srcDoc={html ?? ""}
				sandbox={sandboxAttr}
				style={iframeStyle}
				title="Custom embed"
				data-kiv-type="embed"
				{...rest}
			/>
		);
	}

	return (
		<iframe
			id={id}
			src={iframeUrl ?? ""}
			sandbox={sandboxAttr}
			style={iframeStyle}
			title="Custom embed"
			data-kiv-type="embed"
			{...rest}
		/>
	);
}
