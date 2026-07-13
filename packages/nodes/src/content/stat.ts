import { defineNode, f } from "@kivcode/engine";
import { alignField } from "../align-field";
import { colorOrGradientField, resolveTextPaintStyle } from "../color-gradient";
import { escapeHtml, styleToString } from "../html-utils";
import { STAT_SIZE } from "../scales";

export function formatStatValue(
	value: number,
	decimals: number,
	prefix: string,
	suffix: string,
): string {
	const formatted = Number.isFinite(value)
		? value.toFixed(Math.max(0, decimals))
		: "0";
	return `${prefix}${formatted}${suffix}`;
}

export const statNode = defineNode({
	type: "stat",
	category: "content",
	label: "Stat Counter",
	icon: "trending-up",
	toHtml(props) {
		const align = String(props.align ?? "center");
		const size = STAT_SIZE[String(props.size ?? "xl")] ?? STAT_SIZE.xl;
		const value = formatStatValue(
			Number(props.value ?? 0),
			Number(props.decimals ?? 0),
			String(props.prefix ?? ""),
			String(props.suffix ?? ""),
		);
		const wrapperStyle = styleToString({
			display: "flex",
			flexDirection: "column",
			alignItems:
				align === "left"
					? "flex-start"
					: align === "right"
						? "flex-end"
						: "center",
			textAlign: align,
		});
		const valueStyle = styleToString({
			fontSize: size,
			fontWeight: "800",
			lineHeight: "1.1",
			...resolveTextPaintStyle(props.valueColor, "#0f172a"),
		});
		const labelHtml =
			props.label !== undefined && props.label !== ""
				? `<span style="${styleToString({ fontSize: "14px", color: "#64748b", marginTop: "4px" })}">${escapeHtml(props.label)}</span>`
				: "";
		return `<div style="${wrapperStyle}" data-kiv-type="stat"><span style="${valueStyle}">${escapeHtml(value)}</span>${labelHtml}</div>`;
	},
	fields: {
		value: f.number({ label: "Value", default: 100, group: "Content" }),
		prefix: f.text({ label: "Prefix", localizable: true, group: "Content" }),
		suffix: f.text({
			label: "Suffix (e.g. %, +, k)",
			localizable: true,
			group: "Content",
		}),
		label: f.text({ label: "Label", localizable: true, group: "Content" }),
		decimals: f.number({
			label: "Decimal Places",
			default: 0,
			group: "Content",
		}),
		animateOnView: f.boolean({
			label: "Animate on Scroll Into View",
			default: true,
			group: "Behavior",
		}),
		animationDuration: f.number({
			label: "Duration (ms)",
			default: 1500,
			group: "Behavior",
		}),
		align: alignField({ default: "center", group: "Style" }),
		valueColor: colorOrGradientField({ label: "Value Color", group: "Style" }),
		size: f.select(["md", "lg", "xl", "2xl"], {
			label: "Size",
			default: "xl",
			responsive: true,
			group: "Style",
		}),
	},
});
