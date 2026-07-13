import { defineNode, f } from "@kivcode/engine";
import { escapeHtml, styleToString } from "../html-utils";

// Raw embedded HTML/scripts are an XSS vector the moment this document is
// rendered outside the trusted editor (e.g. a public page via renderToHtml()).
// Both modes ALWAYS render through an <iframe>, never raw HTML on the main
// page — sandbox attributes then bound what the embedded content can do.
// `html` mode uses `srcdoc` WITHOUT `allow-same-origin`: combining it with
// `allow-scripts` on a srcdoc iframe would grant the embedded script the
// parent page's own origin (cookies/storage), defeating the sandbox.
// `iframe` mode points at a genuinely different origin, so `allow-same-origin`
// there only grants the embed its OWN origin — safe, and often required for
// legitimate third-party embeds (maps, schedulers, video players) to work.
export const embedNode = defineNode({
	type: "embed",
	category: "content",
	label: "Custom Embed",
	icon: "code",
	toHtml(props) {
		const height = Number(props.height ?? 400);
		const embedType = String(props.embedType ?? "iframe");
		const sandboxed = props.sandboxed !== false;
		const style = styleToString({
			width: "100%",
			height: `${height}px`,
			border: "0",
			display: "block",
		});

		if (embedType === "html") {
			const sandboxAttr = sandboxed ? ' sandbox="allow-scripts"' : "";
			const srcdoc = escapeHtml(props.html ?? "");
			return `<iframe srcdoc="${srcdoc}"${sandboxAttr} style="${style}" data-kiv-type="embed"></iframe>`;
		}

		const sandboxAttr = sandboxed
			? ' sandbox="allow-scripts allow-same-origin allow-popups allow-forms"'
			: "";
		const src = escapeHtml(props.iframeUrl ?? "");
		return `<iframe src="${src}"${sandboxAttr} style="${style}" data-kiv-type="embed"></iframe>`;
	},
	fields: {
		embedType: f.select(["html", "iframe"], {
			label: "Embed Type",
			default: "iframe",
			group: "Content",
		}),
		html: f.textarea({
			label: "HTML",
			group: "Content",
			showIf: { field: "embedType", equals: "html" },
		}),
		iframeUrl: f.text({
			label: "Iframe URL",
			group: "Content",
			showIf: { field: "embedType", equals: "iframe" },
		}),
		height: f.number({ label: "Height (px)", default: 400, group: "Layout" }),
		sandboxed: f.boolean({
			label: "Sandboxed (iframe only)",
			default: true,
			group: "Behavior",
		}),
	},
});
