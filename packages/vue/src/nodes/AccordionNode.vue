<script setup lang="ts">
import { GAP, RADIUS } from "@kivcode/nodes";
import { computed, inject, onMounted, provide, ref } from "vue";
import { KIV_BUS_KEY } from "../bus";
import {
	ACCORDION_CONTEXT_KEY,
	type AccordionContext,
} from "./accordion-context";

declare module "@kivcode/engine" {
	interface KivEventMap {
		"accordion.itemToggled": {
			nodeId?: string;
			itemIndex: number;
			isOpen: boolean;
		};
	}
}

const props = defineProps<{
	nodeId?: string;
	allowMultiple?: boolean;
	keepOneOpen?: boolean;
	defaultOpenIndex?: number;
	animation?: string;
	animationDuration?: number;
	icon?: string;
	iconPosition?: string;
	iconSize?: number;
	gap?: string;
	borderRadius?: string;
	itemBorderRadius?: string;
	showSeparator?: boolean;
	separatorColor?: string;
}>();

const bus = inject(KIV_BUS_KEY, null);

const openIds = ref<Set<string>>(new Set());
const order = ref<string[]>([]);

function isOpen(id: string): boolean {
	return openIds.value.has(id);
}

function register(id: string, defaultOpen: boolean): void {
	order.value = [...order.value, id];
	if (defaultOpen) {
		const next = props.allowMultiple
			? new Set(openIds.value)
			: new Set<string>();
		next.add(id);
		openIds.value = next;
	}
}

function unregister(id: string): void {
	order.value = order.value.filter((existing) => existing !== id);
	if (openIds.value.has(id)) {
		const next = new Set(openIds.value);
		next.delete(id);
		openIds.value = next;
	}
}

function toggle(id: string, disabled?: boolean): void {
	if (disabled) return;
	const wasOpen = openIds.value.has(id);
	if (wasOpen) {
		if (props.keepOneOpen && openIds.value.size === 1) return;
		const next = new Set(openIds.value);
		next.delete(id);
		openIds.value = next;
	} else {
		const next = props.allowMultiple
			? new Set(openIds.value)
			: new Set<string>();
		next.add(id);
		openIds.value = next;
	}
	bus?.emit("accordion.itemToggled", {
		nodeId: props.nodeId,
		itemIndex: order.value.indexOf(id),
		isOpen: openIds.value.has(id),
	});
}

onMounted(() => {
	if (openIds.value.size > 0) return;
	const idx = props.defaultOpenIndex ?? -1;
	const id = idx >= 0 ? order.value[idx] : undefined;
	if (id) openIds.value = new Set([id]);
});

const context: AccordionContext = {
	isOpen,
	toggle,
	register,
	unregister,
	animation: computed(() => props.animation ?? "slide"),
	animationDuration: computed(() => props.animationDuration ?? 200),
	icon: computed(() => props.icon ?? "chevron"),
	iconPosition: computed(() => props.iconPosition ?? "right"),
	iconSize: computed(() => props.iconSize ?? 12),
};
provide(ACCORDION_CONTEXT_KEY, context);

const accordionStyle = computed(() => ({
	display: "flex" as const,
	flexDirection: "column" as const,
	gap: GAP[props.gap ?? "sm"] ?? "8px",
	borderRadius: RADIUS[props.borderRadius ?? "md"] ?? "8px",
}));
</script>

<template>
	<div :style="accordionStyle" data-kiv-type="accordion">
		<slot />
	</div>
</template>
