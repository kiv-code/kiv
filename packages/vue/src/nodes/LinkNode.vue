<script setup lang="ts">
import { BUTTON_RADIUS, BUTTON_SIZE, BUTTON_VARIANT } from "@kivcode/nodes";
import { computed, getCurrentInstance } from "vue";

const props = defineProps<{
	text?: string;
	href?: string;
	target?: string;
	display?: string;
	variant?: string;
	size?: string;
	buttonRadius?: string;
	textColor?: string;
	underline?: boolean;
	fontWeight?: string;
	fontSize?: string;
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
	return {
		color: props.textColor ?? "#6366f1",
		textDecoration: (props.underline !== false
			? "underline"
			: "none") as string,
		fontWeight: props.fontWeight ?? "500",
		fontSize: props.fontSize ?? "inherit",
	};
});

const app = getCurrentInstance();
const registeredRouterLink =
	app && (app.appContext.components as Record<string, unknown>)?.RouterLink;

const tag = computed(() =>
	props.target === "_blank" || !registeredRouterLink
		? "a"
		: registeredRouterLink,
);

const linkAttrs = computed(() => {
	if (tag.value === "a") {
		return {
			href: props.href ?? "#",
			target: props.target ?? "_self",
			rel: props.target === "_blank" ? "noopener noreferrer" : undefined,
		};
	}
	return { to: props.href ?? "/" };
});
</script>

<template>
	<component
		:is="tag"
		v-bind="linkAttrs"
		:style="linkStyle"
		data-kiv-type="link"
	><slot>{{ text ?? 'Link' }}</slot></component>
</template>
