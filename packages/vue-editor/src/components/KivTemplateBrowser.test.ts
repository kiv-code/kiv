import type { PageTemplate } from "@kivcode/engine";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import KivTemplateBrowser from "./KivTemplateBrowser.vue";

// Teleported to <body>, like KivNodePalette — query/mount against the real document.
afterEach(() => {
	document.body.innerHTML = "";
});

const templates: PageTemplate[] = [
	{
		id: "blank",
		name: "Blank page",
		description: "An empty page",
		document: {
			schemaVersion: 1,
			root: { id: "root", type: "page", props: {} },
			i18n: { default: "en", supported: ["en"] },
		},
	},
	{
		id: "landing",
		name: "Landing page",
		description: "Hero and features",
		document: {
			schemaVersion: 1,
			root: { id: "root", type: "page", props: {} },
			i18n: { default: "en", supported: ["en"] },
		},
	},
];

describe("KivTemplateBrowser", () => {
	it("lists every template when the search is empty", () => {
		mount(KivTemplateBrowser, {
			props: { open: true, templates },
			attachTo: document.body,
		});
		expect(document.body.textContent).toContain("Blank page");
		expect(document.body.textContent).toContain("Landing page");
	});

	it("filters by search query", async () => {
		mount(KivTemplateBrowser, {
			props: { open: true, templates },
			attachTo: document.body,
		});
		const input = document.body.querySelector("input") as HTMLInputElement;
		input.value = "landing";
		input.dispatchEvent(new Event("input"));
		await Promise.resolve();
		expect(document.body.textContent).toContain("Landing page");
		expect(document.body.textContent).not.toContain("Blank page");
	});

	it("emits apply with the clicked template, then closes", async () => {
		const wrapper = mount(KivTemplateBrowser, {
			props: { open: true, templates },
			attachTo: document.body,
		});
		const cards = Array.from(
			document.body.querySelectorAll(".kiv-template-modal__card"),
		);
		const landingCard = cards.find((c) =>
			c.textContent?.includes("Landing page"),
		);
		landingCard?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		await wrapper.vm.$nextTick();
		expect(wrapper.emitted("apply")?.[0]).toEqual([templates[1]]);
		expect(wrapper.emitted("close")).toHaveLength(1);
	});

	it("shows an empty state when nothing matches", async () => {
		mount(KivTemplateBrowser, {
			props: { open: true, templates },
			attachTo: document.body,
		});
		const input = document.body.querySelector("input") as HTMLInputElement;
		input.value = "nonexistent";
		input.dispatchEvent(new Event("input"));
		await Promise.resolve();
		expect(document.body.textContent).toContain("No templates match");
	});
});
