import { createRegistry } from "@kiv/engine";
import { describe, expect, it } from "vitest";
import {
	ALL_NODES,
	buttonNode,
	columnNode,
	containerNode,
	gridNode,
	headingNode,
	imageNode,
	pageNode,
	sectionNode,
	stackNode,
	textNode,
} from "./index";

describe("ALL_NODES", () => {
	it("contains 10 nodes", () => {
		expect(ALL_NODES).toHaveLength(10);
	});

	it("all nodes have unique types", () => {
		const types = ALL_NODES.map((n) => n.type);
		expect(new Set(types).size).toBe(10);
	});

	it("registers without errors into a Registry", () => {
		const registry = createRegistry();
		expect(() => registry.registerMany([...ALL_NODES])).not.toThrow();
	});

	it("all nodes have a category", () => {
		for (const node of ALL_NODES) {
			expect(node.category).toBeDefined();
		}
	});
});

describe("layout nodes", () => {
	it("page: type and default lang", () => {
		expect(pageNode.type).toBe("page");
		expect(pageNode.defaults.lang).toBe("en");
	});

	it("section: type and key defaults", () => {
		expect(sectionNode.type).toBe("section");
		expect(sectionNode.defaults.fullWidth).toBe(true);
		expect(sectionNode.defaults.overlay).toBe(false);
		expect(sectionNode.defaults.opacity).toBe(1);
	});

	it("container: type and default maxWidth", () => {
		expect(containerNode.type).toBe("container");
		expect(containerNode.defaults.maxWidth).toBe("lg");
		expect(containerNode.defaults.centered).toBe(true);
	});

	it("stack: type and default direction", () => {
		expect(stackNode.type).toBe("stack");
		expect(stackNode.defaults.direction).toBe("vertical");
		expect(stackNode.defaults.wrap).toBe(false);
	});

	it("grid: type and default columns", () => {
		expect(gridNode.type).toBe("grid");
		expect(gridNode.defaults.columns).toBe("12");
	});

	it("column: type and default span", () => {
		expect(columnNode.type).toBe("column");
		expect(columnNode.defaults.span).toBe("auto");
		expect(columnNode.defaults.offset).toBe("0");
	});
});

describe("content nodes", () => {
	it("heading: type and default level", () => {
		expect(headingNode.type).toBe("heading");
		expect(headingNode.defaults.level).toBe("2");
		expect(headingNode.defaults.align).toBe("left");
	});

	it("text: type and default size", () => {
		expect(textNode.type).toBe("text");
		expect(textNode.defaults.size).toBe("base");
	});

	it("button: type and navigation defaults", () => {
		expect(buttonNode.type).toBe("button");
		expect(buttonNode.defaults.href).toBe("#");
		expect(buttonNode.defaults.target).toBe("_self");
		expect(buttonNode.defaults.linkType).toBe("internal");
		expect(buttonNode.defaults.variant).toBe("primary");
	});
});

describe("media nodes", () => {
	it("image: type and default fit", () => {
		expect(imageNode.type).toBe("image");
		expect(imageNode.defaults.fit).toBe("cover");
		expect(imageNode.defaults.aspectRatio).toBe("auto");
	});
});

describe("node schemas", () => {
	it("section schema accepts valid props", () => {
		const result = sectionNode.schema.safeParse({
			background: "#fff",
			paddingY: "lg",
			overlay: true,
			overlayColor: "rgba(0,0,0,0.5)",
		});
		expect(result.success).toBe(true);
	});

	it("button schema accepts valid props", () => {
		const result = buttonNode.schema.safeParse({
			label: "Get started",
			href: "/pricing",
			linkType: "internal",
			variant: "primary",
		});
		expect(result.success).toBe(true);
	});

	it("heading schema accepts a plain string for text", () => {
		const result = headingNode.schema.safeParse({
			text: "Hello world",
			level: "1",
		});
		expect(result.success).toBe(true);
	});
});
