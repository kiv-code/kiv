import type { FieldDescriptor } from "@kivcode/engine";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SizeSliderControl from "./SizeSliderControl.vue";

const PX: FieldDescriptor = {
	schema: { parse: (v: unknown) => v } as unknown as FieldDescriptor["schema"],
	control: "text",
	sliderUnits: [{ unit: "px", min: 0, max: 500, step: 1 }],
};

const WITH_AUTO: FieldDescriptor = { ...PX, allowAuto: true };

function mountControl(descriptor: FieldDescriptor, modelValue?: string) {
	return mount(SizeSliderControl, { props: { descriptor, modelValue } });
}

describe("SizeSliderControl", () => {
	it("renders a slider for a value it can represent", () => {
		const w = mountControl(PX, "120px");
		expect(w.find('input[type="range"]').exists()).toBe(true);
		expect(
			(w.find('input[type="number"]').element as HTMLInputElement).value,
		).toBe("120");
	});

	describe("the unset state", () => {
		it("says the value is unset instead of showing a slider at 0", () => {
			const w = mountControl(WITH_AUTO, "");
			expect(w.find('input[type="range"]').exists()).toBe(false);
			expect(w.text()).toContain("Not set");
		});

		it("offers an auto tab that clears the value", async () => {
			const w = mountControl(WITH_AUTO, "120px");
			const auto = w
				.findAll(".kiv-size-slider__unit")
				.find((b) => b.text() === "auto");
			await auto?.trigger("click");
			expect(w.emitted("update:modelValue")?.at(-1)).toEqual([""]);
		});

		it("has no auto tab unless the field opts in", () => {
			const w = mountControl(PX, "120px");
			expect(
				w.findAll(".kiv-size-slider__unit").map((b) => b.text()),
			).not.toContain("auto");
		});

		it("seeds a real number when leaving auto for a unit", async () => {
			const w = mountControl(WITH_AUTO, "");
			const px = w
				.findAll(".kiv-size-slider__unit")
				.find((b) => b.text() === "px");
			await px?.trigger("click");
			// Not "NaNpx" — the old control had no number to carry over here.
			expect(w.emitted("update:modelValue")?.at(-1)).toEqual(["0px"]);
		});
	});

	describe("values the slider cannot represent", () => {
		it("shows calc() as editable text rather than a misleading 0", () => {
			const w = mountControl(PX, "calc(100vh - 80px)");
			expect(w.find('input[type="range"]').exists()).toBe(false);
			const text = w.find('input[type="text"]');
			expect(text.exists()).toBe(true);
			expect((text.element as HTMLInputElement).value).toBe(
				"calc(100vh - 80px)",
			);
		});

		it("edits a unit the field was not configured with as text", () => {
			// Left on the slider, `3rem` would be driven by the px range and one
			// drag would write `250rem`.
			const w = mountControl(PX, "3rem");
			expect(w.find('input[type="range"]').exists()).toBe(false);
			expect(
				(w.find('input[type="text"]').element as HTMLInputElement).value,
			).toBe("3rem");
		});

		it("does not emit anything just from being rendered", () => {
			// The regression this guards: merely opening the inspector on a
			// clamp() value used to be enough to lose it on the next interaction.
			const w = mountControl(PX, "clamp(1rem, 4vw, 3rem)");
			expect(w.emitted("update:modelValue")).toBeUndefined();
		});
	});
});
