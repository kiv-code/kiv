export { buttonNode, headingNode, textNode } from "./content";
export {
	columnNode,
	containerNode,
	gridNode,
	pageNode,
	sectionNode,
	stackNode,
} from "./layout";
export { imageNode } from "./media";

import { buttonNode } from "./content/button";
import { headingNode } from "./content/heading";
import { textNode } from "./content/text";
import { columnNode } from "./layout/column";
import { containerNode } from "./layout/container";
import { gridNode } from "./layout/grid";
import { pageNode } from "./layout/page";
import { sectionNode } from "./layout/section";
import { stackNode } from "./layout/stack";
import { imageNode } from "./media/image";

/** All 10 base nodes — pass to registry.registerMany(ALL_NODES). */
export const ALL_NODES = [
	pageNode,
	sectionNode,
	containerNode,
	stackNode,
	gridNode,
	columnNode,
	headingNode,
	textNode,
	buttonNode,
	imageNode,
] as const;
