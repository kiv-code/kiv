<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
	label?: string;
	href?: string;
	target?: string;
	linkType?: string;
	variant?: string;
	size?: string;
	fullWidth?: boolean;
}>();

const resolvedHref = computed(() => props.href ?? "#");
const resolvedTarget = computed(() => {
	if (props.linkType === "external") return "_blank";
	return props.target ?? "_self";
});
const rel = computed(() =>
	resolvedTarget.value === "_blank" ? "noopener noreferrer" : undefined,
);

const buttonStyle = computed(() => ({
	display: props.fullWidth ? "block" : "inline-block",
	width: props.fullWidth ? "100%" : undefined,
}));
</script>

<template>
	<a
		:href="resolvedHref"
		:target="resolvedTarget"
		:rel="rel"
		:style="buttonStyle"
		:data-kiv-variant="variant"
		:data-kiv-size="size"
		:data-kiv-link-type="linkType"
		data-kiv-type="button"
		class="kiv-button"
	>
		{{ label }}
	</a>
</template>
