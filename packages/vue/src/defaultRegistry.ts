import {
	ButtonNode,
	ColumnNode,
	ContainerNode,
	GridNode,
	HeadingNode,
	ImageNode,
	PageNode,
	SectionNode,
	StackNode,
	TextNode,
} from "./nodes";
import { createVueRegistry } from "./registry";

/**
 * Creates a VueRegistry pre-loaded with components for all 10 base nodes.
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
	registry.register("heading", HeadingNode);
	registry.register("text", TextNode);
	registry.register("button", ButtonNode);
	registry.register("image", ImageNode);
	return registry;
}
