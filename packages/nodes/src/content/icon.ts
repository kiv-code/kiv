import { defineNode, f } from "@kivcode/engine";
import { escapeHtml, normalizeSvgIconSize } from "../html-utils";
import { resolveIcon } from "../icons";
import { sizeField } from "../size-field";

/**
 * Shared by `toHtml` and both framework renderers. Accepts a bare number from
 * documents written before `iconSize` was a real field, as well as the CSS
 * length the size control now writes — the renderers used to append their own
 * `px`, which turned "96px" into "96pxpx".
 */
export function resolveIconSize(value: unknown): string {
	if (typeof value === "number") return `${value}px`;
	const s = String(value ?? "").trim();
	return s || "24px";
}

export const iconNode = defineNode({
	type: "icon",
	category: "media",
	label: "Icon",
	description: "CSS class or inline SVG icon",
	toHtml(props) {
		const icon = String(props.icon ?? "");
		const size = resolveIconSize(props.iconSize);
		const color = String(props.iconColor || "currentColor");

		const svgHtml = resolveIconInHtml(icon);
		if (svgHtml) {
			return `<span style="display:inline-flex;font-size:${size};color:${escapeHtml(color)};" data-kiv-type="icon">${svgHtml}</span>`;
		}

		const style = `font-size:${size};color:${escapeHtml(color)};`;
		return `<span style="${style}" data-kiv-type="icon"><i class="${escapeHtml(icon)}" aria-hidden="true"></i></span>`;
	},
	fields: {
		icon: f.text({
			label: "Icon",
			default: "",
			group: "Content",
			pluginControl: "icon-picker",
		}),
		// `toHtml` already read this prop, but no field declared it — the size
		// was unreachable from the inspector and always rendered at 24px.
		iconSize: sizeField({
			label: "Size",
			default: "24px",
			group: "Style",
			units: [{ unit: "px", min: 8, max: 160, step: 1 }],
		}),
		iconColor: f.color({ label: "Color", default: "", group: "Style" }),
	},
});

function resolveIconInHtml(icon: string): string | null {
	const svg = resolveIcon(icon);
	if (!svg) return null;
	return normalizeSvgIconSize(svg);
}
