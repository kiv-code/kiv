import { defineNode, f } from "@kivcode/engine";
import { RADIUS, styleToString } from "@kivcode/nodes";

export const carouselNode = defineNode({
	type: "carousel",
	category: "interactive",
	label: "Carousel",
	icon: "images",
	description: "Rotating set of slides with autoplay, arrows, and dots.",
	slotConstraints: { default: ["image", "section", "container", "stack"] },
	toHtml(props, children) {
		const aspect =
			props.aspectRatio && props.aspectRatio !== "auto"
				? String(props.aspectRatio)
				: undefined;
		const viewportStyle = styleToString({
			position: "relative",
			overflow: "hidden",
			borderRadius: RADIUS[String(props.borderRadius ?? "lg")] ?? "16px",
			aspectRatio: aspect,
		});
		const trackStyle = styleToString({
			display: "flex",
			overflowX: "auto",
			scrollSnapType: "x mandatory",
			height: aspect ? "100%" : undefined,
		});
		// No-JS fallback: a horizontally scroll-snapping strip — genuinely
		// swipeable/scrollable without any script, unlike a fixed single slide.
		return (
			`<div data-kiv-type="carousel" style="${viewportStyle}">` +
			`<style>.kiv-carousel__track>*{flex:0 0 100%;min-width:0;scroll-snap-align:start;}</style>` +
			`<div class="kiv-carousel__track" style="${trackStyle}">${children.default ?? ""}</div>` +
			`</div>`
		);
	},
	fields: {
		autoplay: f.boolean({
			label: "Autoplay",
			default: true,
			group: "Behavior",
		}),
		autoplayInterval: f.number({
			label: "Interval (ms)",
			default: 5000,
			group: "Behavior",
		}),
		pauseOnHover: f.boolean({
			label: "Pause on Hover",
			default: true,
			group: "Behavior",
		}),
		loop: f.boolean({ label: "Loop", default: true, group: "Behavior" }),
		animation: f.select(["fade", "slide", "none"], {
			label: "Animation",
			default: "slide",
			group: "Style",
		}),
		animationDuration: f.number({
			label: "Duration (ms)",
			default: 300,
			group: "Style",
		}),
		showArrows: f.boolean({
			label: "Show Arrows",
			default: true,
			group: "Controls",
		}),
		showDots: f.boolean({
			label: "Show Dots",
			default: true,
			group: "Controls",
		}),
		showThumbnails: f.boolean({
			label: "Show Thumbnails",
			default: false,
			group: "Controls",
		}),
		aspectRatio: f.select(["16/9", "4/3", "1/1", "3/2", "auto"], {
			label: "Aspect Ratio",
			default: "16/9",
			group: "Layout",
		}),
		borderRadius: f.select(["none", "sm", "md", "lg", "xl", "full"], {
			label: "Border Radius",
			default: "lg",
			group: "Style",
		}),
	},
});
