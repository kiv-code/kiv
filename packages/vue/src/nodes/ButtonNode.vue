<script setup lang="ts">
import {
	BUTTON_RADIUS,
	BUTTON_SIZE,
	BUTTON_VARIANT,
	type ButtonSizeStyle,
	type ButtonVariantStyle,
} from "@kiv/nodes";
import { computed, inject, resolveComponent } from "vue";
import { KIV_BUS_KEY } from "../bus";
import { KIV_EDITOR_MODE_KEY } from "../editor-mode";

const props = defineProps<{
	nodeId?: string;
	label?: string;
	icon?: string;
	iconPosition?: string;
	href?: string;
	target?: string;
	linkType?: string;
	variant?: string;
	size?: string;
	fullWidth?: boolean;
	align?: string;
	borderRadius?: string;
	fontWeight?: string;
	backgroundType?: string;
	customBackground?: string;
	gradientFrom?: string;
	gradientMiddle?: string;
	gradientTo?: string;
	gradientAngle?: number;
	customColor?: string;
	customBorderColor?: string;
}>();

const isEditorMode = inject(KIV_EDITOR_MODE_KEY, false);
const bus = inject(KIV_BUS_KEY, null);

// Detect Vue Router WITHOUT depending on it. If the consumer's app registered
// vue-router, `RouterLink` resolves to the real component; otherwise
// resolveComponent returns the string "RouterLink" (unresolved), so we fall
// back to a plain <a>. @kiv/vue never imports vue-router.
const resolvedRouterLink = resolveComponent("RouterLink");
const hasRouter = typeof resolvedRouterLink !== "string";

// For linkType="internal", use RouterLink (SPA, no reload) when a router
// exists. Everything else (external, anchor, or no router) uses <a>.
const useRouterLink = computed(
	() => !isEditorMode && props.linkType === "internal" && hasRouter,
);

// The element/component to render: RouterLink or a plain anchor.
const tag = computed(() => (useRouterLink.value ? resolvedRouterLink : "a"));

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

// Props bound to whichever tag we render. RouterLink wants `to`, <a> wants href/target/rel.
const linkAttrs = computed(() => {
	if (useRouterLink.value) {
		return { to: props.href ?? "/" };
	}
	return {
		href: resolvedHref.value,
		target: resolvedTarget.value,
		rel: rel.value,
	};
});

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

// Icon: raw SVG (starts with "<") is injected via v-html; anything else is
// treated as an icon-font class (<i class="...">). Empty = no icon.
const hasIcon = computed(() => !!props.icon?.trim());
const iconIsSvg = computed(() => props.icon?.trim().startsWith("<") ?? false);
const iconClass = computed(() => (iconIsSvg.value ? "" : (props.icon ?? "")));
const iconOnRight = computed(() => props.iconPosition === "right");

// Per-button escape hatch. Priority: gradient → custom solid → variant/theme.
const bgFinal = computed(() => {
	if (props.backgroundType === "gradient") {
		const angle = props.gradientAngle ?? 135;
		const from = props.gradientFrom || "#6366f1";
		const to = props.gradientTo || "#a855f7";
		// Middle stop is optional — include it only when set.
		const middle = props.gradientMiddle?.trim();
		const stops = middle ? `${from}, ${middle}, ${to}` : `${from}, ${to}`;
		return `linear-gradient(${angle}deg, ${stops})`;
	}
	return props.customBackground || variantStyle.value.background;
});
const colorFinal = computed(
	() => props.customColor || variantStyle.value.color,
);
const borderFinal = computed(() =>
	props.customBorderColor
		? `2px solid ${props.customBorderColor}`
		: variantStyle.value.border,
);

const buttonStyle = computed(() => ({
	// Flex when there's an icon so icon + label align with a gap.
	display: hasIcon.value
		? props.fullWidth
			? "flex"
			: "inline-flex"
		: props.fullWidth
			? "block"
			: "inline-block",
	alignItems: hasIcon.value ? ("center" as const) : undefined,
	justifyContent: hasIcon.value ? ("center" as const) : undefined,
	gap: hasIcon.value ? "0.5em" : undefined,
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
	background: bgFinal.value,
	color: colorFinal.value,
	border: borderFinal.value,
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
	<component
		:is="tag"
		v-bind="linkAttrs"
		:style="buttonStyle"
		data-kiv-type="button"
		@click="onClick"
	>
		<!-- Icon before label -->
		<template v-if="hasIcon && !iconOnRight">
			<span v-if="iconIsSvg" class="kiv-btn-icon" v-html="icon" />
			<i v-else :class="iconClass" class="kiv-btn-icon" aria-hidden="true" />
		</template>

		<span v-if="label">{{ label }}</span>

		<!-- Icon after label -->
		<template v-if="hasIcon && iconOnRight">
			<span v-if="iconIsSvg" class="kiv-btn-icon" v-html="icon" />
			<i v-else :class="iconClass" class="kiv-btn-icon" aria-hidden="true" />
		</template>
	</component>
</template>

<style scoped>
.kiv-btn-icon {
	display: inline-flex;
	align-items: center;
	line-height: 0;
}
.kiv-btn-icon :deep(svg) {
	width: 1em;
	height: 1em;
	display: block;
}
</style>
