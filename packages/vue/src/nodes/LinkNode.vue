<script setup lang="ts">
import {
	BUTTON_RADIUS,
	BUTTON_SIZE,
	BUTTON_VARIANT,
	resolveLinkTypographyStyle,
} from "@kivcode/nodes";
import { computed } from "vue";
import { useKivLink } from "../composables/useKivLink";

const props = defineProps<{
	text?: string;
	href?: string;
	linkType?: string;
	/** Pre-`linkType` documents; read by resolveLink for back-compat. */
	target?: string;
	display?: string;
	variant?: string;
	size?: string;
	buttonRadius?: string;
	fontFamily?: string;
	color?: string;
	underline?: boolean;
	weight?: string;
	fontSize?: number;
}>();

const isButton = computed(() => props.display === "button");

const linkStyle = computed(() => {
	if (isButton.value) {
		const v = BUTTON_VARIANT[props.variant ?? "primary"] ?? {
			background: "#6366f1",
			color: "#ffffff",
			border: "2px solid transparent",
		};
		const s = BUTTON_SIZE[props.size ?? "md"] ?? {
			padding: "9px 20px",
			fontSize: "14px",
		};
		return {
			display: "inline-block" as const,
			padding: s.padding,
			fontSize: s.fontSize,
			fontWeight: "600" as const,
			fontFamily: "inherit",
			textAlign: "center" as const,
			textDecoration: (v.textDecoration ?? "none") as string,
			borderRadius: BUTTON_RADIUS[props.buttonRadius ?? "md"] ?? "6px",
			lineHeight: "1" as const,
			whiteSpace: "nowrap" as const,
			background: v.background,
			color: v.color,
			border: v.border,
		};
	}
	const typoStyle = resolveLinkTypographyStyle({
		fontFamily: props.fontFamily,
		fontSize: props.fontSize,
		weight: props.weight,
		color: props.color,
	});
	return {
		color: typoStyle.color,
		textDecoration: (props.underline !== false
			? "underline"
			: "none") as string,
		fontWeight: typoStyle.fontWeight,
		fontSize: typoStyle.fontSize,
		fontFamily: typoStyle.fontFamily,
	};
});

// Same shared link behaviour as Button — this component used to pick RouterLink
// off `target` alone, which handed anchors and absolute external URLs to the
// router as if they were app routes.
const {
	tag,
	attrs: linkAttrs,
	onClick,
} = useKivLink(computed(() => ({ ...props })));
</script>

<template>
	<component
		:is="tag"
		v-bind="linkAttrs"
		:style="linkStyle"
		data-kiv-type="link"
		@click="onClick"
	><slot>{{ text ?? 'Link' }}</slot></component>
</template>
