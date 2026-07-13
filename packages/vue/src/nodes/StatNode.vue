<script setup lang="ts">
import {
	formatStatValue,
	resolveTextPaintStyle,
	STAT_SIZE,
} from "@kivcode/nodes";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = withDefaults(
	defineProps<{
		value?: number;
		prefix?: string;
		suffix?: string;
		label?: string;
		decimals?: number;
		animateOnView?: boolean;
		animationDuration?: number;
		align?: string;
		valueColor?: unknown;
		size?: string;
	}>(),
	{ animateOnView: true },
);

const rootRef = ref<HTMLElement | null>(null);
const displayValue = ref(0);
const hasAnimated = ref(false);
let observer: IntersectionObserver | null = null;

function animateTo(target: number, duration: number) {
	const start = performance.now();
	function tick(nowMs: number) {
		const progress = Math.min(1, (nowMs - start) / Math.max(1, duration));
		displayValue.value = target * progress;
		if (progress < 1) requestAnimationFrame(tick);
	}
	requestAnimationFrame(tick);
}

onMounted(() => {
	if (!props.animateOnView || typeof IntersectionObserver === "undefined") {
		displayValue.value = props.value ?? 0;
		return;
	}
	observer = new IntersectionObserver((entries) => {
		if (entries[0]?.isIntersecting && !hasAnimated.value) {
			hasAnimated.value = true;
			animateTo(props.value ?? 0, props.animationDuration ?? 1500);
			observer?.disconnect();
		}
	});
	if (rootRef.value) observer.observe(rootRef.value);
});
onBeforeUnmount(() => observer?.disconnect());

// Editing `value` (e.g. live in the Inspector) after the count-up already
// ran must still be reflected — otherwise the displayed number goes stale
// forever, since the IntersectionObserver only ever fires once.
watch(
	() => props.value,
	(next) => {
		if (!props.animateOnView || hasAnimated.value) {
			displayValue.value = next ?? 0;
		}
	},
);

const formatted = computed(() =>
	formatStatValue(
		displayValue.value,
		props.decimals ?? 0,
		props.prefix ?? "",
		props.suffix ?? "",
	),
);

const resolvedSize = computed(() => STAT_SIZE[props.size ?? "xl"] ?? "56px");
const valueStyle = computed(() => ({
	fontSize: resolvedSize.value,
	fontWeight: "800" as const,
	lineHeight: "1.1",
	...resolveTextPaintStyle(props.valueColor, "#0f172a"),
}));
const wrapperStyle = computed(() => ({
	display: "flex" as const,
	flexDirection: "column" as const,
	alignItems:
		props.align === "left"
			? ("flex-start" as const)
			: props.align === "right"
				? ("flex-end" as const)
				: ("center" as const),
	textAlign: (props.align ?? "center") as "left" | "center" | "right",
}));
</script>

<template>
	<div ref="rootRef" :style="wrapperStyle" data-kiv-type="stat">
		<span :style="valueStyle">{{ formatted }}</span>
		<span v-if="label" class="kiv-stat__label">{{ label }}</span>
	</div>
</template>

<style scoped>
.kiv-stat__label {
	font-size: 14px;
	color: #64748b;
	margin-top: 4px;
}
</style>
