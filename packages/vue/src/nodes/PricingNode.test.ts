import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import PricingNode from "./PricingNode.vue";

const sampleData = JSON.stringify({
	tiers: [
		{ period: "Julio", tier: "Regular", highlighted: true },
		{ period: "Agosto", tier: "Late", highlighted: false },
	],
	rows: [{ label: "PMI Members", values: ["S/ 1,700", "S/ 2,100"] }],
});

describe("PricingNode", () => {
	it("renders the table variant with a real <table>", () => {
		const wrapper = mount(PricingNode, {
			props: { data: sampleData, variant: "table" },
		});
		expect(wrapper.find("table").exists()).toBe(true);
		expect(wrapper.text()).toContain("PMI Members");
		expect(wrapper.text()).toContain("S/ 1,700");
	});

	it("renders the cards variant as a grid, not a table", () => {
		const wrapper = mount(PricingNode, {
			props: { data: sampleData, variant: "cards" },
		});
		expect(wrapper.find("table").exists()).toBe(false);
		expect(wrapper.text()).toContain("S/ 2,100");
	});

	it("shows the CTA button only when ctaLabel is set", () => {
		const withoutCta = mount(PricingNode, {
			props: { data: sampleData, variant: "cards" },
		});
		expect(withoutCta.text()).not.toContain("Inscreva-se");

		const withCta = mount(PricingNode, {
			props: { data: sampleData, variant: "cards", ctaLabel: "Inscreva-se" },
		});
		expect(withCta.text()).toContain("Inscreva-se");
	});

	it("renders without throwing for malformed JSON", () => {
		expect(() =>
			mount(PricingNode, { props: { data: "{not valid" } }),
		).not.toThrow();
	});
});
