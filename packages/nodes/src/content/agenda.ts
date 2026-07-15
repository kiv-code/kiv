import { defineNode, f } from "@kivcode/engine";
import {
	colorOrGradientField,
	resolveBackgroundPaint,
} from "../color-gradient";
import { escapeHtml, styleToString } from "../html-utils";
import { GAP, RADIUS } from "../scales";
import { sizeField } from "../size-field";

const PIN_SVG =
	'<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>';

export const agendaNode = defineNode({
	type: "agenda",
	category: "content",
	label: "Agenda",
	icon: "calendar",
	description:
		"Flexible content list — event schedule, feature list, timeline, or card grid.",
	slotConstraints: { default: ["agenda-item"] },
	toHtml(props, children) {
		const disclaimer =
			props.disclaimer !== undefined && props.disclaimer !== ""
				? `<p style="${styleToString({ fontSize: "13px", color: "#64748b", margin: "0 0 12px" })}">${escapeHtml(props.disclaimer)}</p>`
				: "";
		const style = styleToString({
			display: "flex",
			flexDirection: "column",
			gap: GAP[String(props.gap ?? "xs")] ?? "4px",
			"--kiv-agenda-stripe-width": String(props.stripeWidth || "150px"),
			"--kiv-agenda-item-radius":
				RADIUS[String(props.itemRadius ?? "md")] ?? "8px",
			"--kiv-agenda-layout": String(props.layout ?? "stripe"),
		});
		return `<div data-kiv-type="agenda">${disclaimer}<div style="${style}">${children.default ?? ""}</div></div>`;
	},
	fields: {
		disclaimer: f.text({
			label: "Disclaimer",
			localizable: true,
			group: "Content",
			hint: 'Small note above the list, e.g. "Schedule subject to change without notice."',
		}),
		layout: f.select(["stripe", "card", "compact", "timeline"], {
			label: "Layout",
			default: "stripe",
			group: "Layout",
			hint: "stripe = left time block; card = image cards; compact = minimal inline; timeline = vertical line.",
		}),
		columns: f.select(["1", "2", "3"], {
			label: "Columns (card mode)",
			default: "1",
			group: "Layout",
			showIf: { field: "layout", equals: "card" },
		}),
		gap: f.select(["none", "xs", "sm", "md"], {
			label: "Gap Between Items",
			default: "xs",
			group: "Layout",
		}),
		stripeWidth: sizeField({
			label: "Time Stripe Width",
			default: "150px",
			group: "Layout",
			units: [{ unit: "px", min: 80, max: 320, step: 1 }],
		}),
		itemRadius: f.select(["none", "sm", "md", "lg"], {
			label: "Item Radius",
			default: "md",
			group: "Style",
		}),
		bodyBackground: f.color({
			label: "Body Background",
			default: "#eceefb",
			hint: "Background color for the content area of each item.",
			group: "Style",
		}),
		showTimelineLine: f.boolean({
			label: "Show Timeline Line",
			default: true,
			group: "Style",
			hint: "Vertical connecting line in timeline layout.",
			showIf: { field: "layout", equals: "timeline" },
		}),
		timelineLineColor: f.color({
			label: "Timeline Line Color",
			default: "#cbd5e1",
			group: "Style",
			showIf: { field: "layout", equals: "timeline" },
		}),
	},
});

export const agendaItemNode = defineNode({
	type: "agenda-item",
	category: "content",
	label: "Agenda Item",
	icon: "clock",
	description:
		"A single item inside an Agenda — time block, card, or compact row.",
	toHtml(props) {
		const time = props.time !== undefined ? escapeHtml(props.time) : "";
		const label = props.label !== undefined ? escapeHtml(props.label) : "";
		const stripeText = label ? `${label}<br>${time}` : time;

		const stripeStyle = styleToString({
			flex: "0 0 var(--kiv-agenda-stripe-width, 150px)",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			textAlign: "center",
			fontWeight: "800",
			fontSize: String(props.stripeFontSize || "0.85rem"),
			padding: "12px",
			lineHeight: "1.3",
			background: resolveBackgroundPaint(props.stripeColor, "#e2e8f0"),
			color: String(props.stripeTextColor || "#0f172a"),
		});

		const title = props.title !== undefined ? escapeHtml(props.title) : "";
		const description =
			props.description !== undefined && props.description !== ""
				? `<p style="${styleToString({ margin: "0", fontSize: String(props.descriptionFontSize || "0.82rem"), color: "#475569", lineHeight: "1.5" })}">${escapeHtml(props.description)}</p>`
				: "";
		const location =
			props.location !== undefined && props.location !== ""
				? `<span style="${styleToString({ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.8rem", color: "#64748b" })}"><span style="color:#ff5a3c;display:inline-flex;">${PIN_SVG}</span>${escapeHtml(props.location)}</span>`
				: "";

		const tagsHtml =
			props.tags && props.tags !== ""
				? `<div style="${styleToString({ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" })}">${String(
						props.tags,
					)
						.split(",")
						.map((t: string) => t.trim())
						.filter(Boolean)
						.map(
							(t: string) =>
								`<span style="${styleToString({ fontSize: "0.68rem", fontWeight: "600", padding: "2px 8px", borderRadius: "9999px", background: "#e0e7ff", color: "#4338ca" })}">${escapeHtml(t)}</span>`,
						)
						.join("")}</div>`
				: "";

		const imageHtml =
			props.image && props.image !== ""
				? `<img src="${escapeHtml(props.image)}" alt="${escapeHtml(props.title ?? "")}" style="${styleToString({ width: "100%", maxHeight: "200px", objectFit: "cover", borderRadius: "6px", marginBottom: "8px" })}" />`
				: "";

		const mainStyle = styleToString({
			display: "flex",
			flexDirection: "column",
			gap: "6px",
			minWidth: "0",
		});

		let speakerHtml = "";
		if (props.hasSpeaker) {
			const avatarStyle = styleToString({
				width: "56px",
				height: "56px",
				borderRadius: RADIUS.full,
				objectFit: "cover",
				flexShrink: "0",
				background: "#e2e8f0",
			});
			const avatar = props.speakerAvatar
				? `<img src="${escapeHtml(props.speakerAvatar)}" alt="${escapeHtml(props.speakerName ?? "")}" style="${avatarStyle}" />`
				: `<div style="${avatarStyle}"></div>`;
			const speakerLabel =
				props.speakerLabel !== undefined
					? escapeHtml(props.speakerLabel)
					: "Speaker";
			const roleLabelStyle = styleToString({
				fontSize: "0.68rem",
				fontWeight: "700",
				color: "#ff1d96",
				textTransform: "uppercase",
				letterSpacing: "0.04em",
			});
			const nameStyle = styleToString({
				fontWeight: "700",
				fontSize: "0.88rem",
			});
			const descStyle = styleToString({
				fontSize: "0.76rem",
				color: "#64748b",
				maxWidth: "24ch",
				lineHeight: "1.35",
			});
			speakerHtml = `<div style="${styleToString({ display: "flex", alignItems: "center", gap: "12px", flexShrink: "0" })}">${avatar}<div style="${styleToString({ display: "flex", flexDirection: "column", gap: "2px" })}"><span style="${roleLabelStyle}">${speakerLabel}</span><span style="${nameStyle}">${escapeHtml(props.speakerName ?? "")}</span><span style="${descStyle}">${escapeHtml(props.speakerRole ?? "")}</span></div></div>`;
		}

		const bodyStyle = styleToString({
			flex: "1",
			background: props.bodyBackground
				? String(props.bodyBackground)
				: "#eceefb",
			padding: "14px 20px",
			display: "flex",
			alignItems: props.hasSpeaker ? "flex-start" : "center",
			justifyContent: "space-between",
			gap: "20px",
			flexWrap: "wrap",
		});

		const wrapStyle = styleToString({
			display: "flex",
			borderRadius: "var(--kiv-agenda-item-radius, 8px)",
			overflow: "hidden",
		});

		const highlight = props.highlight
			? `border-left: 4px solid ${String(props.highlightColor || "#6366f1")};`
			: "";

		return (
			`<article data-kiv-type="agenda-item" style="${wrapStyle}${highlight}">` +
			`<div style="${stripeStyle}">${stripeText}</div>` +
			`<div style="${bodyStyle}"><div style="${mainStyle}">${imageHtml}<p style="margin:0;font-weight:700;font-size:${escapeHtml(String(props.titleFontSize || "0.95rem"))};">${title}</p>${description}${location}${tagsHtml}</div>${speakerHtml}</div>` +
			`</article>`
		);
	},
	fields: {
		time: f.text({
			label: "Time",
			localizable: true,
			inline: true,
			group: "Content",
			hint: 'e.g. "9:00 AM" or "2024-03-15"',
		}),
		label: f.text({
			label: "Label",
			localizable: true,
			group: "Content",
			hint: 'Optional category line above the time, e.g. "Workshop"',
		}),
		title: f.text({
			label: "Title",
			localizable: true,
			inline: true,
			group: "Content",
		}),
		description: f.text({
			label: "Description",
			localizable: true,
			group: "Content",
			hint: "Optional short description below the title.",
		}),
		location: f.text({
			label: "Location",
			localizable: true,
			group: "Content",
		}),
		image: f.text({
			label: "Image URL",
			group: "Content",
			pluginControl: "media-picker",
			hint: "Optional image shown above the title (card/compact modes).",
		}),
		tags: f.text({
			label: "Tags",
			group: "Content",
			hint: 'Comma-separated tags, e.g. "workshop, frontend, react".',
		}),
		bodyBackground: f.color({
			label: "Body Background",
			default: "",
			hint: "Override the body background for this specific item. Empty = use Agenda default.",
			group: "Style",
		}),
		highlight: f.boolean({
			label: "Highlight",
			default: false,
			group: "Style",
			hint: "Adds a left accent border to emphasize this item.",
		}),
		highlightColor: f.color({
			label: "Highlight Color",
			default: "#6366f1",
			group: "Style",
			showIf: { field: "highlight", equals: "true" },
		}),
		stripeColor: colorOrGradientField({
			label: "Stripe Color",
			group: "Style",
			hint: "Background paint for the time block on the left.",
		}),
		stripeTextColor: f.color({
			label: "Stripe Text Color",
			default: "#0f172a",
			group: "Style",
		}),
		stripeFontSize: sizeField({
			label: "Time/Label Font Size",
			default: "0.85rem",
			group: "Style",
			units: [
				{ unit: "rem", min: 0.5, max: 2, step: 0.01 },
				{ unit: "px", min: 8, max: 32, step: 1 },
			],
		}),
		titleFontSize: sizeField({
			label: "Title Font Size",
			default: "0.95rem",
			group: "Style",
			units: [
				{ unit: "rem", min: 0.5, max: 2, step: 0.01 },
				{ unit: "px", min: 8, max: 32, step: 1 },
			],
		}),
		descriptionFontSize: sizeField({
			label: "Description Font Size",
			default: "0.82rem",
			group: "Style",
			units: [
				{ unit: "rem", min: 0.5, max: 2, step: 0.01 },
				{ unit: "px", min: 8, max: 32, step: 1 },
			],
		}),
		hasSpeaker: f.boolean({
			label: "Has Speaker",
			default: false,
			group: "Speaker",
		}),
		speakerLabel: f.text({
			label: "Speaker Role Label",
			default: "Speaker",
			localizable: true,
			group: "Speaker",
			showIf: { field: "hasSpeaker", equals: "true" },
		}),
		speakerName: f.text({
			label: "Speaker Name",
			localizable: true,
			group: "Speaker",
			showIf: { field: "hasSpeaker", equals: "true" },
		}),
		speakerRole: f.text({
			label: "Speaker Title / Company",
			localizable: true,
			group: "Speaker",
			showIf: { field: "hasSpeaker", equals: "true" },
		}),
		speakerAvatar: f.text({
			label: "Speaker Photo",
			group: "Speaker",
			pluginControl: "media-picker",
			showIf: { field: "hasSpeaker", equals: "true" },
		}),
	},
});
