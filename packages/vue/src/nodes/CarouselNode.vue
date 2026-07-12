<script setup lang="ts">
import { RADIUS } from "@kiv/nodes";
import {
	computed,
	inject,
	nextTick,
	onBeforeUnmount,
	onMounted,
	onUpdated,
	ref,
	useSlots,
	watch,
} from "vue";
import { KIV_BUS_KEY } from "../bus";
import { KIV_EDITOR_MODE_KEY } from "../editor-mode";

declare module "@kiv/engine" {
	interface KivEventMap {
		"carousel.slideChanged": {
			nodeId?: string;
			currentIndex: number;
			previousIndex: number;
		};
	}
}

const props = defineProps<{
	nodeId?: string;
	autoplay?: boolean;
	autoplayInterval?: number;
	pauseOnHover?: boolean;
	loop?: boolean;
	animation?: string;
	animationDuration?: number;
	showArrows?: boolean;
	showDots?: boolean;
	showThumbnails?: boolean;
	aspectRatio?: string;
	borderRadius?: string;
}>();

const bus = inject(KIV_BUS_KEY, null);
const isEditorMode = inject(KIV_EDITOR_MODE_KEY, false);
const slots = useSlots();
const trackRef = ref<HTMLElement | null>(null);

const currentIndex = ref(0);
const paused = ref(false);
const slideCount = ref(0);

// Synchronous initial count from slots (available during setup/render).
const slotCount = computed(() => slots.default?.({})?.length ?? 0);
slideCount.value = slotCount.value;

// DOM-based count for dynamic updates (DnD, etc.) — onUpdated fires after
// each render, catching children added/removed after the initial mount.
function updateSlideCount(): void {
	if (trackRef.value) {
		slideCount.value = trackRef.value.children.length;
	}
}

onMounted(updateSlideCount);
onUpdated(updateSlideCount);

function onTrackEl(el: unknown): void {
	trackRef.value = el as HTMLElement | null;
}

function goTo(index: number): void {
	const count = slideCount.value;
	if (count === 0) return;
	let next = index;
	if (props.loop) {
		next = ((index % count) + count) % count;
	} else {
		next = Math.max(0, Math.min(count - 1, index));
	}
	if (next === currentIndex.value) return;
	const previous = currentIndex.value;
	currentIndex.value = next;
	bus?.emit("carousel.slideChanged", {
		nodeId: props.nodeId,
		currentIndex: next,
		previousIndex: previous,
	});
}

function next(): void {
	goTo(currentIndex.value + 1);
}
function prev(): void {
	goTo(currentIndex.value - 1);
}

let timer: ReturnType<typeof setInterval> | null = null;
function clearTimer(): void {
	if (timer) clearInterval(timer);
	timer = null;
}
function startTimer(): void {
	clearTimer();
	if (!props.autoplay || isEditorMode || slideCount.value <= 1) return;
	timer = setInterval(
		() => {
			if (paused.value) return;
			next();
		},
		Math.max(500, props.autoplayInterval ?? 5000),
	);
}

onMounted(startTimer);
onBeforeUnmount(clearTimer);
watch(
	() => [props.autoplay, props.autoplayInterval, slideCount.value],
	startTimer,
);

function onMouseEnter(): void {
	if (props.pauseOnHover) paused.value = true;
}
function onMouseLeave(): void {
	paused.value = false;
}

const isAbsoluteLayout = computed(
	() => (props.animation ?? "slide") !== "slide",
);

const viewportStyle = computed(() => {
	const aspect =
		props.aspectRatio && props.aspectRatio !== "auto"
			? props.aspectRatio
			: undefined;
	return {
		position: "relative" as const,
		overflow: "hidden" as const,
		borderRadius: RADIUS[props.borderRadius ?? "lg"] ?? "16px",
		aspectRatio: aspect,
	};
});

const trackStyle = computed(() => {
	if (isAbsoluteLayout.value) {
		return { position: "relative" as const, width: "100%", height: "100%" };
	}
	return {
		display: "flex" as const,
		width: "100%",
		height: "100%",
		transform: `translateX(-${currentIndex.value * 100}%)`,
		transition: `transform ${props.animationDuration ?? 300}ms ease`,
	};
});

// Vue's SFC compiler rejects a literal <style> tag anywhere in <template>,
// so per-slide visibility (fade/none layouts) is applied imperatively to the
// track's direct DOM children instead of via a generated stylesheet.
function applySlideStyles(): void {
	const el = trackRef.value;
	if (!el) return;
	const children = Array.from(el.children) as HTMLElement[];
	const absolute = isAbsoluteLayout.value;
	const duration = props.animationDuration ?? 300;
	const noTransition = (props.animation ?? "fade") === "none";
	for (const [i, child] of children.entries()) {
		if (absolute) {
			child.style.position = "absolute";
			child.style.inset = "0";
			child.style.flex = "";
			child.style.minWidth = "";
			child.style.transition = noTransition ? "" : `opacity ${duration}ms ease`;
			child.style.opacity = i === currentIndex.value ? "1" : "0";
			child.style.pointerEvents = i === currentIndex.value ? "auto" : "none";
		} else {
			child.style.position = "";
			child.style.inset = "";
			child.style.opacity = "";
			child.style.pointerEvents = "";
			child.style.transition = "";
			child.style.flex = "0 0 100%";
			child.style.minWidth = "0";
		}
	}
}

watch(
	[
		currentIndex,
		isAbsoluteLayout,
		() => props.animation,
		() => props.animationDuration,
		slideCount,
	],
	async () => {
		await nextTick();
		applySlideStyles();
	},
);
onMounted(async () => {
	await nextTick();
	applySlideStyles();
});
</script>

<template>
	<div :style="viewportStyle" data-kiv-type="carousel" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
		<div :ref="onTrackEl" class="kiv-carousel__track" :style="trackStyle">
			<slot />
		</div>

		<template v-if="showArrows && slideCount > 1">
			<button type="button" class="kiv-carousel__arrow kiv-carousel__arrow--prev" aria-label="Previous slide" @click="prev">
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2 4 7l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
			</button>
			<button type="button" class="kiv-carousel__arrow kiv-carousel__arrow--next" aria-label="Next slide" @click="next">
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
			</button>
		</template>

		<div v-if="showDots && slideCount > 1" class="kiv-carousel__dots">
			<button
				v-for="i in slideCount"
				:key="i"
				type="button"
				class="kiv-carousel__dot"
				:class="{ 'kiv-carousel__dot--active': i - 1 === currentIndex }"
				:aria-label="`Go to slide ${i}`"
				@click="goTo(i - 1)"
			/>
		</div>

		<div v-if="showThumbnails && slideCount > 1" class="kiv-carousel__thumbs">
			<button
				v-for="i in slideCount"
				:key="i"
				type="button"
				class="kiv-carousel__thumb"
				:class="{ 'kiv-carousel__thumb--active': i - 1 === currentIndex }"
				@click="goTo(i - 1)"
			>{{ i }}</button>
		</div>
	</div>
</template>

<style scoped>
.kiv-carousel__arrow {
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	width: 30px;
	height: 30px;
	border: none;
	border-radius: 9999px;
	background: rgba(15, 23, 42, 0.55);
	color: #fff;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	z-index: 2;
}
.kiv-carousel__arrow--prev { left: 10px; }
.kiv-carousel__arrow--next { right: 10px; }
.kiv-carousel__dots {
	position: absolute;
	bottom: 10px;
	left: 0;
	right: 0;
	display: flex;
	justify-content: center;
	gap: 6px;
	z-index: 2;
}
.kiv-carousel__dot {
	width: 8px;
	height: 8px;
	border-radius: 9999px;
	border: none;
	background: rgba(255, 255, 255, 0.5);
	cursor: pointer;
	padding: 0;
}
.kiv-carousel__dot--active { background: #fff; }
.kiv-carousel__thumbs {
	position: absolute;
	bottom: 10px;
	left: 0;
	right: 0;
	display: flex;
	justify-content: center;
	gap: 6px;
	z-index: 2;
}
.kiv-carousel__thumb {
	min-width: 22px;
	height: 22px;
	padding: 0 4px;
	border-radius: 4px;
	border: 1px solid rgba(255, 255, 255, 0.6);
	background: rgba(15, 23, 42, 0.55);
	color: #fff;
	font-size: 0.65rem;
	cursor: pointer;
}
.kiv-carousel__thumb--active { background: #6366f1; border-color: #6366f1; }
</style>
