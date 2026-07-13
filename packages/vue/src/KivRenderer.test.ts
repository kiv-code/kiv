import type { KivDocument } from "@kivcode/engine";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createDefaultVueRegistry } from "./defaultRegistry";
import KivRenderer from "./KivRenderer.vue";

function buildDocument(): KivDocument {
	return {
		schemaVersion: 1,
		i18n: { default: "en", supported: ["en", "es"], fallback: "en" },
		root: {
			id: "page-1",
			type: "page",
			props: { lang: "en" },
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
									props: { text: "Hello", level: "2" },
								},
							],
						},
					},
				],
			},
		},
	};
}

describe("KivRenderer", () => {
	it("renders the root node via its registered component", () => {
		const wrapper = mount(KivRenderer, {
			props: {
				document: buildDocument(),
				registry: createDefaultVueRegistry(),
			},
		});

		const page = wrapper.find('[data-kiv-type="page"]');
		expect(page.exists()).toBe(true);
	});

	it("renders nested slot children recursively", () => {
		const wrapper = mount(KivRenderer, {
			props: {
				document: buildDocument(),
				registry: createDefaultVueRegistry(),
			},
		});

		const section = wrapper.find('[data-kiv-type="section"]');
		expect(section.exists()).toBe(true);
		const heading = section.find("h2");
		expect(heading.exists()).toBe(true);
		expect(heading.text()).toBe("Hello");
	});

	it("sets data-kiv-node-id on every rendered node matching its KivNode id", () => {
		const wrapper = mount(KivRenderer, {
			props: {
				document: buildDocument(),
				registry: createDefaultVueRegistry(),
			},
		});

		expect(wrapper.find('[data-kiv-node-id="page-1"]').exists()).toBe(true);
		expect(wrapper.find('[data-kiv-node-id="section-1"]').exists()).toBe(true);
		expect(wrapper.find('[data-kiv-node-id="heading-1"]').exists()).toBe(true);
	});

	it("falls back to an unknown-node placeholder for unregistered node types", () => {
		const document = buildDocument();
		document.root.slots = {
			default: [
				{
					id: "mystery-1",
					type: "totally-unregistered-widget",
					props: {},
				},
			],
		};

		const wrapper = mount(KivRenderer, {
			props: {
				document,
				registry: createDefaultVueRegistry(),
			},
		});

		const fallback = wrapper.find(
			'[data-kiv-unknown="totally-unregistered-widget"]',
		);
		expect(fallback.exists()).toBe(true);
		expect(fallback.element.tagName).toBe("DIV");
		expect(fallback.attributes("style")).toContain("display: none");
	});

	it("resolves responsive props to the base value by default", () => {
		const document = buildDocument();
		const heading = document.root.slots?.default?.[0]?.slots?.default?.[0];
		if (heading) {
			heading.props = {
				text: { base: "Mobile heading", lg: "Desktop heading" },
				level: "2",
			};
		}

		const wrapper = mount(KivRenderer, {
			props: {
				document,
				registry: createDefaultVueRegistry(),
			},
		});

		expect(wrapper.find("h2").text()).toBe("Mobile heading");
	});

	it("resolves responsive props to the breakpoint value when breakpoint prop is passed", () => {
		const document = buildDocument();
		const heading = document.root.slots?.default?.[0]?.slots?.default?.[0];
		if (heading) {
			heading.props = {
				text: { base: "Mobile heading", lg: "Desktop heading" },
				level: "2",
			};
		}

		const wrapper = mount(KivRenderer, {
			props: {
				document,
				registry: createDefaultVueRegistry(),
				breakpoint: "lg",
			},
		});

		expect(wrapper.find("h2").text()).toBe("Desktop heading");
	});

	it("resolves localized props to the document default locale", () => {
		const document = buildDocument();
		const heading = document.root.slots?.default?.[0]?.slots?.default?.[0];
		if (heading) {
			heading.props = {
				text: { $t: { en: "Hello", es: "Hola" } },
				level: "2",
			};
		}

		const wrapper = mount(KivRenderer, {
			props: {
				document,
				registry: createDefaultVueRegistry(),
			},
		});

		expect(wrapper.find("h2").text()).toBe("Hello");
	});

	it("resolves localized props to the requested locale prop", () => {
		const document = buildDocument();
		const heading = document.root.slots?.default?.[0]?.slots?.default?.[0];
		if (heading) {
			heading.props = {
				text: { $t: { en: "Hello", es: "Hola" } },
				level: "2",
			};
		}

		const wrapper = mount(KivRenderer, {
			props: {
				document,
				registry: createDefaultVueRegistry(),
				locale: "es",
			},
		});

		expect(wrapper.find("h2").text()).toBe("Hola");
	});
});
