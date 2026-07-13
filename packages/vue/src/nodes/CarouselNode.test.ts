import { carouselNode } from "@kivcode/nodes-interactive";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { h } from "vue";
import { KIV_BUS_KEY } from "../bus";
import CarouselNode from "./CarouselNode.vue";

function mountCarousel(props: Record<string, unknown> = {}, bus?: unknown) {
	return mount(CarouselNode, {
		props: { ...carouselNode.defaults, autoplay: false, ...props },
		slots: {
			default: () => [
				h("div", "Slide 1"),
				h("div", "Slide 2"),
				h("div", "Slide 3"),
			],
		},
		global: {
			provide: bus ? { [KIV_BUS_KEY as unknown as string]: bus } : {},
		},
	});
}

describe("CarouselNode", () => {
	it("renders a data-kiv-type wrapper and 3 slides", () => {
		const wrapper = mountCarousel();
		expect(wrapper.attributes("data-kiv-type")).toBe("carousel");
		expect(wrapper.findAll(".kiv-carousel__track > *")).toHaveLength(3);
	});

	it("shows arrows and dots by default and advances on next-arrow click", async () => {
		const wrapper = mountCarousel();
		const nextArrow = wrapper.find(".kiv-carousel__arrow--next");
		expect(nextArrow.exists()).toBe(true);
		await nextArrow.trigger("click");
		expect(wrapper.findAll(".kiv-carousel__dot--active")).toHaveLength(1);
	});

	it("loops back to the first slide past the last when loop=true", async () => {
		const emit = vi.fn();
		const wrapper = mountCarousel({ loop: true }, { emit });
		const dots = () => wrapper.findAll(".kiv-carousel__dot");
		await dots()[2]?.trigger("click");
		const nextArrow = wrapper.find(".kiv-carousel__arrow--next");
		await nextArrow.trigger("click");
		const lastCall = emit.mock.calls.at(-1);
		expect(lastCall?.[0]).toBe("carousel.slideChanged");
		expect(lastCall?.[1]).toMatchObject({ currentIndex: 0, previousIndex: 2 });
	});

	it("does not advance past the last slide when loop=false", async () => {
		const wrapper = mountCarousel({ loop: false });
		const dots = wrapper.findAll(".kiv-carousel__dot");
		await dots[2]?.trigger("click");
		const nextArrow = wrapper.find(".kiv-carousel__arrow--next");
		await nextArrow.trigger("click");
		expect(wrapper.findAll(".kiv-carousel__dot--active")[0]?.text()).toBe("");
		expect(wrapper.findAll(".kiv-carousel__dot")[2]?.classes()).toContain(
			"kiv-carousel__dot--active",
		);
	});

	it("emits carousel.slideChanged on the bus when the slide changes", async () => {
		const emit = vi.fn();
		const wrapper = mountCarousel({}, { emit });
		await wrapper.find(".kiv-carousel__arrow--next").trigger("click");
		expect(emit).toHaveBeenCalledWith("carousel.slideChanged", {
			nodeId: undefined,
			currentIndex: 1,
			previousIndex: 0,
		});
	});

	it("hides arrows/dots/thumbnails when their toggles are off", () => {
		const wrapper = mountCarousel({
			showArrows: false,
			showDots: false,
			showThumbnails: false,
		});
		expect(wrapper.find(".kiv-carousel__arrow--next").exists()).toBe(false);
		expect(wrapper.find(".kiv-carousel__dots").exists()).toBe(false);
		expect(wrapper.find(".kiv-carousel__thumbs").exists()).toBe(false);
	});
});
