<script setup lang="ts">
import type { Breakpoint, KivDocument, KivNode, Registry } from "@kiv/engine";
import type { VueRegistry } from "@kiv/vue";
import { provide, ref, watch } from "vue";
import { EDITOR_STORE_KEY } from "../store/context";
import { useEditorStore } from "../store/editor-store";
import KivCanvas from "./KivCanvas.vue";
import KivInspector from "./KivInspector.vue";
import KivNodePalette from "./KivNodePalette.vue";
import KivTree from "./KivTree.vue";

const props = defineProps<{
	document: KivDocument;
	registry: Registry;
	vueRegistry: VueRegistry;
	title?: string;
	theme?: "dark" | "light";
}>();

const emit = defineEmits<{ "update:document": [doc: KivDocument] }>();

const store = useEditorStore(props.document, props.registry);
provide(EDITOR_STORE_KEY, store);

watch(
	() => store.document.value,
	(doc) => emit("update:document", doc),
	{ deep: true },
);

const treeOpen = ref(true);
const inspectorOpen = ref(true);
const paletteOpen = ref(false);

function openPalette() {
	paletteOpen.value = true;
}
function closePalette() {
	paletteOpen.value = false;
}

function onPaletteAdd(node: KivNode, position: "inside" | "after") {
	if (!store) return;
	const selected = store.selected.value;
	const doc = store.document.value;

	if (position === "inside") {
		const parent = selected ?? doc.root;
		const slots = Object.keys(parent.slots ?? {});
		const slotName = slots[0] ?? "default";
		store.addNode(parent.id, slotName, node);
	} else {
		// after: find parent of selected, insert right after selected's index
		if (!selected) {
			// no selection → append to root's first slot
			const slots = Object.keys(doc.root.slots ?? {});
			store.addNode(doc.root.id, slots[0] ?? "default", node);
		} else {
			// find selected's parent via DFS
			function findParent(
				current: KivNode,
				targetId: string,
			): { parent: KivNode; slot: string; index: number } | null {
				for (const [slot, children] of Object.entries(current.slots ?? {})) {
					for (let i = 0; i < children.length; i++) {
						const child = children[i];
						if (!child) continue;
						if (child.id === targetId)
							return { parent: current, slot, index: i };
						const found = findParent(child, targetId);
						if (found) return found;
					}
				}
				return null;
			}
			const loc = findParent(doc.root, selected.id);
			if (loc) {
				store.addNode(loc.parent.id, loc.slot, node, loc.index + 1);
			} else {
				store.addNode(doc.root.id, "default", node);
			}
		}
	}

	store.select(node.id);
	paletteOpen.value = false;
}

interface BpDef {
	value: Breakpoint;
	label: string;
	width: string;
	icon: string;
}
const BREAKPOINTS: BpDef[] = [
	{ value: "base", label: "Mobile", width: "390px", icon: "📱" },
	{ value: "md", label: "Tablet", width: "768px", icon: "📟" },
	{ value: "lg", label: "Desktop", width: "1280px", icon: "🖥" },
	{ value: "xl", label: "Wide", width: "100%", icon: "◼" },
];
</script>

<template>
	<div class="kiv-editor" :class="props.theme === 'light' ? 'kiv-editor--light' : 'kiv-editor--dark'">
		<!-- Toolbar -->
		<header class="kiv-editor__toolbar">
			<div class="kiv-toolbar__left">
				<button
					type="button"
					class="kiv-toolbar__panel-toggle"
					:class="{ active: treeOpen }"
					title="Toggle structure panel"
					@click="treeOpen = !treeOpen"
				>
					<svg width="15" height="15" viewBox="0 0 15 15" fill="none">
						<rect x="1" y="3" width="5" height="9" rx="1" fill="currentColor" opacity=".6"/>
						<rect x="8" y="1" width="6" height="4" rx="1" fill="currentColor"/>
						<rect x="8" y="7" width="6" height="4" rx="1" fill="currentColor" opacity=".6"/>
					</svg>
				</button>
				<div class="kiv-toolbar__sep" />
				<button
					type="button"
					class="kiv-toolbar__action"
					:disabled="!store.canUndo.value"
					title="Undo (⌘Z)"
					@click="store.undo()"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
					</svg>
				</button>
				<button
					type="button"
					class="kiv-toolbar__action"
					:disabled="!store.canRedo.value"
					title="Redo (⌘⇧Z)"
					@click="store.redo()"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>
					</svg>
				</button>
			</div>

			<div class="kiv-toolbar__center">
				<div class="kiv-bp-switcher">
					<button
						v-for="bp in BREAKPOINTS"
						:key="bp.value"
						type="button"
						class="kiv-bp-btn"
						:class="{ 'kiv-bp-btn--active': store.breakpoint.value === bp.value }"
						:title="bp.label"
						@click="store.setBreakpoint(bp.value)"
					>
						<span class="kiv-bp-btn__icon">{{ bp.icon }}</span>
						<span class="kiv-bp-btn__label">{{ bp.label }}</span>
					</button>
				</div>
			</div>

			<div class="kiv-toolbar__right">
				<button
					type="button"
					class="kiv-toolbar__add-btn"
					title="Add node"
					@click="openPalette"
				>
					<svg width="11" height="11" viewBox="0 0 11 11" fill="none">
						<path d="M5.5 1v9M1 5.5h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
					</svg>
					Add
				</button>
				<div class="kiv-toolbar__sep" />
				<button
					type="button"
					class="kiv-toolbar__panel-toggle"
					:class="{ active: inspectorOpen }"
					title="Toggle inspector"
					@click="inspectorOpen = !inspectorOpen"
				>
					<svg width="15" height="15" viewBox="0 0 15 15" fill="none">
						<rect x="9" y="3" width="5" height="9" rx="1" fill="currentColor" opacity=".6"/>
						<rect x="1" y="1" width="6" height="4" rx="1" fill="currentColor"/>
						<rect x="1" y="7" width="6" height="4" rx="1" fill="currentColor" opacity=".6"/>
					</svg>
				</button>
			</div>
		</header>

		<!-- Body -->
		<div class="kiv-editor__body">
			<transition name="kiv-panel">
				<KivTree v-if="treeOpen" @open-palette="openPalette" />
			</transition>
			<KivCanvas :registry="vueRegistry" />
			<transition name="kiv-panel">
				<KivInspector v-if="inspectorOpen" :registry="registry" />
			</transition>
		</div>

		<KivNodePalette
			:open="paletteOpen"
			:selected-node-type="store.selected.value?.type"
			@close="closePalette"
			@add="onPaletteAdd"
		/>
	</div>
</template>

<style scoped>
.kiv-editor {
	display: flex;
	flex-direction: column;
	height: 100%;
	font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
	font-size: 13px;
	background: #0f1117;
	color: #e2e8f0;
}

/* ── Toolbar ── */
.kiv-editor__toolbar {
	display: grid;
	grid-template-columns: 1fr auto 1fr;
	align-items: center;
	padding: 0 10px;
	height: 44px;
	background: #16181f;
	border-bottom: 1px solid #1e2130;
	flex-shrink: 0;
	gap: 8px;
}
.kiv-toolbar__left {
	display: flex;
	align-items: center;
	gap: 4px;
}
.kiv-toolbar__right {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 4px;
}
.kiv-toolbar__center {
	display: flex;
	justify-content: center;
}
.kiv-toolbar__sep {
	width: 1px;
	height: 20px;
	background: #2d3148;
	margin: 0 4px;
}

.kiv-toolbar__action {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border: none;
	border-radius: 6px;
	background: transparent;
	color: var(--color-text-secondary);
	cursor: pointer;
	transition: background 0.12s, color 0.12s;
}
.kiv-toolbar__action:hover:not(:disabled) {
	background: var(--color-surface-overlay);
	color: var(--color-text-primary);
}
.kiv-toolbar__action:disabled {
	opacity: 0.3;
	cursor: default;
}
.kiv-toolbar__panel-toggle {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border: none;
	border-radius: 6px;
	background: transparent;
	color: var(--color-text-secondary);
	cursor: pointer;
	transition: background 0.12s, color 0.12s;
}
.kiv-toolbar__panel-toggle:hover {
	background: var(--color-surface-overlay);
	color: var(--color-text-primary);
}
.kiv-toolbar__panel-toggle.active {
	background: var(--color-surface-overlay);
	color: var(--color-accent);
}
.kiv-toolbar__add-btn {
	display: flex;
	align-items: center;
	gap: 5px;
	padding: 5px 10px;
	border: none;
	border-radius: 6px;
	background: var(--color-accent);
	color: #fff;
	font-size: 0.72rem;
	font-weight: 600;
	font-family: inherit;
	cursor: pointer;
	transition: opacity 0.12s;
}
.kiv-toolbar__add-btn:hover { opacity: 0.85; }

/* ── Breakpoint switcher ── */
.kiv-bp-switcher {
	display: flex;
	gap: 1px;
	background: #1a1d2a;
	border: 1px solid #1e2130;
	border-radius: 8px;
	padding: 2px;
}
.kiv-bp-btn {
	display: flex;
	align-items: center;
	gap: 5px;
	padding: 4px 10px;
	border: none;
	border-radius: 6px;
	background: transparent;
	color: var(--color-text-secondary);
	cursor: pointer;
	font-size: 0.72rem;
	font-family: inherit;
	transition: background 0.1s, color 0.1s;
	white-space: nowrap;
}
.kiv-bp-btn:hover {
	background: var(--color-surface-overlay);
	color: var(--color-text-primary);
}
.kiv-bp-btn--active {
	background: var(--color-surface-overlay);
	color: var(--color-accent-light);
	font-weight: 600;
}
.kiv-bp-btn__icon { font-size: 0.8rem; }
.kiv-bp-btn__label { font-size: 0.72rem; }

/* ── Body ── */
.kiv-editor__body {
	display: flex;
	flex: 1;
	overflow: hidden;
}

/* ── Panel slide transition ── */
.kiv-panel-enter-active,
.kiv-panel-leave-active {
	transition: width 0.2s ease, opacity 0.15s ease;
	overflow: hidden;
}
.kiv-panel-enter-from,
.kiv-panel-leave-to {
	width: 0 !important;
	min-width: 0 !important;
	opacity: 0;
}
</style>
