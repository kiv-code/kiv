<script setup lang="ts">
import type {
	Breakpoint,
	FieldDescriptor,
	KivNode,
	Registry,
} from "@kiv/engine";
import { computed, inject, ref, watch } from "vue";
import FieldControl from "../inspector/FieldControl.vue";
import { EDITOR_STORE_KEY } from "../store/context";
import { getNodeLabel } from "../utils/node-labels";

const props = defineProps<{ registry: Registry }>();
const store = inject(EDITOR_STORE_KEY);

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

const groupedFields = computed(() => {
	const node = store?.selected.value;
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

	return GROUP_ORDER.filter((g) => groups.has(g)).map((g) => ({
		name: g,
		fields: groups.get(g) ?? [],
	}));
});

// Returns the effective prop value for a field at the active breakpoint.
// Always extracts the per-breakpoint value even when in "base" mode,
// because the stored value may already be a responsive object.
function getFieldValue(fieldKey: string, descriptor: FieldDescriptor): unknown {
	const node = store?.selected.value;
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
	const node = store?.selected.value;
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
			store.updateProps(node.id, { [fieldKey]: { $t: t } });
			return;
		}
		// Single-locale doc — store as a plain value
		store.updateProps(node.id, { [fieldKey]: value });
		return;
	}

	if (!descriptor.responsive) {
		store.updateProps(node.id, { [fieldKey]: value });
		return;
	}
	// Always merge into responsive object to preserve other breakpoints
	const existing = node.props[fieldKey];
	const compiled = props.registry.get(node.type);
	const schemaDefault = compiled?.fields[fieldKey]?.default;
	const current: Record<string, unknown> =
		existing && typeof existing === "object" && !Array.isArray(existing)
			? { ...(existing as Record<string, unknown>) }
			: { base: existing ?? schemaDefault };
	current[fieldBreakpoint.value] = value;
	store.updateProps(node.id, { [fieldKey]: current });
}

const hasResponsiveFields = computed(() =>
	groupedFields.value.some((g) =>
		g.fields.some((f) => f.descriptor.responsive),
	),
);
</script>

<template>
	<aside class="kiv-inspector">
		<div class="kiv-inspector__header">Inspector</div>

		<div v-if="!store?.selected.value" class="kiv-inspector__empty">
			<div class="kiv-inspector__empty-icon">
				<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<rect x="3" y="3" width="18" height="18" rx="2"/>
					<path d="M3 9h18M9 21V9"/>
				</svg>
			</div>
			<p>Select a node to inspect</p>
		</div>

		<template v-else>
			<!-- Node header: type badge + actions -->
			<div class="kiv-inspector__node-header">
				<span class="kiv-inspector__node-badge">{{ getNodeLabel(store.selected.value.type) }}</span>
				<div class="kiv-inspector__node-actions">
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
	</aside>
</template>

<style scoped>
.kiv-inspector {
	width: 260px;
	min-width: 260px;
	flex-shrink: 0;
	border-left: 1px solid var(--color-border);
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background: var(--color-surface-raised);
	color: var(--color-text-primary);
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
	background: rgba(99, 102, 241, 0.2);
	color: #a5b4fc;
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
	color: #f87171;
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

.kiv-inspector__groups {
	flex: 1;
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

.kiv-inspector__group-fields {
	padding: 10px 12px;
	display: flex;
	flex-direction: column;
	gap: 10px;
}
</style>
