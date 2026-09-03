import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SectionNode from "./SectionNode.vue";

describe("SectionNode", () => {
	it("renders a section with data-kiv-type=section and slot content", () => {
		const wrapper = mount(SectionNode, {
			slots: { default: "<p>body</p>" },
		});
		expect(wrapper.element.tagName).toBe("SECTION");
		expect(wrapper.attributes("data-kiv-type")).toBe("section");
		expect(wrapper.html()).toContain("<p>body</p>");
	});

	it("produces no inline style for an all-default/transparent section", () => {
		const wrapper = mount(SectionNode, {});
		expect(wrapper.attributes("style")).toBeUndefined();
	});

	it("applies background color and padding scale values", () => {
		const wrapper = mount(SectionNode, {
			props: {
				background: "#123456",
				padding: { top: "lg", right: "md", bottom: "lg", left: "md" },
			},
		});
		const style = wrapper.attributes("style") ?? "";
		expect(style).toContain("background-color: #123456");
		expect(style).toContain("padding: 64px 32px");
	});

	it("renders the overlay div with a solid-or-gradient color when overlay is enabled", () => {
		const wrapper = mount(SectionNode, {
			props: {
				overlay: true,
				overlayColor: { type: "solid", solid: "#010203", alpha: 0.5 },
			},
		});
		const overlay = wrapper.find(".kiv-section__overlay");
		expect(overlay.exists()).toBe(true);
		const el = overlay.element as HTMLElement;
		expect(el.style.background).toBe("rgba(1, 2, 3, 0.5)");
	});

	it("does not render the overlay or video background by default", () => {
		const wrapper = mount(SectionNode, {});
		expect(wrapper.find(".kiv-section__overlay").exists()).toBe(false);
		expect(wrapper.find(".kiv-section__video-bg").exists()).toBe(false);
	});
});
