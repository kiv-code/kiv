<script setup lang="ts">
import {
	hoverEffectClass,
	hoverGlowStyle,
	IMAGE_SRCSET_WIDTHS,
	RADIUS,
	SHADOW,
} from "@kivcode/nodes";
import { computed, inject } from "vue";
import { KIV_MEDIA_KEY } from "../media";

const props = defineProps<{
	src?: string;
	alt?: string;
	fit?: string;
	aspectRatio?: string;
	width?: string;
	borderRadius?: string;
	shadow?: string;
	hoverEffect?: string;
	hoverGlowColor?: string;
}>();

const media = inject(KIV_MEDIA_KEY, null);

// Without a MediaProvider, resolve() is the identity and no srcset is
// generated — a raw URL string has no reliable way to derive width variants.
const resolvedSrc = computed(
	() => media?.resolve(props.src ?? "", {}) ?? props.src ?? "",
);

const srcset = computed(() => {
	if (!media || !props.src) return undefined;
	return IMAGE_SRCSET_WIDTHS.map(
		(w) => `${media.resolve(props.src ?? "", { width: w })} ${w}w`,
	).join(", ");
});

const imageStyle = computed(() => ({
	objectFit: (props.fit ?? "cover") as "cover" | "contain" | "fill" | "none",
	aspectRatio: props.aspectRatio !== "auto" ? props.aspectRatio : undefined,
	width: props.width ?? "100%",
	maxWidth: "100%",
	display: "block",
	borderRadius: RADIUS[props.borderRadius ?? "none"] ?? "0",
	boxShadow: SHADOW[props.shadow ?? "none"] ?? "none",
	...hoverGlowStyle(props.hoverGlowColor),
}));
const hoverClass = computed(() => hoverEffectClass(props.hoverEffect));
</script>

<template>
	<img
		:src="resolvedSrc"
		:srcset="srcset"
		sizes="100vw"
		loading="lazy"
		:alt="alt ?? ''"
		:class="hoverClass"
		:style="imageStyle"
		data-kiv-type="image"
	/>
</template>
