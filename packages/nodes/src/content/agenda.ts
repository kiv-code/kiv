import { defineNode, f } from "@kivcode/engine";
import {
	colorOrGradientField,
	resolveBackgroundPaint,
	resolveSolidColor,
} from "../color-gradient";
import { escapeHtml, styleToString } from "../html-utils";
import { fromScale, GAP, RADIUS } from "../scales";
import { sizeField } from "../size-field";
import { resolveTypographyStyle, typographyFields } from "../typography-field";

const PIN_SVG =
	'<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>';

const stripeTypo = typographyFields({
	group: "Style",
	defaultSize: 14,
	weightDefault: "800",
});
const titleTypo = typographyFields({
	group: "Style",
	defaultSize: 15,
	weightDefault: "700",
});
const descriptionTypo = typographyFields({
	group: "Style",
	defaultSize: 13,
	weightDefault: "400",
});
const speakerLabelTypo = typographyFields({
	group: "Speaker",
	defaultSize: 11,
	weightDefault: "700",
});
const speakerNameTypo = typographyFields({
	group: "Speaker",
	defaultSize: 14,
	weightDefault: "700",
});
const speakerTitleTypo = typographyFields({
	group: "Speaker",
	defaultSize: 12,
	weightDefault: "400",
});
const speakerCompanyTypo = typographyFields({
	group: "Speaker",
	defaultSize: 12,
	weightDefault: "400",
});

/** Resolves one agenda-item text role (stripe, title, description, or one of
 * the speaker roles) through the shared typography resolver. Each role has
 * its own defaults/fallbacks, mirroring the field triplets that used to be
 * hand-rolled per role. */
export function resolveAgendaTypographyStyle(
	props: Record<string, unknown>,
	defaults: { size: number; weight: string; colorFallback: string },
): Record<string, string | undefined> {
	return resolveTypographyStyle(
		props as {
			fontFamily?: string;
			size?: number;
			weight?: string;
			color?: unknown;
		},
		defaults,
	);
}

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
			gap: fromScale(GAP, props.gap ?? "xs", "4px"),
			"--kiv-agenda-stripe-width": String(props.stripeWidth || "150px"),
			"--kiv-agenda-item-radius": fromScale(
				RADIUS,
				props.itemRadius ?? "md",
				"8px",
			),
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
			...resolveAgendaTypographyStyle(
				{
					fontFamily: props.stripeFontFamily,
					size: props.stripeFontSize,
					weight: props.stripeFontWeight,
					color: props.stripeTextColor,
				},
				{ size: 14, weight: "800", colorFallback: "#0f172a" },
			),
			padding: "12px",
			lineHeight: "1.3",
			background: resolveBackgroundPaint(props.stripeColor, "#e2e8f0"),
			margin: undefined,
		});

		const hasTime = time !== "" || label !== "";
		const stripeHtml = hasTime
			? `<div style="${stripeStyle}">${stripeText}</div>`
			: "";

		const title = props.title !== undefined ? escapeHtml(props.title) : "";
		const description =
			props.description !== undefined && props.description !== ""
				? `<p style="${styleToString({
						...resolveAgendaTypographyStyle(
							{
								fontFamily: props.descriptionFontFamily,
								size: props.descriptionFontSize,
								weight: props.descriptionFontWeight,
								color: props.descriptionColor,
							},
							{ size: 13, weight: "400", colorFallback: "#475569" },
						),
						margin: "0",
						lineHeight: "1.5",
					})}">${escapeHtml(props.description)}</p>`
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
			const count = Math.min(
				8,
				Math.max(1, Number(props.speakerCount ?? "1") || 1),
			);
			const perRow = Math.min(
				5,
				Math.max(1, Number(props.speakersPerRow ?? "3") || 3),
			);
			const avatarStyle = styleToString({
				width: "56px",
				height: "56px",
				borderRadius: RADIUS.full,
				objectFit: "cover",
				flexShrink: "0",
				background: "#e2e8f0",
			});
			const roleLabelStyle = styleToString({
				...resolveAgendaTypographyStyle(
					{
						fontFamily: props.speakerLabelFontFamily,
						size: props.speakerLabelFontSize,
						weight: props.speakerLabelFontWeight,
						color: props.speakerLabelColor,
					},
					{ size: 11, weight: "700", colorFallback: "#ff1d96" },
				),
				textTransform: "uppercase",
				letterSpacing: "0.04em",
			});
			const nameStyle = styleToString(
				resolveAgendaTypographyStyle(
					{
						fontFamily: props.speakerNameFontFamily,
						size: props.speakerNameFontSize,
						weight: props.speakerNameFontWeight,
						color: props.speakerNameColor,
					},
					{ size: 14, weight: "700", colorFallback: "inherit" },
				),
			);
			const titleStyle = styleToString({
				...resolveAgendaTypographyStyle(
					{
						fontFamily: props.speakerTitleFontFamily,
						size: props.speakerTitleFontSize,
						weight: props.speakerTitleFontWeight,
						color: props.speakerTitleColor,
					},
					{ size: 12, weight: "400", colorFallback: "#64748b" },
				),
				lineHeight: "1.35",
			});
			const companyStyle = styleToString({
				...resolveAgendaTypographyStyle(
					{
						fontFamily: props.speakerCompanyFontFamily,
						size: props.speakerCompanyFontSize,
						weight: props.speakerCompanyFontWeight,
						color: props.speakerCompanyColor,
					},
					{ size: 12, weight: "400", colorFallback: "#64748b" },
				),
				lineHeight: "1.35",
			});
			const cards: string[] = [];
			for (let i = 1; i <= count; i++) {
				const name = i === 1 ? props.speakerName : props[`speaker${i}Name`];
				const title = i === 1 ? props.speakerRole : props[`speaker${i}Role`];
				const company =
					i === 1 ? props.speakerCompany : props[`speaker${i}Company`];
				const avatarSrc =
					i === 1 ? props.speakerAvatar : props[`speaker${i}Avatar`];
				const avatar = avatarSrc
					? `<img src="${escapeHtml(String(avatarSrc))}" alt="${escapeHtml(name ? String(name) : "")}" style="${avatarStyle}" />`
					: `<div style="${avatarStyle}"></div>`;
				const label = i === 1 ? props.speakerLabel : props[`speaker${i}Label`];
				const speakerLabel =
					label !== undefined && label !== ""
						? `<span style="${roleLabelStyle}">${escapeHtml(String(label))}</span>`
						: "";
				const titleHtml =
					title !== undefined && title !== ""
						? `<span style="${titleStyle}">${escapeHtml(String(title))}</span>`
						: "";
				const companyHtml =
					company !== undefined && company !== ""
						? `<span style="${companyStyle}">${escapeHtml(String(company))}</span>`
						: "";
				cards.push(
					`<div style="${styleToString({ display: "flex", alignItems: "center", gap: "12px", minWidth: "0" })}">${avatar}<div style="${styleToString({ display: "flex", flexDirection: "column", gap: "2px", minWidth: "0" })}">${speakerLabel}<span style="${nameStyle}">${escapeHtml(name ? String(name) : "")}</span>${titleHtml}${companyHtml}</div></div>`,
				);
			}
			speakerHtml = `<div style="${styleToString({ display: "grid", gridTemplateColumns: `repeat(${perRow}, 1fr)`, gap: "16px", flex: "1 1 100%" })}">${cards.join("")}</div>`;
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
			? `border-left: 4px solid ${resolveSolidColor(props.highlightColor, "#6366f1")};`
			: "";

		const titleStyleStr = styleToString(
			resolveAgendaTypographyStyle(
				{
					fontFamily: props.titleFontFamily,
					size: props.titleFontSize,
					weight: props.titleFontWeight,
					color: props.titleColor,
				},
				{ size: 15, weight: "700", colorFallback: "inherit" },
			),
		);

		return (
			`<article data-kiv-type="agenda-item" style="${wrapStyle}${highlight}">` +
			stripeHtml +
			`<div style="${bodyStyle}"><div style="${mainStyle}">${imageHtml}<p style="${titleStyleStr}">${title}</p>${description}${location}${tagsHtml}</div>${speakerHtml}</div>` +
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
		stripeTextColor: {
			...stripeTypo.color,
			label: "Stripe Text Color",
			default: "#0f172a",
		},
		stripeFontFamily: stripeTypo.fontFamily,
		stripeFontSize: { ...stripeTypo.size, label: "Time/Label Font Size" },
		stripeFontWeight: { ...stripeTypo.weight, label: "Time/Label Font Weight" },
		titleFontFamily: titleTypo.fontFamily,
		titleFontSize: { ...titleTypo.size, label: "Title Font Size" },
		titleFontWeight: { ...titleTypo.weight, label: "Title Font Weight" },
		titleColor: {
			...titleTypo.color,
			label: "Title Color",
			default: "",
			hint: "Empty = inherit the item's default text color.",
		},
		descriptionFontFamily: descriptionTypo.fontFamily,
		descriptionFontSize: {
			...descriptionTypo.size,
			label: "Description Font Size",
		},
		descriptionFontWeight: {
			...descriptionTypo.weight,
			label: "Description Font Weight",
		},
		descriptionColor: {
			...descriptionTypo.color,
			label: "Description Color",
			default: "#475569",
		},
		hasSpeaker: f.boolean({
			label: "Has Speaker",
			default: false,
			group: "Speaker",
		}),
		speakerCount: f.select(["1", "2", "3", "4", "5", "6", "7", "8"], {
			label: "Number of Speakers",
			default: "1",
			group: "Speaker",
			hint: 'Each speaker gets its own "Speaker N" section below.',
			showIf: { field: "hasSpeaker", equals: "true" },
		}),
		speakersPerRow: f.select(["1", "2", "3", "4", "5"], {
			label: "Speakers Per Row",
			default: "3",
			group: "Speaker",
			hint: "How many speaker cards sit side by side before wrapping to a new row. Always 1 per row on the Mobile canvas view regardless of this setting.",
			showIf: { field: "hasSpeaker", equals: "true" },
		}),
		speakerLabel: f.text({
			label: "Role Label",
			default: "Speaker",
			localizable: true,
			hint: 'e.g. "Speaker", "Moderator", "Panelist". Leave empty to hide it.',
			group: "Speaker 1",
			showIf: { field: "hasSpeaker", equals: "true" },
		}),
		speakerLabelFontFamily: {
			...speakerLabelTypo.fontFamily,
			showIf: { field: "hasSpeaker", equals: "true" },
		},
		speakerLabelFontSize: {
			...speakerLabelTypo.size,
			label: "Role Label Font Size",
			showIf: { field: "hasSpeaker", equals: "true" },
		},
		speakerLabelColor: {
			...speakerLabelTypo.color,
			label: "Role Label Color",
			default: "#ff1d96",
			showIf: { field: "hasSpeaker", equals: "true" },
		},
		speakerLabelFontWeight: {
			...speakerLabelTypo.weight,
			label: "Role Label Font Weight",
			showIf: { field: "hasSpeaker", equals: "true" },
		},
		speakerName: f.text({
			label: "Name",
			localizable: true,
			group: "Speaker 1",
			showIf: { field: "hasSpeaker", equals: "true" },
		}),
		speakerNameFontFamily: {
			...speakerNameTypo.fontFamily,
			showIf: { field: "hasSpeaker", equals: "true" },
		},
		speakerNameFontSize: {
			...speakerNameTypo.size,
			label: "Name Font Size",
			showIf: { field: "hasSpeaker", equals: "true" },
		},
		speakerNameColor: {
			...speakerNameTypo.color,
			label: "Name Color",
			default: "",
			hint: "Empty = inherit the item's default text color.",
			showIf: { field: "hasSpeaker", equals: "true" },
		},
		speakerNameFontWeight: {
			...speakerNameTypo.weight,
			label: "Name Font Weight",
			showIf: { field: "hasSpeaker", equals: "true" },
		},
		speakerRole: f.text({
			label: "Title",
			localizable: true,
			group: "Speaker 1",
			showIf: { field: "hasSpeaker", equals: "true" },
		}),
		speakerTitleFontFamily: {
			...speakerTitleTypo.fontFamily,
			showIf: { field: "hasSpeaker", equals: "true" },
		},
		speakerTitleFontSize: {
			...speakerTitleTypo.size,
			label: "Title Font Size",
			showIf: { field: "hasSpeaker", equals: "true" },
		},
		speakerTitleColor: {
			...speakerTitleTypo.color,
			label: "Title Color",
			default: "#64748b",
			showIf: { field: "hasSpeaker", equals: "true" },
		},
		speakerTitleFontWeight: {
			...speakerTitleTypo.weight,
			label: "Title Font Weight",
			showIf: { field: "hasSpeaker", equals: "true" },
		},
		speakerCompany: f.text({
			label: "Company",
			localizable: true,
			group: "Speaker 1",
			showIf: { field: "hasSpeaker", equals: "true" },
		}),
		speakerCompanyFontFamily: {
			...speakerCompanyTypo.fontFamily,
			showIf: { field: "hasSpeaker", equals: "true" },
		},
		speakerCompanyFontSize: {
			...speakerCompanyTypo.size,
			label: "Company Font Size",
			showIf: { field: "hasSpeaker", equals: "true" },
		},
		speakerCompanyColor: {
			...speakerCompanyTypo.color,
			label: "Company Color",
			default: "#64748b",
			showIf: { field: "hasSpeaker", equals: "true" },
		},
		speakerCompanyFontWeight: {
			...speakerCompanyTypo.weight,
			label: "Company Font Weight",
			showIf: { field: "hasSpeaker", equals: "true" },
		},
		speakerAvatar: f.text({
			label: "Photo",
			group: "Speaker 1",
			pluginControl: "media-picker",
			showIf: { field: "hasSpeaker", equals: "true" },
		}),
		...buildAdditionalSpeakerFields(),
	},
});

/** Generates the Name/Title/Company/Photo fields for speakers 2..8 — each in
 * its own "Speaker N" Inspector group (so it's obvious which card you're
 * editing once there are more than one), visible only once `speakerCount`
 * reaches that index. */
function buildAdditionalSpeakerFields() {
	const fields: Record<string, ReturnType<typeof f.text>> = {};
	for (let i = 2; i <= 8; i++) {
		const showIf = {
			field: "speakerCount",
			equals: Array.from({ length: 8 - i + 1 }, (_, j) => String(i + j)),
		};
		fields[`speaker${i}Label`] = f.text({
			label: "Role Label",
			default: "Speaker",
			localizable: true,
			hint: 'e.g. "Speaker", "Moderator", "Panelist". Leave empty to hide it.',
			group: `Speaker ${i}`,
			showIf,
		});
		fields[`speaker${i}Name`] = f.text({
			label: "Name",
			localizable: true,
			group: `Speaker ${i}`,
			showIf,
		});
		fields[`speaker${i}Role`] = f.text({
			label: "Title",
			localizable: true,
			group: `Speaker ${i}`,
			showIf,
		});
		fields[`speaker${i}Company`] = f.text({
			label: "Company",
			localizable: true,
			group: `Speaker ${i}`,
			showIf,
		});
		fields[`speaker${i}Avatar`] = f.text({
			label: "Photo",
			group: `Speaker ${i}`,
			pluginControl: "media-picker",
			showIf,
		});
	}
	return fields;
}
