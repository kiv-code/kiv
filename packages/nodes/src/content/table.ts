import { defineNode, f } from "@kiv/engine";
import { alignField } from "../align-field";
import { escapeHtml, styleToString } from "../html-utils";

export interface TableData {
	headers: string[];
	rows: string[][];
}

/** Leniently parses the data JSON text field — malformed input never throws, it just renders an empty table. */
export function parseTableData(raw: unknown): TableData {
	if (typeof raw !== "string" || !raw.trim()) return { headers: [], rows: [] };
	try {
		const parsed = JSON.parse(raw);
		const headers = Array.isArray(parsed?.headers)
			? parsed.headers.map((h: unknown) => String(h))
			: [];
		const rows = Array.isArray(parsed?.rows)
			? parsed.rows.map((row: unknown) =>
					Array.isArray(row) ? row.map((cell) => String(cell)) : [],
				)
			: [];
		return { headers, rows };
	} catch {
		return { headers: [], rows: [] };
	}
}

export const tableNode = defineNode({
	type: "table",
	category: "content",
	label: "Table",
	icon: "table",
	toHtml(props) {
		const { headers, rows } = parseTableData(props.data);
		const bordered = props.bordered !== false;
		const striped = props.striped !== false;
		const compact = Boolean(props.compact);
		const align = String(props.align ?? "left");
		const headerBackground = String(props.headerBackground ?? "#f8fafc");
		const border = bordered ? "1px solid #e2e8f0" : "none";
		const cellPadding = compact ? "6px 10px" : "10px 14px";

		const tableStyle = styleToString({
			width: "100%",
			borderCollapse: "collapse",
			border,
		});
		const thStyle = styleToString({
			textAlign: align,
			padding: cellPadding,
			background: headerBackground,
			border,
			fontWeight: "700",
		});
		const cellStyleFor = (rowIndex: number) =>
			styleToString({
				textAlign: align,
				padding: cellPadding,
				border,
				background:
					striped && rowIndex % 2 === 1 ? "rgba(0,0,0,0.03)" : undefined,
			});

		const headHtml = headers.length
			? `<thead><tr>${headers.map((h) => `<th style="${thStyle}">${escapeHtml(h)}</th>`).join("")}</tr></thead>`
			: "";
		const bodyHtml = `<tbody>${rows
			.map(
				(row, rowIndex) =>
					`<tr>${row.map((cell) => `<td style="${cellStyleFor(rowIndex)}">${escapeHtml(cell)}</td>`).join("")}</tr>`,
			)
			.join("")}</tbody>`;

		return `<table style="${tableStyle}" data-kiv-type="table">${headHtml}${bodyHtml}</table>`;
	},
	fields: {
		data: f.textarea({
			label: "Data",
			default: '{"headers":["Column 1","Column 2"],"rows":[["",""]]}',
			group: "Content",
			pluginControl: "table-editor",
		}),
		striped: f.boolean({
			label: "Striped Rows",
			default: true,
			group: "Style",
		}),
		bordered: f.boolean({ label: "Bordered", default: true, group: "Style" }),
		compact: f.boolean({ label: "Compact", default: false, group: "Style" }),
		headerBackground: f.color({
			label: "Header Background",
			default: "#f8fafc",
			group: "Style",
		}),
		align: alignField({ label: "Cell Align", default: "left", group: "Style" }),
	},
});
