<script setup lang="ts">
import {
	BUTTON_RADIUS,
	BUTTON_SIZE,
	BUTTON_VARIANT,
	type ButtonSizeStyle,
	type ButtonVariantStyle,
	hoverEffectClass,
	hoverGlowStyle,
	resolveBackgroundPaint,
	resolveIcon,
	resolveSolidColor,
	resolveSpacingStyle,
	resolveTextPaintStyle,
} from "@kivcode/nodes";
import { computed, getCurrentInstance, inject } from "vue";
import { KIV_BUS_KEY } from "../bus";
import { KIV_EDITOR_MODE_KEY } from "../editor-mode";

const props = defineProps<{
	nodeId?: string;
	label?: string;
	icon?: string;
	iconSize?: number;
	iconColor?: string;
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
	background?: unknown;
	textColor?: unknown;
	paddingBox?: unknown;
	customBorderColor?: string;
	hoverEffect?: string;
	hoverGlowColor?: string;
}>();

const isEditorMode = inject(KIV_EDITOR_MODE_KEY, false);
const bus = inject(KIV_BUS_KEY, null);

// Detect Vue Router WITHOUT depending on it and WITHOUT resolveComponent(),
// which warns to the console whenever the name isn't found — even when the
// result is never used. A plain lookup in the app's registered components is
// silent: if the consumer's app installed vue-router, `RouterLink` is there;
// otherwise this is undefined and we fall back to a plain <a>. @kivcode/vue never
// imports vue-router.
const registeredRouterLink = computed(() => {
	if (isEditorMode || props.linkType !== "internal") return undefined;
	const components = getCurrentInstance()?.appContext.components;
	return components?.RouterLink ?? components?.["router-link"];
});

// For linkType="internal", use RouterLink (SPA, no reload) when a router
// exists. Everything else (external, anchor, or no router) uses <a>.
const useRouterLink = computed(() => !!registeredRouterLink.value);

// The element/component to render: RouterLink or a plain anchor.
const tag = computed(() =>
	useRouterLink.value ? registeredRouterLink.value : "a",
);

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

const hasIcon = computed(() => !!props.icon?.trim());
const resolvedSvg = computed(() => resolveIcon(props.icon ?? ""));
const iconSizePx = computed(() => props.iconSize ?? 16);
const iconIsSvg = computed(
	() => (props.icon?.trim().startsWith("<") ?? false) || !!resolvedSvg.value,
);
const iconContent = computed(() => {
	if (resolvedSvg.value) return resolvedSvg.value;
	if (props.icon?.trim().startsWith("<")) return props.icon;
	return "";
});
const iconClass = computed(() => (iconIsSvg.value ? "" : (props.icon ?? "")));
const iconOnRight = computed(() => props.iconPosition === "right");

// Per-button escape hatch, shared across every node with solid-or-gradient
// paint (see packages/nodes/src/color-gradient.ts). Empty solid → inherit
// variant/theme.
const bgFinal = computed(() =>
	resolveBackgroundPaint(props.background, variantStyle.value.background),
);
// Plain solid fallback for icon inheritance — a gradient text fill only
// applies to the label span (see labelStyle) via background-clip, which
// would conflict with the button's own background if applied here.
const colorFinal = computed(() =>
	resolveSolidColor(props.textColor, variantStyle.value.color),
);
const labelStyle = computed(() =>
	resolveTextPaintStyle(props.textColor, variantStyle.value.color),
);
const borderFinal = computed(() =>
	props.customBorderColor
		? `2px solid ${props.customBorderColor}`
		: variantStyle.value.border,
);
const hoverClass = computed(() => hoverEffectClass(props.hoverEffect));

// Per-side escape hatch, shared across every node that needs it (see
// packages/nodes/src/spacing-field.ts). Empty side falls back to the size
// preset's padding shorthand ("Ypx Xpx").
const paddingFallback = computed(() => {
	if (variantStyle.value.textDecoration) {
		return { top: "0", right: "0", bottom: "0", left: "0" };
	}
	const [y, x] = sizing.value.padding.split(" ");
	return { top: y, right: x, bottom: y, left: x };
});
const paddingFinal = computed(() =>
	resolveSpacingStyle("padding", props.paddingBox, paddingFallback.value),
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
	...paddingFinal.value,
	fontSize: sizing.value.fontSize,
	fontWeight: props.fontWeight ?? "600",
	fontFamily: "inherit",
	textAlign: (props.align ?? "center") as "left" | "center" | "right",
	borderRadius: BUTTON_RADIUS[props.borderRadius ?? "md"] ?? "6px",
	textDecoration: variantStyle.value.textDecoration ?? "none",
	cursor: isEditorMode ? "default" : "pointer",
	// Broad on purpose: inline styles always win over the .kiv-hover-* class's
	// own `transition`, so this has to cover every property a hover preset
	// might animate, or the preset's :hover state would snap instead of ease.
	transition:
		"opacity 0.15s, background 0.15s, transform 0.18s ease, box-shadow 0.18s ease, filter 0.25s ease",
	lineHeight: "1",
	whiteSpace: "nowrap" as const,
	background: bgFinal.value,
	// Default background-origin is padding-box: with a 2px transparent
	// border, the gradient gets sized to the smaller padding-box area and
	// then tiles (default background-repeat) to fill the extra border-box
	// strip — a visible seam right at the edges. border-box makes the
	// gradient size to (and paint under) the border directly, no seam.
	backgroundOrigin: "border-box" as const,
	color: colorFinal.value,
	border: borderFinal.value,
	...hoverGlowStyle(props.hoverGlowColor),
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
		:class="hoverClass"
		:style="buttonStyle"
		data-kiv-type="button"
		@click="onClick"
	>
		<!-- Icon before label -->
		<template v-if="hasIcon && !iconOnRight">
			<span
				v-if="iconIsSvg"
				class="kiv-btn-icon"
				:style="{ fontSize: iconSizePx + 'px', color: iconColor || undefined }"
				v-html="iconContent"
			/>
			<i
				v-else
				:class="iconClass"
				class="kiv-btn-icon"
				:style="{ fontSize: iconSizePx + 'px', color: iconColor || undefined }"
				aria-hidden="true"
			/>
		</template>

		<span v-if="label" :style="labelStyle">{{ label }}</span>

		<!-- Icon after label -->
		<template v-if="hasIcon && iconOnRight">
			<span
				v-if="iconIsSvg"
				class="kiv-btn-icon"
				:style="{ fontSize: iconSizePx + 'px', color: iconColor || undefined }"
				v-html="iconContent"
			/>
			<i
				v-else
				:class="iconClass"
				class="kiv-btn-icon"
				:style="{ fontSize: iconSizePx + 'px', color: iconColor || undefined }"
				aria-hidden="true"
			/>
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
	vertical-align: middle;
}
</style>
