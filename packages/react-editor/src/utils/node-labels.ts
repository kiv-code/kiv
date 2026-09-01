import type { Registry } from "@kivcode/engine";

// The registry's `label`/`category` (declared once per node in `@kivcode/nodes`)
// are the single source of truth — these helpers only add editor-specific
// presentation on top (an abbreviation for tight badges, a color per category).

// Abbreviated label for canvas overlay badges, where the full label doesn't fit.
// Only list types where the short form actually differs from the full label.
const SHORT_OVERRIDES: Record<string, string> = {
	container: "Box",
	column: "Col",
	"form-field": "Field",
	stat: "Stat",
	"social-icons": "Social",
	embed: "Embed",
	"accordion-item": "Item",
	"tab-panel": "Panel",
	"agenda-item": "Item",
};

export function getNodeLabel(type: string, registry?: Registry): string {
	return registry?.get(type)?.label ?? type;
}

export function getNodeLabelShort(type: string, registry?: Registry): string {
	return SHORT_OVERRIDES[type] ?? getNodeLabel(type, registry);
}

const CATEGORY_TINT: Record<string, string> = {
	layout: "rgba(148, 163, 184, 0.16)",
	content: "rgba(129, 140, 248, 0.18)",
	media: "rgba(52, 211, 153, 0.16)",
	interactive: "rgba(244, 114, 182, 0.16)",
};

export function getNodeCategoryTint(type: string, registry?: Registry): string {
	const category = registry?.get(type)?.category ?? "layout";
	return CATEGORY_TINT[category] ?? CATEGORY_TINT.layout ?? "";
}
