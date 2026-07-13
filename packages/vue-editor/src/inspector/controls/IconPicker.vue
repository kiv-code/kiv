<script setup lang="ts">
import type { FieldDescriptor } from "@kivcode/engine";
import {
	getIconSets,
	type IconSet,
	type ResolvedIcon,
	resolveIconInfo,
} from "@kivcode/nodes";
import { computed, inject, ref } from "vue";
import { EDITOR_STORE_KEY } from "../../store/context";

const INITIAL_LIMIT = 200;

// `modelValue` is undefined whenever a node was created before the `icon`
// field existed, or simply never had it set — very common, since most
// buttons have no icon. Defaulting it here means every other reference in
// this file can safely assume a string, instead of crashing setup() the
// moment such a node is selected (an uncaught error here takes down the
// whole Inspector panel, not just this control).
const props = withDefaults(
	defineProps<{
		modelValue?: string;
		descriptor?: FieldDescriptor;
	}>(),
	{ modelValue: "" },
);

const emit = defineEmits<{
	"update:modelValue": [value: string];
}>();

const store = inject(EDITOR_STORE_KEY, null);
const iconSets = getIconSets();
const activeSet = ref<IconSet>(
	findSetForValue(props.modelValue) ?? (iconSets[0] as IconSet),
);
const search = ref("");
const showCustom = ref(props.modelValue.trim().startsWith("<svg"));
const showAll = ref(false);

const svgCache = new Map<string, string>();

function getSvg(key: string): string {
	let svg = svgCache.get(key);
	if (svg === undefined) {
		const info = resolveIconInfo(key);
		svg = info?.svg ?? "";
		svgCache.set(key, svg);
	}
	return svg;
}

const allNames = computed(() => {
	const set = activeSet.value;
	const keys = Object.keys(set.data.icons ?? {});
	return keys;
});

const filteredNames = computed(() => {
	if (showCustom.value) return [];
	const q = search.value.toLowerCase().trim();
	if (!q) return allNames.value;
	return allNames.value.filter((name) => name.toLowerCase().includes(q));
});

const visibleNames = computed(() => {
	if (showAll.value) return filteredNames.value;
	return filteredNames.value.slice(0, INITIAL_LIMIT);
});

const hasMore = computed(
	() => !showAll.value && filteredNames.value.length > INITIAL_LIMIT,
);
const totalCount = computed(() => filteredNames.value.length);

const selectedInfo = computed(() => {
	if (showCustom.value || !props.modelValue) return null;
	if (props.modelValue.trim().startsWith("<svg")) return null;
	return resolveIconInfo(props.modelValue);
});

function findSetForValue(value: string): IconSet | undefined {
	if (!value || value.startsWith("<svg")) return undefined;
	const colonIdx = value.indexOf(":");
	if (colonIdx > 0) {
		return iconSets.find((s) => s.prefix === value.slice(0, colonIdx));
	}
	for (const set of iconSets) {
		if (set.data.icons?.[value]) return set;
	}
	return undefined;
}

function selectIconName(name: string) {
	showCustom.value = false;
	emit("update:modelValue", `${activeSet.value.prefix}:${name}`);
}

function switchTab(set: IconSet) {
	activeSet.value = set;
	showCustom.value = false;
	search.value = "";
	showAll.value = false;
	if (!props.modelValue || props.modelValue.startsWith("<svg")) {
		emit("update:modelValue", "");
	}
}

function switchToCustom() {
	showCustom.value = true;
	emit("update:modelValue", "<svg>\n\n</svg>");
}

function resetSearch() {
	search.value = "";
	showAll.value = false;
}

// ── Embedded size + color (read from the selected node's props) ──
const selectedNode = computed(() => store?.selected.value);
const iconSize = computed(() => {
	const v = selectedNode.value?.props?.iconSize;
	if (typeof v === "number") return v;
	return 16;
});
const iconColor = computed(() => {
	const v = selectedNode.value?.props?.iconColor;
	if (typeof v === "string" && v) return v;
	return "";
});
function setIconSize(px: number) {
	if (!store || !selectedNode.value) return;
	store.updateProps(selectedNode.value.id, { iconSize: px });
}
function setIconColor(color: string) {
	if (!store || !selectedNode.value) return;
	store.updateProps(selectedNode.value.id, { iconColor: color });
}
</script>

<template>
	<div class="kiv-icon-picker">
		<div class="kiv-icon-picker__tabs">
			<button
				v-for="set in iconSets"
				:key="set.prefix"
				type="button"
				class="kiv-icon-picker__tab"
				:class="{
					'kiv-icon-picker__tab--active': !showCustom && activeSet.prefix === set.prefix,
				}"
				@click="switchTab(set)"
			>
				{{ set.label }}
			</button>
			<button
				type="button"
				class="kiv-icon-picker__tab"
				:class="{ 'kiv-icon-picker__tab--active': showCustom }"
				@click="switchToCustom"
			>
				Custom
			</button>
		</div>

		<template v-if="!showCustom">
			<div class="kiv-icon-picker__search">
				<input
					v-model="search"
					type="text"
					class="kiv-icon-picker__search-input"
					placeholder="Search icons…"
				/>
			</div>

			<div v-if="selectedInfo" class="kiv-icon-picker__active-preview">
				<span
					class="kiv-icon-picker__preview-icon"
					v-html="selectedInfo.svg"
				/>
				<span class="kiv-icon-picker__active-name">{{ modelValue }}</span>
				<button
					type="button"
					class="kiv-icon-picker__clear"
					@click="emit('update:modelValue', '')"
				>
					&times;
				</button>
			</div>

			<div class="kiv-icon-picker__grid">
				<button
					v-for="name in visibleNames"
					:key="`${activeSet.prefix}:${name}`"
					type="button"
					class="kiv-icon-picker__item"
					:class="{
						'kiv-icon-picker__item--active':
							modelValue === `${activeSet.prefix}:${name}`,
					}"
					:title="name"
					v-html="getSvg(`${activeSet.prefix}:${name}`)"
					@click="selectIconName(name)"
				/>
				<button
					v-if="hasMore"
					type="button"
					class="kiv-icon-picker__show-all"
					@click="showAll = true"
				>
					Show all {{ totalCount }} icons
				</button>
				<div v-if="!visibleNames.length" class="kiv-icon-picker__empty">
					No icons match "{{ search }}"
				</div>
			</div>

			<!-- Embedded icon size + color controls -->
			<div class="kiv-icon-picker__extra">
				<div class="kiv-icon-picker__extra-row">
					<label class="kiv-icon-picker__extra-label">Size</label>
					<div class="kiv-icon-picker__size-wrap">
						<input
							type="range"
							class="kiv-icon-picker__size-slider"
							:value="iconSize"
							min="8"
							max="128"
							step="1"
							@input="setIconSize(Number(($event.target as HTMLInputElement).value))"
						/>
						<input
							type="number"
							class="kiv-icon-picker__size-input"
							:value="iconSize"
							min="8"
							max="128"
							@input="setIconSize(Number(($event.target as HTMLInputElement).value))"
						/>
					</div>
				</div>
				<div class="kiv-icon-picker__extra-row">
					<label class="kiv-icon-picker__extra-label">Color</label>
					<input
						type="color"
						class="kiv-icon-picker__color-input"
						:value="iconColor || '#000000'"
						@input="setIconColor(($event.target as HTMLInputElement).value)"
					/>
					<input
						type="text"
						class="kiv-icon-picker__color-text"
						:value="iconColor"
						placeholder="inherit"
						@input="setIconColor(($event.target as HTMLInputElement).value)"
					/>
				</div>
			</div>
		</template>

		<textarea
			v-else
			:value="modelValue"
			class="kiv-icon-picker__custom-input"
			placeholder="Paste SVG markup"
			rows="4"
			@input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
		/>
	</div>
</template>

<style scoped>
.kiv-icon-picker {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.kiv-icon-picker__tabs {
	display: flex;
	gap: 0;
	border-radius: 5px;
	overflow: hidden;
	border: 1px solid var(--color-border);
}
.kiv-icon-picker__tab {
	flex: 1;
	padding: 4px 6px;
	font-size: 0.65rem;
	background: var(--color-surface-base);
	border: none;
	cursor: pointer;
	color: var(--color-text-muted);
	transition: background 0.1s, color 0.1s;
}
.kiv-icon-picker__tab--active {
	background: var(--color-accent-muted);
	color: var(--color-accent-light);
	font-weight: 600;
}

.kiv-icon-picker__search-input {
	width: 100%;
	padding: 5px 8px;
	background: var(--color-surface-base);
	border: 1px solid var(--color-border);
	border-radius: 5px;
	color: var(--color-text-primary);
	font-size: 0.72rem;
	font-family: inherit;
	outline: none;
	box-sizing: border-box;
}
.kiv-icon-picker__search-input:focus {
	border-color: var(--color-accent);
}
.kiv-icon-picker__search-input::placeholder {
	color: var(--color-text-muted);
}

.kiv-icon-picker__active-preview {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 6px 8px;
	background: var(--color-surface-overlay);
	border-radius: 5px;
}
.kiv-icon-picker__preview-icon {
	display: inline-flex;
	flex-shrink: 0;
	color: var(--color-text-primary);
}
.kiv-icon-picker__preview-icon :deep(svg) {
	width: 24px;
	height: 24px;
	display: block;
}
.kiv-icon-picker__active-name {
	font-size: 0.7rem;
	color: var(--color-text-secondary);
	flex: 1;
}
.kiv-icon-picker__clear {
	background: none;
	border: none;
	cursor: pointer;
	color: var(--color-text-muted);
	font-size: 1rem;
	line-height: 1;
	padding: 0 2px;
}
.kiv-icon-picker__clear:hover {
	color: var(--color-text-primary);
}

.kiv-icon-picker__grid {
	max-height: 260px;
	overflow-y: auto;
	display: flex;
	flex-wrap: wrap;
	gap: 2px;
	min-height: 0;
	flex-shrink: 0;
}
.kiv-icon-picker__grid::-webkit-scrollbar {
	width: 3px;
}
.kiv-icon-picker__grid::-webkit-scrollbar-thumb {
	background: var(--color-border);
	border-radius: 2px;
}

.kiv-icon-picker__item {
	width: 28px;
	height: 28px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	background: transparent;
	border: 1px solid transparent;
	border-radius: 4px;
	cursor: pointer;
	color: var(--color-text-secondary);
	transition: background 0.1s, border-color 0.1s, color 0.1s;
}
.kiv-icon-picker__item:hover {
	background: var(--color-surface-overlay);
	color: var(--color-text-primary);
}
.kiv-icon-picker__item--active {
	background: var(--color-accent-muted);
	border-color: var(--color-accent);
	color: var(--color-accent-light);
}

.kiv-icon-picker__show-all {
	width: 100%;
	padding: 6px 8px;
	text-align: center;
	font-size: 0.7rem;
	background: var(--color-surface-overlay);
	border: 1px dashed var(--color-border);
	border-radius: 5px;
	color: var(--color-accent);
	cursor: pointer;
	font-family: inherit;
	transition: background 0.1s;
}
.kiv-icon-picker__show-all:hover {
	background: var(--color-accent-muted);
}

.kiv-icon-picker__item :deep(svg) {
	width: 16px;
	height: 16px;
	display: block;
}

.kiv-icon-picker__empty {
	padding: 20px 8px;
	text-align: center;
	font-size: 0.7rem;
	color: var(--color-text-muted);
	width: 100%;
}

/* ── Embedded size + color ── */
.kiv-icon-picker__extra {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding-top: 2px;
	border-top: 1px solid var(--color-border);
}
.kiv-icon-picker__extra-row {
	display: flex;
	align-items: center;
	gap: 8px;
}
.kiv-icon-picker__extra-label {
	font-size: 0.6rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: var(--color-text-muted);
	flex-shrink: 0;
	width: 34px;
}
.kiv-icon-picker__size-wrap {
	display: flex;
	align-items: center;
	gap: 6px;
	flex: 1;
}
.kiv-icon-picker__size-slider {
	flex: 1;
	accent-color: var(--color-accent);
	height: 4px;
	cursor: pointer;
}
.kiv-icon-picker__size-input {
	width: 48px;
	padding: 3px 4px;
	background: var(--color-surface-base);
	border: 1px solid var(--color-border);
	border-radius: 4px;
	color: var(--color-text-primary);
	font-size: 0.72rem;
	font-family: inherit;
	text-align: center;
	outline: none;
	box-sizing: border-box;
}
.kiv-icon-picker__size-input:focus {
	border-color: var(--color-accent);
}
.kiv-icon-picker__color-input {
	width: 28px;
	height: 28px;
	padding: 0;
	border: 1px solid var(--color-border);
	border-radius: 4px;
	cursor: pointer;
	background: none;
	flex-shrink: 0;
}
.kiv-icon-picker__color-text {
	flex: 1;
	padding: 3px 6px;
	background: var(--color-surface-base);
	border: 1px solid var(--color-border);
	border-radius: 4px;
	color: var(--color-text-primary);
	font-size: 0.72rem;
	font-family: inherit;
	outline: none;
	box-sizing: border-box;
}
.kiv-icon-picker__color-text:focus {
	border-color: var(--color-accent);
}
.kiv-icon-picker__color-text::placeholder {
	color: var(--color-text-muted);
}

.kiv-icon-picker__custom-input {
	width: 100%;
	padding: 6px 8px;
	background: var(--color-surface-base);
	border: 1px solid var(--color-border);
	border-radius: 5px;
	color: var(--color-text-primary);
	font-size: 0.75rem;
	font-family: monospace;
	resize: vertical;
	outline: none;
	box-sizing: border-box;
}
.kiv-icon-picker__custom-input:focus {
	border-color: var(--color-accent);
}
</style>
