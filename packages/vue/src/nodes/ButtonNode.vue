<script setup lang="ts">
import {
	BUTTON_RADIUS,
	BUTTON_SIZE,
	BUTTON_VARIANT,
	type ButtonSizeStyle,
	type ButtonVariantStyle,
} from "@kiv/nodes";
import { computed, inject } from "vue";
import { KIV_BUS_KEY } from "../bus";
import { KIV_EDITOR_MODE_KEY } from "../editor-mode";

const props = defineProps<{
	nodeId?: string;
	label?: string;
	href?: string;
	target?: string;
	linkType?: string;
	variant?: string;
	size?: string;
	fullWidth?: boolean;
	align?: string;
	borderRadius?: string;
	fontWeight?: string;
}>();

const isEditorMode = inject(KIV_EDITOR_MODE_KEY, false);
const bus = inject(KIV_BUS_KEY, null);

const resolvedHref = computed(() =>
	isEditorMode ? undefined : (props.href ?? "#"),
);
const resolvedTarget = computed(() => {
	if (isEditorMode) return undefined;
	if (props.linkType === "external") return "_blank";
	return props.target ?? "_self";
});
const rel = computed(() =>
	resolvedTarget.value === "_blank" ? "noopener noreferrer" : undefined,
);

const DEFAULT_SIZE: ButtonSizeStyle = { padding: "9px 20px", fontSize: "14px" };
const DEFAULT_VARIANT: ButtonVariantStyle = {
	background: "#6366f1",
	color: "#ffffff",
	border: "2px solid transparent",
};

const sizing = computed(
	(): ButtonSizeStyle => BUTTON_SIZE[props.size ?? "md"] ?? DEFAULT_SIZE,
);
const variantStyle = computed(
	(): ButtonVariantStyle =>
		BUTTON_VARIANT[props.variant ?? "primary"] ?? DEFAULT_VARIANT,
);

const buttonStyle = computed(() => ({
	display: props.fullWidth ? "block" : "inline-block",
	width: props.fullWidth ? "100%" : undefined,
	padding: variantStyle.value.textDecoration ? "0" : sizing.value.padding,
	fontSize: sizing.value.fontSize,
	fontWeight: props.fontWeight ?? "600",
	fontFamily: "inherit",
	textAlign: (props.align ?? "center") as "left" | "center" | "right",
	borderRadius: BUTTON_RADIUS[props.borderRadius ?? "md"] ?? "6px",
	textDecoration: variantStyle.value.textDecoration ?? "none",
	cursor: isEditorMode ? "default" : "pointer",
	transition: "opacity 0.15s, background 0.15s",
	lineHeight: "1",
	whiteSpace: "nowrap" as const,
	background: variantStyle.value.background,
	color: variantStyle.value.color,
	border: variantStyle.value.border,
}));

function onClick(e: MouseEvent) {
	if (isEditorMode) {
		e.preventDefault();
		return;
	}
	// Runtime: emit through the engine bus if one was provided.
	bus?.emit("button.clicked", {
		nodeId: props.nodeId,
		label: props.label,
		href: props.href,
	});

	// Anchor navigation: smooth-scroll to the target node ourselves.
	// The renderer stamps each node with id="<nodeId>", so href="#hero"
	// finds the element and scrolls to it — works inside scroll containers,
	// where the browser's native hash jump can be unreliable.
	if (props.linkType === "anchor") {
		const raw = props.href ?? "";
		const targetId = raw.startsWith("#") ? raw.slice(1) : raw;
		e.preventDefault();
		if (targetId) {
			const el = document.getElementById(targetId);
			el?.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	}
}
</script>

<template>
	<a
		:href="resolvedHref"
		:target="resolvedTarget"
		:rel="rel"
		:style="buttonStyle"
		data-kiv-type="button"
		@click="onClick"
	>{{ label }}</a>
</template>
