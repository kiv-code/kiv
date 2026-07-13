import type { KivDocument, KivNode } from "@kivcode/engine";
import { createEventBus, createRegistry } from "@kivcode/engine";
import { describe, expect, it, vi } from "vitest";
import { useEditorStore } from "./editor-store";

const registry = createRegistry();

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

describe("useEditorStore", () => {
	it("initializes with the given document", () => {
		const doc = makeDoc();
		const store = useEditorStore(doc, registry);
		expect(store.document.value.root.id).toBe("root");
	});

	it("select sets the selected node", () => {
		const store = useEditorStore(makeDoc(), registry);
		expect(store.selected.value).toBeNull();
		store.select("heading-1");
		expect(store.selected.value?.id).toBe("heading-1");
	});

	it("select(null) clears selection", () => {
		const store = useEditorStore(makeDoc(), registry);
		store.select("heading-1");
		store.select(null);
		expect(store.selected.value).toBeNull();
	});

	it("updateProps patches node props", () => {
		const store = useEditorStore(makeDoc(), registry);
		store.updateProps("section-1", { background: "#000" });
		const section = store.document.value.root.slots?.default?.[0];
		expect(section?.props.background).toBe("#000");
	});

	it("addNode appends a child", () => {
		const store = useEditorStore(makeDoc(), registry);
		const newNode: KivNode = { id: "text-1", type: "text", props: {} };
		store.addNode("section-1", "default", newNode);
		const children =
			store.document.value.root.slots?.default?.[0]?.slots?.default;
		expect(children).toHaveLength(2);
	});

	it("removeNode removes a child", () => {
		const store = useEditorStore(makeDoc(), registry);
		store.removeNode("heading-1");
		const children =
			store.document.value.root.slots?.default?.[0]?.slots?.default;
		expect(children).toHaveLength(0);
	});

	it("removeNode clears selection if selected node is removed", () => {
		const store = useEditorStore(makeDoc(), registry);
		store.select("heading-1");
		store.removeNode("heading-1");
		expect(store.selected.value).toBeNull();
	});

	it("undo/redo cycle restores document state", () => {
		const store = useEditorStore(makeDoc(), registry);
		expect(store.canUndo.value).toBe(false);
		store.updateProps("section-1", { background: "#000" });
		expect(store.canUndo.value).toBe(true);
		store.undo();
		const section = store.document.value.root.slots?.default?.[0];
		expect(section?.props.background).toBe("#fff");
		expect(store.canRedo.value).toBe(true);
		store.redo();
		const sectionAfterRedo = store.document.value.root.slots?.default?.[0];
		expect(sectionAfterRedo?.props.background).toBe("#000");
	});

	it("new action clears redo stack", () => {
		const store = useEditorStore(makeDoc(), registry);
		store.updateProps("section-1", { background: "#111" });
		store.undo();
		expect(store.canRedo.value).toBe(true);
		store.updateProps("section-1", { background: "#222" });
		expect(store.canRedo.value).toBe(false);
	});

	it("undo does nothing when history is empty", () => {
		const store = useEditorStore(makeDoc(), registry);
		store.undo();
		expect(store.document.value.root.id).toBe("root");
	});

	it("setLocked toggles a node's locked flag", () => {
		const store = useEditorStore(makeDoc(), registry);
		store.setLocked("heading-1", true);
		const heading =
			store.document.value.root.slots?.default?.[0]?.slots?.default?.[0];
		expect(heading?.locked).toBe(true);
		store.setLocked("heading-1", false);
		const updated =
			store.document.value.root.slots?.default?.[0]?.slots?.default?.[0];
		expect(updated?.locked).toBe(false);
	});

	it("setVisible sets a node's visible flag", () => {
		const store = useEditorStore(makeDoc(), registry);
		store.setVisible("heading-1", false);
		const heading =
			store.document.value.root.slots?.default?.[0]?.slots?.default?.[0];
		expect(heading?.visible).toBe(false);
	});

	it("toggleSelect adds/removes ids without clearing the rest", () => {
		const store = useEditorStore(makeDoc(), registry);
		store.toggleSelect("section-1");
		store.toggleSelect("heading-1");
		expect(store.selectedIds.value).toEqual(["section-1", "heading-1"]);
		store.toggleSelect("section-1");
		expect(store.selectedIds.value).toEqual(["heading-1"]);
	});

	it("selectAll selects every node except the root", () => {
		const store = useEditorStore(makeDoc(), registry);
		store.selectAll();
		expect(store.selectedIds.value).toEqual(["section-1", "heading-1"]);
	});

	it("clearSelection empties the selection", () => {
		const store = useEditorStore(makeDoc(), registry);
		store.selectAll();
		store.clearSelection();
		expect(store.selectedIds.value).toEqual([]);
	});

	it("selectedNodes resolves the actual nodes for every selected id", () => {
		const store = useEditorStore(makeDoc(), registry);
		store.selectAll();
		expect(store.selectedNodes.value.map((n) => n.id)).toEqual([
			"section-1",
			"heading-1",
		]);
	});

	it("isLocked reports a node's locked flag", () => {
		const store = useEditorStore(makeDoc(), registry);
		expect(store.isLocked("heading-1")).toBe(false);
		store.setLocked("heading-1", true);
		expect(store.isLocked("heading-1")).toBe(true);
	});

	it("updatePropsMany patches every id as a single undo step", () => {
		const store = useEditorStore(makeDoc(), registry);
		store.updatePropsMany(["section-1", "heading-1"], { locked: false });
		expect(store.canUndo.value).toBe(true);
		store.updateProps("section-1", { background: "#123" });
		expect(
			store.document.value.root.slots?.default?.[0]?.props.background,
		).toBe("#123");
		store.undo();
		store.undo();
		expect(
			store.document.value.root.slots?.default?.[0]?.props.background,
		).toBe("#fff");
	});

	it("updatePropsMany skips locked targets while still applying to the rest", () => {
		const store = useEditorStore(makeDoc(), registry);
		store.setLocked("heading-1", true);
		store.updatePropsMany(["section-1", "heading-1"], { text: "changed" });
		const section = store.document.value.root.slots?.default?.[0];
		const heading = section?.slots?.default?.[0];
		expect(section?.props.text).toBe("changed");
		expect(heading?.props.text).toBe("Hello");
	});

	it("removeMany removes every id as a single undo step", () => {
		const store = useEditorStore(makeDoc(), registry);
		store.removeMany(["heading-1"]);
		const children =
			store.document.value.root.slots?.default?.[0]?.slots?.default;
		expect(children).toHaveLength(0);
		expect(store.canUndo.value).toBe(true);
		store.undo();
		expect(
			store.document.value.root.slots?.default?.[0]?.slots?.default,
		).toHaveLength(1);
	});

	it("startBatch/endBatch collapse manual updateProps calls into one undo step", () => {
		const store = useEditorStore(makeDoc(), registry);
		store.startBatch();
		store.updateProps("section-1", { background: "#111" });
		store.updateProps("section-1", { background: "#222" });
		store.endBatch();
		expect(
			store.document.value.root.slots?.default?.[0]?.props.background,
		).toBe("#222");
		store.undo();
		expect(
			store.document.value.root.slots?.default?.[0]?.props.background,
		).toBe("#fff");
	});

	it("forwards editor mutations onto a shared bus when provided", () => {
		const bus = createEventBus();
		const handler = vi.fn();
		bus.on("node.propsChanged", handler);
		const store = useEditorStore(makeDoc(), registry, { bus });
		store.updateProps("heading-1", { text: "Hi" });
		expect(handler).toHaveBeenCalledWith({
			id: "heading-1",
			patch: { text: "Hi" },
		});
	});

	it("updateSeoMeta merges into document.seo", () => {
		const store = useEditorStore(makeDoc(), registry);
		store.updateSeoMeta({ title: "Home" });
		store.updateSeoMeta({ description: "Welcome" });
		expect(store.document.value.seo).toEqual({
			title: "Home",
			description: "Welcome",
		});
	});

	it("loadDocument replaces the document as a single undo step and clears selection", () => {
		const store = useEditorStore(makeDoc(), registry);
		store.select("heading-1");
		const template: KivDocument = {
			schemaVersion: 1,
			root: { id: "root", type: "page", props: {} },
			i18n: { default: "en", supported: ["en"] },
		};
		store.loadDocument(template);
		expect(store.document.value.root.slots).toBeUndefined();
		expect(store.selectedIds.value).toHaveLength(0);
		expect(store.canUndo.value).toBe(true);
		store.undo();
		expect(store.document.value.root.slots?.default).toHaveLength(1);
	});
});
