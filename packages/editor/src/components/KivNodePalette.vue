<script setup lang="ts">
import type { KivNode } from "@kiv/engine";
import { computed, nextTick, ref, watch } from "vue";
import { getNodeIcon } from "../utils/node-icons";

interface PaletteItem {
	type: string;
	label: string;
	description: string;
	hasDefaultSlot: boolean;
	category: "layout" | "content" | "media";
}

const PALETTE: PaletteItem[] = [
	{
		type: "section",
		label: "Section",
		description: "Full-width section with rich background options",
		hasDefaultSlot: true,
		category: "layout",
	},
	{
		type: "container",
		label: "Container",
		description: "Centered max-width content wrapper",
		hasDefaultSlot: true,
		category: "layout",
	},
	{
		type: "stack",
		label: "Stack",
		description: "Flex container — vertical or horizontal",
		hasDefaultSlot: true,
		category: "layout",
	},
	{
		type: "grid",
		label: "Grid",
		description: "Responsive multi-column grid layout",
		hasDefaultSlot: true,
		category: "layout",
	},
	{
		type: "column",
		label: "Column",
		description: "Column slot inside a Grid",
		hasDefaultSlot: true,
		category: "layout",
	},
	{
		type: "heading",
		label: "Heading",
		description: "H1–H6 text with fluid sizing",
		hasDefaultSlot: false,
		category: "content",
	},
	{
		type: "text",
		label: "Text",
		description: "Paragraph or inline text block",
		hasDefaultSlot: false,
		category: "content",
	},
	{
		type: "button",
		label: "Button",
		description: "CTA with primary, secondary, ghost styles",
		hasDefaultSlot: false,
		category: "content",
	},
	{
		type: "image",
		label: "Image",
		description: "Responsive image with cover/contain fit",
		hasDefaultSlot: false,
		category: "media",
	},
];

const CATEGORY_META: Record<string, { label: string; color: string }> = {
	layout: { label: "Layout", color: "#818cf8" },
	content: { label: "Content", color: "#34d399" },
	media: { label: "Media", color: "#fb923c" },
};

const props = defineProps<{
	open: boolean;
	selectedNodeType?: string;
}>();

const emit = defineEmits<{
	close: [];
	add: [node: KivNode, position: "inside" | "after"];
}>();

const search = ref("");
const position = ref<"inside" | "after">("inside");
const searchInput = ref<HTMLInputElement | null>(null);

watch(
	() => props.open,
	(val) => {
		if (val) {
			search.value = "";
			nextTick(() => searchInput.value?.focus());
		}
	},
);

const filtered = computed(() => {
	const q = search.value.toLowerCase().trim();
	return PALETTE.filter(
		(p) =>
			!q ||
			p.label.toLowerCase().includes(q) ||
			p.description.toLowerCase().includes(q) ||
			p.category.includes(q),
	);
});

const categories = ["layout", "content", "media"] as const;

function categoryItems(cat: string) {
	return filtered.value.filter((p) => p.category === cat);
}

function addNode(item: PaletteItem) {
	const node: KivNode = {
		id: `${item.type}-${Math.random().toString(36).slice(2, 7)}`,
		type: item.type,
		props: {},
		slots: item.hasDefaultSlot ? { default: [] } : undefined,
	};
	emit("add", node, position.value);
}

function onBackdrop(e: MouseEvent) {
	if (e.target === e.currentTarget) emit("close");
}

function onKeydown(e: KeyboardEvent) {
	if (e.key === "Escape") emit("close");
}
</script>

<template>
	<Teleport to="body">
		<Transition name="kiv-modal">
			<div
				v-if="open"
				class="kiv-palette-backdrop"
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

					<!-- Position toggle -->
					<div class="kiv-palette-modal__position">
						<span class="kiv-palette-modal__position-label">Insert</span>
						<div class="kiv-palette-modal__position-tabs">
							<button
								type="button"
								class="kiv-palette-modal__position-tab"
								:class="{ active: position === 'inside' }"
								@click="position = 'inside'"
							>
								<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
									<rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.3"/>
									<rect x="3.5" y="3.5" width="5" height="5" rx="1" fill="currentColor" opacity=".5"/>
								</svg>
								Inside selected
							</button>
							<button
								type="button"
								class="kiv-palette-modal__position-tab"
								:class="{ active: position === 'after' }"
								@click="position = 'after'"
							>
								<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
									<rect x="1" y="1" width="10" height="5" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
									<rect x="1" y="8" width="10" height="3" rx="1" fill="currentColor" opacity=".4"/>
								</svg>
								After selected
							</button>
						</div>
					</div>

					<!-- Node list -->
					<div class="kiv-palette-modal__list">
						<template v-for="cat in categories" :key="cat">
							<div v-if="categoryItems(cat).length" class="kiv-palette-modal__group">
								<div class="kiv-palette-modal__group-label" :style="{ color: CATEGORY_META[cat]?.color }">
									{{ CATEGORY_META[cat]?.label }}
								</div>
								<button
									v-for="item in categoryItems(cat)"
									:key="item.type"
									type="button"
									class="kiv-palette-modal__item"
									@click="addNode(item)"
								>
									<span class="kiv-palette-modal__item-icon">{{ getNodeIcon(item.type) }}</span>
									<span class="kiv-palette-modal__item-body">
										<span class="kiv-palette-modal__item-name">{{ item.label }}</span>
										<span class="kiv-palette-modal__item-desc">{{ item.description }}</span>
									</span>
									<svg class="kiv-palette-modal__item-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
										<path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
								</button>
							</div>
						</template>
						<div v-if="!filtered.length" class="kiv-palette-modal__empty">
							No nodes match "{{ search }}"
						</div>
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
	width: 420px;
	max-height: 560px;
	background: #16181f;
	border: 1px solid #252840;
	border-radius: 12px;
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
	border-bottom: 1px solid #1e2130;
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
	border-bottom: 1px solid #1e2130;
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
	background: #0d0f17;
	border: 1px solid #252840;
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

.kiv-palette-modal__position {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 8px 14px;
	border-bottom: 1px solid #1e2130;
	flex-shrink: 0;
}
.kiv-palette-modal__position-label {
	font-size: 0.7rem;
	color: var(--color-text-muted);
	flex-shrink: 0;
}
.kiv-palette-modal__position-tabs {
	display: flex;
	gap: 4px;
}
.kiv-palette-modal__position-tab {
	display: flex;
	align-items: center;
	gap: 5px;
	padding: 4px 10px;
	border: 1px solid transparent;
	border-radius: 6px;
	background: transparent;
	color: var(--color-text-muted);
	font-size: 0.72rem;
	font-family: inherit;
	cursor: pointer;
	transition: background 0.1s, color 0.1s, border-color 0.1s;
}
.kiv-palette-modal__position-tab:hover {
	background: #1a1d2e;
	color: var(--color-text-secondary);
}
.kiv-palette-modal__position-tab.active {
	background: var(--color-accent-muted);
	border-color: rgba(99, 102, 241, 0.35);
	color: var(--color-accent-light);
}

.kiv-palette-modal__list {
	flex: 1;
	overflow-y: auto;
	padding: 6px 0 10px;
}
.kiv-palette-modal__list::-webkit-scrollbar { width: 3px; }
.kiv-palette-modal__list::-webkit-scrollbar-thumb { background: #252840; border-radius: 2px; }

.kiv-palette-modal__group { padding: 0; }
.kiv-palette-modal__group-label {
	padding: 8px 14px 4px;
	font-size: 0.62rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.08em;
}

.kiv-palette-modal__item {
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	padding: 8px 14px;
	background: none;
	border: none;
	cursor: pointer;
	font-family: inherit;
	text-align: left;
	transition: background 0.1s;
}
.kiv-palette-modal__item:hover {
	background: #1a1d2e;
}
.kiv-palette-modal__item:hover .kiv-palette-modal__item-arrow {
	opacity: 1;
	transform: translateX(2px);
}

.kiv-palette-modal__item-icon {
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #1a1d2e;
	border: 1px solid #252840;
	border-radius: 7px;
	font-size: 0.85rem;
	flex-shrink: 0;
}

.kiv-palette-modal__item-body {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;
}
.kiv-palette-modal__item-name {
	font-size: 0.8rem;
	font-weight: 500;
	color: var(--color-text-primary);
}
.kiv-palette-modal__item-desc {
	font-size: 0.7rem;
	color: var(--color-text-muted);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.kiv-palette-modal__item-arrow {
	color: var(--color-text-muted);
	flex-shrink: 0;
	opacity: 0;
	transition: opacity 0.1s, transform 0.1s;
}

.kiv-palette-modal__empty {
	padding: 32px 14px;
	text-align: center;
	font-size: 0.78rem;
	color: var(--color-text-muted);
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
