<script setup lang="ts">
import {
	BUTTON_RADIUS,
	BUTTON_SIZE,
	BUTTON_VARIANT,
	resolveBackgroundPaint,
	resolveSpacingStyle,
	SHADOW,
} from "@kiv/nodes";
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { KIV_BUS_KEY } from "../bus";
import { KIV_EDITOR_MODE_KEY } from "../editor-mode";

declare module "@kiv/engine" {
	interface KivEventMap {
		"modal.opened": { nodeId?: string };
		"modal.closed": { nodeId?: string };
	}
}

const props = defineProps<{
	nodeId?: string;
	size?: string;
	contentPadding?: unknown;
	panelBackground?: string;
	panelRadius?: string;
	panelShadow?: string;
	closeOnOverlay?: boolean;
	closeOnEscape?: boolean;
	showCloseButton?: boolean;
	preventScroll?: boolean;
	animation?: string;
	overlayColor?: string;
	overlayBlur?: string;
	autoOpen?: boolean;
	openDelay?: number;
	openFrequency?: string;
	openTrigger?: string;
	scrollPercent?: number;
	timeOnPage?: number;
	showTrigger?: boolean;
	triggerLabel?: string;
	triggerTag?: string;
	triggerVariant?: string;
	triggerIcon?: string;
	triggerIconPosition?: string;
	triggerSize?: string;
	triggerRadius?: string;
	triggerPadding?: unknown;
	triggerMargin?: unknown;
	triggerBackground?: unknown;
	triggerTextColor?: string;
	triggerBorderColor?: string;
	triggerBorderWidth?: number;
	triggerShadow?: string;
	triggerFullWidth?: boolean;
	clickAction?: string;
	actionHref?: string;
	actionTarget?: string;
}>();

const bus = inject(KIV_BUS_KEY, null);
const isEditorMode = inject(KIV_EDITOR_MODE_KEY, false);

const open = ref(false);
const autoOpenFired = ref(false);

function openModal(): void {
	if (isEditorMode) return;
	open.value = true;
	bus?.emit("modal.opened", { nodeId: props.nodeId });
}

function closeModal(): void {
	if (!open.value) return;
	open.value = false;
	bus?.emit("modal.closed", { nodeId: props.nodeId });
}

function onOverlayClick(): void {
	if (props.closeOnOverlay !== false) closeModal();
}

function onKeydown(e: KeyboardEvent): void {
	if (e.key === "Escape" && props.closeOnEscape !== false) closeModal();
}

watch(open, (isOpen) => {
	if (typeof document === "undefined") return;
	if (isOpen && props.preventScroll !== false) {
		document.body.style.overflow = "hidden";
	} else {
		document.body.style.overflow = "";
	}
});
onBeforeUnmount(() => {
	if (typeof document !== "undefined") document.body.style.overflow = "";
});

// ── Frequency gating (sessionStorage / localStorage) ──
function frequencyKey(): string | null {
	const nid = props.nodeId;
	if (!nid) return null;
	return `kiv-modal-${nid}`;
}
function canOpenByFrequency(): boolean {
	const freq = props.openFrequency ?? "always";
	if (freq === "always") return true;
	const key = frequencyKey();
	if (!key) return true;
	if (freq === "once-session") {
		return !sessionStorage.getItem(key);
	}
	return !localStorage.getItem(key);
}
function markOpened(): void {
	const freq = props.openFrequency ?? "always";
	if (freq === "always") return;
	const key = frequencyKey();
	if (!key) return;
	if (freq === "once-session") {
		sessionStorage.setItem(key, "1");
	} else {
		localStorage.setItem(key, "1");
	}
}

// ── Auto-open logic ──
let scrollHandler: (() => void) | null = null;
let timeHandler: ReturnType<typeof setTimeout> | null = null;
let exitHandler: ((e: MouseEvent) => void) | null = null;

function scheduleAutoOpen(): void {
	if (!props.autoOpen || isEditorMode || autoOpenFired.value) return;
	if (!canOpenByFrequency()) return;

	const delay = props.openDelay ?? 1000;
	const trigger = props.openTrigger ?? "load";

	if (trigger === "load") {
		timeHandler = setTimeout(() => {
			openModal();
			markOpened();
			autoOpenFired.value = true;
		}, delay);
	} else if (trigger === "time") {
		const secs = props.timeOnPage ?? 10;
		timeHandler = setTimeout(() => {
			openModal();
			markOpened();
			autoOpenFired.value = true;
		}, secs * 1000);
	} else if (trigger === "scroll") {
		const threshold = (props.scrollPercent ?? 50) / 100;
		scrollHandler = () => {
			if (autoOpenFired.value) return;
			const scrolled =
				window.scrollY /
				(document.documentElement.scrollHeight - window.innerHeight);
			if (scrolled >= threshold) {
				openModal();
				markOpened();
				autoOpenFired.value = true;
				const h = scrollHandler;
				if (h) window.removeEventListener("scroll", h);
				scrollHandler = null;
			}
		};
		window.addEventListener("scroll", scrollHandler, { passive: true });
	} else if (trigger === "exit-intent") {
		exitHandler = (e: MouseEvent) => {
			if (autoOpenFired.value) return;
			if (e.clientY <= 0) {
				openModal();
				markOpened();
				autoOpenFired.value = true;
				const h = exitHandler;
				if (h) document.removeEventListener("mouseleave", h);
				exitHandler = null;
			}
		};
		document.addEventListener("mouseleave", exitHandler);
	}
}

function cleanupAutoOpen(): void {
	if (scrollHandler) {
		window.removeEventListener("scroll", scrollHandler);
		scrollHandler = null;
	}
	if (timeHandler) {
		clearTimeout(timeHandler);
		timeHandler = null;
	}
	if (exitHandler) {
		document.removeEventListener("mouseleave", exitHandler);
		exitHandler = null;
	}
}

onMounted(() => scheduleAutoOpen());
onBeforeUnmount(() => cleanupAutoOpen());

watch(
	() => props.autoOpen,
	(val, old) => {
		if (val && !old) scheduleAutoOpen();
		if (!val && old) cleanupAutoOpen();
	},
);

// ── Trigger rendering ──
const resolvedTriggerTag = computed(() => {
	if (props.clickAction && props.clickAction !== "none") return "a";
	return props.triggerTag ?? "button";
});

const triggerIconSvg = computed(() => props.triggerIcon || null);

const triggerBtnSize = computed(
	() => BUTTON_SIZE[props.triggerSize ?? "md"] ?? BUTTON_SIZE.md,
);

const triggerBtnRadius = computed(
	() => BUTTON_RADIUS[props.triggerRadius ?? "md"] ?? "6px",
);

const triggerCustomBg = computed(() =>
	resolveBackgroundPaint(props.triggerBackground),
);

const triggerBtnShadow = computed(
	() => SHADOW[props.triggerShadow ?? "none"] ?? "none",
);

const triggerStyle = computed(() => {
	const variant = props.triggerVariant ?? "primary";
	const isCustom = variant === "custom" || props.triggerBackground;
	const v = isCustom
		? null
		: (BUTTON_VARIANT[variant] ?? BUTTON_VARIANT.primary);
	const sz = triggerBtnSize.value;
	const pad = resolveSpacingStyle("padding", props.triggerPadding, sz?.padding);
	const margin = resolveSpacingStyle("margin", props.triggerMargin, "0");
	const borderW = props.triggerBorderWidth ?? 0;

	const base: Record<string, string | number | undefined> = {
		...pad,
		...margin,
		display: "inline-flex",
		alignItems: "center",
		gap: "6px",
		fontSize: sz?.fontSize,
		fontWeight: "600",
		borderRadius: triggerBtnRadius.value,
		cursor: isEditorMode ? "default" : "pointer",
		boxShadow:
			triggerBtnShadow.value !== "none" ? triggerBtnShadow.value : undefined,
		transition:
			"background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
		textDecoration: resolvedTriggerTag.value === "a" ? "none" : undefined,
		width: props.triggerFullWidth ? "100%" : undefined,
		justifyContent: props.triggerFullWidth ? "center" : undefined,
	};

	if (isCustom) {
		base.background = triggerCustomBg.value;
		base.color = props.triggerTextColor || undefined;
		base.border =
			borderW > 0
				? `${borderW}px solid ${props.triggerBorderColor || "#e2e8f0"}`
				: "none";
	} else if (v) {
		base.background = v.background;
		base.color = v.color;
		base.border = v.border;
		if (v.textDecoration) base.textDecoration = v.textDecoration;
	}
	return base;
});

// ── Panel sizing ──
const panelStyle = computed(() => {
	const widths: Record<string, string> = {
		sm: "400px",
		md: "560px",
		lg: "760px",
		xl: "960px",
		full: "100vw",
		auto: "auto",
	};
	const radiusMap: Record<string, string> = {
		sm: "4px",
		md: "8px",
		lg: "12px",
		xl: "16px",
	};
	const sz = props.size ?? "md";
	return {
		width: widths[sz] ?? widths.md,
		height: sz === "full" ? "100vh" : undefined,
		borderRadius:
			sz === "full" ? "0" : (radiusMap[props.panelRadius ?? "md"] ?? "8px"),
		background: props.panelBackground || "#ffffff",
		boxShadow: SHADOW[props.panelShadow ?? "lg"],
	};
});

const overlayStyle = computed(() => {
	const color = props.overlayColor || "#000000";
	const blur = props.overlayBlur ?? "none";
	const blurMap: Record<string, string> = {
		none: "0",
		sm: "4px",
		md: "8px",
		lg: "16px",
	};
	return {
		background: `${color}8c`,
		backdropFilter:
			blurMap[blur] && blurMap[blur] !== "0"
				? `blur(${blurMap[blur]})`
				: undefined,
	};
});

const transitionName = computed(() => `kiv-modal-${props.animation ?? "fade"}`);

const contentStyle = computed(() =>
	resolveSpacingStyle("padding", props.contentPadding, "24px"),
);

const iconSide = computed(() => props.triggerIconPosition ?? "left");
</script>

<template>
	<div class="kiv-modal" :style="showTrigger === false ? { display: 'none' } : { display: 'inline-block' }">
		<button
			v-if="resolvedTriggerTag === 'button'"
			type="button"
			:style="triggerStyle"
			data-kiv-modal-trigger
			@click="openModal"
		>
			<span>{{ triggerLabel ?? "Open" }}</span>
		</button>
		<a
			v-else-if="resolvedTriggerTag === 'a'"
			:href="actionHref"
			:target="actionTarget"
			:style="triggerStyle"
			data-kiv-modal-trigger
			@click.prevent="openModal"
		>
			<span>{{ triggerLabel ?? "Open" }}</span>
		</a>
		<span
			v-else
			:style="triggerStyle"
			data-kiv-modal-trigger
			@click="openModal"
		>
			<span>{{ triggerLabel ?? "Open" }}</span>
		</span>

		<Teleport to="body">
			<Transition :name="transitionName">
				<div
					v-if="open"
					class="kiv-modal__backdrop"
					data-kiv-type="modal"
					role="dialog"
					aria-modal="true"
					:style="overlayStyle"
					@click.self="onOverlayClick"
					@keydown="onKeydown"
				>
					<div class="kiv-modal__panel" :style="panelStyle">
						<button
							v-if="showCloseButton !== false"
							type="button"
							class="kiv-modal__close"
							aria-label="Close"
							@click="closeModal"
						>
							<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
						</button>
						<div class="kiv-modal__content" :style="contentStyle">
							<slot />
						</div>
					</div>
				</div>
			</Transition>
		</Teleport>
	</div>
</template>

<style scoped>
.kiv-modal__backdrop {
	position: fixed;
	inset: 0;
	z-index: 9998;
	display: flex;
	align-items: center;
	justify-content: center;
}
.kiv-modal__panel {
	position: relative;
	max-width: calc(100vw - 32px);
	max-height: calc(100vh - 32px);
	overflow: auto;
}
.kiv-modal__close {
	position: absolute;
	top: 10px;
	right: 10px;
	width: 26px;
	height: 26px;
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	border-radius: 6px;
	background: rgba(15, 23, 42, 0.06);
	color: #0f172a;
	cursor: pointer;
	z-index: 1;
}
.kiv-modal__trigger-icon {
	display: inline-flex;
	align-items: center;
	line-height: 0;
}
.kiv-modal__trigger-icon :deep(svg) {
	width: 1em;
	height: 1em;
}

.kiv-modal-fade-enter-active,
.kiv-modal-fade-leave-active { transition: opacity 0.15s ease; }
.kiv-modal-fade-enter-from,
.kiv-modal-fade-leave-to { opacity: 0; }

.kiv-modal-zoom-enter-active,
.kiv-modal-zoom-leave-active { transition: opacity 0.15s ease; }
.kiv-modal-zoom-enter-active .kiv-modal__panel,
.kiv-modal-zoom-leave-active .kiv-modal__panel { transition: transform 0.15s ease; }
.kiv-modal-zoom-enter-from,
.kiv-modal-zoom-leave-to { opacity: 0; }
.kiv-modal-zoom-enter-from .kiv-modal__panel,
.kiv-modal-zoom-leave-to .kiv-modal__panel { transform: scale(0.92); }

.kiv-modal-slide-up-enter-active,
.kiv-modal-slide-up-leave-active { transition: opacity 0.15s ease; }
.kiv-modal-slide-up-enter-active .kiv-modal__panel,
.kiv-modal-slide-up-leave-active .kiv-modal__panel { transition: transform 0.18s ease; }
.kiv-modal-slide-up-enter-from,
.kiv-modal-slide-up-leave-to { opacity: 0; }
.kiv-modal-slide-up-enter-from .kiv-modal__panel,
.kiv-modal-slide-up-leave-to .kiv-modal__panel { transform: translateY(24px); }

.kiv-modal-slide-down-enter-active,
.kiv-modal-slide-down-leave-active { transition: opacity 0.15s ease; }
.kiv-modal-slide-down-enter-active .kiv-modal__panel,
.kiv-modal-slide-down-leave-active .kiv-modal__panel { transition: transform 0.18s ease; }
.kiv-modal-slide-down-enter-from,
.kiv-modal-slide-down-leave-to { opacity: 0; }
.kiv-modal-slide-down-enter-from .kiv-modal__panel,
.kiv-modal-slide-down-leave-to .kiv-modal__panel { transform: translateY(-24px); }

.kiv-modal-none-enter-active,
.kiv-modal-none-leave-active { transition: none; }
</style>
