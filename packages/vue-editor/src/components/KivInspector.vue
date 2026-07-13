<script setup lang="ts">
import type {
	Breakpoint,
	FieldDescriptor,
	KivNode,
	Registry,
} from "@kivcode/engine";
import { computed, inject, ref, watch } from "vue";
import { useResizablePanel } from "../composables/useResizablePanel";
import FieldControl from "../inspector/FieldControl.vue";
import { EDITOR_EXTENSIONS_KEY, EDITOR_STORE_KEY } from "../store/context";
import { getNodeLabel } from "../utils/node-labels";
import { mergeResponsiveValue } from "../utils/responsive-value";
import { isHiddenAtBreakpoint } from "../utils/visibility";

const props = defineProps<{ registry: Registry }>();
const store = inject(EDITOR_STORE_KEY);
const extensions = inject(EDITOR_EXTENSIONS_KEY, null);

const { width, startResize } = useResizablePanel({
	storageKey: "kiv-editor:inspector-width",
	defaultWidth: 260,
	min: 240,
	max: 480,
	edge: "left",
});

const pluginTabNames = ref<string[]>([]);
const activePluginTab = ref<string | null>(null);

// Keep the list of plugin tab names in sync as plugins register (typically
// from onEditorReady, which fires after this component's first render) —
// watching `.size` (not the Map reference itself, which never changes)
// is what actually establishes a reactive dependency on additions/removals.
watch(
	() => extensions?.getInspectorTabs().size,
	() => {
		const tabs = extensions?.getInspectorTabs();
		if (tabs) pluginTabNames.value = Array.from(tabs.keys());
	},
	{ immediate: true },
);

// ── Editable node ID ────────────────────────────────────────────────────────
const idDraft = ref("");

// Keep the draft in sync with the selected node
watch(
	() => store?.selected.value?.id,
	(id) => {
		idDraft.value = id ?? "";
	},
	{ immediate: true },
);

// Validation message for the current draft (null = valid)
const idError = computed<string | null>(() => {
	const current = store?.selected.value?.id;
	const draft = idDraft.value.trim();
	if (!current) return null;
	if (draft === current) return null;
	if (!draft) return "ID cannot be empty";
	if (!/^[a-zA-Z][\w-]*$/.test(draft))
		return "Use letters, numbers, - or _ (must start with a letter)";
	if (store && !store.canUseId(draft)) return "This ID is already in use";
	return null;
});

function commitId() {
	const current = store?.selected.value?.id;
	if (!current || !store) return;
	const draft = idDraft.value.trim();
	if (draft === current) return;
	if (idError.value) {
		// Invalid — revert to the real id
		idDraft.value = current;
		return;
	}
	store.renameNode(current, draft);
}

function resetIdDraft() {
	idDraft.value = store?.selected.value?.id ?? "";
}

// Uses the same breakpoint as the canvas — changing it here also changes the canvas preview
const BP_OPTIONS: { value: Breakpoint; label: string }[] = [
	{ value: "base", label: "MB" },
	{ value: "md", label: "MD" },
	{ value: "lg", label: "LG" },
	{ value: "xl", label: "XL" },
];

const fieldBreakpoint = computed(() => store?.breakpoint.value ?? "base");
const fieldLocale = computed(() => store?.locale.value ?? "en");
const localesCount = computed(
	() => store?.document.value.i18n?.supported?.length ?? 1,
);

// A localized value in JSON looks like { $t: { en: "...", es: "..." } }
function isLocalized(v: unknown): v is { $t: Record<string, unknown> } {
	return (
		typeof v === "object" &&
		v !== null &&
		!Array.isArray(v) &&
		"$t" in (v as Record<string, unknown>)
	);
}

const GROUP_ORDER = [
	"Layout",
	"Spacing",
	"Spacing (advanced)",
	"Typography",
	"Content",
	"Background",
	"Overlay",
	"Effects",
	"Border",
	"Colors",
	"Link",
	"Style",
	"General",
];

// A fixed color per group, consistent across every node type — lets a
// collapsed group stay recognizable by color alone once a document has
// several field groups stacked in a narrow panel.
const GROUP_COLORS: Record<string, string> = {
	Layout: "#94a3b8",
	Spacing: "#34d399",
	"Spacing (advanced)": "#34d399",
	Typography: "#38bdf8",
	Content: "#818cf8",
	Background: "#fb923c",
	Overlay: "#fb923c",
	Effects: "#fbbf24",
	Border: "#a78bfa",
	Colors: "#f472b6",
	Link: "#60a5fa",
	Style: "#2dd4bf",
	General: "#64748b",
};
const DEFAULT_GROUP_COLOR = "#64748b";

function groupColor(name: string): string {
	return GROUP_COLORS[name] ?? DEFAULT_GROUP_COLOR;
}

interface GroupedField {
	key: string;
	descriptor: FieldDescriptor;
}

// Evaluates a field's showIf condition against the node's current props.
// Returns true (visible) when there's no condition or it matches.
function isFieldVisible(node: KivNode, descriptor: FieldDescriptor): boolean {
	const cond = descriptor.showIf;
	if (!cond) return true;
	const current = node.props[cond.field];
	const expected = Array.isArray(cond.equals) ? cond.equals : [cond.equals];
	return expected.includes(String(current ?? ""));
}

// ── Multi-select ────────────────────────────────────────────────────────────
const isMulti = computed(() => (store?.selectedNodes.value.length ?? 0) > 1);

/** The node whose values/fields drive the panel: the single selection, or — when
 * every selected node shares a type — the first of the multi-selection. */
const activeNode = computed<KivNode | null>(() => {
	const nodes = store?.selectedNodes.value ?? [];
	if (nodes.length === 0) return null;
	const first = nodes[0];
	if (!first) return null;
	if (nodes.length === 1) return first;
	return nodes.every((n) => n.type === first.type) ? first : null;
});

const targetIds = computed<string[]>(
	() => store?.selectedNodes.value.map((n) => n.id) ?? [],
);

function applyPatch(patch: Record<string, unknown>) {
	if (!store) return;
	const ids = targetIds.value;
	const first = ids[0];
	if (!first) return;
	if (ids.length > 1) store.updatePropsMany(ids, patch);
	else store.updateProps(first, patch);
}

function toggleLockedAll() {
	if (!store) return;
	const nodes = store.selectedNodes.value;
	const allLocked = nodes.every((n) => n.locked === true);
	store.startBatch();
	for (const n of nodes) store.setLocked(n.id, !allLocked);
	store.endBatch();
}

const groupedFields = computed(() => {
	const node = activeNode.value;
	if (!node || !props.registry.has(node.type)) return [];

	const compiled = props.registry.get(node.type);
	if (!compiled) return [];
	const groups = new Map<string, GroupedField[]>();

	for (const [key, descriptor] of Object.entries(compiled.fields)) {
		if (!isFieldVisible(node, descriptor)) continue; // respect showIf
		const g = descriptor.group ?? "General";
		if (!groups.has(g)) groups.set(g, []);
		groups.get(g)?.push({ key, descriptor });
	}

	// Known groups render in GROUP_ORDER's curated order; any group name a
	// node uses that isn't in that list (a new/custom category) still renders
	// — appended at the end, in first-seen order — instead of silently
	// vanishing from the Inspector. Missing entirely looks identical to "no
	// such field exists," which is much harder to notice than a
	// slightly-out-of-place section.
	const known = GROUP_ORDER.filter((g) => groups.has(g));
	const unknown = [...groups.keys()].filter((g) => !GROUP_ORDER.includes(g));
	return [...known, ...unknown].map((g) => ({
		name: g,
		fields: groups.get(g) ?? [],
	}));
});

// Returns the effective prop value for a field at the active breakpoint.
// Always extracts the per-breakpoint value even when in "base" mode,
// because the stored value may already be a responsive object.
function getFieldValue(fieldKey: string, descriptor: FieldDescriptor): unknown {
	const node = activeNode.value;
	if (!node) return undefined;
	let raw = node.props[fieldKey];
	// Localized field: unwrap the active locale (with fallback to first available)
	if (descriptor.localizable && isLocalized(raw)) {
		const t = raw.$t;
		raw = fieldLocale.value in t ? t[fieldLocale.value] : Object.values(t)[0];
	}
	if (!descriptor.responsive) return raw;
	// If already a responsive object, extract the value for the active breakpoint
	if (raw && typeof raw === "object" && !Array.isArray(raw)) {
		const obj = raw as Record<string, unknown>;
		const bp = fieldBreakpoint.value;
		// Mobile-first cascade: walk down from requested breakpoint to base
		const ORDER = ["base", "sm", "md", "lg", "xl"] as const;
		const target = ORDER.indexOf(bp as (typeof ORDER)[number]);
		for (let i = target; i >= 0; i--) {
			const key = ORDER[i];
			if (key && key in obj && obj[key] !== undefined) return obj[key];
		}
		return undefined;
	}
	// Flat value — return as-is (only set on base)
	return raw;
}

function updateFieldValue(
	fieldKey: string,
	descriptor: FieldDescriptor,
	value: unknown,
) {
	const node = activeNode.value;
	if (!node || !store) return;

	// Localized field: write into the active locale, preserving other locales.
	// Only wrap in $t when the document actually supports multiple locales.
	if (descriptor.localizable) {
		const supported = store.document.value.i18n?.supported ?? [];
		const existing = node.props[fieldKey];
		if (supported.length > 1) {
			const t: Record<string, unknown> = isLocalized(existing)
				? { ...existing.$t }
				: {};
			t[fieldLocale.value] = value;
			applyPatch({ [fieldKey]: { $t: t } });
			return;
		}
		// Single-locale doc — store as a plain value
		applyPatch({ [fieldKey]: value });
		return;
	}

	if (!descriptor.responsive) {
		applyPatch({ [fieldKey]: value });
		return;
	}
	// Always merge into responsive object to preserve other breakpoints
	const merged = mergeResponsiveValue(
		node.props[fieldKey],
		fieldBreakpoint.value,
		value,
	);
	applyPatch({ [fieldKey]: merged });
}

const hasResponsiveFields = computed(() =>
	groupedFields.value.some((g) =>
		g.fields.some((f) => f.descriptor.responsive),
	),
);

// ── Locked / visible toggles ────────────────────────────────────────────────
const isNodeLocked = computed(() => store?.selected.value?.locked === true);

const isNodeHiddenHere = computed(() =>
	isHiddenAtBreakpoint(store?.selected.value?.visible, fieldBreakpoint.value),
);

function toggleLocked() {
	const node = store?.selected.value;
	if (!node || !store) return;
	store.setLocked(node.id, !isNodeLocked.value);
}

function toggleVisible() {
	const node = store?.selected.value;
	if (!node || !store) return;
	store.setVisible(node.id, isNodeHiddenHere.value);
}
</script>

<template>
	<aside class="kiv-inspector" :style="{ width: `${width}px`, minWidth: `${width}px` }">
		<div class="kiv-inspector__resize-handle" @mousedown="startResize" />
		<div class="kiv-inspector__header">Inspector</div>

		<div v-if="!store?.selectedNodes.value.length" class="kiv-inspector__empty">
			<div class="kiv-inspector__empty-icon">
				<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<rect x="3" y="3" width="18" height="18" rx="2"/>
					<path d="M3 9h18M9 21V9"/>
				</svg>
			</div>
			<p>Select a node to inspect</p>
		</div>

		<div v-else-if="isMulti" class="kiv-inspector__fields">
			<div class="kiv-inspector__node-header">
				<span class="kiv-inspector__node-badge">Multiple selected ({{ store?.selectedNodes.value.length }})</span>
				<div class="kiv-inspector__node-actions">
					<button
						type="button"
						class="kiv-inspector__action-btn"
						title="Lock/unlock all selected"
						@click="toggleLockedAll"
					>
						<svg width="13" height="13" viewBox="0 0 13 13" fill="none">
							<rect x="3" y="6" width="7" height="5.5" rx="1.2" stroke="currentColor" stroke-width="1.2"/>
							<path d="M4.5 6V4.2a2 2 0 0 1 4 0V6" stroke="currentColor" stroke-width="1.2"/>
						</svg>
					</button>
					<button
						type="button"
						class="kiv-inspector__action-btn kiv-inspector__action-btn--danger"
						title="Delete all selected"
						@click="store?.removeMany(targetIds)"
					>
						<svg width="13" height="13" viewBox="0 0 13 13" fill="none">
							<path d="M2 3.5h9M5 3.5V2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M10 3.5l-.7 7a1 1 0 0 1-1 .9H4.7a1 1 0 0 1-1-.9L3 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M5.5 6v3M7.5 6v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
						</svg>
					</button>
				</div>
			</div>

			<div v-if="!activeNode" class="kiv-inspector__empty">
				<p>Select nodes of the same type to edit shared fields together.</p>
			</div>
			<template v-else>
				<div v-if="hasResponsiveFields" class="kiv-inspector__responsive">
					<span class="kiv-inspector__responsive-label">Breakpoint</span>
					<div class="kiv-inspector__responsive-tabs">
						<button
							v-for="bp in BP_OPTIONS"
							:key="bp.value"
							type="button"
							class="kiv-inspector__responsive-tab"
							:class="{ active: fieldBreakpoint === bp.value }"
							@click="store?.setBreakpoint(bp.value)"
						>{{ bp.label }}</button>
					</div>
				</div>
				<div class="kiv-inspector__groups">
					<details
						v-for="group in groupedFields"
						:key="group.name"
						class="kiv-inspector__group"
						open
					>
						<summary class="kiv-inspector__group-title">
							<svg class="kiv-inspector__chevron" width="10" height="10" viewBox="0 0 10 10" fill="none">
								<path d="M3 2l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
							<span class="kiv-inspector__group-dot" :style="{ background: groupColor(group.name) }" />
							{{ group.name }}
						</summary>
						<div class="kiv-inspector__group-fields">
							<FieldControl
								v-for="field in group.fields"
								:key="`${field.key}-${fieldBreakpoint}-${fieldLocale}`"
								:field-key="field.key"
								:descriptor="field.descriptor"
								:model-value="getFieldValue(field.key, field.descriptor)"
								:breakpoint="field.descriptor.responsive ? fieldBreakpoint : undefined"
								:locale="field.descriptor.localizable && localesCount > 1 ? fieldLocale : undefined"
								@update:model-value="updateFieldValue(field.key, field.descriptor, $event)"
							/>
						</div>
					</details>
				</div>
			</template>
		</div>

		<template v-else-if="store?.selected.value">
			<!-- Node header: type badge + actions -->
			<div class="kiv-inspector__node-header">
				<span class="kiv-inspector__node-badge">{{ getNodeLabel(store.selected.value.type, store.registry) }}</span>
				<div class="kiv-inspector__node-actions">
					<button
						type="button"
						class="kiv-inspector__action-btn"
						:class="{ 'kiv-inspector__action-btn--active': isNodeLocked }"
						:title="isNodeLocked ? 'Unlock node' : 'Lock node'"
						@click="toggleLocked"
					>
						<svg v-if="isNodeLocked" width="13" height="13" viewBox="0 0 13 13" fill="none">
							<rect x="3" y="6" width="7" height="5.5" rx="1.2" stroke="currentColor" stroke-width="1.2"/>
							<path d="M4.5 6V4.2a2 2 0 0 1 4 0V6" stroke="currentColor" stroke-width="1.2"/>
						</svg>
						<svg v-else width="13" height="13" viewBox="0 0 13 13" fill="none">
							<rect x="3" y="6" width="7" height="5.5" rx="1.2" stroke="currentColor" stroke-width="1.2"/>
							<path d="M4.5 6V4.2a2 2 0 0 1 3.8-.9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
						</svg>
					</button>
					<button
						type="button"
						class="kiv-inspector__action-btn"
						:class="{ 'kiv-inspector__action-btn--active': isNodeHiddenHere }"
						:title="isNodeHiddenHere ? 'Show at this breakpoint' : 'Hide at this breakpoint'"
						@click="toggleVisible"
					>
						<svg v-if="isNodeHiddenHere" width="13" height="13" viewBox="0 0 13 13" fill="none">
							<path d="M1.5 6.5S3.8 2.5 6.5 2.5s5 4 5 4-2.3 4-5 4-5-4-5-4Z" stroke="currentColor" stroke-width="1.1"/>
							<line x1="2" y1="11" x2="11" y2="2" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
						</svg>
						<svg v-else width="13" height="13" viewBox="0 0 13 13" fill="none">
							<path d="M1.5 6.5S3.8 2.5 6.5 2.5s5 4 5 4-2.3 4-5 4-5-4-5-4Z" stroke="currentColor" stroke-width="1.1"/>
							<circle cx="6.5" cy="6.5" r="1.6" stroke="currentColor" stroke-width="1.1"/>
						</svg>
					</button>
					<button
						type="button"
						class="kiv-inspector__action-btn"
						title="Duplicate node (⌘D)"
						@click="store.duplicateNode(store.selected.value.id)"
					>
						<svg width="13" height="13" viewBox="0 0 13 13" fill="none">
							<rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
							<path d="M1 9V2a1 1 0 0 1 1-1h7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
						</svg>
					</button>
					<button
						type="button"
						class="kiv-inspector__action-btn kiv-inspector__action-btn--danger"
						title="Delete node (⌫)"
						@click="store.removeNode(store.selected.value.id)"
					>
						<svg width="13" height="13" viewBox="0 0 13 13" fill="none">
							<path d="M2 3.5h9M5 3.5V2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M10 3.5l-.7 7a1 1 0 0 1-1 .9H4.7a1 1 0 0 1-1-.9L3 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M5.5 6v3M7.5 6v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
						</svg>
					</button>
				</div>
			</div>

			<!-- Plugin inspector tabs -->
			<div v-if="pluginTabNames.length > 0" class="kiv-inspector__tabs">
				<button
					v-for="tabName in pluginTabNames"
					:key="tabName"
					type="button"
					class="kiv-inspector__tab"
					:class="{ 'kiv-inspector__tab--active': activePluginTab === tabName }"
					@click="activePluginTab = activePluginTab === tabName ? null : tabName"
				>{{ tabName }}</button>
			</div>

			<!-- Plugin tab content -->
			<div
				v-if="activePluginTab && extensions"
				class="kiv-inspector__plugin-tab"
			>
				<component
					:is="extensions.getInspectorTabs().get(activePluginTab)?.component"
					:node="store?.selected.value"
					:store="store"
				/>
			</div>

			<div v-if="!activePluginTab" class="kiv-inspector__fields">
				<!-- Editable node ID -->
				<div class="kiv-inspector__id-row">
					<label class="kiv-inspector__id-label">ID</label>
					<div class="kiv-inspector__id-field" :class="{ 'kiv-inspector__id-field--error': idError }">
						<span class="kiv-inspector__id-hash">#</span>
						<input
							:key="store.selected.value.id"
							v-model="idDraft"
							type="text"
							class="kiv-inspector__id-input"
							spellcheck="false"
							autocomplete="off"
							@keydown.enter="commitId"
							@keydown.esc="resetIdDraft"
							@blur="commitId"
						/>
					</div>
				</div>
				<div v-if="idError" class="kiv-inspector__id-hint kiv-inspector__id-hint--error">
					{{ idError }}
				</div>

				<!-- Responsive breakpoint mini-switcher (only when node has responsive fields) -->
				<div v-if="hasResponsiveFields" class="kiv-inspector__responsive">
					<span class="kiv-inspector__responsive-label">Breakpoint</span>
					<div class="kiv-inspector__responsive-tabs">
						<button
							v-for="bp in BP_OPTIONS"
							:key="bp.value"
							type="button"
							class="kiv-inspector__responsive-tab"
							:class="{ active: fieldBreakpoint === bp.value }"
							@click="store?.setBreakpoint(bp.value)"
						>{{ bp.label }}</button>
					</div>
				</div>

				<div class="kiv-inspector__groups">
					<details
						v-for="group in groupedFields"
						:key="group.name"
						class="kiv-inspector__group"
						open
					>
						<summary class="kiv-inspector__group-title">
							<svg class="kiv-inspector__chevron" width="10" height="10" viewBox="0 0 10 10" fill="none">
								<path d="M3 2l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
							<span class="kiv-inspector__group-dot" :style="{ background: groupColor(group.name) }" />
							{{ group.name }}
						</summary>
						<div class="kiv-inspector__group-fields">
							<FieldControl
								v-for="field in group.fields"
								:key="`${field.key}-${fieldBreakpoint}-${fieldLocale}`"
								:field-key="field.key"
								:descriptor="field.descriptor"
								:model-value="getFieldValue(field.key, field.descriptor)"
								:breakpoint="field.descriptor.responsive ? fieldBreakpoint : undefined"
								:locale="field.descriptor.localizable && localesCount > 1 ? fieldLocale : undefined"
								@update:model-value="updateFieldValue(field.key, field.descriptor, $event)"
							/>
						</div>
					</details>
				</div>
			</div>
		</template>
	</aside>
</template>

<style scoped>
.kiv-inspector {
	position: relative;
	flex-shrink: 0;
	border-left: 1px solid var(--color-border);
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background: var(--color-surface-raised);
	color: var(--color-text-primary);
}
.kiv-inspector__resize-handle {
	position: absolute;
	top: 0;
	left: -3px;
	bottom: 0;
	width: 6px;
	cursor: col-resize;
	z-index: 5;
}
.kiv-inspector__resize-handle::after {
	content: "";
	position: absolute;
	top: 0;
	bottom: 0;
	right: 2px;
	width: 2px;
	border-radius: 1px;
	background: transparent;
	transition: background 0.12s;
}
.kiv-inspector__resize-handle:hover::after {
	background: var(--color-accent);
}
.kiv-inspector__header {
	padding: 8px 12px;
	font-size: 0.65rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	color: var(--color-text-secondary);
	border-bottom: 1px solid var(--color-border);
	background: var(--color-surface-raised);
}
.kiv-inspector__empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10px;
	padding: 40px 16px;
	color: var(--color-text-muted);
	font-size: 0.78rem;
	text-align: center;
}
.kiv-inspector__empty-icon { color: var(--color-border); }
.kiv-inspector__empty p { margin: 0; }

.kiv-inspector__node-header {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 7px 10px;
	border-bottom: 1px solid var(--color-border);
	background: var(--color-surface-raised);
}
.kiv-inspector__node-badge {
	display: inline-block;
	padding: 2px 8px;
	background: var(--color-accent-muted);
	color: var(--color-accent-light);
	border-radius: 4px;
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.02em;
	flex-shrink: 0;
}
.kiv-inspector__node-actions {
	display: flex;
	align-items: center;
	gap: 2px;
	flex-shrink: 0;
	margin-left: auto;
}

/* Editable node ID */
.kiv-inspector__id-row {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 10px;
	border-bottom: 1px solid var(--color-border);
	background: var(--color-surface-raised);
}
.kiv-inspector__id-label {
	font-size: 0.62rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--color-text-muted);
	flex-shrink: 0;
}
.kiv-inspector__id-field {
	display: flex;
	align-items: center;
	flex: 1;
	min-width: 0;
	background: var(--color-surface-sunken);
	border: 1px solid var(--color-border);
	border-radius: 6px;
	padding: 0 8px;
	transition: border-color 0.12s;
}
.kiv-inspector__id-field:focus-within {
	border-color: var(--color-accent);
}
.kiv-inspector__id-field--error,
.kiv-inspector__id-field--error:focus-within {
	border-color: var(--color-danger);
}
.kiv-inspector__id-hash {
	color: var(--color-text-muted);
	font-size: 0.75rem;
	flex-shrink: 0;
}
.kiv-inspector__id-input {
	flex: 1;
	min-width: 0;
	border: none;
	background: transparent;
	color: var(--color-text-primary);
	font-size: 0.75rem;
	font-family: var(--font-mono, monospace);
	padding: 6px 4px;
	outline: none;
}
.kiv-inspector__id-hint {
	padding: 4px 10px 6px;
	font-size: 0.64rem;
	background: var(--color-surface-raised);
	border-bottom: 1px solid var(--color-border);
}
.kiv-inspector__id-hint--error {
	color: var(--color-danger);
}
.kiv-inspector__action-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border: none;
	border-radius: 5px;
	background: transparent;
	color: var(--color-text-muted);
	cursor: pointer;
	transition: background 0.1s, color 0.1s;
}
.kiv-inspector__action-btn:hover {
	background: var(--color-surface-overlay);
	color: var(--color-text-primary);
}
.kiv-inspector__action-btn--danger:hover {
	background: rgba(239, 68, 68, 0.15);
	color: var(--color-danger);
}
.kiv-inspector__action-btn--active {
	background: var(--color-accent-muted);
	color: var(--color-accent-light);
}

/* Responsive mini-switcher */
.kiv-inspector__responsive {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 6px 10px;
	border-bottom: 1px solid var(--color-border);
	background: var(--color-surface-raised);
}
.kiv-inspector__responsive-label {
	font-size: 0.65rem;
	color: var(--color-text-muted);
	flex-shrink: 0;
}
.kiv-inspector__responsive-tabs {
	display: flex;
	gap: 2px;
	background: var(--color-surface-base);
	border: 1px solid var(--color-border);
	border-radius: 5px;
	padding: 2px;
}
.kiv-inspector__responsive-tab {
	padding: 2px 7px;
	font-size: 0.62rem;
	font-weight: 600;
	font-family: inherit;
	border: none;
	border-radius: 3px;
	background: transparent;
	color: var(--color-text-muted);
	cursor: pointer;
	transition: background 0.1s, color 0.1s;
}
.kiv-inspector__responsive-tab:hover { color: var(--color-text-secondary); }
.kiv-inspector__responsive-tab.active {
	background: var(--color-accent-muted);
	color: var(--color-accent-light);
}

.kiv-inspector__fields {
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
}
.kiv-inspector__groups {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
}
.kiv-inspector__groups::-webkit-scrollbar { width: 3px; }
.kiv-inspector__groups::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 2px; }

.kiv-inspector__group {
	border-bottom: 1px solid var(--color-surface-overlay);
}
.kiv-inspector__group-title {
	padding: 6px 12px;
	font-size: 0.65rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--color-text-secondary);
	cursor: pointer;
	user-select: none;
	background: var(--color-surface-raised);
	list-style: none;
	display: flex;
	align-items: center;
	gap: 6px;
	transition: color 0.1s;
}
.kiv-inspector__group-title:hover { color: var(--color-text-primary); }
.kiv-inspector__group-title::-webkit-details-marker { display: none; }

.kiv-inspector__chevron {
	flex-shrink: 0;
	color: var(--color-border);
	transition: transform 0.15s;
}
details[open] .kiv-inspector__chevron {
	transform: rotate(90deg);
}
.kiv-inspector__group-dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	flex-shrink: 0;
}

.kiv-inspector__group-fields {
	padding: 10px 12px;
	display: flex;
	flex-direction: column;
	gap: 10px;
}
</style>
