<script setup lang="ts">
import type { KivNode, Registry } from "@kivcode/engine";
import { computed, inject, nextTick, ref, watch } from "vue";
import { EDITOR_EXTENSIONS_KEY } from "../store/context";
import { getNodeLabel } from "../utils/node-labels";
import {
	buildPalette,
	CATEGORY_META,
	createPaletteNode,
	LEAF_TYPES,
	type PaletteItem,
} from "../utils/palette-items";
import NodeIcon from "./NodeIcon.vue";

const props = defineProps<{
	open: boolean;
	selectedNodeType?: string;
	selectedNodeLabel?: string;
	registry?: Registry;
	theme?: "dark" | "light";
}>();

const extensions = inject(EDITOR_EXTENSIONS_KEY, null);

// Merge hardcoded palette with plugin-registered palette items
const mergedPalette = computed<PaletteItem[]>(() => {
	const items = buildPalette(props.registry);
	if (extensions) {
		for (const pluginItem of extensions.getPaletteItems()) {
			if (!items.some((i) => i.type === pluginItem.type)) {
				items.push({
					type: pluginItem.type,
					label: pluginItem.label,
					description: pluginItem.description ?? "",
					hasDefaultSlot: true,
					category: pluginItem.category ?? "content",
				});
			}
		}
	}
	return items;
});

const emit = defineEmits<{
	close: [];
	add: [node: KivNode];
}>();

const search = ref("");
const searchInput = ref<HTMLInputElement | null>(null);
const activeIndex = ref(0);

watch(
	() => props.open,
	(val) => {
		if (val) {
			search.value = "";
			activeIndex.value = 0;
			nextTick(() => searchInput.value?.focus());
		}
	},
);

// Reset highlight when the search query changes
watch(search, () => {
	activeIndex.value = 0;
});

// Describe where the node will land
const insertHint = computed(() => {
	const type = props.selectedNodeType;
	const label = props.selectedNodeLabel ?? (type ? getNodeLabel(type) : null);
	if (!type) return "Will be added to the end of the page";
	if (LEAF_TYPES.has(type)) return `Will be added after "${label}"`;
	return `Will be added inside "${label}"`;
});

// Derive categories from merged palette (keeps hardcoded order, adds any new ones from plugins)
const categories = computed<string[]>(() => {
	const seen = new Set<string>();
	const order: string[] = [];
	for (const item of mergedPalette.value) {
		if (!seen.has(item.category)) {
			seen.add(item.category);
			order.push(item.category);
		}
	}
	return order;
});

const filtered = computed(() => {
	const q = search.value.toLowerCase().trim();
	return mergedPalette.value.filter(
		(p) =>
			!q ||
			p.label.toLowerCase().includes(q) ||
			p.description.toLowerCase().includes(q) ||
			p.category.includes(q),
	);
});

function categoryItems(cat: string) {
	return filtered.value.filter((p) => p.category === cat);
}

// Flat list in display order — used for keyboard navigation
const flatItems = computed(() =>
	categories.value.flatMap((cat) => categoryItems(cat)),
);

function isActive(item: PaletteItem) {
	return flatItems.value[activeIndex.value]?.type === item.type;
}

function addNode(item: PaletteItem) {
	const node = createPaletteNode(
		item.type,
		props.registry,
		item.hasDefaultSlot,
	);
	emit("add", node);
}

// Dragging a card starts a native drag session that keeps running after the
// DOM it started from goes away, so the modal (which would otherwise cover
// the canvas underneath) closes immediately — the canvas becomes the drop
// target for the rest of the gesture, like a picker that dismisses on drag.
function onCardDragStart(e: DragEvent, item: PaletteItem) {
	if (!e.dataTransfer) return;
	e.dataTransfer.setData("application/x-kiv-node-type", item.type);
	e.dataTransfer.setData("text/plain", item.type);
	e.dataTransfer.effectAllowed = "copy";
	emit("close");
}

function onBackdrop(e: MouseEvent) {
	if (e.target === e.currentTarget) emit("close");
}

// Grid is 2 columns — arrows move accordingly
function onKeydown(e: KeyboardEvent) {
	const items = flatItems.value;
	const count = items.length;

	if (e.key === "Escape") {
		emit("close");
		return;
	}
	if (!count) return;

	if (e.key === "ArrowDown") {
		e.preventDefault();
		activeIndex.value = Math.min(count - 1, activeIndex.value + 2);
	} else if (e.key === "ArrowUp") {
		e.preventDefault();
		activeIndex.value = Math.max(0, activeIndex.value - 2);
	} else if (e.key === "ArrowRight") {
		e.preventDefault();
		activeIndex.value = Math.min(count - 1, activeIndex.value + 1);
	} else if (e.key === "ArrowLeft") {
		e.preventDefault();
		activeIndex.value = Math.max(0, activeIndex.value - 1);
	} else if (e.key === "Enter") {
		e.preventDefault();
		const item = items[activeIndex.value];
		if (item) addNode(item);
	}
}
</script>

<template>
	<Teleport to="body">
		<Transition name="kiv-modal">
			<div
				v-if="open"
				class="kiv-palette-backdrop"
				:class="theme === 'light' ? 'kiv-editor--light' : 'kiv-editor--dark'"
				@click="onBackdrop"
				@keydown="onKeydown"
			>
				<div class="kiv-palette-modal" role="dialog" aria-modal="true" aria-label="Add node">
					<!-- Header -->
					<div class="kiv-palette-modal__header">
						<div class="kiv-palette-modal__title">
							<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
								<path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
							</svg>
							Add node
						</div>
						<button type="button" class="kiv-palette-modal__close" @click="$emit('close')">
							<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
								<path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
							</svg>
						</button>
					</div>

					<!-- Search -->
					<div class="kiv-palette-modal__search">
						<svg class="kiv-palette-modal__search-icon" width="13" height="13" viewBox="0 0 13 13" fill="none">
							<circle cx="5.5" cy="5.5" r="4" stroke="currentColor" stroke-width="1.4"/>
							<path d="M8.5 8.5l3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
						</svg>
						<input
							ref="searchInput"
							v-model="search"
							type="text"
							class="kiv-palette-modal__search-input"
							placeholder="Search nodes…"
						/>
					</div>

					<!-- Insert hint -->
					<div class="kiv-palette-modal__hint">
						<svg width="11" height="11" viewBox="0 0 11 11" fill="none">
							<circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" stroke-width="1.2"/>
							<path d="M5.5 5v3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
							<circle cx="5.5" cy="3.5" r="0.6" fill="currentColor"/>
						</svg>
						{{ insertHint }}
					</div>

					<!-- Node grid -->
					<div class="kiv-palette-modal__list">
						<template v-for="cat in categories" :key="cat">
							<div v-if="categoryItems(cat).length" class="kiv-palette-modal__group">
								<div class="kiv-palette-modal__group-label">
									<span class="kiv-palette-modal__group-dot" :style="{ background: CATEGORY_META[cat]?.color }" />
									{{ CATEGORY_META[cat]?.label ?? cat }}
								</div>
								<div class="kiv-palette-modal__grid">
									<button
										v-for="item in categoryItems(cat)"
										:key="item.type"
										type="button"
										draggable="true"
										class="kiv-palette-modal__card"
										:class="{ 'kiv-palette-modal__card--active': isActive(item) }"
										@click="addNode(item)"
										@dragstart="onCardDragStart($event, item)"
										@mouseenter="activeIndex = flatItems.findIndex((f) => f.type === item.type)"
									>
										<span
											class="kiv-palette-modal__card-icon"
											:style="{
												color: CATEGORY_META[item.category]?.color,
												background: `${CATEGORY_META[item.category]?.color}1a`,
											}"
										><NodeIcon :type="item.type" :size="18" /></span>
										<span class="kiv-palette-modal__card-name">{{ item.label }}</span>
										<span class="kiv-palette-modal__card-desc">{{ item.description }}</span>
									</button>
								</div>
							</div>
						</template>
						<div v-if="!filtered.length" class="kiv-palette-modal__empty">
							<div class="kiv-palette-modal__empty-icon">🔍</div>
							No nodes match "{{ search }}"
						</div>
					</div>

					<!-- Footer with keyboard hints -->
					<div class="kiv-palette-modal__footer">
						<span class="kiv-palette-modal__kbd-group">
							<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd>
							<span class="kiv-palette-modal__kbd-label">navigate</span>
						</span>
						<span class="kiv-palette-modal__kbd-group">
							<kbd>↵</kbd>
							<span class="kiv-palette-modal__kbd-label">add</span>
						</span>
						<span class="kiv-palette-modal__kbd-group">
							<kbd>esc</kbd>
							<span class="kiv-palette-modal__kbd-label">close</span>
						</span>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.kiv-palette-backdrop {
	position: fixed;
	inset: 0;
	z-index: 9999;
	background: rgba(0, 0, 0, 0.55);
	backdrop-filter: blur(2px);
	display: flex;
	align-items: center;
	justify-content: center;
}

.kiv-palette-modal {
	width: 480px;
	max-height: 600px;
	background: var(--color-surface-raised);
	border: 1px solid var(--color-border);
	border-radius: 14px;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	box-shadow: 0 24px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.04);
}

.kiv-palette-modal__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 14px 16px 10px;
	border-bottom: 1px solid var(--color-border);
	flex-shrink: 0;
}
.kiv-palette-modal__title {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 0.85rem;
	font-weight: 600;
	color: var(--color-text-primary);
}
.kiv-palette-modal__close {
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	background: transparent;
	color: var(--color-text-muted);
	cursor: pointer;
	border-radius: 5px;
	transition: background 0.1s, color 0.1s;
}
.kiv-palette-modal__close:hover {
	background: var(--color-surface-overlay);
	color: var(--color-text-primary);
}

.kiv-palette-modal__search {
	position: relative;
	padding: 10px 12px 8px;
	border-bottom: 1px solid var(--color-border);
	flex-shrink: 0;
}
.kiv-palette-modal__search-icon {
	position: absolute;
	left: 22px;
	top: 50%;
	transform: translateY(-50%);
	color: var(--color-text-muted);
	pointer-events: none;
}
.kiv-palette-modal__search-input {
	width: 100%;
	padding: 7px 10px 7px 32px;
	background: var(--color-surface-base);
	border: 1px solid var(--color-border);
	border-radius: 7px;
	color: var(--color-text-primary);
	font-size: 0.82rem;
	font-family: inherit;
	outline: none;
	transition: border-color 0.12s;
}
.kiv-palette-modal__search-input:focus {
	border-color: var(--color-accent);
}
.kiv-palette-modal__search-input::placeholder {
	color: var(--color-text-muted);
}

/* Insert hint */
.kiv-palette-modal__hint {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 7px 14px;
	border-bottom: 1px solid var(--color-border);
	font-size: 0.7rem;
	color: var(--color-text-muted);
	flex-shrink: 0;
	background: var(--color-surface-raised);
}

.kiv-palette-modal__list {
	flex: 1;
	overflow-y: auto;
	padding: 10px 14px 14px;
}
.kiv-palette-modal__list::-webkit-scrollbar { width: 4px; }
.kiv-palette-modal__list::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 2px; }

.kiv-palette-modal__group { padding: 0; margin-bottom: 14px; }
.kiv-palette-modal__group:last-child { margin-bottom: 0; }
.kiv-palette-modal__group-label {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 0 2px 8px;
	font-size: 0.62rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.09em;
	color: var(--color-text-muted);
}
.kiv-palette-modal__group-dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	flex-shrink: 0;
}

/* Card grid — 2 columns */
.kiv-palette-modal__grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 6px;
}

.kiv-palette-modal__card {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 6px;
	padding: 12px;
	background: var(--color-surface-overlay);
	border: 1px solid transparent;
	border-radius: 9px;
	cursor: pointer;
	font-family: inherit;
	text-align: left;
	transition: background 0.12s, border-color 0.12s, transform 0.06s;
}
.kiv-palette-modal__card:hover,
.kiv-palette-modal__card--active {
	background: var(--color-surface-overlay);
	border-color: rgba(99, 102, 241, 0.4);
}
.kiv-palette-modal__card--active {
	box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.25);
}
.kiv-palette-modal__card:active {
	transform: scale(0.98);
}

.kiv-palette-modal__card-icon {
	width: 34px;
	height: 34px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 8px;
	font-size: 1rem;
	flex-shrink: 0;
}
.kiv-palette-modal__card-name {
	font-size: 0.82rem;
	font-weight: 600;
	color: var(--color-text-primary);
}
.kiv-palette-modal__card-desc {
	font-size: 0.68rem;
	line-height: 1.35;
	color: var(--color-text-muted);
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.kiv-palette-modal__empty {
	padding: 40px 14px;
	text-align: center;
	font-size: 0.8rem;
	color: var(--color-text-muted);
}
.kiv-palette-modal__empty-icon {
	font-size: 1.6rem;
	margin-bottom: 8px;
	opacity: 0.5;
}

/* Footer keyboard hints */
.kiv-palette-modal__footer {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 9px 16px;
	border-top: 1px solid var(--color-border);
	background: var(--color-surface-raised);
	flex-shrink: 0;
}
.kiv-palette-modal__kbd-group {
	display: flex;
	align-items: center;
	gap: 4px;
}
.kiv-palette-modal__footer kbd {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 16px;
	height: 16px;
	padding: 0 4px;
	background: var(--color-surface-overlay);
	border: 1px solid var(--color-border);
	border-radius: 4px;
	font-size: 0.62rem;
	font-family: inherit;
	color: var(--color-text-secondary);
	line-height: 1;
}
.kiv-palette-modal__kbd-label {
	font-size: 0.65rem;
	color: var(--color-text-muted);
	margin-left: 2px;
}

/* Modal enter/leave transition */
.kiv-modal-enter-active {
	transition: opacity 0.15s ease, transform 0.15s ease;
}
.kiv-modal-leave-active {
	transition: opacity 0.1s ease, transform 0.1s ease;
}
.kiv-modal-enter-from {
	opacity: 0;
}
.kiv-modal-leave-to {
	opacity: 0;
}
.kiv-modal-enter-from .kiv-palette-modal,
.kiv-modal-leave-to .kiv-palette-modal {
	transform: scale(0.96) translateY(-8px);
}
</style>
