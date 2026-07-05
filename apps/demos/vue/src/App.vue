<script setup lang="ts">
import { KivEditor } from "@kiv/editor";
import type { Breakpoint, KivDocument } from "@kiv/engine";
import { createEngine } from "@kiv/engine";
import { ALL_NODES } from "@kiv/nodes";
import {
	type AnalyticsEvent,
	analyticsPlugin,
	type ClickCounts,
	clickCounterPlugin,
} from "@kiv/plugin-analytics";
import { createDefaultVueRegistry, KivRenderer } from "@kiv/vue";
import { computed, onBeforeUnmount, ref, shallowRef } from "vue";
import { demoDocument } from "./demo-document";
import { clearPage, loadPage, savePage } from "./persistence";

// Two independent plugins listening on the same bus — proves the flow.
const events = shallowRef<AnalyticsEvent[]>([]);
const clickCounts = shallowRef<ClickCounts>({});

const engine = createEngine({
	nodes: [...ALL_NODES],
	plugins: [
		// Plugin 1 — captures EVERY event via the "*" wildcard.
		analyticsPlugin({
			sink: (e) => {
				events.value = [{ ...e }, ...events.value].slice(0, 20);
			},
		}),
		// Plugin 2 — tallies clicks per button (listens only to button.clicked).
		clickCounterPlugin({
			onChange: (counts) => {
				clickCounts.value = counts;
			},
		}),
	],
});

// Sorted list of [button, count] for display
const countList = computed(() =>
	Object.entries(clickCounts.value).sort((a, b) => b[1] - a[1]),
);
const vueRegistry = createDefaultVueRegistry();

// Inject theme CSS variables into <head>
const styleEl = document.createElement("style");
styleEl.textContent = engine.css();
document.head.appendChild(styleEl);

// Load the persisted page on startup (simulates SELECT ... FROM pages),
// falling back to the built-in demo document if nothing is saved yet.
const doc = ref<KivDocument>(loadPage() ?? demoDocument);
const mode = ref<"editor" | "preview">("editor");
const previewLocale = ref<string>(doc.value.i18n.default);

// ── Responsive preview ─────────────────────────────────────────────────────
// The preview must reflect the ACTUAL width it's rendered at, so responsive
// props (Grid columns, Column span, sizes…) resolve to the right breakpoint.
// Without this the preview is stuck at "base" (mobile) regardless of width.
const previewStage = ref<HTMLElement | null>(null);
const previewBreakpoint = ref<Breakpoint>("base");

// Same thresholds the editor uses (min-width, mobile-first).
function breakpointForWidth(w: number): Breakpoint {
	if (w >= 1280) return "xl";
	if (w >= 1024) return "lg";
	if (w >= 768) return "md";
	if (w >= 640) return "sm";
	return "base";
}

let resizeObserver: ResizeObserver | null = null;
function observePreview(el: HTMLElement | null) {
	previewStage.value = el;
	resizeObserver?.disconnect();
	if (!el) return;
	resizeObserver = new ResizeObserver((entries) => {
		const w = entries[0]?.contentRect.width ?? el.clientWidth;
		previewBreakpoint.value = breakpointForWidth(w);
	});
	resizeObserver.observe(el);
	previewBreakpoint.value = breakpointForWidth(el.clientWidth);
}

// ── Autosave (debounced) ──────────────────────────────────────────────────
type SaveState = "idle" | "saving" | "saved";
const saveState = ref<SaveState>("idle");
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function onDocumentUpdate(updated: KivDocument) {
	doc.value = updated;
	saveState.value = "saving";
	if (saveTimer) clearTimeout(saveTimer);
	// Debounce: wait until edits pause, then persist once.
	saveTimer = setTimeout(() => {
		savePage(updated);
		saveState.value = "saved";
	}, 500);
}

onBeforeUnmount(() => {
	if (saveTimer) clearTimeout(saveTimer);
	resizeObserver?.disconnect();
});

function resetToDemo() {
	clearPage();
	doc.value = structuredClone(demoDocument);
	saveState.value = "idle";
}

function clearEvents() {
	events.value = [];
}
</script>

<template>
	<div class="demo">
		<!-- Top bar: mode toggle -->
		<div class="demo-bar">
			<div class="demo-bar__brand">Kiv Demo</div>
			<div class="demo-bar__modes">
				<button
					type="button"
					:class="{ active: mode === 'editor' }"
					@click="mode = 'editor'"
				>Editor</button>
				<button
					type="button"
					:class="{ active: mode === 'preview' }"
					@click="mode = 'preview'"
				>Preview</button>
			</div>
			<div class="demo-bar__spacer" />

			<!-- Save status (autosave to localStorage = your `pages` table) -->
			<span class="demo-save" :class="`demo-save--${saveState}`">
				<template v-if="saveState === 'saving'">Saving…</template>
				<template v-else-if="saveState === 'saved'">✓ Saved</template>
				<template v-else>Autosave on</template>
			</span>
			<button type="button" class="demo-reset" @click="resetToDemo">Reset</button>

			<div v-if="mode === 'preview'" class="demo-bar__locales">
				<button
					v-for="loc in doc.i18n.supported"
					:key="loc"
					type="button"
					:class="{ active: previewLocale === loc }"
					@click="previewLocale = loc"
				>{{ loc.toUpperCase() }}</button>
			</div>
		</div>

		<!-- Editor -->
		<div v-if="mode === 'editor'" class="demo-body">
			<KivEditor
				:document="doc"
				:registry="engine.registry"
				:vue-registry="vueRegistry"
				title="Kiv Demo"
				@update:document="onDocumentUpdate"
			/>
		</div>

		<!-- Preview: real runtime render WITH the bus wired -->
		<div v-else class="demo-preview">
			<div :ref="(el) => observePreview(el as HTMLElement | null)" class="demo-preview__stage">
				<KivRenderer
					:document="doc"
					:registry="vueRegistry"
					:locale="previewLocale"
					:breakpoint="previewBreakpoint"
					:bus="engine.bus"
				/>
			</div>
			<!-- Two plugins listening on the same bus -->
			<aside class="demo-events">
				<div class="demo-events__header">
					<span>Plugins</span>
					<button type="button" @click="clearEvents">Clear log</button>
				</div>
				<p class="demo-events__hint">
					Click a button in the preview → two independent plugins react via the
					engine bus, without touching the core.
				</p>

				<!-- Plugin 2: click-counter (specific event + own state) -->
				<div class="demo-panel">
					<div class="demo-panel__title">
						<span class="demo-panel__dot demo-panel__dot--count" />
						click-counter · listens to <code>button.clicked</code>
					</div>
					<ul class="demo-counts">
						<li v-if="!countList.length" class="demo-events__empty">
							No clicks yet.
						</li>
						<li v-for="[key, n] in countList" :key="key" class="demo-counts__item">
							<span class="demo-counts__key">{{ key }}</span>
							<span class="demo-counts__badge">{{ n }}</span>
						</li>
					</ul>
				</div>

				<!-- Plugin 1: analytics (wildcard + event log) -->
				<div class="demo-panel">
					<div class="demo-panel__title">
						<span class="demo-panel__dot demo-panel__dot--events" />
						analytics · listens to <code>*</code>
					</div>
					<ul class="demo-events__list">
						<li v-if="!events.length" class="demo-events__empty">
							No events yet.
						</li>
						<li v-for="(e, i) in events" :key="i" class="demo-events__item">
							<span class="demo-events__name">{{ e.event }}</span>
							<code class="demo-events__payload">{{ JSON.stringify(e.payload) }}</code>
						</li>
					</ul>
				</div>
			</aside>
		</div>
	</div>
</template>

<style>
*,
*::before,
*::after {
	box-sizing: border-box;
}
html,
body {
	margin: 0;
	padding: 0;
	height: 100%;
	background: #0f1117;
}
.demo {
	height: 100vh;
	display: flex;
	flex-direction: column;
	font-family: ui-sans-serif, system-ui, sans-serif;
}

/* Top bar */
.demo-bar {
	display: flex;
	align-items: center;
	gap: 12px;
	height: 40px;
	padding: 0 12px;
	background: #16181f;
	border-bottom: 1px solid #1e2130;
	color: #e2e8f0;
	flex-shrink: 0;
}
.demo-bar__brand {
	font-size: 0.8rem;
	font-weight: 700;
}
.demo-bar__spacer {
	flex: 1;
}
.demo-bar__modes,
.demo-bar__locales {
	display: flex;
	gap: 2px;
	background: #0d0f17;
	border: 1px solid #1e2130;
	border-radius: 7px;
	padding: 2px;
}
.demo-bar__modes button,
.demo-bar__locales button {
	padding: 4px 12px;
	border: none;
	border-radius: 5px;
	background: transparent;
	color: #94a3b8;
	font-size: 0.72rem;
	font-weight: 600;
	font-family: inherit;
	cursor: pointer;
}
.demo-bar__modes button.active,
.demo-bar__locales button.active {
	background: rgba(99, 102, 241, 0.2);
	color: #a5b4fc;
}

/* Save status + reset */
.demo-save {
	font-size: 0.68rem;
	font-variant-numeric: tabular-nums;
	color: #64748b;
	transition: color 0.15s;
}
.demo-save--saving {
	color: #fbbf24;
}
.demo-save--saved {
	color: #34d399;
}
.demo-reset {
	padding: 4px 10px;
	border: 1px solid #1e2130;
	border-radius: 6px;
	background: transparent;
	color: #94a3b8;
	font-size: 0.7rem;
	font-family: inherit;
	cursor: pointer;
}
.demo-reset:hover {
	background: #1a1d2a;
	color: #e2e8f0;
}

.demo-body {
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
}

/* Preview */
.demo-preview {
	flex: 1;
	min-height: 0;
	display: flex;
}
.demo-preview__stage {
	flex: 1;
	overflow: auto;
	background: #fff;
}
.demo-events {
	width: 320px;
	flex-shrink: 0;
	background: #13151c;
	border-left: 1px solid #1e2130;
	color: #e2e8f0;
	display: flex;
	flex-direction: column;
	overflow-y: auto;
}
.demo-events__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 12px;
	border-bottom: 1px solid #1e2130;
	font-size: 0.7rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: #b0bdd0;
}
.demo-events__header button {
	border: none;
	background: transparent;
	color: #64748b;
	font-size: 0.66rem;
	cursor: pointer;
	font-family: inherit;
}
.demo-events__header button:hover {
	color: #e2e8f0;
}
.demo-events__hint {
	padding: 10px 12px;
	margin: 0;
	font-size: 0.68rem;
	line-height: 1.4;
	color: #64748b;
	border-bottom: 1px solid #1e2130;
}
.demo-events__hint code {
	color: #a5b4fc;
	font-size: 0.64rem;
}
.demo-events__list {
	list-style: none;
	margin: 0;
	padding: 6px;
	overflow-y: auto;
	flex: 1;
}
.demo-events__empty {
	padding: 16px 8px;
	text-align: center;
	color: #475569;
	font-size: 0.72rem;
}
.demo-events__item {
	display: flex;
	flex-direction: column;
	gap: 2px;
	padding: 7px 8px;
	border-radius: 6px;
	background: #1a1d2a;
	margin-bottom: 4px;
}
.demo-events__name {
	font-size: 0.72rem;
	font-weight: 600;
	color: #6ee7b7;
}
.demo-events__payload {
	font-size: 0.64rem;
	color: #94a3b8;
	word-break: break-all;
}

/* Per-plugin panel */
.demo-panel {
	border-bottom: 1px solid #1e2130;
	padding: 8px 6px 10px;
}
.demo-panel__title {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 4px 6px 8px;
	font-size: 0.64rem;
	color: #94a3b8;
}
.demo-panel__title code {
	color: #a5b4fc;
	font-size: 0.62rem;
}
.demo-panel__dot {
	width: 7px;
	height: 7px;
	border-radius: 50%;
	flex-shrink: 0;
}
.demo-panel__dot--count {
	background: #fb923c;
}
.demo-panel__dot--events {
	background: #34d399;
}

/* Click counts (plugin 2) */
.demo-counts {
	list-style: none;
	margin: 0;
	padding: 0 6px;
}
.demo-counts__item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 6px 8px;
	border-radius: 6px;
	background: #1a1d2a;
	margin-bottom: 4px;
}
.demo-counts__key {
	font-size: 0.72rem;
	color: #e2e8f0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.demo-counts__badge {
	flex-shrink: 0;
	min-width: 22px;
	text-align: center;
	padding: 1px 7px;
	border-radius: 10px;
	background: rgba(251, 146, 60, 0.18);
	color: #fdba74;
	font-size: 0.68rem;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
}
</style>
