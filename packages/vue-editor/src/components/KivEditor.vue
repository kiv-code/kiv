<script setup lang="ts">
import type {
	Breakpoint,
	EventBus,
	KivDocument,
	KivEngine,
	KivNode,
	PageTemplate,
	Registry,
} from "@kivcode/engine";
import { BUILT_IN_TEMPLATES, cloneNodeTree } from "@kivcode/engine";
import type { ContentTemplate } from "@kivcode/nodes-interactive";
import { CONTENT_TEMPLATES } from "@kivcode/nodes-interactive";
import type { VueRegistry } from "@kivcode/vue";
import { computed, onMounted, onUnmounted, provide, ref, watch } from "vue";
import { EditorExtensions } from "../extensions";
import ColorGradientControl from "../inspector/controls/ColorGradientControl.vue";
import IconPicker from "../inspector/controls/IconPicker.vue";
import MediaPicker from "../inspector/controls/MediaPicker.vue";
import PricingEditor from "../inspector/controls/PricingEditor.vue";
import SizeSliderControl from "../inspector/controls/SizeSliderControl.vue";
import SocialLinksEditor from "../inspector/controls/SocialLinksEditor.vue";
import SpacingBoxControl from "../inspector/controls/SpacingBoxControl.vue";
import TableEditor from "../inspector/controls/TableEditor.vue";
import { EDITOR_EXTENSIONS_KEY, EDITOR_STORE_KEY } from "../store/context";
import { useEditorStore } from "../store/editor-store";
import { insertNodeNearSelection } from "../utils/insert-node";
import { getNodeLabel } from "../utils/node-labels";
import KivBlockLibrary from "./KivBlockLibrary.vue";
import KivCanvas from "./KivCanvas.vue";
import KivInspector from "./KivInspector.vue";
import KivNodePalette from "./KivNodePalette.vue";
import KivTemplateBrowser from "./KivTemplateBrowser.vue";
import KivTree from "./KivTree.vue";

const props = defineProps<{
	document: KivDocument;
	registry: Registry;
	vueRegistry: VueRegistry;
	title?: string;
	theme?: "dark" | "light";
	/** Shared bus (e.g. `engine.bus`) so plugins can observe editor mutations. */
	bus?: EventBus;
	/** Engine reference — when provided, triggered `setEditorExtensions()` on mount so plugins' `onEditorReady` fires. */
	engine?: KivEngine;
}>();

const emit = defineEmits<{ "update:document": [doc: KivDocument] }>();

const store = useEditorStore(props.document, props.registry, {
	bus: props.bus,
	media: props.engine?.media ?? null,
	services: props.engine?.services ?? null,
});
provide(EDITOR_STORE_KEY, store);

const extensions = new EditorExtensions();
extensions.addFieldControl("icon-picker", IconPicker);
extensions.addFieldControl("color-gradient", ColorGradientControl);
extensions.addFieldControl("size-slider", SizeSliderControl);
extensions.addFieldControl("spacing-box", SpacingBoxControl);
extensions.addFieldControl("media-picker", MediaPicker);
extensions.addFieldControl("table-editor", TableEditor);
extensions.addFieldControl("pricing-editor", PricingEditor);
extensions.addFieldControl("social-links-editor", SocialLinksEditor);
provide(EDITOR_EXTENSIONS_KEY, extensions);

watch(
	() => store.document.value,
	(doc) => {
		emit("update:document", doc);
		extensions.notifyDocumentChanged(doc);
	},
	{ deep: true },
);

// Wire extension notifications to editor store events
onMounted(() => {
	if (props.engine) {
		props.engine.setEditorExtensions(extensions);
	}
	// Subscribe to bus events to trigger extension callbacks
	const bus = props.bus;
	if (bus) {
		const unsubSelect = bus.on("selection.changed", (state) => {
			const ids = state.ids;
			const doc = store.document.value;
			if (ids.length > 0) {
				function find(n: KivNode): KivNode | null {
					if (n.id === ids[0]) return n;
					for (const ch of Object.values(n.slots ?? {})) {
						for (const c of ch) {
							const f = find(c);
							if (f) return f;
						}
					}
					return null;
				}
				const node = find(doc.root);
				if (node) extensions.notifyNodeSelected(node);
			}
		});
		onUnmounted(unsubSelect);

		const unsubCreate = bus.on("node.created", (payload) => {
			const doc = store.document.value;
			function find(n: KivNode): KivNode | null {
				if (n.id === payload.id) return n;
				for (const ch of Object.values(n.slots ?? {})) {
					for (const c of ch) {
						const f = find(c);
						if (f) return f;
					}
				}
				return null;
			}
			const node = find(doc.root);
			if (node) extensions.notifyNodeCreated(node);
		});
		onUnmounted(unsubCreate);
	}
});

const treeOpen = ref(true);
const inspectorOpen = ref(true);
const paletteOpen = ref(false);
const templatesOpen = ref(false);
const blocksOpen = ref(false);

function applyTemplate(template: PageTemplate): void {
	store.loadDocument(template.document);
}

function insertBlock(template: ContentTemplate): void {
	const node = cloneNodeTree(template.create());
	insertNodeNearSelection(store, node);
	store.select(node.id);
}

// Editor chrome theme — initialized from prop, toggleable at runtime
const editorTheme = ref<"dark" | "light">(props.theme ?? "dark");
function toggleTheme() {
	editorTheme.value = editorTheme.value === "dark" ? "light" : "dark";
}

// Locales available in the document (for the toolbar switcher)
const locales = computed<string[]>(
	() => store.document.value.i18n?.supported ?? [],
);
const hasMultipleLocales = computed(() => locales.value.length > 1);
function localeLabel(loc: string) {
	return loc.toUpperCase();
}

function openPalette() {
	paletteOpen.value = true;
}
function closePalette() {
	paletteOpen.value = false;
}

// Smart insert: if selected has slots → append inside as last child.
// If selected is a leaf (no slots) → insert after it in its parent.
// No selection → append to root's first slot.
function onPaletteAdd(node: KivNode) {
	if (!store) return;
	insertNodeNearSelection(store, node);
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
	<div class="kiv-editor" :class="editorTheme === 'light' ? 'kiv-editor--light' : 'kiv-editor--dark'">
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
					title="Redo (⌘⇧Z)"
					:disabled="!store.canRedo.value"
					@click="store.redo()"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>
					</svg>
				</button>

				<!-- Plugin toolbar buttons -->
				<template v-for="btn in extensions.getToolbarButtons()" :key="btn.id">
					<div class="kiv-toolbar__sep" />
					<button
						type="button"
						class="kiv-toolbar__action"
						:title="btn.label"
						@click="btn.onClick()"
					>
						<template v-if="btn.icon">{{ btn.icon }}</template>
						<template v-else>{{ btn.label }}</template>
					</button>
				</template>

				<!-- Locale switcher (only when doc supports more than one) -->
				<template v-if="hasMultipleLocales">
					<div class="kiv-toolbar__sep" />
					<div class="kiv-locale-switcher" title="Preview locale">
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="9"/>
							<path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>
						</svg>
						<button
							v-for="loc in locales"
							:key="loc"
							type="button"
							class="kiv-locale-btn"
							:class="{ 'kiv-locale-btn--active': store.locale.value === loc }"
							@click="store.setLocale(loc)"
						>{{ localeLabel(loc) }}</button>
					</div>
				</template>
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
					class="kiv-toolbar__zoom-btn"
					title="Reset zoom (⌘0)"
					@click="store.resetZoom()"
				>{{ Math.round(store.zoom.value * 100) }}%</button>
				<div class="kiv-toolbar__sep" />
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
					class="kiv-toolbar__action"
					title="Page templates"
					@click="templatesOpen = true"
				>
					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="3" width="7" height="7" rx="1"/>
						<rect x="14" y="3" width="7" height="7" rx="1"/>
						<rect x="3" y="14" width="7" height="7" rx="1"/>
						<rect x="14" y="14" width="7" height="7" rx="1"/>
					</svg>
				</button>
				<button
					type="button"
					class="kiv-toolbar__action"
					title="Insert block"
					@click="blocksOpen = true"
				>
					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="3" width="18" height="7" rx="1"/>
						<rect x="3" y="14" width="8" height="7" rx="1"/>
						<rect x="14" y="14" width="7" height="7" rx="1"/>
					</svg>
				</button>
				<div class="kiv-toolbar__sep" />
				<button
					type="button"
					class="kiv-toolbar__action"
					:title="editorTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
					@click="toggleTheme"
				>
					<svg v-if="editorTheme === 'dark'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="4"/>
						<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
					</svg>
					<svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>
					</svg>
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
			<KivCanvas :registry="vueRegistry" :engine-registry="registry" />
			<transition name="kiv-panel">
				<KivInspector v-if="inspectorOpen" :registry="registry" />
			</transition>
		</div>

		<KivNodePalette
			:open="paletteOpen"
			:selected-node-type="store.selected.value?.type"
			:selected-node-label="store.selected.value ? getNodeLabel(store.selected.value.type, registry) : undefined"
			:registry="registry"
			:theme="editorTheme"
			@close="closePalette"
			@add="onPaletteAdd"
		/>

		<KivTemplateBrowser
			:open="templatesOpen"
			:templates="BUILT_IN_TEMPLATES"
			@close="templatesOpen = false"
			@apply="applyTemplate"
		/>

		<KivBlockLibrary
			:open="blocksOpen"
			:templates="CONTENT_TEMPLATES"
			@close="blocksOpen = false"
			@insert="insertBlock"
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
	background: var(--color-surface-base);
	color: var(--color-text-primary);
}

/* ── Toolbar ── */
.kiv-editor__toolbar {
	display: grid;
	grid-template-columns: 1fr auto 1fr;
	align-items: center;
	padding: 0 10px;
	height: 44px;
	background: var(--color-surface-raised);
	border-bottom: 1px solid var(--color-border);
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
	background: var(--color-border);
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
.kiv-toolbar__zoom-btn {
	padding: 4px 8px;
	border: none;
	border-radius: 6px;
	background: transparent;
	color: var(--color-text-secondary);
	font-size: 0.72rem;
	font-weight: 600;
	font-family: inherit;
	font-variant-numeric: tabular-nums;
	cursor: pointer;
	transition: background 0.12s, color 0.12s;
}
.kiv-toolbar__zoom-btn:hover {
	background: var(--color-surface-overlay);
	color: var(--color-text-primary);
}

/* ── Breakpoint switcher ── */
.kiv-bp-switcher {
	display: flex;
	gap: 1px;
	background: var(--color-surface-overlay);
	border: 1px solid var(--color-border);
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

/* ── Locale switcher ── */
.kiv-locale-switcher {
	display: flex;
	align-items: center;
	gap: 2px;
	padding: 2px 2px 2px 6px;
	background: var(--color-surface-overlay);
	border: 1px solid var(--color-border);
	border-radius: 7px;
	color: var(--color-text-muted);
}
.kiv-locale-btn {
	padding: 3px 7px;
	border: none;
	border-radius: 5px;
	background: transparent;
	color: var(--color-text-secondary);
	cursor: pointer;
	font-size: 0.68rem;
	font-weight: 600;
	font-family: inherit;
	letter-spacing: 0.03em;
	transition: background 0.1s, color 0.1s;
}
.kiv-locale-btn:hover { color: var(--color-text-primary); }
.kiv-locale-btn--active {
	background: var(--color-accent-muted);
	color: var(--color-accent-light);
}

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
