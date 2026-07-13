import type { KivNode } from "@kivcode/engine";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { KIV_CONTEXT_KEY } from "./context";
import { createDefaultVueRegistry } from "./defaultRegistry";
import { KIV_EDITOR_MODE_KEY } from "./editor-mode";
import KivNodeRenderer from "./KivNodeRenderer.vue";
import { createVueRegistry } from "./registry";

function baseContext(overrides?: { locale?: string; breakpoint?: string }) {
	return {
		registry: createDefaultVueRegistry(),
		resolveCtx: {
			locale: overrides?.locale ?? "en",
			breakpoint: overrides?.breakpoint ?? "base",
			fallbackLocale: "en",
		},
	};
}

describe("KivNodeRenderer", () => {
	it("renders the registered component for a node type", () => {
		const node: KivNode = {
			id: "heading-1",
			type: "heading",
			props: { text: "Hello", level: "3" },
		};

		const wrapper = mount(KivNodeRenderer, {
			props: { node },
			global: {
				provide: { [KIV_CONTEXT_KEY as unknown as string]: baseContext() },
			},
		});

		expect(wrapper.element.tagName).toBe("H3");
		expect(wrapper.text()).toBe("Hello");
	});

	it("sets id, node-id and data-kiv-node-id attributes to the resolved node id", () => {
		const node: KivNode = {
			id: "heading-42",
			type: "heading",
			props: { text: "Hello" },
		};

		const wrapper = mount(KivNodeRenderer, {
			props: { node },
			global: {
				provide: { [KIV_CONTEXT_KEY as unknown as string]: baseContext() },
			},
		});

		expect(wrapper.attributes("id")).toBe("heading-42");
		expect(wrapper.attributes("node-id")).toBe("heading-42");
		expect(wrapper.attributes("data-kiv-node-id")).toBe("heading-42");
	});

	it("recursively renders slot children into the matching named slot", () => {
		const node: KivNode = {
			id: "section-1",
			type: "section",
			props: {},
			slots: {
				default: [
					{ id: "heading-1", type: "heading", props: { text: "Nested" } },
				],
			},
		};

		const wrapper = mount(KivNodeRenderer, {
			props: { node },
			global: {
				provide: { [KIV_CONTEXT_KEY as unknown as string]: baseContext() },
			},
		});

		const heading = wrapper.find('[data-kiv-node-id="heading-1"]');
		expect(heading.exists()).toBe(true);
		expect(heading.text()).toBe("Nested");
	});

	it("falls back to Link's flat text prop when its default slot is an empty array (not undefined)", () => {
		// This is the shape a freshly palette-created Link node has: it gets
		// `slots: { default: [] }` up front (so DnD/indent can nest into it
		// later) but starts with no children, so the flat `text` prop must
		// still render — an empty-but-present slot must NOT suppress it.
		const node: KivNode = {
			id: "link-1",
			type: "link",
			props: { text: "Fallback text", href: "#" },
			slots: { default: [] },
		};

		const wrapper = mount(KivNodeRenderer, {
			props: { node },
			global: {
				provide: { [KIV_CONTEXT_KEY as unknown as string]: baseContext() },
			},
		});

		expect(wrapper.text()).toBe("Fallback text");
	});

	it("renders an unknown-type fallback div when the registry has no component for the type", () => {
		const node: KivNode = {
			id: "mystery-1",
			type: "not-a-real-type",
			props: {},
		};

		const wrapper = mount(KivNodeRenderer, {
			props: { node },
			global: {
				provide: {
					[KIV_CONTEXT_KEY as unknown as string]: {
						registry: createVueRegistry(),
						resolveCtx: { locale: "en", breakpoint: "base" },
					},
				},
			},
		});

		expect(wrapper.element.tagName).toBe("DIV");
		expect(wrapper.attributes("data-kiv-unknown")).toBe("not-a-real-type");
		expect(wrapper.attributes("style")).toContain("display: none");
	});

	it("resolves responsive props for the given breakpoint", () => {
		const node: KivNode = {
			id: "heading-1",
			type: "heading",
			props: { text: { base: "Mobile", lg: "Desktop" } },
		};

		const wrapperBase = mount(KivNodeRenderer, {
			props: { node },
			global: {
				provide: {
					[KIV_CONTEXT_KEY as unknown as string]: baseContext({
						breakpoint: "base",
					}),
				},
			},
		});
		expect(wrapperBase.text()).toBe("Mobile");

		const wrapperLg = mount(KivNodeRenderer, {
			props: { node },
			global: {
				provide: {
					[KIV_CONTEXT_KEY as unknown as string]: baseContext({
						breakpoint: "lg",
					}),
				},
			},
		});
		expect(wrapperLg.text()).toBe("Desktop");
	});

	it("resolves localized props for the given locale", () => {
		const node: KivNode = {
			id: "heading-1",
			type: "heading",
			props: { text: { $t: { en: "Hello", es: "Hola" } } },
		};

		const wrapperEn = mount(KivNodeRenderer, {
			props: { node },
			global: {
				provide: {
					[KIV_CONTEXT_KEY as unknown as string]: baseContext({ locale: "en" }),
				},
			},
		});
		expect(wrapperEn.text()).toBe("Hello");

		const wrapperEs = mount(KivNodeRenderer, {
			props: { node },
			global: {
				provide: {
					[KIV_CONTEXT_KEY as unknown as string]: baseContext({ locale: "es" }),
				},
			},
		});
		expect(wrapperEs.text()).toBe("Hola");
	});

	it("renders nothing for a node hidden at the current breakpoint outside the editor", () => {
		const node: KivNode = {
			id: "heading-1",
			type: "heading",
			props: { text: "Hello" },
			visible: false,
		};

		const wrapper = mount(KivNodeRenderer, {
			props: { node },
			global: {
				provide: { [KIV_CONTEXT_KEY as unknown as string]: baseContext() },
			},
		});

		expect(wrapper.find('[data-kiv-node-id="heading-1"]').exists()).toBe(false);
	});

	it("still renders a hidden node inside the editor, dimmed and flagged", () => {
		const node: KivNode = {
			id: "heading-1",
			type: "heading",
			props: { text: "Hello" },
			visible: { base: false, lg: true },
		};

		const wrapper = mount(KivNodeRenderer, {
			props: { node },
			global: {
				provide: {
					[KIV_CONTEXT_KEY as unknown as string]: baseContext(),
					[KIV_EDITOR_MODE_KEY as unknown as string]: true,
				},
			},
		});

		expect(wrapper.attributes("data-kiv-hidden")).toBe("true");
		expect(wrapper.attributes("style")).toContain("opacity: 0.35");
	});

	it("renders visible: false as visible again once the breakpoint resolves true", () => {
		const node: KivNode = {
			id: "heading-1",
			type: "heading",
			props: { text: "Hello" },
			visible: { base: false, lg: true },
		};

		const wrapper = mount(KivNodeRenderer, {
			props: { node },
			global: {
				provide: {
					[KIV_CONTEXT_KEY as unknown as string]: baseContext({
						breakpoint: "lg",
					}),
				},
			},
		});

		expect(wrapper.find('[data-kiv-node-id="heading-1"]').exists()).toBe(true);
		expect(wrapper.attributes("data-kiv-hidden")).toBeUndefined();
	});

	it("renders nothing but the fallback div when no context is provided and the type is unregistered", () => {
		const node: KivNode = {
			id: "orphan-1",
			type: "whatever",
			props: {},
		};

		const wrapper = mount(KivNodeRenderer, {
			props: { node },
		});

		expect(wrapper.element.tagName).toBe("DIV");
		expect(wrapper.attributes("data-kiv-unknown")).toBe("whatever");
	});
});
