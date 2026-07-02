<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
	src?: string;
	alt?: string;
	fit?: string;
	aspectRatio?: string;
}>();

const imageStyle = computed(() => ({
	"object-fit": (props.fit as "cover" | "contain" | "fill" | "none") ?? "cover",
	"aspect-ratio": props.aspectRatio !== "auto" ? props.aspectRatio : undefined,
	width: "100%",
	display: "block",
}));
</script>

<template>
	<img
		:src="src"
		:alt="alt ?? ''"
		:style="imageStyle"
		data-kiv-type="image"
	/>
</template>
