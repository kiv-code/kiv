<script setup lang="ts">
import {
	type PricingData,
	parsePricingData,
	RADIUS,
	resolveBackgroundPaint,
	resolveSolidColor,
} from "@kiv/nodes";
import { computed } from "vue";

const props = defineProps<{
	data?: string;
	variant?: string;
	headerColor?: string;
	highlightColor?: unknown;
	borderRadius?: string;
	ctaLabel?: string;
}>();

const parsed = computed<PricingData>(() => parsePricingData(props.data));
const radius = computed(() => RADIUS[props.borderRadius ?? "lg"] ?? "16px");
const headerBg = computed(() =>
	resolveSolidColor(props.headerColor, "#14162b"),
);
const highlightBg = computed(() =>
	resolveBackgroundPaint(props.highlightColor, "#ff1d96"),
);
const highlightSolid = computed(() =>
	resolveSolidColor(props.highlightColor, "#ff1d96"),
);

function thStyle(highlighted: boolean) {
	return {
		background: highlighted ? highlightBg.value : headerBg.value,
		color: "#ffffff",
		textAlign: "center" as const,
		padding: "14px 16px",
		fontSize: "0.82rem",
		fontWeight: "500",
	};
}
function tdStyle(highlighted: boolean, isLabel: boolean) {
	return {
		textAlign: (isLabel ? "left" : "center") as "left" | "center",
		padding: "16px",
		background: highlighted ? `${highlightSolid.value}1a` : "#ffffff",
		color: highlighted ? highlightSolid.value : "#0f172a",
		borderTop: "1px solid #e5e7eb",
		fontWeight: "700",
	};
}
function cardStyle(highlighted: boolean, scaled: boolean) {
	return {
		borderRadius: radius.value,
		padding: "22px",
		border: highlighted ? "none" : "1px solid #e5e7eb",
		background: highlighted ? highlightBg.value : "#ffffff",
		color: highlighted ? "#ffffff" : "#0f172a",
		display: "flex" as const,
		flexDirection: "column" as const,
		gap: "14px",
		position: "relative" as const,
		transform: scaled ? "scale(0.97)" : undefined,
	};
}
function rowStyle(highlighted: boolean) {
	return {
		display: "flex" as const,
		justifyContent: "space-between" as const,
		fontSize: "0.86rem",
		padding: "8px 0",
		borderTop: highlighted
			? "1px solid rgba(255,255,255,0.28)"
			: "1px solid #e5e7eb",
	};
}
function rowLabelStyle(highlighted: boolean) {
	return { color: highlighted ? "rgba(255,255,255,0.85)" : "#64748b" };
}
function ctaStyle(highlighted: boolean) {
	return {
		marginTop: "6px",
		textAlign: "center" as const,
		padding: "10px",
		borderRadius: RADIUS.sm,
		fontWeight: "700",
		fontSize: "0.85rem",
		background: highlighted ? "#ffffff" : "#0f172a",
		color: highlighted ? "#4b22d6" : "#ffffff",
	};
}

const isCards = computed(
	() => props.variant === "cards" || props.variant === "cards-featured",
);
const isFeatured = computed(() => props.variant === "cards-featured");
const gridStyle = computed(() => ({
	display: "grid" as const,
	gridTemplateColumns: `repeat(${parsed.value.tiers.length || 1}, 1fr)`,
	gap: "16px",
	alignItems: (isFeatured.value ? "center" : "stretch") as "center" | "stretch",
}));
</script>

<template>
	<div data-kiv-type="pricing">
		<!-- table -->
		<div
			v-if="!isCards"
			:style="{ borderRadius: radius, overflow: 'hidden', border: '1px solid #e5e7eb' }"
		>
			<table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
				<thead>
					<tr>
						<th></th>
						<th v-for="(t, i) in parsed.tiers" :key="'th' + i" :style="thStyle(t.highlighted)">
							<span style="display: block; font-size: 0.78rem; opacity: 0.85;">{{ t.period }}</span>
							<span style="display: block; font-weight: 800; font-style: italic; margin-top: 2px;">{{ t.tier }}</span>
						</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(row, ri) in parsed.rows" :key="'row' + ri">
						<td :style="tdStyle(false, true)">{{ row.label }}</td>
						<td v-for="(t, ti) in parsed.tiers" :key="'cell' + ri + '-' + ti" :style="tdStyle(t.highlighted, false)">
							{{ row.values[ti] ?? "" }}
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- cards / cards-featured -->
		<div v-else :style="gridStyle">
			<div
				v-for="(t, ti) in parsed.tiers"
				:key="'card' + ti"
				:style="cardStyle(t.highlighted, isFeatured && !t.highlighted)"
			>
				<span
					v-if="isFeatured && t.highlighted"
					style="position: absolute; top: -12px; right: 20px; background: #ffb067; color: #3a2200; font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; padding: 5px 10px; border-radius: 999px;"
				>Featured</span>
				<span style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.85;">{{ t.period }}</span>
				<span style="font-size: 1.15rem; font-weight: 800; font-style: italic;">{{ t.tier }}</span>
				<div>
					<div v-for="(row, ri) in parsed.rows" :key="'r' + ri" :style="rowStyle(t.highlighted)">
						<span :style="rowLabelStyle(t.highlighted)">{{ row.label }}</span>
						<span style="font-weight: 800;">{{ row.values[ti] ?? "" }}</span>
					</div>
				</div>
				<div v-if="ctaLabel" :style="ctaStyle(t.highlighted)">{{ ctaLabel }}</div>
			</div>
		</div>
	</div>
</template>
