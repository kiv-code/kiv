<script setup lang="ts">
import { parseTableData } from "@kivcode/nodes";
import { computed } from "vue";

const props = withDefaults(
	defineProps<{
		data?: string;
		striped?: boolean;
		bordered?: boolean;
		compact?: boolean;
		headerBackground?: string;
		align?: string;
	}>(),
	{ striped: true, bordered: true },
);

const parsed = computed(() => parseTableData(props.data));
const cellAlign = computed(
	() => (props.align ?? "left") as "left" | "center" | "right",
);
const cellPadding = computed(() => (props.compact ? "6px 10px" : "10px 14px"));
const border = computed(() => (props.bordered ? "1px solid #e2e8f0" : "none"));

const tableStyle = computed(() => ({
	width: "100%",
	borderCollapse: "collapse" as const,
	border: border.value,
}));
const thStyle = computed(() => ({
	textAlign: cellAlign.value,
	padding: cellPadding.value,
	background: props.headerBackground ?? "#f8fafc",
	border: border.value,
	fontWeight: "700" as const,
}));

function cellStyle(rowIndex: number) {
	return {
		textAlign: cellAlign.value,
		padding: cellPadding.value,
		border: border.value,
		background:
			props.striped && rowIndex % 2 === 1 ? "rgba(0,0,0,0.03)" : undefined,
	};
}
</script>

<template>
	<table :style="tableStyle" data-kiv-type="table">
		<thead v-if="parsed.headers.length">
			<tr>
				<th v-for="(h, i) in parsed.headers" :key="i" :style="thStyle">{{ h }}</th>
			</tr>
		</thead>
		<tbody>
			<tr v-for="(row, rowIndex) in parsed.rows" :key="rowIndex">
				<td v-for="(cell, cellIndex) in row" :key="cellIndex" :style="cellStyle(rowIndex)">{{ cell }}</td>
			</tr>
		</tbody>
	</table>
</template>
