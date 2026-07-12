import type { KivNode, Registry } from "@kiv/engine";

export interface PaletteItem {
	type: string;
	label: string;
	description: string;
	hasDefaultSlot: boolean;
	category: string;
}

export const PALETTE: PaletteItem[] = [
	{
		type: "section",
		label: "Section",
		description: "Full-width section with rich background options",
		hasDefaultSlot: true,
		category: "layout",
	},
	{
		type: "container",
		label: "Container",
		description: "Centered max-width content wrapper",
		hasDefaultSlot: true,
		category: "layout",
	},
	{
		type: "stack",
		label: "Group",
		description: "Flex group — vertical column or horizontal row",
		hasDefaultSlot: true,
		category: "layout",
	},
	{
		type: "grid",
		label: "Grid",
		description: "Responsive multi-column grid layout",
		hasDefaultSlot: true,
		category: "layout",
	},
	{
		type: "column",
		label: "Column",
		description: "Column slot inside a Grid",
		hasDefaultSlot: true,
		category: "layout",
	},
	{
		type: "spacer",
		label: "Spacer",
		description: "Empty vertical gap, scale-driven height",
		hasDefaultSlot: false,
		category: "layout",
	},
	{
		type: "heading",
		label: "Heading",
		description: "H1–H6 text with fluid sizing",
		hasDefaultSlot: false,
		category: "content",
	},
	{
		type: "rich-text",
		label: "Rich Text",
		description: "HTML text block with inline formatting",
		hasDefaultSlot: false,
		category: "content",
	},
	{
		type: "text",
		label: "Text",
		description: "Paragraph or inline text block",
		hasDefaultSlot: false,
		category: "content",
	},
	{
		type: "button",
		label: "Button",
		description: "CTA with primary, secondary, ghost styles",
		hasDefaultSlot: false,
		category: "content",
	},
	{
		type: "link",
		label: "Link",
		description: "Inline or button-style hyperlink",
		// Link wraps an optional default slot (icon/image/text children) and
		// falls back to the flat `text` field when that slot is empty — so
		// giving new Link nodes an (empty) default slot up front doesn't
		// regress the plain-text case, it just also lets the editor's
		// "insert inside" and indent (Tab) flows nest content into it.
		hasDefaultSlot: true,
		category: "content",
	},
	{
		type: "divider",
		label: "Divider",
		description: "Horizontal rule with style, color, and spacing options",
		hasDefaultSlot: false,
		category: "content",
	},
	{
		type: "form",
		label: "Form",
		description: "Submits via services.api, or a native form fallback",
		hasDefaultSlot: true,
		category: "content",
	},
	{
		type: "form-field",
		label: "Form Field",
		description: "A single labeled input/select/checkbox inside a Form",
		hasDefaultSlot: false,
		category: "content",
	},
	{
		type: "testimonial",
		label: "Testimonial",
		description: "Quote, author, avatar, and star rating",
		hasDefaultSlot: false,
		category: "content",
	},
	{
		type: "card",
		label: "Card",
		description: "Styled container that composes with other content nodes",
		hasDefaultSlot: true,
		category: "content",
	},
	{
		type: "countdown",
		label: "Countdown",
		description: "Live countdown to a target date",
		hasDefaultSlot: false,
		category: "content",
	},
	{
		type: "stat",
		label: "Stat Counter",
		description: "Animated number that counts up on scroll into view",
		hasDefaultSlot: false,
		category: "content",
	},
	{
		type: "social-icons",
		label: "Social Icons",
		description: "Row of linked social platform icons",
		hasDefaultSlot: false,
		category: "content",
	},
	{
		type: "embed",
		label: "Custom Embed",
		description: "Sandboxed HTML or iframe embed",
		hasDefaultSlot: false,
		category: "content",
	},
	{
		type: "table",
		label: "Table",
		description: "Semantic data table from headers/rows JSON",
		hasDefaultSlot: false,
		category: "content",
	},
	{
		type: "agenda",
		label: "Agenda",
		description: "Event schedule — a list of time-blocked sessions",
		hasDefaultSlot: true,
		category: "content",
	},
	{
		type: "agenda-item",
		label: "Agenda Item",
		description: "A single time-blocked session inside an Agenda",
		hasDefaultSlot: false,
		category: "content",
	},
	{
		type: "pricing",
		label: "Pricing",
		description: "Pricing table with tiers and rows — table or card styles",
		hasDefaultSlot: false,
		category: "content",
	},
	{
		type: "image",
		label: "Image",
		description: "Responsive image with cover/contain fit",
		hasDefaultSlot: false,
		category: "media",
	},
	{
		type: "video",
		label: "Video",
		description: "YouTube, Vimeo, or custom video embed",
		hasDefaultSlot: false,
		category: "media",
	},
	{
		type: "icon",
		label: "Icon",
		description: "CSS class or inline SVG icon",
		hasDefaultSlot: false,
		category: "media",
	},
	{
		type: "carousel",
		label: "Carousel",
		description: "Rotating set of image/section/stack slides",
		hasDefaultSlot: true,
		category: "interactive",
	},
	{
		type: "accordion",
		label: "Accordion",
		description: "Collapsible list of titled panels",
		hasDefaultSlot: true,
		category: "interactive",
	},
	{
		type: "accordion-item",
		label: "Accordion Item",
		description: "A single titled, collapsible panel",
		hasDefaultSlot: true,
		category: "interactive",
	},
	{
		type: "tabs",
		label: "Tabs",
		description: "Switchable set of titled panels",
		hasDefaultSlot: true,
		category: "interactive",
	},
	{
		type: "tab-panel",
		label: "Tab Panel",
		description: "A single panel of content inside Tabs",
		hasDefaultSlot: true,
		category: "interactive",
	},
	{
		type: "modal",
		label: "Modal",
		description: "A trigger that opens content in an overlay dialog",
		hasDefaultSlot: true,
		category: "interactive",
	},
];

export const CATEGORY_META: Record<string, { label: string; color: string }> = {
	layout: { label: "Layout", color: "#818cf8" },
	content: { label: "Content", color: "#34d399" },
	media: { label: "Media", color: "#fb923c" },
	interactive: { label: "Interactive", color: "#f472b6" },
	embed: { label: "Embed", color: "#a78bfa" },
};

/** Leaf node types — cannot contain children. Link is deliberately absent:
 * it has an optional default slot (icon/image/text children), falling back
 * to its flat `text` field when empty — see the PALETTE entry above. */
export const LEAF_TYPES = new Set([
	"heading",
	"rich-text",
	"text",
	"button",
	"image",
	"video",
	"icon",
	"divider",
	"spacer",
	"form-field",
	"testimonial",
	"countdown",
	"stat",
	"social-icons",
	"embed",
	"table",
	"agenda-item",
	"pricing",
]);

export function paletteItemByType(type: string): PaletteItem | undefined {
	return PALETTE.find((p) => p.type === type);
}

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
