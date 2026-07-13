import { defineNode, f } from "@kivcode/engine";
import { escapeHtml, normalizeSvgIconSize } from "../html-utils";
import { resolveIcon } from "../icons";

export const iconNode = defineNode({
	type: "icon",
	category: "media",
	label: "Icon",
	description: "CSS class or inline SVG icon",
	toHtml(props) {
		const icon = String(props.icon ?? "");
		const size = props.iconSize ?? 24;
		const color = String(props.iconColor || "currentColor");

		const svgHtml = resolveIconInHtml(icon);
		if (svgHtml) {
			return `<span style="display:inline-flex;font-size:${size}px;color:${escapeHtml(color)};" data-kiv-type="icon">${svgHtml}</span>`;
		}

		const style = `font-size:${size}px;color:${escapeHtml(color)};`;
		return `<span style="${style}" data-kiv-type="icon"><i class="${escapeHtml(icon)}" aria-hidden="true"></i></span>`;
	},
	fields: {
		icon: f.text({
			label: "Icon",
			default: "",
			group: "Content",
			pluginControl: "icon-picker",
		}),
	},
});

function resolveIconInHtml(icon: string): string | null {
	const svg = resolveIcon(icon);
	if (!svg) return null;
	return normalizeSvgIconSize(svg);
}
