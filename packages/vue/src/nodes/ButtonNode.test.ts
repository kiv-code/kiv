import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ButtonNode from "./ButtonNode.vue";

describe("ButtonNode", () => {
	it("renders an anchor with data-kiv-type and the label", () => {
		const wrapper = mount(ButtonNode, {
			props: { label: "Click me", href: "https://example.com" },
		});
		expect(wrapper.element.tagName).toBe("A");
		expect(wrapper.attributes("data-kiv-type")).toBe("button");
		expect(wrapper.text()).toBe("Click me");
		expect(wrapper.attributes("href")).toBe("https://example.com");
	});

	it("renders no link at all until a destination is set", () => {
		// The old default was href="#", which looked like a link but scrolled
		// to the top of the page when clicked.
		const wrapper = mount(ButtonNode, { props: { label: "Go" } });
		expect(wrapper.element.tagName).toBe("SPAN");
		expect(wrapper.attributes("href")).toBeUndefined();
	});

	it("links in the same tab for an internal destination", () => {
		const wrapper = mount(ButtonNode, {
			props: { label: "Go", href: "/about", linkType: "internal" },
		});
		expect(wrapper.attributes("href")).toBe("/about");
		expect(wrapper.attributes("target")).toBe("_self");
		expect(wrapper.attributes("rel")).toBeUndefined();
	});

	it("forces target=_blank and rel=noopener for linkType=external", () => {
		const wrapper = mount(ButtonNode, {
			props: { label: "External", href: "https://x.com", linkType: "external" },
		});
		expect(wrapper.attributes("target")).toBe("_blank");
		expect(wrapper.attributes("rel")).toBe("noopener noreferrer");
	});

	it("applies the outline variant colors and full width block display", () => {
		const wrapper = mount(ButtonNode, {
			props: { label: "Outline", variant: "outline", fullWidth: true },
		});
		const style = wrapper.attributes("style") ?? "";
		// The browser coalesces the separately-set `background` and
		// `background-origin` longhands into the `background` shorthand when
		// serializing back to a style string (order: origin, then color).
		expect(style).toContain("background: border-box transparent");
		expect(style).toContain("width: 100%");
		expect(style).toContain("display: block");
	});

	it("applies the hover effect class when set, omits it otherwise", () => {
		const withEffect = mount(ButtonNode, {
			props: { label: "Go", hoverEffect: "underline" },
		});
		expect(withEffect.classes()).toContain("kiv-hover-underline");

		const withoutEffect = mount(ButtonNode, { props: { label: "Go" } });
		expect(withoutEffect.classes()).toHaveLength(0);
	});
});
