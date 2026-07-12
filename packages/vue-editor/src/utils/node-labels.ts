// Human-readable labels for node types — used in tree and canvas overlays
export const NODE_LABELS: Record<string, string> = {
	page: "Page",
	section: "Section",
	container: "Container",
	grid: "Grid",
	column: "Column",
	spacer: "Spacer",
	stack: "Group",
	heading: "Heading",
	text: "Text",
	button: "Button",
	image: "Image",
	form: "Form",
	"form-field": "Form Field",
	testimonial: "Testimonial",
	card: "Card",
	countdown: "Countdown",
	stat: "Stat Counter",
	"social-icons": "Social Icons",
	embed: "Custom Embed",
	table: "Table",
	carousel: "Carousel",
	accordion: "Accordion",
	"accordion-item": "Accordion Item",
	tabs: "Tabs",
	"tab-panel": "Tab Panel",
	modal: "Modal",
	agenda: "Agenda",
	"agenda-item": "Agenda Item",
	pricing: "Pricing",
};

// Short label for canvas overlay badges
export const NODE_LABELS_SHORT: Record<string, string> = {
	page: "Page",
	section: "Section",
	container: "Box",
	grid: "Grid",
	column: "Col",
	spacer: "Spacer",
	stack: "Group",
	heading: "Heading",
	text: "Text",
	button: "Button",
	image: "Image",
	form: "Form",
	"form-field": "Field",
	testimonial: "Testimonial",
	card: "Card",
	countdown: "Countdown",
	stat: "Stat",
	"social-icons": "Social",
	embed: "Embed",
	table: "Table",
	carousel: "Carousel",
	accordion: "Accordion",
	"accordion-item": "Item",
	tabs: "Tabs",
	"tab-panel": "Panel",
	modal: "Modal",
	agenda: "Agenda",
	"agenda-item": "Item",
	pricing: "Pricing",
};

export function getNodeLabel(type: string): string {
	return NODE_LABELS[type] ?? type;
}

export function getNodeLabelShort(type: string): string {
	return NODE_LABELS_SHORT[type] ?? type;
}

// Mirrors each node's `category` field (@kiv/nodes) — kept as a lookup here
// rather than read from the registry so the tree can color a row without
// threading the registry through every recursive KivTreeNode level.
const NODE_CATEGORY: Record<
	string,
	"layout" | "content" | "media" | "interactive"
> = {
	page: "layout",
	section: "layout",
	container: "layout",
	stack: "layout",
	grid: "layout",
	column: "layout",
	spacer: "layout",
	heading: "content",
	text: "content",
	button: "content",
	link: "content",
	"rich-text": "content",
	divider: "content",
	form: "content",
	"form-field": "content",
	testimonial: "content",
	card: "content",
	countdown: "content",
	stat: "content",
	"social-icons": "content",
	embed: "content",
	table: "content",
	agenda: "content",
	"agenda-item": "content",
	pricing: "content",
	image: "media",
	video: "media",
	icon: "media",
	carousel: "interactive",
	accordion: "interactive",
	"accordion-item": "interactive",
	tabs: "interactive",
	"tab-panel": "interactive",
	modal: "interactive",
};

const CATEGORY_TINT: Record<
	"layout" | "content" | "media" | "interactive",
	string
> = {
	layout: "rgba(148, 163, 184, 0.16)",
	content: "rgba(129, 140, 248, 0.18)",
	media: "rgba(52, 211, 153, 0.16)",
	interactive: "rgba(244, 114, 182, 0.16)",
};

export function getNodeCategoryTint(type: string): string {
	const category = NODE_CATEGORY[type] ?? "layout";
	return CATEGORY_TINT[category];
}
