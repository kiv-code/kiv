import type { KivDocument } from "@kivcode/engine";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { EDITOR_STORE_KEY } from "../store/context";
import { useEditorStore } from "../store/editor-store";
import KivTree from "./KivTree.vue";

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
								{ id: "heading-1", type: "heading", props: { text: "Hello" } },
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

function mountTree() {
	const store = useEditorStore(makeDoc(), {
		has: () => false,
		get: () => undefined,
	} as never);
	const wrapper = mount(KivTree, {
		global: { provide: { [EDITOR_STORE_KEY]: store } },
		attachTo: document.body,
	});
	return { store, wrapper };
}

afterEach(() => {
	document.body.innerHTML = "";
});

describe("KivTree", () => {
	it("shows a match count while filtering", async () => {
		const { wrapper } = mountTree();
		const input = wrapper.find(".kiv-tree__filter");
		await input.setValue("heading");
		expect(wrapper.text()).toContain("1 match");
	});

	it("pluralizes the match count for more than one hit", async () => {
		const { wrapper } = mountTree();
		const input = wrapper.find(".kiv-tree__filter");
		await input.setValue("t"); // matches "text" and the "text-1" id, "heading" id too
		expect(wrapper.text()).toMatch(/\d+ matches/);
	});

	it("Escape clears the filter", async () => {
		const { wrapper } = mountTree();
		const input = wrapper.find(".kiv-tree__filter");
		await input.setValue("heading");
		expect((input.element as HTMLInputElement).value).toBe("heading");
		await input.trigger("keydown", { key: "Escape" });
		expect((input.element as HTMLInputElement).value).toBe("");
	});

	it("shift-clicking a tree row adds it to the selection", async () => {
		const { store, wrapper } = mountTree();
		const rows = wrapper.findAll(".ktn__row");
		const headingRow = rows.find((r) => r.text().includes("heading-1"));
		const textRow = rows.find((r) => r.text().includes("text-1"));
		await headingRow?.trigger("click");
		await textRow?.trigger("click", { shiftKey: true });
		expect(store.selectedIds.value).toEqual(["heading-1", "text-1"]);
	});
});
