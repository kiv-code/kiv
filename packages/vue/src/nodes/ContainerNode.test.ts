import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ContainerNode from "./ContainerNode.vue";

describe("ContainerNode", () => {
	it("renders a div with data-kiv-type=container and slot content", () => {
		const wrapper = mount(ContainerNode, {
			slots: { default: "<span>inner</span>" },
		});
		expect(wrapper.element.tagName).toBe("DIV");
		expect(wrapper.attributes("data-kiv-type")).toBe("container");
		expect(wrapper.html()).toContain("<span>inner</span>");
	});

	it("defaults to maxWidth lg, centered margins and md horizontal padding", () => {
		const wrapper = mount(ContainerNode, {});
		const style = wrapper.attributes("style") ?? "";
		expect(style).toContain("max-width: 1024px");
		expect(style).toContain("width: 100%");
		expect(style).toContain("margin-left: auto");
		expect(style).toContain("margin-right: auto");
		expect(style).toContain("padding: 0px 16px");
	});

	it("omits centering margins when centered is false", () => {
		const wrapper = mount(ContainerNode, { props: { centered: false } });
		const style = wrapper.attributes("style") ?? "";
		expect(style).not.toContain("margin-left");
		expect(style).not.toContain("margin-right");
	});

	it("maps maxWidth and paddingY scales", () => {
		const wrapper = mount(ContainerNode, {
			props: {
				maxWidth: "sm",
				padding: { top: "lg", right: "md", bottom: "lg", left: "md" },
			},
		});
		const style = wrapper.attributes("style") ?? "";
		expect(style).toContain("max-width: 640px");
		expect(style).toContain("padding: 32px 16px");
	});
});
