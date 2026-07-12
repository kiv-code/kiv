export { accordionItemNode, accordionNode } from "./accordion";
export { carouselNode } from "./carousel";
export { modalNode } from "./modal";
export { tabPanelNode, tabsNode } from "./tabs";
export {
	CONTENT_TEMPLATES,
	type ContentTemplate,
} from "./templates";

import { accordionItemNode, accordionNode } from "./accordion";
import { carouselNode } from "./carousel";
import { modalNode } from "./modal";
import { tabPanelNode, tabsNode } from "./tabs";

/** All 6 interactive nodes — pass to registry.registerMany(ALL_INTERACTIVE_NODES). */
export const ALL_INTERACTIVE_NODES = [
	carouselNode,
	accordionNode,
	accordionItemNode,
	tabsNode,
	tabPanelNode,
	modalNode,
] as const;
