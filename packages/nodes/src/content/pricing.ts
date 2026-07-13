import { defineNode, f } from "@kivcode/engine";
import {
	colorOrGradientField,
	resolveBackgroundPaint,
	resolveSolidColor,
} from "../color-gradient";
import { escapeHtml, styleToString } from "../html-utils";
import { RADIUS } from "../scales";

export interface PricingTier {
	period: string;
	tier: string;
	highlighted: boolean;
}

export interface PricingRow {
	label: string;
	values: string[];
}

export interface PricingData {
	tiers: PricingTier[];
	rows: PricingRow[];
}

/** Leniently parses the data JSON text field — malformed input never throws, it just renders empty. */
export function parsePricingData(raw: unknown): PricingData {
	if (typeof raw !== "string" || !raw.trim()) return { tiers: [], rows: [] };
	try {
		const parsed = JSON.parse(raw);
		const tiers: PricingTier[] = Array.isArray(parsed?.tiers)
			? parsed.tiers.map((t: unknown) => {
					const tier = t as Record<string, unknown>;
					return {
						period: String(tier?.period ?? ""),
						tier: String(tier?.tier ?? ""),
						highlighted: Boolean(tier?.highlighted),
					};
				})
			: [];
		const rows: PricingRow[] = Array.isArray(parsed?.rows)
			? parsed.rows.map((r: unknown) => {
					const row = r as Record<string, unknown>;
					return {
						label: String(row?.label ?? ""),
						values: Array.isArray(row?.values)
							? row.values.map((v: unknown) => String(v))
							: [],
					};
				})
			: [];
		return { tiers, rows };
	} catch {
		return { tiers: [], rows: [] };
	}
}

function renderTableVariant(
	data: PricingData,
	headerBg: string,
	highlightBg: string,
	radius: string,
): string {
	const wrapStyle = styleToString({
		borderRadius: radius,
		overflow: "hidden",
		border: "1px solid #e5e7eb",
	});
	const thStyle = (highlighted: boolean) =>
		styleToString({
			background: highlighted ? highlightBg : headerBg,
			color: "#ffffff",
			textAlign: "center",
			padding: "14px 16px",
			fontSize: "0.82rem",
			fontWeight: "500",
		});
	const tdStyle = (highlighted: boolean, isLabel: boolean) =>
		styleToString({
			textAlign: isLabel ? "left" : "center",
			padding: "16px",
			background: highlighted ? `${highlightBg}1a` : "#ffffff",
			color: highlighted ? highlightBg : "#0f172a",
			borderTop: "1px solid #e5e7eb",
			fontWeight: isLabel ? "700" : "700",
		});
	const head = `<tr><th></th>${data.tiers
		.map(
			(t) =>
				`<th style="${thStyle(t.highlighted)}"><span style="display:block;font-size:0.78rem;opacity:0.85;">${escapeHtml(t.period)}</span><span style="display:block;font-weight:800;font-style:italic;margin-top:2px;">${escapeHtml(t.tier)}</span></th>`,
		)
		.join("")}</tr>`;
	const body = data.rows
		.map(
			(row) =>
				`<tr><td style="${tdStyle(false, true)}">${escapeHtml(row.label)}</td>${data.tiers
					.map(
						(t, i) =>
							`<td style="${tdStyle(t.highlighted, false)}">${escapeHtml(row.values[i] ?? "")}</td>`,
					)
					.join("")}</tr>`,
		)
		.join("");
	return `<div style="${wrapStyle}"><table style="width:100%;border-collapse:collapse;font-size:0.9rem;"><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
}

function renderCardsVariant(
	data: PricingData,
	accentBg: string,
	radius: string,
	ctaLabel: string,
	featured: boolean,
): string {
	const gridStyle = styleToString({
		display: "grid",
		gridTemplateColumns: `repeat(${data.tiers.length || 1}, 1fr)`,
		gap: "16px",
		alignItems: featured ? "center" : "stretch",
	});
	const cards = data.tiers
		.map((t, ti) => {
			const isAccent = t.highlighted;
			const cardStyle = styleToString({
				borderRadius: radius,
				padding: "22px",
				border: isAccent ? "none" : "1px solid #e5e7eb",
				background: isAccent ? accentBg : "#ffffff",
				color: isAccent ? "#ffffff" : "#0f172a",
				display: "flex",
				flexDirection: "column",
				gap: "14px",
				position: "relative",
				transform: featured && !isAccent ? "scale(0.97)" : undefined,
			});
			const rows = data.rows
				.map((row) => {
					const rowStyle = styleToString({
						display: "flex",
						justifyContent: "space-between",
						fontSize: "0.86rem",
						padding: "8px 0",
						borderTop: isAccent
							? "1px solid rgba(255,255,255,0.28)"
							: "1px solid #e5e7eb",
					});
					const labelStyle = styleToString({
						color: isAccent ? "rgba(255,255,255,0.85)" : "#64748b",
					});
					return `<div style="${rowStyle}"><span style="${labelStyle}">${escapeHtml(row.label)}</span><span style="font-weight:800;">${escapeHtml(row.values[ti] ?? "")}</span></div>`;
				})
				.join("");
			const cta = ctaLabel
				? `<div style="${styleToString({ marginTop: "6px", textAlign: "center", padding: "10px", borderRadius: RADIUS.sm, fontWeight: "700", fontSize: "0.85rem", background: isAccent ? "#ffffff" : "#0f172a", color: isAccent ? "#4b22d6" : "#ffffff" })}">${escapeHtml(ctaLabel)}</div>`
				: "";
			const badge =
				featured && isAccent
					? `<span style="${styleToString({ position: "absolute", top: "-12px", right: "20px", background: "#ffb067", color: "#3a2200", fontSize: "0.68rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.04em", padding: "5px 10px", borderRadius: "999px" })}">Featured</span>`
					: "";
			return `<div style="${cardStyle}">${badge}<span style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;opacity:0.85;">${escapeHtml(t.period)}</span><span style="font-family:inherit;font-size:1.15rem;font-weight:800;font-style:italic;">${escapeHtml(t.tier)}</span><div>${rows}</div>${cta}</div>`;
		})
		.join("");
	return `<div style="${gridStyle}">${cards}</div>`;
}

export const pricingNode = defineNode({
	type: "pricing",
	category: "content",
	label: "Pricing",
	icon: "dollar-sign",
	description: "Pricing table with tiers and rows — table or card styles.",
	toHtml(props) {
		const data = parsePricingData(props.data);
		const radius = RADIUS[String(props.borderRadius ?? "lg")] ?? "16px";
		const variant = String(props.variant ?? "table");
		const headerBg = resolveSolidColor(props.headerColor, "#14162b");
		const highlightBg = resolveBackgroundPaint(props.highlightColor, "#ff1d96");
		const highlightSolid = resolveSolidColor(props.highlightColor, "#ff1d96");
		const ctaLabel = props.ctaLabel !== undefined ? String(props.ctaLabel) : "";

		let inner: string;
		if (variant === "cards") {
			inner = renderCardsVariant(data, highlightSolid, radius, ctaLabel, false);
		} else if (variant === "cards-featured") {
			inner = renderCardsVariant(data, highlightSolid, radius, ctaLabel, true);
		} else {
			inner = renderTableVariant(data, headerBg, highlightBg, radius);
		}
		return `<div data-kiv-type="pricing">${inner}</div>`;
	},
	fields: {
		data: f.textarea({
			label: "Data",
			default:
				'{"tiers":[{"period":"Julio","tier":"Regular","highlighted":true},{"period":"Agosto","tier":"Late","highlighted":false}],"rows":[{"label":"PMI Members","values":["S/ 1,700","S/ 2,100"]},{"label":"Non-members","values":["S/ 2,200","S/ 2,600"]}]}',
			group: "Content",
			pluginControl: "pricing-editor",
		}),
		variant: f.select(["table", "cards", "cards-featured"], {
			label: "Style",
			default: "table",
			group: "Style",
		}),
		headerColor: f.color({
			label: "Header Color",
			default: "#14162b",
			group: "Style",
			hint: "Table style only — the dark header row background.",
		}),
		highlightColor: colorOrGradientField({
			label: "Highlight Color",
			group: "Style",
			hint: "Paint for the highlighted tier — header column (table) or accent card (cards).",
		}),
		borderRadius: f.select(["none", "sm", "md", "lg", "xl"], {
			label: "Border Radius",
			default: "lg",
			group: "Style",
		}),
		ctaLabel: f.text({
			label: "CTA Label",
			default: "",
			localizable: true,
			group: "Content",
			hint: 'Shown as a button in Cards styles. Empty hides the button, e.g. "Inscreva-se".',
		}),
	},
});
