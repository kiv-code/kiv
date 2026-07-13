import type { KivDocument } from "@kivcode/engine";
import { createRegistry } from "@kivcode/engine";
import { ALL_NODES } from "@kivcode/nodes";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { EDITOR_STORE_KEY } from "../store/context";
import { useEditorStore } from "../store/editor-store";
import KivInspector from "./KivInspector.vue";

const registry = createRegistry();
registry.registerMany([...ALL_NODES]);

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
								{
									id: "heading-2",
									type: "heading",
									props: { text: "World", level: 2 },
								},
								{ id: "text-1", type: "text", props: { content: "Body" } },
							],
						},
					},
				],
			},
		},
		i18n: { default: "en", supported: ["en"] },
	};
}

function mountInspector(doc = makeDoc()) {
	const store = useEditorStore(doc, registry);
	const wrapper = mount(KivInspector, {
		props: { registry },
		global: { provide: { [EDITOR_STORE_KEY]: store } },
		attachTo: document.body,
	});
	return { store, wrapper };
}

afterEach(() => {
	document.body.innerHTML = "";
});

describe("KivInspector", () => {
	it("shows the empty state when nothing is selected", () => {
		const { wrapper } = mountInspector();
		expect(wrapper.text()).toContain("Select a node to inspect");
	});

	it("shows the single-node header for one selected node", async () => {
		const { store, wrapper } = mountInspector();
		store.select("heading-1");
		await nextTick();
		expect(wrapper.text()).not.toContain("Multiple selected");
	});

	it("shows a 'Multiple selected' header when several nodes are selected", async () => {
		const { store, wrapper } = mountInspector();
		store.select("heading-1");
		store.toggleSelect("heading-2");
		await nextTick();
		expect(wrapper.text()).toContain("Multiple selected (2)");
	});

	it("shares an editable field across every selected node of the same type", async () => {
		const { store, wrapper } = mountInspector();
		store.select("heading-1");
		store.toggleSelect("heading-2");
		await nextTick();
		const textField = wrapper
			.findAll(".kiv-field")
			.find((f) => f.find(".kiv-field__label").text() === "Text");
		const input = textField?.find("input");
		expect(input?.exists()).toBe(true);
		await input?.setValue("Changed");
		const section = store.document.value.root.slots?.default?.[0];
		const h1 = section?.slots?.default?.[0];
		const h2 = section?.slots?.default?.[1];
		expect(h1?.props.text).toBe("Changed");
		expect(h2?.props.text).toBe("Changed");
	});

	it("shows a mixed-type message instead of a field editor when types differ", async () => {
		const { store, wrapper } = mountInspector();
		store.select("heading-1");
		store.toggleSelect("text-1");
		await nextTick();
		expect(wrapper.text()).toContain("Select nodes of the same type");
	});

	it("deletes every selected node when 'delete all' is clicked", async () => {
		const { store, wrapper } = mountInspector();
		store.select("heading-1");
		store.toggleSelect("heading-2");
		await nextTick();
		await wrapper.find('[title="Delete all selected"]').trigger("click");
		const children =
			store.document.value.root.slots?.default?.[0]?.slots?.default;
		expect(children).toHaveLength(1);
		expect(children?.[0]?.id).toBe("text-1");
	});

	it("does not update props for a locked node selected via the tree", () => {
		const { store } = mountInspector();
		store.select("heading-1");
		store.setLocked("heading-1", true);
		store.updateProps("heading-1", { text: "should not apply" });
		const heading =
			store.document.value.root.slots?.default?.[0]?.slots?.default?.[0];
		expect(heading?.props.text).toBe("Hello");
	});
});
