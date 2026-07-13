import { createRegistry } from "@kivcode/engine";
import { describe, expect, it } from "vitest";
import {
	ALL_INTERACTIVE_NODES,
	accordionItemNode,
	accordionNode,
	carouselNode,
	modalNode,
	tabPanelNode,
	tabsNode,
} from "./index";

describe("ALL_INTERACTIVE_NODES", () => {
	it("contains 6 nodes", () => {
		expect(ALL_INTERACTIVE_NODES).toHaveLength(6);
	});

	it("all nodes have unique types", () => {
		const types = ALL_INTERACTIVE_NODES.map((n) => n.type);
		expect(new Set(types).size).toBe(6);
	});

	it("all nodes are categorized as interactive", () => {
		for (const node of ALL_INTERACTIVE_NODES) {
			expect(node.category).toBe("interactive");
		}
	});

	it("registers without errors into a Registry", () => {
		const registry = createRegistry();
		expect(() =>
			registry.registerMany([...ALL_INTERACTIVE_NODES]),
		).not.toThrow();
	});

	it("every node's defaults satisfy its own compiled schema", () => {
		for (const node of ALL_INTERACTIVE_NODES) {
			const result = node.schema.safeParse(node.defaults);
			expect(
				result.success,
				`${node.type}: ${JSON.stringify(result.error?.issues)}`,
			).toBe(true);
		}
	});

	it("every node renders non-empty HTML from its own defaults", () => {
		const ctx = { locale: "en", breakpoint: "base" as const };
		for (const node of ALL_INTERACTIVE_NODES) {
			const html = node.toHtml?.(node.defaults, {}, ctx);
			expect(html, `${node.type} has no toHtml`).toBeDefined();
			expect(html?.trim().length ?? 0, node.type).toBeGreaterThan(0);
			expect(html, node.type).toContain(`data-kiv-type="${node.type}"`);
		}
	});
});

describe("carousel", () => {
	it("only accepts image/section/container/stack in its default slot", () => {
		expect(carouselNode.slotConstraints?.default).toEqual([
			"image",
			"section",
			"container",
			"stack",
		]);
	});
});

describe("accordion", () => {
	it("only accepts accordion-item in its default slot", () => {
		expect(accordionNode.slotConstraints?.default).toEqual(["accordion-item"]);
	});

	it("accordion-item renders a native <details> with the title in <summary>", () => {
		const html = accordionItemNode.toHtml?.(
			{ title: "FAQ", defaultOpen: true },
			{ default: "<p>Answer</p>" },
			{ locale: "en", breakpoint: "base" },
		);
		expect(html).toContain("<details");
		expect(html).toContain(" open");
		expect(html).toContain("<summary");
		expect(html).toContain("FAQ");
		expect(html).toContain("<p>Answer</p>");
	});

	it("accordion-item omits the open attribute by default", () => {
		const html = accordionItemNode.toHtml?.(
			{ title: "FAQ" },
			{},
			{ locale: "en", breakpoint: "base" },
		);
		expect(html).not.toContain(" open");
	});
});

describe("tabs", () => {
	it("only accepts tab-panel in its default slot", () => {
		expect(tabsNode.slotConstraints?.default).toEqual(["tab-panel"]);
	});

	it("tab-panel renders its title and badge", () => {
		const html = tabPanelNode.toHtml?.(
			{ title: "Pricing", badge: "New" },
			{ default: "<p>Body</p>" },
			{ locale: "en", breakpoint: "base" },
		);
		expect(html).toContain("Pricing");
		expect(html).toContain("New");
		expect(html).toContain("<p>Body</p>");
	});
});

describe("modal", () => {
	it("has no slotConstraints — accepts any content", () => {
		expect(modalNode.slotConstraints).toBeUndefined();
	});

	it("renders the trigger label and keeps the content in the DOM", () => {
		const html = modalNode.toHtml?.(
			{ triggerLabel: "Open dialog" },
			{ default: "<p>Modal body</p>" },
			{ locale: "en", breakpoint: "base" },
		);
		expect(html).toContain("Open dialog");
		expect(html).toContain("<p>Modal body</p>");
	});
});
