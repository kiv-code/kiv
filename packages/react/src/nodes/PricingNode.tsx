import {
	type PricingData,
	parsePricingData,
	RADIUS,
	resolveBackgroundPaint,
	resolveSolidColor,
} from "@kivcode/nodes";
import { type CSSProperties, useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface PricingNodeProps extends KivNodeComponentProps {
	data?: string;
	variant?: string;
	headerColor?: string;
	highlightColor?: unknown;
	borderRadius?: string;
	ctaLabel?: string;
}

function thStyle(
	highlighted: boolean,
	highlightBg: string,
	headerBg: string,
): CSSProperties {
	return {
		background: highlighted ? highlightBg : headerBg,
		color: "#ffffff",
		textAlign: "center",
		padding: "14px 16px",
		fontSize: "0.82rem",
		fontWeight: 500,
	};
}
function tdStyle(
	highlighted: boolean,
	isLabel: boolean,
	highlightSolid: string,
): CSSProperties {
	return {
		textAlign: isLabel ? "left" : "center",
		padding: "16px",
		background: highlighted ? `${highlightSolid}1a` : "#ffffff",
		color: highlighted ? highlightSolid : "#0f172a",
		borderTop: "1px solid #e5e7eb",
		fontWeight: 700,
	};
}
function cardStyle(
	highlighted: boolean,
	scaled: boolean,
	radius: string,
	highlightBg: string,
): CSSProperties {
	return {
		borderRadius: radius,
		padding: "22px",
		border: highlighted ? "none" : "1px solid #e5e7eb",
		background: highlighted ? highlightBg : "#ffffff",
		color: highlighted ? "#ffffff" : "#0f172a",
		display: "flex",
		flexDirection: "column",
		gap: "14px",
		position: "relative",
		transform: scaled ? "scale(0.97)" : undefined,
	};
}
function rowStyle(highlighted: boolean): CSSProperties {
	return {
		display: "flex",
		justifyContent: "space-between",
		fontSize: "0.86rem",
		padding: "8px 0",
		borderTop: highlighted
			? "1px solid rgba(255,255,255,0.28)"
			: "1px solid #e5e7eb",
	};
}
function rowLabelStyle(highlighted: boolean): CSSProperties {
	return { color: highlighted ? "rgba(255,255,255,0.85)" : "#64748b" };
}
function ctaStyle(highlighted: boolean): CSSProperties {
	return {
		marginTop: "6px",
		textAlign: "center",
		padding: "10px",
		borderRadius: RADIUS.sm,
		fontWeight: 700,
		fontSize: "0.85rem",
		background: highlighted ? "#ffffff" : "#0f172a",
		color: highlighted ? "#4b22d6" : "#ffffff",
	};
}

export function PricingNode({
	data,
	variant,
	headerColor,
	highlightColor,
	borderRadius,
	ctaLabel,
	id,
	style,
	...rest
}: PricingNodeProps) {
	const parsed: PricingData = useMemo(() => parsePricingData(data), [data]);
	const radius = RADIUS[borderRadius ?? "lg"] ?? "16px";
	const headerBg = resolveSolidColor(headerColor, "#14162b");
	const highlightBg = resolveBackgroundPaint(highlightColor, "#ff1d96");
	const highlightSolid = resolveSolidColor(highlightColor, "#ff1d96");

	const isCards = variant === "cards" || variant === "cards-featured";
	const isFeatured = variant === "cards-featured";

	const gridStyle: CSSProperties = useMemo(
		() => ({
			display: "grid",
			gridTemplateColumns: `repeat(${parsed.tiers.length || 1}, 1fr)`,
			gap: "16px",
			alignItems: isFeatured ? "center" : "stretch",
		}),
		[parsed.tiers.length, isFeatured],
	);

	return (
		<div id={id} data-kiv-type="pricing" style={style} {...rest}>
			{!isCards ? (
				<div
					style={{
						borderRadius: radius,
						overflow: "hidden",
						border: "1px solid #e5e7eb",
					}}
				>
					<table
						style={{
							width: "100%",
							borderCollapse: "collapse",
							fontSize: "0.9rem",
						}}
					>
						<thead>
							<tr>
								<th />
								{parsed.tiers.map((t, i) => (
									<th
										// biome-ignore lint/suspicious/noArrayIndexKey: tiers are a fixed, ordered list parsed from the node's own data field
										key={i}
										style={thStyle(t.highlighted, highlightBg, headerBg)}
									>
										<span
											style={{
												display: "block",
												fontSize: "0.78rem",
												opacity: 0.85,
											}}
										>
											{t.period}
										</span>
										<span
											style={{
												display: "block",
												fontWeight: 800,
												fontStyle: "italic",
												marginTop: "2px",
											}}
										>
											{t.tier}
										</span>
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{parsed.rows.map((row, ri) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: rows are a fixed, ordered list parsed from the node's own data field
								<tr key={ri}>
									<td style={tdStyle(false, true, highlightSolid)}>
										{row.label}
									</td>
									{parsed.tiers.map((t, ti) => (
										<td
											// biome-ignore lint/suspicious/noArrayIndexKey: tiers are a fixed, ordered list parsed from the node's own data field
											key={ti}
											style={tdStyle(t.highlighted, false, highlightSolid)}
										>
											{row.values[ti] ?? ""}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<div style={gridStyle}>
					{parsed.tiers.map((t, ti) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: tiers are a fixed, ordered list parsed from the node's own data field
							key={ti}
							style={cardStyle(
								t.highlighted,
								isFeatured && !t.highlighted,
								radius,
								highlightBg,
							)}
						>
							{isFeatured && t.highlighted && (
								<span
									style={{
										position: "absolute",
										top: "-12px",
										right: "20px",
										background: "#ffb067",
										color: "#3a2200",
										fontSize: "0.68rem",
										fontWeight: 800,
										textTransform: "uppercase",
										letterSpacing: "0.04em",
										padding: "5px 10px",
										borderRadius: "999px",
									}}
								>
									Featured
								</span>
							)}
							<span
								style={{
									fontSize: "0.78rem",
									fontWeight: 700,
									textTransform: "uppercase",
									letterSpacing: "0.05em",
									opacity: 0.85,
								}}
							>
								{t.period}
							</span>
							<span
								style={{
									fontSize: "1.15rem",
									fontWeight: 800,
									fontStyle: "italic",
								}}
							>
								{t.tier}
							</span>
							<div>
								{parsed.rows.map((row, ri) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: rows are a fixed, ordered list parsed from the node's own data field
									<div key={ri} style={rowStyle(t.highlighted)}>
										<span style={rowLabelStyle(t.highlighted)}>
											{row.label}
										</span>
										<span style={{ fontWeight: 800 }}>
											{row.values[ti] ?? ""}
										</span>
									</div>
								))}
							</div>
							{ctaLabel && (
								<div style={ctaStyle(t.highlighted)}>{ctaLabel}</div>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
