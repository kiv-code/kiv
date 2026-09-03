<script setup lang="ts">
import { computed } from "vue";
import { useKivTypography } from "../composables/useKivTypography";

const props = defineProps<{
	content?: string;
	size?: number;
	weight?: string;
	color?: string;
	align?: string;
	lineHeight?: string;
	letterSpacing?: string;
	transform?: string;
	fontStyle?: string;
	fontFamily?: string;
}>();

// Style comes from the shared typography resolver, so this component, the
// static HTML export and every other text node stay in agreement.
const textStyle = useKivTypography(computed(() => ({ ...props })));
</script>

<template>
	<p :style="textStyle" data-kiv-type="text">{{ content }}</p>
</template>
