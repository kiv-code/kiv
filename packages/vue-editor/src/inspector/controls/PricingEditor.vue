<script setup lang="ts">
import type { PricingData } from "@kiv/nodes";
import { computed } from "vue";

const props = defineProps<{
	modelValue?: string;
}>();

const emit = defineEmits<{
	"update:modelValue": [value: string];
}>();

function parse(v: string | undefined): PricingData {
	if (!v)
		return {
			tiers: [{ period: "", tier: "", highlighted: false }],
			rows: [{ label: "", values: [""] }],
		};
	try {
		const p = JSON.parse(v);
		const tiers = Array.isArray(p?.tiers)
			? p.tiers.map((t: Record<string, unknown>) => ({
					period: String(t?.period ?? ""),
					tier: String(t?.tier ?? ""),
					highlighted: Boolean(t?.highlighted),
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

const data = computed(() => parse(props.modelValue));

function serialize(d: PricingData): string {
	return JSON.stringify(d);
}

function updateTier(
	index: number,
	patch: Partial<PricingData["tiers"][number]>,
): void {
	const tiers = data.value.tiers.map((t, i) =>
		i === index ? { ...t, ...patch } : t,
	);
	emit("update:modelValue", serialize({ ...data.value, tiers }));
}

function updateRowLabel(index: number, label: string): void {
	const rows = data.value.rows.map((r, i) =>
		i === index ? { ...r, label } : r,
	);
	emit("update:modelValue", serialize({ ...data.value, rows }));
}

function updateCell(rowIdx: number, tierIdx: number, value: string): void {
	const rows = data.value.rows.map((r, i) => {
		if (i !== rowIdx) return r;
		const values = [...r.values];
		values[tierIdx] = value;
		return { ...r, values };
	});
	emit("update:modelValue", serialize({ ...data.value, rows }));
}

function addTier(): void {
	const tiers = [
		...data.value.tiers,
		{ period: "", tier: "", highlighted: false },
	];
	const rows = data.value.rows.map((r) => ({
		...r,
		values: [...r.values, ""],
	}));
	emit("update:modelValue", serialize({ tiers, rows }));
}

function removeTier(index: number): void {
	if (data.value.tiers.length <= 1) return;
	const tiers = data.value.tiers.filter((_, i) => i !== index);
	const rows = data.value.rows.map((r) => ({
		...r,
		values: r.values.filter((_, i) => i !== index),
	}));
	emit("update:modelValue", serialize({ tiers, rows }));
}

function addRow(): void {
	const rows = [
		...data.value.rows,
		{ label: "", values: data.value.tiers.map(() => "") },
	];
	emit("update:modelValue", serialize({ ...data.value, rows }));
}

function removeRow(index: number): void {
	const rows = data.value.rows.filter((_, i) => i !== index);
	emit(
		"update:modelValue",
		serialize({
			...data.value,
			rows: rows.length
				? rows
				: [{ label: "", values: data.value.tiers.map(() => "") }],
		}),
	);
}
</script>

<template>
	<div class="kiv-pricing-editor">
		<div class="kiv-pricing-editor__toolbar">
			<button type="button" class="kiv-pricing-editor__btn" @click="addTier">+ Tier</button>
			<button type="button" class="kiv-pricing-editor__btn" @click="addRow">+ Row</button>
		</div>
		<div class="kiv-pricing-editor__grid">
			<table>
				<thead>
					<tr>
						<th class="kiv-pricing-editor__cell kiv-pricing-editor__cell--actions"></th>
						<th
							v-for="(tier, ti) in data.tiers"
							:key="'tier' + ti"
							class="kiv-pricing-editor__cell kiv-pricing-editor__cell--header"
						>
							<input
								:value="tier.period"
								class="kiv-pricing-editor__input"
								placeholder="Period"
								@input="updateTier(ti, { period: ($event.target as HTMLInputElement).value })"
							/>
							<input
								:value="tier.tier"
								class="kiv-pricing-editor__input kiv-pricing-editor__input--strong"
								placeholder="Tier"
								@input="updateTier(ti, { tier: ($event.target as HTMLInputElement).value })"
							/>
							<label class="kiv-pricing-editor__highlight">
								<input
									type="checkbox"
									:checked="tier.highlighted"
									@change="updateTier(ti, { highlighted: ($event.target as HTMLInputElement).checked })"
								/>
								Highlight
							</label>
							<button
								v-if="data.tiers.length > 1"
								type="button"
								class="kiv-pricing-editor__remove"
								title="Remove tier"
								@click="removeTier(ti)"
							>&times;</button>
						</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(row, ri) in data.rows" :key="'row' + ri">
						<td class="kiv-pricing-editor__cell">
							<input
								:value="row.label"
								class="kiv-pricing-editor__input"
								placeholder="Row label"
								@input="updateRowLabel(ri, ($event.target as HTMLInputElement).value)"
							/>
						</td>
						<td
							v-for="(tier, ti) in data.tiers"
							:key="'cell' + ri + '-' + ti"
							class="kiv-pricing-editor__cell"
						>
							<input
								:value="row.values[ti] ?? ''"
								class="kiv-pricing-editor__input"
								placeholder="Value"
								@input="updateCell(ri, ti, ($event.target as HTMLInputElement).value)"
							/>
						</td>
						<td class="kiv-pricing-editor__cell kiv-pricing-editor__cell--actions">
							<button
								type="button"
								class="kiv-pricing-editor__remove"
								title="Remove row"
								@click="removeRow(ri)"
							>&times;</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<style scoped>
.kiv-pricing-editor {
	display: flex;
	flex-direction: column;
	gap: 8px;
}
.kiv-pricing-editor__toolbar {
	display: flex;
	gap: 6px;
}
.kiv-pricing-editor__btn {
	padding: 4px 10px;
	border: 1px solid var(--color-border);
	border-radius: 6px;
	background: var(--color-surface-sunken);
	color: var(--color-text-secondary);
	font-size: 0.75rem;
	cursor: pointer;
}
.kiv-pricing-editor__grid {
	max-height: 320px;
	overflow: auto;
	border: 1px solid var(--color-border);
	border-radius: 6px;
}
.kiv-pricing-editor__grid table {
	width: 100%;
	border-collapse: collapse;
}
.kiv-pricing-editor__cell {
	position: relative;
	padding: 4px;
	border: 1px solid var(--color-border);
	vertical-align: top;
	min-width: 90px;
}
.kiv-pricing-editor__cell--header {
	background: var(--color-surface-overlay);
}
.kiv-pricing-editor__cell--actions {
	width: 24px;
	padding: 0;
	text-align: center;
	border: none;
	background: transparent;
}
.kiv-pricing-editor__input {
	width: 100%;
	padding: 3px 5px;
	border: none;
	background: transparent;
	color: var(--color-text-primary);
	font-size: 0.78rem;
	outline: none;
	display: block;
}
.kiv-pricing-editor__input--strong {
	font-weight: 700;
}
.kiv-pricing-editor__input:focus {
	background: var(--color-accent-muted);
	border-radius: 3px;
}
.kiv-pricing-editor__highlight {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 0.68rem;
	color: var(--color-text-muted);
	padding: 2px 4px;
}
.kiv-pricing-editor__remove {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 18px;
	height: 18px;
	border: none;
	border-radius: 4px;
	background: transparent;
	color: var(--color-text-muted);
	font-size: 0.85rem;
	cursor: pointer;
}
.kiv-pricing-editor__remove:hover {
	color: #ef4444;
}
</style>
