import { parseTableData } from "@kivcode/nodes";
import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface TableNodeProps extends KivNodeComponentProps {
	data?: string;
	striped?: boolean;
	bordered?: boolean;
	compact?: boolean;
	headerBackground?: string;
	align?: string;
}

export function TableNode({
	data,
	striped = true,
	bordered = true,
	compact,
	headerBackground,
	align,
	id,
	style,
	...rest
}: TableNodeProps) {
	const parsed = useMemo(() => parseTableData(data), [data]);
	const cellAlign = (align ?? "left") as "left" | "center" | "right";
	const cellPadding = compact ? "6px 10px" : "10px 14px";
	const border = bordered ? "1px solid #e2e8f0" : "none";

	const tableStyle = useMemo(
		() => ({
			width: "100%",
			borderCollapse: "collapse" as const,
			border,
			...style,
		}),
		[border, style],
	);
	const thStyle = useMemo(
		() => ({
			textAlign: cellAlign,
			padding: cellPadding,
			background: headerBackground ?? "#f8fafc",
			border,
			fontWeight: "700" as const,
		}),
		[cellAlign, cellPadding, headerBackground, border],
	);

	function cellStyle(rowIndex: number) {
		return {
			textAlign: cellAlign,
			padding: cellPadding,
			border,
			background:
				striped && rowIndex % 2 === 1 ? "rgba(0,0,0,0.03)" : undefined,
		};
	}

	return (
		<table id={id} style={tableStyle} data-kiv-type="table" {...rest}>
			{parsed.headers.length > 0 && (
				<thead>
					<tr>
						{parsed.headers.map((h, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: header cells have no stable identity, mirrors the Vue original's index key
							<th key={i} style={thStyle}>
								{h}
							</th>
						))}
					</tr>
				</thead>
			)}
			<tbody>
				{parsed.rows.map((row, rowIndex) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: rows have no stable identity, mirrors the Vue original's index key
					<tr key={rowIndex}>
						{row.map((cell, cellIndex) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: cells have no stable identity, mirrors the Vue original's index key
							<td key={cellIndex} style={cellStyle(rowIndex)}>
								{cell}
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
}
