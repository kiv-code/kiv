import type { FieldDescriptor } from "@kivcode/engine";
import { useMemo } from "react";

export interface TableEditorProps {
	value?: string;
	/** Part of the common plugin-control contract; unused here (same as the Vue original, which never declared it either). */
	fieldKey?: string;
	descriptor?: FieldDescriptor;
	onChange: (value: string) => void;
}

interface TableData {
	headers: string[];
	rows: string[][];
}

function parse(v: string | undefined): TableData {
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

function serialize(headers: string[], rows: string[][]): string {
	return JSON.stringify({ headers, rows });
}

export function TableEditor({
	value,
	fieldKey: _fieldKey,
	descriptor: _descriptor,
	onChange,
}: TableEditorProps) {
	const data = useMemo(() => parse(value), [value]);

	function updateHeader(index: number, headerValue: string): void {
		const h = [...data.headers];
		h[index] = headerValue;
		const r = data.rows.map((row) => [...row]);
		onChange(serialize(h, r));
	}

	function updateCell(rowIdx: number, colIdx: number, cellValue: string): void {
		const r = data.rows.map((row) => [...row]);
		const row = r[rowIdx];
		if (row) row[colIdx] = cellValue;
		onChange(serialize(data.headers, r));
	}

	function addRow(): void {
		const cols = data.headers.length;
		const r = data.rows.map((row) => [...row]);
		r.push(Array(cols).fill(""));
		onChange(serialize(data.headers, r));
	}

	function removeRow(index: number): void {
		const r = data.rows.filter((_, i) => i !== index).map((row) => [...row]);
		if (r.length === 0) r.push(Array(data.headers.length).fill(""));
		onChange(serialize(data.headers, r));
	}

	function addColumn(): void {
		const h = [...data.headers, `Column ${data.headers.length + 1}`];
		const r = data.rows.map((row) => [...row, ""]);
		onChange(serialize(h, r));
	}

	function removeColumn(index: number): void {
		if (data.headers.length <= 1) return;
		const h = data.headers.filter((_, i) => i !== index);
		const r = data.rows.map((row) => row.filter((_, i) => i !== index));
		onChange(serialize(h, r));
	}

	return (
		<div className="kiv-table-editor">
			<div className="kiv-table-editor__toolbar">
				<button
					type="button"
					className="kiv-table-editor__btn"
					onClick={addRow}
					title="Add row"
				>
					<svg
						width="12"
						height="12"
						viewBox="0 0 12 12"
						fill="none"
						aria-hidden="true"
					>
						<path
							d="M6 1v10M1 6h10"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
						/>
					</svg>
					Row
				</button>
				<button
					type="button"
					className="kiv-table-editor__btn"
					onClick={addColumn}
					title="Add column"
				>
					<svg
						width="12"
						height="12"
						viewBox="0 0 12 12"
						fill="none"
						aria-hidden="true"
					>
						<path
							d="M6 1v10M1 6h10"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
						/>
					</svg>
					Column
				</button>
			</div>
			<div className="kiv-table-editor__grid">
				<table>
					<thead>
						<tr>
							{data.headers.map((h, ci) => (
								<th
									// biome-ignore lint/suspicious/noArrayIndexKey: headers have no stable id — same positional keying as the Vue original's `:key="'h' + ci"`
									key={`h-${ci}`}
									className="kiv-table-editor__cell kiv-table-editor__cell--header"
								>
									<input
										value={h}
										className="kiv-table-editor__input"
										placeholder="Header"
										onChange={(e) => updateHeader(ci, e.target.value)}
									/>
									{data.headers.length > 1 && (
										<button
											type="button"
											className="kiv-table-editor__remove-col"
											onClick={() => removeColumn(ci)}
											title="Remove column"
										>
											&times;
										</button>
									)}
								</th>
							))}
							<th className="kiv-table-editor__cell kiv-table-editor__cell--actions" />
						</tr>
					</thead>
					<tbody>
						{data.rows.map((row, ri) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: rows have no stable id — same positional keying as the Vue original's `:key="'r' + ri"`
							<tr key={`r-${ri}`}>
								{row.map((cell, ci) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: cells have no stable id — same positional keying as the Vue original's `:key="'c' + ri + '-' + ci"`
									<td key={`c-${ri}-${ci}`} className="kiv-table-editor__cell">
										<input
											value={cell}
											className="kiv-table-editor__input"
											placeholder="..."
											onChange={(e) => updateCell(ri, ci, e.target.value)}
										/>
									</td>
								))}
								<td className="kiv-table-editor__cell kiv-table-editor__cell--actions">
									<button
										type="button"
										className="kiv-table-editor__remove-row"
										onClick={() => removeRow(ri)}
										title="Remove row"
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
