import type { KivDocument } from "@kivcode/engine";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import A11yPanel from "./A11yPanel.vue";

const dirtyDoc: KivDocument = {
	schemaVersion: 1,
	i18n: { default: "en", supported: ["en"] },
	root: {
		id: "root",
		type: "page",
		props: {},
		slots: {
			default: [
				{ id: "img1", type: "image", props: {} },
				{ id: "b1", type: "button", props: {} },
			],
		},
	},
};

function mountPanel(document: KivDocument) {
	const select = vi.fn();
	const store = { document: { value: document }, select };
	const wrapper = mount(A11yPanel, { props: { store } });
	return { wrapper, select };
}

describe("A11yPanel", () => {
	it("lists one item per issue found in the document", () => {
		const { wrapper } = mountPanel(dirtyDoc);
		const items = wrapper.findAll(".kiv-a11y-panel__item");
		expect(items).toHaveLength(2);
	});

	it("shows the error/warning counts in the summary", () => {
		const { wrapper } = mountPanel(dirtyDoc);
		expect(wrapper.find(".kiv-a11y-panel__badge--error").text()).toContain("2");
	});

	it('shows "No issues found" for a clean document', () => {
		const clean: KivDocument = {
			schemaVersion: 1,
			i18n: { default: "en", supported: ["en"] },
			root: { id: "root", type: "page", props: {}, slots: { default: [] } },
		};
		const { wrapper } = mountPanel(clean);
		expect(wrapper.find(".kiv-a11y-panel__badge--ok").exists()).toBe(true);
		expect(wrapper.findAll(".kiv-a11y-panel__item")).toHaveLength(0);
	});

	it("selects the offending node when an issue is clicked", async () => {
		const { wrapper, select } = mountPanel(dirtyDoc);
		await wrapper.findAll(".kiv-a11y-panel__item")[0]?.trigger("click");
		expect(select).toHaveBeenCalledWith("img1");
	});
});
