<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
	modelValue?: string;
}>();

const emit = defineEmits<{
	"update:modelValue": [value: string];
}>();

function parse(v: string | undefined): { headers: string[]; rows: string[][] } {
	if (!v) return { headers: [""], rows: [[""]] };
	try {
		const p = JSON.parse(v);
		const headers: string[] = Array.isArray(p?.headers)
			? p.headers.map(String)
			: [""];
		const rows: string[][] = Array.isArray(p?.rows)
			? p.rows.map((r: unknown) => (Array.isArray(r) ? r.map(String) : [""]))
			: [[""]];
		return { headers, rows };
	} catch {
		return { headers: [""], rows: [[""]] };
	}
}

const data = computed(() => parse(props.modelValue));

function serialize(headers: string[], rows: string[][]): string {
	return JSON.stringify({ headers, rows });
}

function updateHeader(index: number, value: string): void {
	const h = [...data.value.headers];
	h[index] = value;
	const r = data.value.rows.map((row) => [...row]);
	emit("update:modelValue", serialize(h, r));
}

function updateCell(rowIdx: number, colIdx: number, value: string): void {
	const r = data.value.rows.map((row) => [...row]);
	const row = r[rowIdx];
	if (row) row[colIdx] = value;
	emit("update:modelValue", serialize(data.value.headers, r));
}

function addRow(): void {
	const cols = data.value.headers.length;
	const r = data.value.rows.map((row) => [...row]);
	r.push(Array(cols).fill(""));
	emit("update:modelValue", serialize(data.value.headers, r));
}

function removeRow(index: number): void {
	const r = data.value.rows
		.filter((_, i) => i !== index)
		.map((row) => [...row]);
	if (r.length === 0) r.push(Array(data.value.headers.length).fill(""));
	emit("update:modelValue", serialize(data.value.headers, r));
}

function addColumn(): void {
	const h = [...data.value.headers, `Column ${data.value.headers.length + 1}`];
	const r = data.value.rows.map((row) => [...row, ""]);
	emit("update:modelValue", serialize(h, r));
}

function removeColumn(index: number): void {
	if (data.value.headers.length <= 1) return;
	const h = data.value.headers.filter((_, i) => i !== index);
	const r = data.value.rows.map((row) => row.filter((_, i) => i !== index));
	emit("update:modelValue", serialize(h, r));
}
</script>

<template>
	<div class="kiv-table-editor">
		<div class="kiv-table-editor__toolbar">
			<button type="button" class="kiv-table-editor__btn" @click="addRow" title="Add row">
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
				Row
			</button>
			<button type="button" class="kiv-table-editor__btn" @click="addColumn" title="Add column">
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
				Column
			</button>
		</div>
		<div class="kiv-table-editor__grid">
			<table>
				<thead>
					<tr>
						<th v-for="(h, ci) in data.headers" :key="'h' + ci" class="kiv-table-editor__cell kiv-table-editor__cell--header">
							<input
								:value="h"
								class="kiv-table-editor__input"
								placeholder="Header"
								@input="updateHeader(ci, ($event.target as HTMLInputElement).value)"
							/>
							<button
								v-if="data.headers.length > 1"
								type="button"
								class="kiv-table-editor__remove-col"
								@click="removeColumn(ci)"
								title="Remove column"
							>&times;</button>
						</th>
						<th class="kiv-table-editor__cell kiv-table-editor__cell--actions"></th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(row, ri) in data.rows" :key="'r' + ri">
						<td v-for="(cell, ci) in row" :key="'c' + ri + '-' + ci" class="kiv-table-editor__cell">
							<input
								:value="cell"
								class="kiv-table-editor__input"
								placeholder="..."
								@input="updateCell(ri, ci, ($event.target as HTMLInputElement).value)"
							/>
						</td>
						<td class="kiv-table-editor__cell kiv-table-editor__cell--actions">
							<button
								type="button"
								class="kiv-table-editor__remove-row"
								@click="removeRow(ri)"
								title="Remove row"
							>&times;</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<style scoped>
.kiv-table-editor {
	display: flex;
	flex-direction: column;
	gap: 8px;
}
.kiv-table-editor__toolbar {
	display: flex;
	gap: 6px;
}
.kiv-table-editor__btn {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 4px 10px;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	background: #f8fafc;
	color: #334155;
	font-size: 0.75rem;
	cursor: pointer;
}
.kiv-table-editor__grid {
	max-height: 260px;
	overflow: auto;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
}
.kiv-table-editor__grid table {
	width: 100%;
	border-collapse: collapse;
}
.kiv-table-editor__cell {
	position: relative;
	padding: 2px;
	border: 1px solid #e2e8f0;
	vertical-align: top;
}
.kiv-table-editor__cell--header {
	background: #f1f5f9;
}
.kiv-table-editor__cell--actions {
	width: 28px;
	padding: 0;
	text-align: center;
	border: none;
	background: transparent;
}
.kiv-table-editor__input {
	width: 100%;
	min-width: 60px;
	padding: 4px 6px;
	border: none;
	background: transparent;
	color: #0f172a;
	font-size: 0.8rem;
	outline: none;
}
.kiv-table-editor__input:focus {
	background: #eef2ff;
	border-radius: 3px;
}
.kiv-table-editor__remove-col,
.kiv-table-editor__remove-row {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 18px;
	height: 18px;
	border: none;
	border-radius: 4px;
	background: transparent;
	color: #94a3b8;
	font-size: 0.85rem;
	cursor: pointer;
	opacity: 0;
	transition: opacity 0.15s;
}
.kiv-table-editor__cell:hover .kiv-table-editor__remove-col,
.kiv-table-editor__cell:hover .kiv-table-editor__remove-row,
.kiv-table-editor__remove-col:focus,
.kiv-table-editor__remove-row:focus {
	opacity: 1;
}
.kiv-table-editor__remove-col:hover,
.kiv-table-editor__remove-row:hover {
	color: #ef4444;
	background: #fef2f2;
}
</style>
