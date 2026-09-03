import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ColumnNode from "./ColumnNode.vue";

describe("ColumnNode", () => {
	it("renders a div with data-kiv-type=column and passes through slot content", () => {
		const wrapper = mount(ColumnNode, {
			slots: { default: "<p>child</p>" },
		});
		expect(wrapper.element.tagName).toBe("DIV");
		expect(wrapper.attributes("data-kiv-type")).toBe("column");
		expect(wrapper.html()).toContain("<p>child</p>");
	});

	it("produces no layout styles for default (auto) props", () => {
		const wrapper = mount(ColumnNode, {});
		expect(wrapper.attributes("style")).toBeUndefined();
	});

	it("maps span and offset to grid-column styles", () => {
		const wrapper = mount(ColumnNode, {
			props: { span: "6", offset: "3" },
		});
		const style = wrapper.attributes("style") ?? "";
		expect(style).toContain("grid-column: span 6");
		expect(style).toContain("grid-column-start: 4");
	});

	it("applies padding from the spacing scale", () => {
		const wrapper = mount(ColumnNode, {
			props: { padding: { top: "sm", right: "md", bottom: "sm", left: "md" } },
		});
		const style = wrapper.attributes("style") ?? "";
		expect(style).toContain("padding: 8px 16px");
	});
});
