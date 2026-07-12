import {
	AccordionItemNode,
	AccordionNode,
	AgendaItemNode,
	AgendaNode,
	ButtonNode,
	CardNode,
	CarouselNode,
	ColumnNode,
	ContainerNode,
	CountdownNode,
	DividerNode,
	EmbedNode,
	FormFieldNode,
	FormNode,
	GridNode,
	HeadingNode,
	IconNode,
	ImageNode,
	LinkNode,
	ModalNode,
	PageNode,
	PricingNode,
	RichTextNode,
	SectionNode,
	SocialIconsNode,
	SpacerNode,
	StackNode,
	StatNode,
	TableNode,
	TabPanelNode,
	TabsNode,
	TestimonialNode,
	TextNode,
	VideoNode,
} from "./nodes";
import { createVueRegistry } from "./registry";

/**
 * Creates a VueRegistry pre-loaded with components for all 25 base nodes plus
 * the 9 interactive nodes (carousel, accordion, tabs, modal, agenda, pricing).
 * Pass additional calls to .register() to extend it with custom nodes.
 */
export function createDefaultVueRegistry() {
	const registry = createVueRegistry();
	registry.register("page", PageNode);
	registry.register("section", SectionNode);
	registry.register("container", ContainerNode);
	registry.register("stack", StackNode);
	registry.register("grid", GridNode);
	registry.register("column", ColumnNode);
	registry.register("spacer", SpacerNode);
	registry.register("heading", HeadingNode);
	registry.register("rich-text", RichTextNode);
	registry.register("text", TextNode);
	registry.register("button", ButtonNode);
	registry.register("link", LinkNode);
	registry.register("image", ImageNode);
	registry.register("video", VideoNode);
	registry.register("icon", IconNode);
	registry.register("divider", DividerNode);
	registry.register("form", FormNode);
	registry.register("form-field", FormFieldNode);
	registry.register("testimonial", TestimonialNode);
	registry.register("card", CardNode);
	registry.register("countdown", CountdownNode);
	registry.register("stat", StatNode);
	registry.register("social-icons", SocialIconsNode);
	registry.register("embed", EmbedNode);
	registry.register("table", TableNode);
	registry.register("carousel", CarouselNode);
	registry.register("accordion", AccordionNode);
	registry.register("accordion-item", AccordionItemNode);
	registry.register("tabs", TabsNode);
	registry.register("tab-panel", TabPanelNode);
	registry.register("modal", ModalNode);
	registry.register("agenda", AgendaNode);
	registry.register("agenda-item", AgendaItemNode);
	registry.register("pricing", PricingNode);
	return registry;
}
