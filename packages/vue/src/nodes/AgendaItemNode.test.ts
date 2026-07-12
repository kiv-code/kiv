import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import AgendaItemNode from "./AgendaItemNode.vue";

describe("AgendaItemNode", () => {
	it("renders time, title, and location", () => {
		const wrapper = mount(AgendaItemNode, {
			props: {
				time: "8h às 8h30",
				title: "Abertura",
				location: "Palco Principal",
			},
		});
		expect(wrapper.text()).toContain("8h às 8h30");
		expect(wrapper.text()).toContain("Abertura");
		expect(wrapper.text()).toContain("Palco Principal");
	});

	it("only renders the speaker card when hasSpeaker is true", () => {
		const withoutSpeaker = mount(AgendaItemNode, {
			props: { title: "Coffee" },
		});
		expect(withoutSpeaker.find(".kiv-agenda-item__speaker").exists()).toBe(
			false,
		);

		const withSpeaker = mount(AgendaItemNode, {
			props: {
				title: "Palestra",
				hasSpeaker: true,
				speakerName: "Alice Altissimo",
				speakerRole: "VP",
			},
		});
		expect(withSpeaker.find(".kiv-agenda-item__speaker").exists()).toBe(true);
		expect(withSpeaker.text()).toContain("Alice Altissimo");
	});
});
