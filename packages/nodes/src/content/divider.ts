import { defineNode, f } from "@kiv/engine";
import { alignField } from "../align-field";
import { escapeHtml, styleToString } from "../html-utils";
import { SPACING } from "../scales";
import { sizeField } from "../size-field";

export const dividerNode = defineNode({
	type: "divider",
	category: "content",
	toHtml(props) {
		const thickness = props.thickness ?? 1;
		const color = escapeHtml(props.color ?? "#d1d5db");
		const lineStyle = escapeHtml(props.lineStyle ?? "solid");
		const width =
			props.width === "full" ? "100%" : String(props.width ?? "100%");
		const lineHtml = `<div style="height:0px;width:${width};border-top:${thickness}px ${lineStyle} ${color};flex-shrink:0;"></div>`;
		const justifyByAlignment: Record<string, string> = {
			left: "flex-start",
			center: "center",
			right: "flex-end",
		};
		const wrapperStyle = styleToString({
			display: "flex",
			width: "100%",
			paddingTop: SPACING[String(props.spacing ?? "md")] ?? "16px",
			paddingBottom: SPACING[String(props.spacing ?? "md")] ?? "16px",
			justifyContent:
				justifyByAlignment[String(props.alignment ?? "center")] ?? "center",
		});
		return `<div style="${wrapperStyle}" data-kiv-type="divider">${lineHtml}</div>`;
	},
	fields: {
		lineStyle: f.select(["solid", "dashed", "dotted", "double"], {
			label: "Style",
			default: "solid",
			group: "Style",
		}),
		color: f.color({
			label: "Color",
			default: "#d1d5db",
			group: "Style",
		}),
		thickness: f.number({
			label: "Thickness (px)",
			default: 1,
			responsive: true,
			group: "Style",
		}),
		width: sizeField({
			label: "Width",
			default: "100%",
			group: "Style",
			hint: "Any percentage or pixel value — drag the slider or type an exact size.",
		}),
		alignment: alignField({
			label: "Alignment",
			default: "center",
			responsive: true,
			group: "Style",
		}),
		spacing: f.select(["none", "xs", "sm", "md", "lg", "xl", "2xl"], {
			label: "Spacing",
			default: "md",
			responsive: true,
			group: "Style",
		}),
	},
});
