import type { KivDocument } from "@kivcode/engine";
import { createRegistry } from "@kivcode/engine";
import { ALL_NODES } from "@kivcode/nodes";
import { createDefaultVueRegistry } from "@kivcode/vue";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { EDITOR_STORE_KEY, KIV_TREE_FOCUS_SEARCH_KEY } from "../store/context";
import { useEditorStore } from "../store/editor-store";
import KivCanvas from "./KivCanvas.vue";

const engineRegistry = createRegistry();
engineRegistry.registerMany([...ALL_NODES]);

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
						props: {},
						slots: {
							default: [
								{
									id: "heading-1",
									type: "heading",
									props: { text: "Hello", level: 1 },
								},
							],
						},
					},
				],
			},
		},
		i18n: { default: "en", supported: ["en"] },
	};
}

function makeMultiDoc(): KivDocument {
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
						props: {},
						slots: {
							default: [
								{
									id: "heading-1",
									type: "heading",
									props: { text: "Hello", level: 1 },
								},
								{ id: "text-1", type: "text", props: { content: "World" } },
							],
						},
					},
				],
			},
		},
		i18n: { default: "en", supported: ["en"] },
	};
}

const mountedWrappers: { unmount(): void }[] = [];

function mountCanvas(doc = makeDoc()) {
	const store = useEditorStore(doc, engineRegistry);
	const wrapper = mount(KivCanvas, {
		props: { registry: createDefaultVueRegistry() },
		global: { provide: { [EDITOR_STORE_KEY]: store } },
		attachTo: document.body,
	});
	mountedWrappers.push(wrapper);
	return { store, wrapper };
}

// Unmounting (not just wiping innerHTML) matters here: KivCanvas registers
// window-level keydown/keyup listeners in onMounted, and only onUnmounted
// removes them. Leaving them attached across tests means every later
// keydown dispatch also re-triggers every earlier test's now-orphaned
// component instance.
afterEach(() => {
	for (const wrapper of mountedWrappers.splice(0)) wrapper.unmount();
	document.body.innerHTML = "";
});

describe("KivCanvas", () => {
	it("selects a node when its rendered element is clicked", () => {
		const { store, wrapper } = mountCanvas();
		const heading = wrapper.find('[data-kiv-node-id="heading-1"]');
		expect(heading.exists()).toBe(true);
		heading.element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		expect(store.selected.value?.id).toBe("heading-1");
	});

	it("clears the selection when clicking empty canvas background", () => {
		const { store, wrapper } = mountCanvas();
		store.select("heading-1");
		expect(store.selected.value?.id).toBe("heading-1");

		const canvas = wrapper.find(".kiv-canvas");
		canvas.element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		expect(store.selected.value).toBeNull();
	});

	it("removes the selected node on Delete", () => {
		const { store } = mountCanvas();
		store.select("heading-1");

		window.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" }));

		const children =
			store.document.value.root.slots?.default?.[0]?.slots?.default;
		expect(children).toHaveLength(0);
		expect(store.selected.value).toBeNull();
	});

	it("removes the selected node on Backspace", () => {
		const { store } = mountCanvas();
		store.select("heading-1");

		window.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace" }));

		const children =
			store.document.value.root.slots?.default?.[0]?.slots?.default;
		expect(children).toHaveLength(0);
	});

	it("clears the selection on Escape", () => {
		const { store } = mountCanvas();
		store.select("heading-1");
		expect(store.selected.value?.id).toBe("heading-1");

		window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

		expect(store.selected.value).toBeNull();
	});

	it("undoes the last mutation on Cmd/Ctrl+Z", () => {
		const { store } = mountCanvas();
		store.select("heading-1");
		window.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" }));
		let children =
			store.document.value.root.slots?.default?.[0]?.slots?.default;
		expect(children).toHaveLength(0);

		window.dispatchEvent(
			new KeyboardEvent("keydown", { key: "z", ctrlKey: true }),
		);

		children = store.document.value.root.slots?.default?.[0]?.slots?.default;
		expect(children).toHaveLength(1);
		expect(children?.[0]?.id).toBe("heading-1");
	});

	it("does not select a locked node when its rendered element is clicked", () => {
		const { store, wrapper } = mountCanvas();
		store.setLocked("heading-1", true);
		const heading = wrapper.find('[data-kiv-node-id="heading-1"]');
		heading.element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		expect(store.selected.value).toBeNull();
	});

	it("does not delete a locked node even when it was already selected", () => {
		const { store } = mountCanvas();
		store.select("heading-1");
		store.setLocked("heading-1", true);

		window.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" }));

		const children =
			store.document.value.root.slots?.default?.[0]?.slots?.default;
		expect(children).toHaveLength(1);
	});

	it("ignores keyboard shortcuts while focus is on an input", () => {
		const { store } = mountCanvas();
		store.select("heading-1");

		const input = document.createElement("input");
		document.body.appendChild(input);
		input.focus();
		expect(document.activeElement).toBe(input);

		window.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" }));

		const children =
			store.document.value.root.slots?.default?.[0]?.slots?.default;
		expect(children).toHaveLength(1);

		input.remove();
	});

	it("shift-click adds a node to the selection instead of replacing it", () => {
		const { store, wrapper } = mountCanvas(makeMultiDoc());
		wrapper
			.find('[data-kiv-node-id="heading-1"]')
			.element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		wrapper
			.find('[data-kiv-node-id="text-1"]')
			.element.dispatchEvent(
				new MouseEvent("click", { bubbles: true, shiftKey: true }),
			);
		expect(store.selectedIds.value).toEqual(["heading-1", "text-1"]);
	});

	it("Delete removes every selected node in one go", () => {
		const { store } = mountCanvas(makeMultiDoc());
		store.select("heading-1");
		store.toggleSelect("text-1");

		window.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" }));

		const children =
			store.document.value.root.slots?.default?.[0]?.slots?.default;
		expect(children).toHaveLength(0);
	});

	it("⌘A selects every node in the document", () => {
		const { store } = mountCanvas(makeMultiDoc());
		window.dispatchEvent(
			new KeyboardEvent("keydown", { key: "a", metaKey: true }),
		);
		expect(store.selectedIds.value).toEqual([
			"section-1",
			"heading-1",
			"text-1",
		]);
	});

	it("⌘C then ⌘V pastes a clone of the copied node near the selection", () => {
		const { store } = mountCanvas(makeMultiDoc());
		store.select("heading-1");
		window.dispatchEvent(
			new KeyboardEvent("keydown", { key: "c", metaKey: true }),
		);
		window.dispatchEvent(
			new KeyboardEvent("keydown", { key: "v", metaKey: true }),
		);
		const children =
			store.document.value.root.slots?.default?.[0]?.slots?.default;
		expect(children).toHaveLength(3);
	});

	it("⌘X removes the node so ⌘V can paste it back", () => {
		const { store } = mountCanvas(makeMultiDoc());
		store.select("heading-1");
		window.dispatchEvent(
			new KeyboardEvent("keydown", { key: "x", metaKey: true }),
		);
		expect(
			store.document.value.root.slots?.default?.[0]?.slots?.default,
		).toHaveLength(1);

		store.select("text-1");
		window.dispatchEvent(
			new KeyboardEvent("keydown", { key: "v", metaKey: true }),
		);
		expect(
			store.document.value.root.slots?.default?.[0]?.slots?.default,
		).toHaveLength(2);
	});

	it("ArrowDown selects the next sibling", () => {
		const { store } = mountCanvas(makeMultiDoc());
		store.select("heading-1");
		window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
		expect(store.selected.value?.id).toBe("text-1");
	});

	it("⌘ArrowDown moves the selected node down among its siblings", () => {
		const { store } = mountCanvas(makeMultiDoc());
		store.select("heading-1");
		window.dispatchEvent(
			new KeyboardEvent("keydown", { key: "ArrowDown", metaKey: true }),
		);
		const children =
			store.document.value.root.slots?.default?.[0]?.slots?.default;
		expect(children?.[0]?.id).toBe("text-1");
		expect(children?.[1]?.id).toBe("heading-1");
	});

	it("⌘[ outdents the selected node into its grandparent's slot", () => {
		const { store } = mountCanvas(makeMultiDoc());
		store.select("heading-1");
		window.dispatchEvent(
			new KeyboardEvent("keydown", { key: "[", metaKey: true }),
		);
		const rootChildren = store.document.value.root.slots?.default;
		expect(rootChildren?.some((n) => n.id === "heading-1")).toBe(true);
		const sectionChildren = store.document.value.root.slots?.default?.find(
			(n) => n.id === "section-1",
		)?.slots?.default;
		expect(sectionChildren?.some((n) => n.id === "heading-1")).toBe(false);
	});

	it("⌘/ opens the keyboard shortcut reference modal", async () => {
		mountCanvas();
		window.dispatchEvent(
			new KeyboardEvent("keydown", { key: "/", metaKey: true }),
		);
		await nextTick();
		expect(document.body.textContent).toContain("Keyboard shortcuts");
	});

	it("⌘S emits document.save on the store's bus", () => {
		const { store } = mountCanvas();
		const handler = vi.fn();
		store.bus.on("document.save", handler);
		window.dispatchEvent(
			new KeyboardEvent("keydown", { key: "s", metaKey: true }),
		);
		expect(handler).toHaveBeenCalledWith({ document: store.document.value });
	});

	it("⌘F calls the injected tree-search-focus function", () => {
		const doc = makeDoc();
		const store = useEditorStore(doc, engineRegistry);
		const focusSpy = vi.fn();
		mountedWrappers.push(
			mount(KivCanvas, {
				props: { registry: createDefaultVueRegistry() },
				global: {
					provide: {
						[EDITOR_STORE_KEY]: store,
						[KIV_TREE_FOCUS_SEARCH_KEY]: focusSpy,
					},
				},
				attachTo: document.body,
			}),
		);
		window.dispatchEvent(
			new KeyboardEvent("keydown", { key: "f", metaKey: true }),
		);
		expect(focusSpy).toHaveBeenCalledOnce();
	});

	it("meta+wheel zooms the canvas", () => {
		const { store, wrapper } = mountCanvas();
		const canvas = wrapper.find(".kiv-canvas");
		// happy-dom's WheelEvent doesn't extend MouseEvent (no metaKey support
		// via the constructor init dict), so set it directly on the instance.
		const wheelEvent = new WheelEvent("wheel", {
			deltaY: -100,
			bubbles: true,
			cancelable: true,
		});
		Object.defineProperty(wheelEvent, "metaKey", { value: true });
		canvas.element.dispatchEvent(wheelEvent);
		expect(store.zoom.value).toBeGreaterThan(1);
	});

	it("dropping a palette node type onto the canvas adds a new node", () => {
		const { store, wrapper } = mountCanvas();
		const frame = wrapper.find(".kiv-canvas__frame");
		const dropEvent = new Event("drop", { bubbles: true, cancelable: true });
		Object.defineProperty(dropEvent, "dataTransfer", {
			value: {
				getData: (k: string) =>
					k === "application/x-kiv-node-type" ? "text" : "",
			},
		});
		Object.defineProperty(dropEvent, "clientY", { value: 0 });
		frame.element.dispatchEvent(dropEvent);
		const rootChildren = store.document.value.root.slots?.default;
		expect(rootChildren?.at(-1)?.type).toBe("text");
	});
});
