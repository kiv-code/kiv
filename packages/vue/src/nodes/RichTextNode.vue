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
const richStyle = useKivTypography(computed(() => ({ ...props })));
</script>

<template>
	<div :style="richStyle" class="kiv-rich-text" data-kiv-type="rich-text" v-html="content ?? ''" />
</template>

<style scoped>
.kiv-rich-text :deep(p) {
	margin: 0 0 0.5em;
}
.kiv-rich-text :deep(p:last-child) {
	margin-bottom: 0;
}
.kiv-rich-text :deep(ul),
.kiv-rich-text :deep(ol) {
	padding-left: 1.5em;
	margin: 0.5em 0;
}
.kiv-rich-text :deep(li) {
	margin-bottom: 0.25em;
}
.kiv-rich-text :deep(a) {
	color: #6366f1;
	text-decoration: underline;
}
</style>
