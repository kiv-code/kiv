import type { FieldDescriptor } from "@kivcode/engine";
import type { LinkType, PricingData } from "@kivcode/nodes";
import { useMemo } from "react";

export interface PricingEditorProps {
	value?: string;
	/** Part of the common plugin-control contract; unused here (same as the Vue original, which never declared it either). */
	fieldKey?: string;
	descriptor?: FieldDescriptor;
	onChange: (value: string) => void;
}

const LINK_TYPES: LinkType[] = ["none", "internal", "external", "anchor"];

function parse(v: string | undefined): PricingData {
	if (!v)
		return {
			tiers: [{ period: "", tier: "", highlighted: false }],
			rows: [{ label: "", values: [""] }],
		};
	try {
		const p = JSON.parse(v);
		// `ctaLinkType`/`ctaHref` stay `undefined` when the tier never set its
		// own link — not defaulted to "none" here, or re-saving any OTHER
		// tier's edit would bake "none" into every tier that was never
		// touched, permanently overriding the shared link's fallback for them.
		const tiers = Array.isArray(p?.tiers)
			? p.tiers.map((t: Record<string, unknown>) => ({
					period: String(t?.period ?? ""),
					tier: String(t?.tier ?? ""),
					highlighted: Boolean(t?.highlighted),
					ctaLinkType:
						typeof t?.ctaLinkType === "string"
							? (t.ctaLinkType as LinkType)
							: undefined,
					ctaHref: typeof t?.ctaHref === "string" ? t.ctaHref : undefined,
				}))
			: [{ period: "", tier: "", highlighted: false }];
		const rows = Array.isArray(p?.rows)
			? p.rows.map((r: Record<string, unknown>) => ({
					label: String(r?.label ?? ""),
					values: Array.isArray(r?.values) ? r.values.map(String) : [""],
				}))
			: [{ label: "", values: [""] }];
		return { tiers, rows };
	} catch {
		return {
			tiers: [{ period: "", tier: "", highlighted: false }],
			rows: [{ label: "", values: [""] }],
		};
	}
}

function serialize(d: PricingData): string {
	return JSON.stringify(d);
}

export function PricingEditor({
	value,
	fieldKey: _fieldKey,
	descriptor: _descriptor,
	onChange,
}: PricingEditorProps) {
	const data = useMemo(() => parse(value), [value]);

	function updateTier(
		index: number,
		patch: Partial<PricingData["tiers"][number]>,
	): void {
		const tiers = data.tiers.map((t, i) =>
			i === index ? { ...t, ...patch } : t,
		);
		onChange(serialize({ ...data, tiers }));
	}

	function updateRowLabel(index: number, label: string): void {
		const rows = data.rows.map((r, i) => (i === index ? { ...r, label } : r));
		onChange(serialize({ ...data, rows }));
	}

	function updateCell(
		rowIdx: number,
		tierIdx: number,
		cellValue: string,
	): void {
		const rows = data.rows.map((r, i) => {
			if (i !== rowIdx) return r;
			const values = [...r.values];
			values[tierIdx] = cellValue;
			return { ...r, values };
		});
		onChange(serialize({ ...data, rows }));
	}

	function updateTierLinkType(index: number, value: string): void {
		updateTier(index, { ctaLinkType: value as LinkType });
	}

	function addTier(): void {
		const tiers = [...data.tiers, { period: "", tier: "", highlighted: false }];
		const rows = data.rows.map((r) => ({ ...r, values: [...r.values, ""] }));
		onChange(serialize({ tiers, rows }));
	}

	function removeTier(index: number): void {
		if (data.tiers.length <= 1) return;
		const tiers = data.tiers.filter((_, i) => i !== index);
		const rows = data.rows.map((r) => ({
			...r,
			values: r.values.filter((_, i) => i !== index),
		}));
		onChange(serialize({ tiers, rows }));
	}

	function addRow(): void {
		const rows = [
			...data.rows,
			{ label: "", values: data.tiers.map(() => "") },
		];
		onChange(serialize({ ...data, rows }));
	}

	function removeRow(index: number): void {
		const rows = data.rows.filter((_, i) => i !== index);
		onChange(
			serialize({
				...data,
				rows: rows.length
					? rows
					: [{ label: "", values: data.tiers.map(() => "") }],
			}),
		);
	}

	return (
		<div className="kiv-pricing-editor">
			<div className="kiv-pricing-editor__toolbar">
				<button
					type="button"
					className="kiv-pricing-editor__btn"
					onClick={addTier}
				>
					+ Tier
				</button>
				<button
					type="button"
					className="kiv-pricing-editor__btn"
					onClick={addRow}
				>
					+ Row
				</button>
			</div>
			<div className="kiv-pricing-editor__grid">
				<table>
					<thead>
						<tr>
							<th className="kiv-pricing-editor__cell kiv-pricing-editor__cell--actions" />
							{data.tiers.map((tier, ti) => (
								<th
									// biome-ignore lint/suspicious/noArrayIndexKey: tiers have no stable id — same positional keying as the Vue original's `:key="'tier' + ti"`
									key={`tier-${ti}`}
									className="kiv-pricing-editor__cell kiv-pricing-editor__cell--header"
								>
									<input
										value={tier.period}
										className="kiv-pricing-editor__input"
										placeholder="Period"
										onChange={(e) => updateTier(ti, { period: e.target.value })}
									/>
									<input
										value={tier.tier}
										className="kiv-pricing-editor__input kiv-pricing-editor__input--strong"
										placeholder="Tier"
										onChange={(e) => updateTier(ti, { tier: e.target.value })}
									/>
									<label className="kiv-pricing-editor__highlight">
										<input
											type="checkbox"
											checked={tier.highlighted}
											onChange={(e) =>
												updateTier(ti, { highlighted: e.target.checked })
											}
										/>
										Highlight
									</label>
									<select
										className="kiv-pricing-editor__input kiv-pricing-editor__select"
										value={tier.ctaLinkType ?? "none"}
										title="This tier's own CTA link — overrides the shared one below when set"
										onChange={(e) => updateTierLinkType(ti, e.target.value)}
									>
										{LINK_TYPES.map((lt) => (
											<option key={lt} value={lt}>
												{lt}
											</option>
										))}
									</select>
									{tier.ctaLinkType && tier.ctaLinkType !== "none" && (
										<input
											value={tier.ctaHref ?? ""}
											className="kiv-pricing-editor__input"
											placeholder="/path, https://…, or #section-id"
											onChange={(e) =>
												updateTier(ti, { ctaHref: e.target.value })
											}
										/>
									)}
									{data.tiers.length > 1 && (
										<button
											type="button"
											className="kiv-pricing-editor__remove"
											title="Remove tier"
											onClick={() => removeTier(ti)}
										>
											&times;
										</button>
									)}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{data.rows.map((row, ri) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: rows have no stable id — same positional keying as the Vue original's `:key="'row' + ri"`
							<tr key={`row-${ri}`}>
								<td className="kiv-pricing-editor__cell">
									<input
										value={row.label}
										className="kiv-pricing-editor__input"
										placeholder="Row label"
										onChange={(e) => updateRowLabel(ri, e.target.value)}
									/>
								</td>
								{data.tiers.map((_tier, ti) => (
									<td
										// biome-ignore lint/suspicious/noArrayIndexKey: cells have no stable id — same positional keying as the Vue original's `:key="'cell' + ri + '-' + ti"`
										key={`cell-${ri}-${ti}`}
										className="kiv-pricing-editor__cell"
									>
										<input
											value={row.values[ti] ?? ""}
											className="kiv-pricing-editor__input"
											placeholder="Value"
											onChange={(e) => updateCell(ri, ti, e.target.value)}
										/>
									</td>
								))}
								<td className="kiv-pricing-editor__cell kiv-pricing-editor__cell--actions">
									<button
										type="button"
										className="kiv-pricing-editor__remove"
										title="Remove row"
										onClick={() => removeRow(ri)}
									>
										&times;
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
