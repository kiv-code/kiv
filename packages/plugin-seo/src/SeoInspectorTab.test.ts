import type { SeoMeta } from "@kivcode/engine";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import SeoInspectorTab from "./SeoInspectorTab.vue";

function mountTab(seo: SeoMeta = {}) {
	const updateSeoMeta = vi.fn();
	const store = {
		document: { value: { seo } },
		updateSeoMeta,
	};
	const wrapper = mount(SeoInspectorTab, { props: { store } });
	return { wrapper, updateSeoMeta };
}

describe("SeoInspectorTab", () => {
	it("shows the current title and description", () => {
		const { wrapper } = mountTab({ title: "Home", description: "Welcome" });
		const title = wrapper.find("input").element as HTMLInputElement;
		expect(title.value).toBe("Home");
	});

	it("calls store.updateSeoMeta when the title changes", async () => {
		const { wrapper, updateSeoMeta } = mountTab({});
		const title = wrapper.find("input");
		await title.setValue("New title");
		expect(updateSeoMeta).toHaveBeenCalledWith({ title: "New title" });
	});

	it("renders the noindex/nofollow checkboxes reflecting current state", () => {
		const { wrapper } = mountTab({ noindex: true });
		const checkboxes = wrapper.findAll('input[type="checkbox"]');
		expect((checkboxes[0]?.element as HTMLInputElement).checked).toBe(true);
		expect((checkboxes[1]?.element as HTMLInputElement).checked).toBe(false);
	});

	it("renders the JSON-LD preview from the current seo state", () => {
		const { wrapper } = mountTab({ title: "Home" });
		expect(wrapper.find(".kiv-seo-tab__jsonld").text()).toContain(
			'"name": "Home"',
		);
	});
});
