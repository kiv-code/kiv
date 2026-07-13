<script setup lang="ts">
import { SPACING } from "@kivcode/nodes";
import { computed, inject } from "vue";
import { KIV_EDITOR_MODE_KEY } from "../editor-mode";

const props = withDefaults(
	defineProps<{
		height?: string;
		showDividerOnCanvas?: boolean;
	}>(),
	{ showDividerOnCanvas: true },
);

const isEditorMode = inject(KIV_EDITOR_MODE_KEY, false);

const spacerStyle = computed(() => ({
	height: SPACING[props.height ?? "md"] ?? "16px",
	width: "100%",
}));

const showGuide = computed(() => isEditorMode && props.showDividerOnCanvas);
</script>

<template>
	<div :style="spacerStyle" :class="{ 'kiv-spacer--guide': showGuide }" data-kiv-type="spacer" />
</template>

<style scoped>
.kiv-spacer--guide {
	outline: 1px dashed rgba(99, 102, 241, 0.4);
	outline-offset: -1px;
}
</style>
