<script setup lang="ts">
import type { ContentTemplate } from "@kivcode/nodes-interactive";
import { computed, ref } from "vue";
import NodeIcon from "./NodeIcon.vue";

const props = defineProps<{
	open: boolean;
	templates: ContentTemplate[];
}>();

const emit = defineEmits<{
	close: [];
	insert: [template: ContentTemplate];
}>();

const search = ref("");
const activeCategory = ref<string | null>(null);

// NodeIcon only knows how to draw actual node types — blocks use a slightly
// richer icon vocabulary (see templates/index.ts), so unmapped icons fall
// back to a generic "section" glyph instead of rendering nothing.
const ICON_FALLBACK: Record<string, string> = {
	grid: "grid",
	"message-circle": "testimonial",
	"help-circle": "accordion",
	"credit-card": "card",
	users: "stat",
	calendar: "table",
	table: "table",
	card: "card",
	"clipboard-list": "form",
};
function iconType(icon: string): string {
	return ICON_FALLBACK[icon] ?? "section";
}

const categories = computed<string[]>(() => {
	const seen = new Set<string>();
	const order: string[] = [];
	for (const t of props.templates) {
		if (!seen.has(t.category)) {
			seen.add(t.category);
			order.push(t.category);
		}
	}
	return order;
});

const filtered = computed(() => {
	const q = search.value.toLowerCase().trim();
	return props.templates.filter((t) => {
		if (activeCategory.value && t.category !== activeCategory.value) {
			return false;
		}
		if (!q) return true;
		return (
			t.label.toLowerCase().includes(q) ||
			t.description.toLowerCase().includes(q) ||
			t.category.toLowerCase().includes(q)
		);
	});
});

function insert(template: ContentTemplate): void {
	emit("insert", template);
	emit("close");
}

function onBackdrop(e: MouseEvent): void {
	if (e.target === e.currentTarget) emit("close");
}

function onKeydown(e: KeyboardEvent): void {
	if (e.key === "Escape") emit("close");
}
</script>

<template>
	<Teleport to="body">
		<Transition name="kiv-modal">
			<div
				v-if="open"
				class="kiv-block-backdrop"
				@click="onBackdrop"
				@keydown="onKeydown"
			>
				<div class="kiv-block-modal" role="dialog" aria-modal="true" aria-label="Insert block">
					<div class="kiv-block-modal__header">
						<div class="kiv-block-modal__title">Blocks</div>
						<button type="button" class="kiv-block-modal__close" @click="$emit('close')">
							<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
								<path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
							</svg>
						</button>
					</div>

					<div class="kiv-block-modal__search">
						<input v-model="search" type="text" placeholder="Search blocks…" />
					</div>

					<div class="kiv-block-modal__categories">
						<button
							type="button"
							class="kiv-block-modal__category"
							:class="{ 'kiv-block-modal__category--active': activeCategory === null }"
							@click="activeCategory = null"
						>
							All
						</button>
						<button
							v-for="cat in categories"
							:key="cat"
							type="button"
							class="kiv-block-modal__category"
							:class="{ 'kiv-block-modal__category--active': activeCategory === cat }"
							@click="activeCategory = cat"
						>
							{{ cat }}
						</button>
					</div>

					<p class="kiv-block-modal__hint">
						Inserted at your current selection — a single undo step (⌘Z).
					</p>

					<div class="kiv-block-modal__grid">
						<button
							v-for="template in filtered"
							:key="template.id"
							type="button"
							class="kiv-block-modal__card"
							@click="insert(template)"
						>
							<div class="kiv-block-modal__thumb">
								<NodeIcon :type="iconType(template.icon)" :size="28" />
							</div>
							<span class="kiv-block-modal__name">{{ template.label }}</span>
							<span class="kiv-block-modal__desc">{{ template.description }}</span>
						</button>
						<div v-if="!filtered.length" class="kiv-block-modal__empty">
							No blocks match "{{ search }}"
						</div>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.kiv-block-backdrop {
	position: fixed;
	inset: 0;
	z-index: 9999;
	background: rgba(0, 0, 0, 0.55);
	backdrop-filter: blur(2px);
	display: flex;
	align-items: center;
	justify-content: center;
}
.kiv-block-modal {
	width: 620px;
	max-height: 640px;
	background: var(--color-surface-raised);
	border: 1px solid var(--color-border);
	border-radius: 14px;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	box-shadow: 0 24px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.04);
	font-family: var(--font-editor);
}
.kiv-block-modal__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 14px 16px 10px;
	border-bottom: 1px solid var(--color-border);
	flex-shrink: 0;
}
.kiv-block-modal__title {
	font-size: 0.85rem;
	font-weight: 600;
	color: var(--color-text-primary);
}
.kiv-block-modal__close {
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
}
.kiv-block-modal__close:hover {
	background: var(--color-surface-overlay);
	color: var(--color-text-primary);
}
.kiv-block-modal__search {
	padding: 10px 14px;
	border-bottom: 1px solid var(--color-border);
	flex-shrink: 0;
}
.kiv-block-modal__search input {
	width: 100%;
	padding: 6px 10px;
	background: var(--color-surface-base);
	border: 1px solid var(--color-border);
	border-radius: 7px;
	color: var(--color-text-primary);
	font-size: 0.8rem;
	font-family: inherit;
	outline: none;
}
.kiv-block-modal__search input:focus {
	border-color: var(--color-accent);
}
.kiv-block-modal__categories {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	padding: 10px 14px;
	border-bottom: 1px solid var(--color-border);
	flex-shrink: 0;
}
.kiv-block-modal__category {
	padding: 3px 10px;
	font-size: 0.68rem;
	font-weight: 500;
	text-transform: capitalize;
	background: var(--color-surface-overlay);
	border: 1px solid transparent;
	border-radius: 999px;
	color: var(--color-text-muted);
	cursor: pointer;
}
.kiv-block-modal__category:hover {
	color: var(--color-text-primary);
}
.kiv-block-modal__category--active {
	background: var(--color-accent-muted);
	border-color: rgba(99, 102, 241, 0.4);
	color: var(--color-accent-light);
}
.kiv-block-modal__hint {
	margin: 0;
	padding: 8px 14px;
	font-size: 0.7rem;
	color: var(--color-text-muted);
	border-bottom: 1px solid var(--color-border);
	flex-shrink: 0;
}
.kiv-block-modal__grid {
	flex: 1;
	overflow-y: auto;
	padding: 14px;
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px;
	align-content: start;
}
.kiv-block-modal__card {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 12px;
	background: var(--color-surface-overlay);
	border: 1px solid transparent;
	border-radius: 10px;
	cursor: pointer;
	font-family: inherit;
	text-align: left;
}
.kiv-block-modal__card:hover {
	border-color: rgba(99, 102, 241, 0.4);
}
.kiv-block-modal__thumb {
	width: 100%;
	height: 90px;
	border-radius: 6px;
	background: var(--color-surface-sunken);
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--color-text-muted);
	overflow: hidden;
}
.kiv-block-modal__name {
	font-size: 0.82rem;
	font-weight: 600;
	color: var(--color-text-primary);
}
.kiv-block-modal__desc {
	font-size: 0.7rem;
	color: var(--color-text-muted);
	line-height: 1.35;
}
.kiv-block-modal__empty {
	grid-column: 1 / -1;
	padding: 40px 14px;
	text-align: center;
	font-size: 0.8rem;
	color: var(--color-text-muted);
}

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
.kiv-modal-enter-from .kiv-block-modal,
.kiv-modal-leave-to .kiv-block-modal {
	transform: scale(0.96) translateY(-8px);
}
</style>
