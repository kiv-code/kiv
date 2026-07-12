<script setup lang="ts">
import { resolveSpacingStyle, SPACING } from "@kiv/nodes";
import { computed } from "vue";

const props = defineProps<{
	span?: string;
	offset?: string;
	alignSelf?: string;
	paddingX?: string;
	paddingY?: string;
	paddingBox?: unknown;
}>();

const columnStyle = computed(() => {
	const s: Record<string, string | undefined> = {};
	if (props.span && props.span !== "auto") s.gridColumn = `span ${props.span}`;
	if (props.offset && props.offset !== "0")
		s.gridColumnStart = String(Number(props.offset) + 1);
	if (props.alignSelf && props.alignSelf !== "auto")
		s.alignSelf = props.alignSelf;
	const px =
		props.paddingX && props.paddingX !== "none"
			? SPACING[props.paddingX]
			: undefined;
	const py =
		props.paddingY && props.paddingY !== "none"
			? SPACING[props.paddingY]
			: undefined;
	// Per-side override, shared with every other node that needs this escape
	// hatch (see packages/nodes/src/spacing-field.ts). Empty side falls back
	// to the Padding X/Y shorthand above.
	Object.assign(
		s,
		resolveSpacingStyle("padding", props.paddingBox, {
			top: py,
			right: px,
			bottom: py,
			left: px,
		}),
	);
	return s;
});
</script>

<template>
	<div :style="columnStyle" data-kiv-type="column">
		<slot />
	</div>
</template>
