import type { KivNode, Registry } from "@kivcode/engine";

export interface PaletteItem {
	type: string;
	label: string;
	description: string;
	hasDefaultSlot: boolean;
	category: string;
}

// Display order for the built-in palette, plus the one thing the registry
// can't express: whether a freshly-created node needs a seeded empty default
// slot. Label/description/category are the node's own `defineNode()` fields
// (single source of truth, see `@kivcode/nodes`) — looked up via `buildPalette`.
const PALETTE_ORDER: ReadonlyArray<{ type: string; hasDefaultSlot: boolean }> =
	[
		{ type: "section", hasDefaultSlot: true },
		{ type: "container", hasDefaultSlot: true },
		{ type: "stack", hasDefaultSlot: true },
		{ type: "grid", hasDefaultSlot: true },
		{ type: "column", hasDefaultSlot: true },
		{ type: "spacer", hasDefaultSlot: false },
		{ type: "heading", hasDefaultSlot: false },
		{ type: "rich-text", hasDefaultSlot: false },
		{ type: "text", hasDefaultSlot: false },
		{ type: "button", hasDefaultSlot: false },
		// Link wraps an optional default slot (icon/image/text children) and falls
		// back to the flat `text` field when that slot is empty — so giving new
		// Link nodes an (empty) default slot up front doesn't regress the
		// plain-text case, it just also lets the editor's "insert inside" and
		// indent (Tab) flows nest content into it.
		{ type: "link", hasDefaultSlot: true },
		{ type: "divider", hasDefaultSlot: false },
		{ type: "form", hasDefaultSlot: true },
		{ type: "form-field", hasDefaultSlot: false },
		{ type: "testimonial", hasDefaultSlot: false },
		{ type: "card", hasDefaultSlot: true },
		{ type: "countdown", hasDefaultSlot: false },
		{ type: "stat", hasDefaultSlot: false },
		{ type: "social-icons", hasDefaultSlot: false },
		{ type: "embed", hasDefaultSlot: false },
		{ type: "table", hasDefaultSlot: false },
		{ type: "agenda", hasDefaultSlot: true },
		{ type: "agenda-item", hasDefaultSlot: false },
		{ type: "pricing", hasDefaultSlot: false },
		{ type: "image", hasDefaultSlot: false },
		{ type: "video", hasDefaultSlot: false },
		{ type: "icon", hasDefaultSlot: false },
		{ type: "carousel", hasDefaultSlot: true },
		{ type: "accordion", hasDefaultSlot: true },
		{ type: "accordion-item", hasDefaultSlot: true },
		{ type: "tabs", hasDefaultSlot: true },
		{ type: "tab-panel", hasDefaultSlot: true },
		{ type: "modal", hasDefaultSlot: true },
	];

/** Leaf node types — cannot contain children. Derived from `PALETTE_ORDER`,
 * not a separate list: "leaf" and "no default slot" are the same fact. */
export const LEAF_TYPES = new Set(
	PALETTE_ORDER.filter((p) => !p.hasDefaultSlot).map((p) => p.type),
);

export function buildPalette(registry?: Registry): PaletteItem[] {
	return PALETTE_ORDER.map(({ type, hasDefaultSlot }) => {
		const compiled = registry?.get(type);
		return {
			type,
			label: compiled?.label ?? type,
			description: compiled?.description ?? "",
			category: compiled?.category ?? "content",
			hasDefaultSlot,
		};
	});
}

export function paletteItemByType(
	type: string,
	registry?: Registry,
): PaletteItem | undefined {
	const entry = PALETTE_ORDER.find((p) => p.type === type);
	if (!entry) return undefined;
	const compiled = registry?.get(type);
	return {
		type,
		label: compiled?.label ?? type,
		description: compiled?.description ?? "",
		category: compiled?.category ?? "content",
		hasDefaultSlot: entry.hasDefaultSlot,
	};
}

export const CATEGORY_META: Record<string, { label: string; color: string }> = {
	layout: { label: "Layout", color: "#818cf8" },
	content: { label: "Content", color: "#34d399" },
	media: { label: "Media", color: "#fb923c" },
	interactive: { label: "Interactive", color: "#f472b6" },
	embed: { label: "Embed", color: "#a78bfa" },
};

/**
 * Creates a fresh node of `type` with the registry's field defaults and a
 * random id. `hasDefaultSlot` defaults to the hardcoded palette's entry for
 * `type` (false for an unknown/plugin type — pass it explicitly when the
 * caller already knows better, e.g. a merged palette item).
 */
export function createPaletteNode(
	type: string,
	registry?: Registry,
	hasDefaultSlot = paletteItemByType(type)?.hasDefaultSlot ?? false,
): KivNode {
	const defaults = registry?.get(type)?.defaults ?? {};
	return {
		id: `${type}-${Math.random().toString(36).slice(2, 7)}`,
		type,
		props: { ...defaults },
		slots: hasDefaultSlot ? { default: [] } : undefined,
	};
}
