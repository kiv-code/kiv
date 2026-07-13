<script setup lang="ts">
import {
	BUTTON_RADIUS,
	hoverEffectClass,
	resolveBackgroundPaint,
	resolveIcon,
	resolveSolidColor,
	resolveSpacingStyle,
	SHADOW,
} from "@kivcode/nodes";
import { computed, inject, onMounted, provide, ref } from "vue";
import { KIV_BUS_KEY } from "../bus";
import {
	TABS_CONTEXT_KEY,
	type TabPanelMeta,
	type TabsContext,
} from "./tabs-context";

declare module "@kivcode/engine" {
	interface KivEventMap {
		"tabs.tabChanged": {
			nodeId?: string;
			currentIndex: number;
			currentTitle: string;
		};
	}
}

const props = defineProps<{
	nodeId?: string;
	defaultTab?: number;
	orientation?: string;
	position?: string;
	columns?: string;
	tabVariant?: string;
	activeColor?: unknown;
	inactiveColor?: string;
	activeTextColor?: string;
	inactiveTextColor?: string;
	tabRadius?: string;
	tabFontSize?: string;
	tabFontWeight?: string;
	activeTabFontWeight?: string;
	tabPadding?: unknown;
	tabGap?: string;
	contentGap?: string;
	hoverEffect?: string;
	tabShadow?: string;
	activeShadow?: string;
	tabBorder?: boolean;
	tabBorderColor?: string;
	contentBackground?: string;
	contentPadding?: unknown;
	contentBorderRadius?: string;
	animation?: string;
	stretch?: boolean;
	fullWidth?: boolean;
}>();

const FONT_SIZES: Record<string, string> = {
	xs: "0.75rem",
	sm: "0.85rem",
	md: "1rem",
	lg: "1.25rem",
};

const bus = inject(KIV_BUS_KEY, null);

const activeId = ref<string | null>(null);
const panels = ref<TabPanelMeta[]>([]);

function setActive(id: string): void {
	const index = panels.value.findIndex((p) => p.id === id);
	const panel = panels.value[index];
	if (!panel || panel.disabled || activeId.value === id) return;
	activeId.value = id;
	bus?.emit("tabs.tabChanged", {
		nodeId: props.nodeId,
		currentIndex: index,
		currentTitle: panel.title,
	});
}

function register(meta: TabPanelMeta): void {
	panels.value = [...panels.value, meta];
}

function update(id: string, patch: Partial<Omit<TabPanelMeta, "id">>): void {
	panels.value = panels.value.map((p) =>
		p.id === id ? { ...p, ...patch } : p,
	);
}

function unregister(id: string): void {
	panels.value = panels.value.filter((p) => p.id !== id);
	if (activeId.value === id) activeId.value = null;
}

onMounted(() => {
	if (activeId.value || panels.value.length === 0) return;
	const idx = props.defaultTab ?? 0;
	const preferred = panels.value[idx] ?? panels.value[0];
	if (preferred) activeId.value = preferred.id;
});

const iconPosition = computed(() => "right");
const iconKind = computed(() => "chevron");

const context: TabsContext = {
	activeId,
	setActive,
	register,
	update,
	unregister,
	panels,
	iconPosition,
	icon: iconKind,
};
provide(TABS_CONTEXT_KEY, context);

const isVertical = computed(() => props.orientation === "vertical");
const columnCount = computed(() => Number(props.columns ?? "1"));
const wrapStyle = computed(() => ({
	display: "flex" as const,
	flexDirection: isVertical.value ? ("row" as const) : ("column" as const),
	gap: props.contentGap || "12px",
}));
const tablistStyle = computed(() => {
	if (isVertical.value) {
		return {
			display: "grid" as const,
			gridTemplateColumns:
				columnCount.value > 1 ? `repeat(${columnCount.value}, 1fr)` : undefined,
			gap: props.tabGap || "4px",
		};
	}
	return {
		display: "flex" as const,
		flexDirection: "row" as const,
		gap: props.tabGap || "4px",
		flexWrap: "wrap" as const,
		borderBottom:
			props.tabVariant === "underline" ? "1px solid #e2e8f0" : undefined,
	};
});

const activeBg = computed(() =>
	resolveBackgroundPaint(props.activeColor, "#6366f1"),
);
const activeSolid = computed(() =>
	resolveSolidColor(props.activeColor, "#6366f1"),
);
const inactiveTabColor = computed(() => props.inactiveColor ?? "#334155");
const resolvedTabRadius = computed(
	() => BUTTON_RADIUS[props.tabRadius ?? "full"] ?? "9999px",
);
const resolvedTabFontSize = computed(
	() => FONT_SIZES[props.tabFontSize ?? "sm"] ?? "0.85rem",
);
const resolvedTabFontWeight = computed(() => props.tabFontWeight ?? "500");
const resolvedActiveFontWeight = computed(
	() => props.activeTabFontWeight ?? "700",
);

function tintHex(hex: string): string {
	return /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}14` : "#6366f114";
}

const panelData = computed(() =>
	panels.value.map((p) => ({
		...p,
		_svg: p.icon ? resolveIcon(p.icon) : null,
	})),
);

const tabPaddingStyle = computed(() =>
	resolveSpacingStyle("padding", props.tabPadding, {
		top: "8px",
		right: "14px",
		bottom: "8px",
		left: "14px",
	}),
);

const tabHoverClass = computed(() =>
	hoverEffectClass(props.hoverEffect ?? "lift"),
);

const contentStyle = computed(() => {
	const bg = props.contentBackground || undefined;
	const pad = resolveSpacingStyle("padding", props.contentPadding, "0");
	const radius =
		props.contentBorderRadius && props.contentBorderRadius !== "none"
			? (BUTTON_RADIUS[props.contentBorderRadius] ?? "0")
			: undefined;
	return {
		background: bg,
		...pad,
		borderRadius: radius,
		flex: "1",
		minWidth: "0",
	};
});

function tabButtonStyle(panel: TabPanelMeta) {
	const isActive = panel.id === activeId.value;
	const shadows = [SHADOW[props.tabShadow ?? "none"]]
		.concat(isActive ? [SHADOW[props.activeShadow ?? "none"]] : [])
		.filter((s) => s && s !== "none");

	const overrideFontSize = panel.titleFontSize
		? (FONT_SIZES[panel.titleFontSize] ?? undefined)
		: undefined;
	const panelTitleColor = panel.titleColor || undefined;

	const base: Record<string, string | undefined> = {
		...tabPaddingStyle.value,
		flex: props.stretch || props.fullWidth ? "1" : undefined,
		justifyContent: props.stretch || props.fullWidth ? "center" : undefined,
		border: "none",
		background: "transparent",
		cursor: panel.disabled ? "not-allowed" : "pointer",
		opacity: panel.disabled ? "0.5" : "1",
		fontWeight: isActive
			? resolvedActiveFontWeight.value
			: resolvedTabFontWeight.value,
		fontSize: overrideFontSize || resolvedTabFontSize.value,
		gap: panel.icon ? "6px" : undefined,
		alignItems: "center",
		display: "inline-flex",
		boxShadow: shadows.length ? shadows.join(", ") : undefined,
		transition:
			"background 0.18s ease, color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
	};
	if (props.tabVariant === "pills") {
		base.borderRadius = resolvedTabRadius.value;
		base.background = isActive ? activeBg.value : "#eef1f8";
		base.backgroundOrigin = "border-box";
		base.color =
			panelTitleColor || (isActive ? "#fff" : inactiveTabColor.value);
		if (props.tabBorder) {
			base.border = `1px solid ${props.tabBorderColor || "#e2e8f0"}`;
		}
	} else if (props.tabVariant === "buttons") {
		base.borderRadius = resolvedTabRadius.value;
		base.background = isActive ? tintHex(activeSolid.value) : "transparent";
		base.border = isActive
			? `1px solid ${activeSolid.value}`
			: `1px solid ${props.tabBorderColor || "#e2e8f0"}`;
		base.color =
			panelTitleColor ||
			(isActive ? activeSolid.value : inactiveTabColor.value);
	} else {
		base.borderBottom = isActive
			? `2px solid ${activeSolid.value}`
			: "2px solid transparent";
		base.color =
			panelTitleColor ||
			(isActive ? activeSolid.value : inactiveTabColor.value);
		base.paddingBottom = "6px";
	}
	return base;
}
</script>

<template>
	<div :style="wrapStyle" data-kiv-type="tabs">
		<div role="tablist" :style="tablistStyle">
			<button
				v-for="panel in panelData"
				:key="panel.id"
				type="button"
				role="tab"
				:aria-selected="panel.id === activeId"
				:disabled="panel.disabled"
				:class="tabHoverClass"
				:style="tabButtonStyle(panel)"
				@click="setActive(panel.id)"
			>
				<span
					v-if="panel._svg"
					class="kiv-tab__icon"
					:style="{ fontSize: (panel.iconSize ?? 16) + 'px', color: panel.iconColor || undefined }"
					v-html="panel._svg"
				/>
				<span>{{ panel.title }}</span>
				<span v-if="panel.badge" :style="{ marginLeft: '6px', fontSize: '0.75em', color: panel.badgeColor || undefined }">{{ panel.badge }}</span>
			</button>
		</div>
		<div class="kiv-tabs__panels" :style="contentStyle">
			<slot />
		</div>
	</div>
</template>

<style scoped>
.kiv-tab__icon {
	display: inline-flex;
	align-items: center;
	line-height: 0;
}
.kiv-tab__icon :deep(svg) {
	width: 1em;
	height: 1em;
}
</style>
