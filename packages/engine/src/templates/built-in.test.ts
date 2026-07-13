import { describe, expect, it } from "vitest";
import { CURRENT_SCHEMA_VERSION, migrateDocument } from "../migrations";
import { createRegistry } from "../registry";
import { renderToHtml } from "../render";
import { defineNode } from "../schema";
import type { KivDocument, KivNode } from "../types";
import { BUILT_IN_TEMPLATES } from "./built-in";

// The real node types @kivcode/nodes registers (see packages/nodes/src/index.ts).
// Hardcoded here rather than imported — @kivcode/engine must never depend on
// @kivcode/nodes (nodes depends on engine, not the other way around) — so this
// list is the guardrail that built-in templates only use types that actually
// exist in the first-party node package, without creating that dependency.
const REAL_NODE_TYPES = new Set([
	"page",
	"section",
	"container",
	"stack",
	"grid",
	"column",
	"heading",
	"rich-text",
	"text",
	"button",
	"link",
	"image",
	"video",
	"icon",
	"divider",
]);

function collectTypes(node: KivNode, types: Set<string>): void {
	types.add(node.type);
	for (const children of Object.values(node.slots ?? {})) {
		for (const child of children) collectTypes(child, types);
	}
}

function collectIds(node: KivNode, ids: string[]): void {
	ids.push(node.id);
	for (const children of Object.values(node.slots ?? {})) {
		for (const child of children) collectIds(child, ids);
	}
}

/** A pass-through stub for whichever node types a template happens to use — enough to exercise the real resolver/renderToHtml pipeline without importing @kivcode/nodes. */
function stubRegistryFor(doc: KivDocument) {
	const types = new Set<string>();
	collectTypes(doc.root, types);
	const registry = createRegistry();
	for (const type of types) {
		registry.register(
			defineNode({
				type,
				fields: {},
				toHtml(_props, children) {
					return `<div data-kiv-type="${type}">${children.default ?? ""}</div>`;
				},
			}),
		);
	}
	return registry;
}

describe("BUILT_IN_TEMPLATES", () => {
	it("has a Blank/Landing/About/Contact/Blog-post template", () => {
		expect(BUILT_IN_TEMPLATES.map((t) => t.id).sort()).toEqual(
			["about", "blank", "blog-post", "contact", "landing"].sort(),
		);
	});

	it("every template id is unique", () => {
		const ids = BUILT_IN_TEMPLATES.map((t) => t.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	for (const template of BUILT_IN_TEMPLATES) {
		describe(template.name, () => {
			it("has the current schema version and needs no migration", () => {
				expect(template.document.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
				expect(migrateDocument(template.document)).toEqual(template.document);
			});

			it("has a page root and only uses real, first-party node types", () => {
				expect(template.document.root.type).toBe("page");
				const types = new Set<string>();
				collectTypes(template.document.root, types);
				for (const type of types) {
					expect(
						REAL_NODE_TYPES.has(type),
						`unexpected node type "${type}"`,
					).toBe(true);
				}
			});

			it("has unique node ids across the whole tree", () => {
				const ids: string[] = [];
				collectIds(template.document.root, ids);
				expect(new Set(ids).size).toBe(ids.length);
			});

			it("renders to non-empty HTML through the real resolver + renderToHtml pipeline", () => {
				const registry = stubRegistryFor(template.document);
				const html = renderToHtml(template.document, { registry });
				expect(html.length).toBeGreaterThan(0);
			});
		});
	}
});
