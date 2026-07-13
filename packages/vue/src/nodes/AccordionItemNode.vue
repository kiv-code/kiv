<script setup lang="ts">
import { RADIUS, SPACING } from "@kivcode/nodes";
import { computed, inject, onBeforeUnmount, onMounted } from "vue";
import { KIV_EDITOR_MODE_KEY } from "../editor-mode";
import { ACCORDION_CONTEXT_KEY } from "./accordion-context";

let uidCounter = 0;

const props = withDefaults(
	defineProps<{
		nodeId?: string;
		title?: string;
		defaultOpen?: boolean;
		disabled?: boolean;
		icon?: string;
		background?: string;
		titleColor?: string;
		titleFontSize?: number;
		titleFontWeight?: string;
		padding?: string;
		bodyPadding?: string;
	}>(),
	{ titleFontSize: 0 },
);

const ctx = inject(ACCORDION_CONTEXT_KEY, null);
const isEditorMode = inject(KIV_EDITOR_MODE_KEY, false);

const id = props.nodeId ?? `accordion-item-${uidCounter++}`;

onMounted(() => {
	ctx?.register(id, props.defaultOpen === true);
});
onBeforeUnmount(() => {
	ctx?.unregister(id);
});

const isOpen = computed(
	() => isEditorMode || (ctx ? ctx.isOpen(id) : props.defaultOpen === true),
);

function onToggle(): void {
	if (isEditorMode) return;
	ctx?.toggle(id, props.disabled);
}

const wrapStyle = computed(() => ({
	background:
		props.background && props.background !== "transparent"
			? props.background
			: undefined,
	borderRadius: RADIUS.sm ?? "4px",
	overflow: "hidden" as const,
}));

const headerStyle = computed(() => ({
	display: "flex" as const,
	alignItems: "center" as const,
	justifyContent: "space-between" as const,
	gap: "8px",
	padding: SPACING[props.padding ?? "md"] ?? "12px 16px",
	cursor: props.disabled ? "not-allowed" : "pointer",
	color: props.titleColor || undefined,
	fontWeight: Number(props.titleFontWeight ?? "600"),
	fontSize: props.titleFontSize > 0 ? `${props.titleFontSize}px` : undefined,
	opacity: props.disabled ? 0.5 : 1,
	flexDirection:
		(ctx?.iconPosition.value ?? "right") === "left"
			? ("row-reverse" as const)
			: ("row" as const),
}));

const bodyPaddingStyle = computed(() => ({
	padding: SPACING[props.bodyPadding ?? "md"] ?? "0 16px 16px",
}));

const iconKind = computed(() => ctx?.icon.value ?? "chevron");
const iconSize = computed(() => ctx?.iconSize.value ?? 12);

function onBodyEnter(el: Element, done: () => void): void {
	const e = el as HTMLElement;
	const inner = e.firstElementChild as HTMLElement | null;
	if (!inner) {
		done();
		return;
	}
	const h = inner.scrollHeight;
	e.style.transition = "height 0.25s ease";
	e.style.height = "0px";
	e.style.overflow = "hidden";
	requestAnimationFrame(() => {
		e.style.height = `${h}px`;
		e.addEventListener("transitionend", done, { once: true });
	});
}

function onBodyAfterEnter(el: Element): void {
	const e = el as HTMLElement;
	e.style.height = "";
	e.style.overflow = "";
	e.style.transition = "";
}

function onBodyLeave(el: Element, done: () => void): void {
	const e = el as HTMLElement;
	const inner = e.firstElementChild as HTMLElement | null;
	const h = inner?.scrollHeight ?? e.scrollHeight;
	e.style.transition = "height 0.25s ease";
	e.style.height = `${h}px`;
	e.style.overflow = "hidden";
	requestAnimationFrame(() => {
		e.style.height = "0px";
		e.addEventListener("transitionend", done, { once: true });
	});
}

function onBodyAfterLeave(el: Element): void {
	const e = el as HTMLElement;
	e.style.height = "";
	e.style.overflow = "";
	e.style.transition = "";
}
</script>

<template>
	<div :style="wrapStyle" data-kiv-type="accordion-item">
		<div
			role="button"
			tabindex="0"
			:aria-expanded="isOpen"
			:style="headerStyle"
			@click="onToggle"
			@keydown.enter="onToggle"
			@keydown.space.prevent="onToggle"
		>
			<span>{{ title }}</span>
			<span
				class="kiv-accordion-item__icon"
				:class="{ 'kiv-accordion-item__icon--open': isOpen }"
			>
				<svg v-if="iconKind === 'chevron'" :width="iconSize" :height="iconSize" viewBox="0 0 12 12" fill="none">
					<path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
				<svg v-else-if="iconKind === 'plus'" :width="iconSize" :height="iconSize" viewBox="0 0 12 12" fill="none">
					<path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
				</svg>
				<svg v-else :width="iconSize" :height="iconSize" viewBox="0 0 12 12" fill="none">
					<path d="M1 6h9M6 2l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</span>
		</div>
		<Transition
			:css="false"
			@enter="onBodyEnter"
			@after-enter="onBodyAfterEnter"
			@leave="onBodyLeave"
			@after-leave="onBodyAfterLeave"
		>
			<div v-if="isOpen" :style="bodyPaddingStyle">
				<slot />
			</div>
		</Transition>
	</div>
</template>

<style scoped>
.kiv-accordion-item__icon {
	display: inline-flex;
	transition: transform 0.2s ease;
}
.kiv-accordion-item__icon--open {
	transform: rotate(180deg);
}
</style>
