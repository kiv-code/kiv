import { describe, expect, it, vi } from "vitest";
import type { KivDocument, KivNode } from "../types";
import { EditorEngine } from "./editor-engine";

function makeDoc(): KivDocument {
	return {
		schemaVersion: 1,
		root: {
			id: "root",
			type: "page",
			props: {},
			slots: {
				default: [
					{
						id: "section-1",
						type: "section",
						props: { background: "#fff" },
						slots: {
							default: [
								{ id: "heading-1", type: "heading", props: { text: "Hello" } },
							],
						},
					},
				],
			},
		},
		i18n: { default: "en", supported: ["en"] },
	};
}

describe("EditorEngine", () => {
	it("initializes with a clone of the given document", () => {
		const doc = makeDoc();
		const engine = new EditorEngine(doc);
		expect(engine.document.root.id).toBe("root");
		expect(engine.document).not.toBe(doc);
	});

	it("addNode appends a child and emits node.created", () => {
		const engine = new EditorEngine(makeDoc());
		const handler = vi.fn();
		engine.bus.on("node.created", handler);
		const node: KivNode = { id: "text-1", type: "text", props: {} };
		engine.addNode({ parentId: "section-1", slot: "default", node });
		const children = engine.document.root.slots?.default?.[0]?.slots?.default;
		expect(children).toHaveLength(2);
		expect(handler).toHaveBeenCalledWith({
			id: "text-1",
			parentId: "section-1",
			slot: "default",
		});
	});

	it("removeNode removes a child and emits node.removed", () => {
		const engine = new EditorEngine(makeDoc());
		const handler = vi.fn();
		engine.bus.on("node.removed", handler);
		engine.removeNode("heading-1");
		const children = engine.document.root.slots?.default?.[0]?.slots?.default;
		expect(children).toHaveLength(0);
		expect(handler).toHaveBeenCalledWith({ id: "heading-1" });
	});

	it("removeNode clears the selection if the removed node was selected", () => {
		const engine = new EditorEngine(makeDoc());
		engine.selection.select("heading-1");
		engine.removeNode("heading-1");
		expect(engine.selection.has("heading-1")).toBe(false);
	});

	it("updateNodeProps patches props and emits node.propsChanged", () => {
		const engine = new EditorEngine(makeDoc());
		const handler = vi.fn();
		engine.bus.on("node.propsChanged", handler);
		engine.updateNodeProps("section-1", { background: "#000" });
		const section = engine.document.root.slots?.default?.[0];
		expect(section?.props.background).toBe("#000");
		expect(handler).toHaveBeenCalledWith({
			id: "section-1",
			patch: { background: "#000" },
		});
	});

	it("moveNode relocates a node and emits node.moved", () => {
		const engine = new EditorEngine(makeDoc());
		const handler = vi.fn();
		engine.bus.on("node.moved", handler);
		engine.moveNode({
			id: "heading-1",
			targetParentId: "root",
			targetSlot: "default",
			targetIndex: 1,
		});
		expect(engine.document.root.slots?.default).toHaveLength(2);
		expect(engine.document.root.slots?.default?.[1]?.id).toBe("heading-1");
		expect(handler).toHaveBeenCalledOnce();
	});

	it("renameNode renames and keeps the node selected under its new id", () => {
		const engine = new EditorEngine(makeDoc());
		engine.selection.select("heading-1");
		const ok = engine.renameNode("heading-1", "title-1");
		expect(ok).toBe(true);
		expect(engine.selection.has("title-1")).toBe(true);
		expect(engine.findNode("title-1")).not.toBeNull();
	});

	it("renameNode rejects empty, unchanged, or colliding ids", () => {
		const engine = new EditorEngine(makeDoc());
		expect(engine.renameNode("heading-1", "  ")).toBe(false);
		expect(engine.renameNode("heading-1", "heading-1")).toBe(false);
		expect(engine.renameNode("heading-1", "section-1")).toBe(false);
	});

	it("duplicateNode inserts a copy right after the original", () => {
		const engine = new EditorEngine(makeDoc());
		engine.duplicateNode("heading-1");
		const children = engine.document.root.slots?.default?.[0]?.slots?.default;
		expect(children).toHaveLength(2);
	});

	it("undo/redo cycle restores document state and emits history.changed", () => {
		const engine = new EditorEngine(makeDoc());
		const handler = vi.fn();
		engine.bus.on("history.changed", handler);
		expect(engine.canUndo).toBe(false);
		engine.updateNodeProps("section-1", { background: "#000" });
		expect(engine.canUndo).toBe(true);
		engine.undo();
		expect(engine.document.root.slots?.default?.[0]?.props.background).toBe(
			"#fff",
		);
		expect(engine.canRedo).toBe(true);
		engine.redo();
		expect(engine.document.root.slots?.default?.[0]?.props.background).toBe(
			"#000",
		);
		expect(handler).toHaveBeenCalled();
	});

	it("undo does nothing when history is empty", () => {
		const engine = new EditorEngine(makeDoc());
		engine.undo();
		expect(engine.document.root.id).toBe("root");
	});

	it("canUseId reports collisions and allows a node's own current id", () => {
		const engine = new EditorEngine(makeDoc());
		expect(engine.canUseId("section-1")).toBe(false);
		expect(engine.canUseId("section-1", "section-1")).toBe(true);
		expect(engine.canUseId("brand-new")).toBe(true);
	});

	it("selection changes emit selection.changed on the bus", () => {
		const engine = new EditorEngine(makeDoc());
		const handler = vi.fn();
		engine.bus.on("selection.changed", handler);
		engine.selection.select("heading-1");
		expect(handler).toHaveBeenCalledWith({ ids: ["heading-1"] });
	});
});
