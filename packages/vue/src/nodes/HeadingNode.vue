<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
	text?: string;
	level?: string;
	color?: string;
	align?: string;
}>();

const tag = computed(() => `h${props.level ?? "2"}`);

const headingStyle = computed(() => ({
	color: props.color ?? "var(--kiv-colors-foreground)",
	"text-align": props.align ?? "left",
}));
</script>

<template>
	<component :is="tag" :style="headingStyle" data-kiv-type="heading">
		{{ text }}
	</component>
</template>
