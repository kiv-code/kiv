<script setup lang="ts">
import type { PageTemplate } from "@kivcode/engine";
import { computed, ref } from "vue";
import NodeIcon from "./NodeIcon.vue";

const props = defineProps<{
	open: boolean;
	templates: PageTemplate[];
}>();

const emit = defineEmits<{
	close: [];
	apply: [template: PageTemplate];
}>();

const search = ref("");

const filtered = computed(() => {
	const q = search.value.toLowerCase().trim();
	if (!q) return props.templates;
	return props.templates.filter(
		(t) =>
			t.name.toLowerCase().includes(q) ||
			(t.description ?? "").toLowerCase().includes(q) ||
			(t.category ?? "").toLowerCase().includes(q),
	);
});

function apply(template: PageTemplate): void {
	emit("apply", template);
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
				class="kiv-template-backdrop"
				@click="onBackdrop"
				@keydown="onKeydown"
			>
				<div class="kiv-template-modal" role="dialog" aria-modal="true" aria-label="Page templates">
					<div class="kiv-template-modal__header">
						<div class="kiv-template-modal__title">Templates</div>
						<button type="button" class="kiv-template-modal__close" @click="$emit('close')">
							<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
								<path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
							</svg>
						</button>
					</div>

					<div class="kiv-template-modal__search">
						<input v-model="search" type="text" placeholder="Search templates…" />
					</div>

					<p class="kiv-template-modal__hint">
						Applying a template replaces the current page — it's a single undo step (⌘Z).
					</p>

					<div class="kiv-template-modal__grid">
						<button
							v-for="template in filtered"
							:key="template.id"
							type="button"
							class="kiv-template-modal__card"
							@click="apply(template)"
						>
							<div class="kiv-template-modal__thumb">
								<img v-if="template.thumbnail" :src="template.thumbnail" alt="" />
								<NodeIcon v-else type="page" :size="28" />
							</div>
							<span class="kiv-template-modal__name">{{ template.name }}</span>
							<span v-if="template.description" class="kiv-template-modal__desc">{{ template.description }}</span>
						</button>
						<div v-if="!filtered.length" class="kiv-template-modal__empty">
							No templates match "{{ search }}"
						</div>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.kiv-template-backdrop {
	position: fixed;
	inset: 0;
	z-index: 9999;
	background: rgba(0, 0, 0, 0.55);
	backdrop-filter: blur(2px);
	display: flex;
	align-items: center;
	justify-content: center;
}
.kiv-template-modal {
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
.kiv-template-modal__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 14px 16px 10px;
	border-bottom: 1px solid var(--color-border);
	flex-shrink: 0;
}
.kiv-template-modal__title {
	font-size: 0.85rem;
	font-weight: 600;
	color: var(--color-text-primary);
}
.kiv-template-modal__close {
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
.kiv-template-modal__close:hover {
	background: var(--color-surface-overlay);
	color: var(--color-text-primary);
}
.kiv-template-modal__search {
	padding: 10px 14px;
	border-bottom: 1px solid var(--color-border);
	flex-shrink: 0;
}
.kiv-template-modal__search input {
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
.kiv-template-modal__search input:focus {
	border-color: var(--color-accent);
}
.kiv-template-modal__hint {
	margin: 0;
	padding: 8px 14px;
	font-size: 0.7rem;
	color: var(--color-text-muted);
	border-bottom: 1px solid var(--color-border);
	flex-shrink: 0;
}
.kiv-template-modal__grid {
	flex: 1;
	overflow-y: auto;
	padding: 14px;
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px;
	align-content: start;
}
.kiv-template-modal__card {
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
.kiv-template-modal__card:hover {
	border-color: rgba(99, 102, 241, 0.4);
}
.kiv-template-modal__thumb {
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
.kiv-template-modal__thumb img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}
.kiv-template-modal__name {
	font-size: 0.82rem;
	font-weight: 600;
	color: var(--color-text-primary);
}
.kiv-template-modal__desc {
	font-size: 0.7rem;
	color: var(--color-text-muted);
	line-height: 1.35;
}
.kiv-template-modal__empty {
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
.kiv-modal-enter-from .kiv-template-modal,
.kiv-modal-leave-to .kiv-template-modal {
	transform: scale(0.96) translateY(-8px);
}
</style>
