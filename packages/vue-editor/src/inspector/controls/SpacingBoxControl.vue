<script setup lang="ts">
import type { FieldDescriptor } from "@kivcode/engine";
import type { SpacingBoxValue } from "@kivcode/nodes";
import { normalizeSpacingBox } from "@kivcode/nodes";
import { computed, ref } from "vue";

const props = defineProps<{
	modelValue?: unknown;
	descriptor?: FieldDescriptor;
}>();
const emit = defineEmits<{
	"update:modelValue": [value: SpacingBoxValue];
}>();

// Never spread `modelValue` directly — a legacy plain string (uniform value
// on all 4 sides, pre-dating this field type) would iterate as characters.
// See normalizeColorOrGradient's identical concern in color-gradient.ts.
const value = computed(() => normalizeSpacingBox(props.modelValue));

// Scale tokens offered as presets. Keeping them as the primary affordance is
// what lets this one control replace the old paddingX/paddingY selects without
// pushing every document off the design system onto arbitrary pixel values.
const tokens = computed(() =>
	Object.keys(props.descriptor?.spacingScale ?? {}),
);

const allEqual = computed(() => {
	const v = value.value;
	return v.top === v.right && v.right === v.bottom && v.bottom === v.left;
});
// Starts linked whenever the current value happens to be uniform (including
// the empty/inherit default) — unlinking is an explicit user action from there.
const linked = ref(allEqual.value);

function patch(partial: Partial<SpacingBoxValue>) {
	emit("update:modelValue", { ...value.value, ...partial });
}

function setAll(v: string) {
	patch({ top: v, right: v, bottom: v, left: v });
}

function setSide(side: keyof SpacingBoxValue, v: string) {
	patch({ [side]: v });
}

/** In per-side mode a token chip applies to whichever side is focused last. */
const activeSide = ref<keyof SpacingBoxValue>("top");

function applyToken(token: string) {
	const next =
		value.value[linked.value ? "top" : activeSide.value] === token ? "" : token;
	if (linked.value) setAll(next);
	else setSide(activeSide.value, next);
}

const currentToken = computed(
	() => value.value[linked.value ? "top" : activeSide.value],
);

const SIDES = [
	{ key: "top", label: "Top", area: "top" },
	{ key: "right", label: "Right", area: "right" },
	{ key: "bottom", label: "Bottom", area: "bottom" },
	{ key: "left", label: "Left", area: "left" },
] as const;
</script>

<template>
	<div class="kiv-spacing-box">
		<div class="kiv-spacing-box__tabs">
			<button
				type="button"
				class="kiv-spacing-box__tab"
				:class="{ 'kiv-spacing-box__tab--active': linked }"
				@click="linked = true; setAll(value.top)"
			>
				All sides
			</button>
			<button
				type="button"
				class="kiv-spacing-box__tab"
				:class="{ 'kiv-spacing-box__tab--active': !linked }"
				@click="linked = false"
			>
				Per side
			</button>
		</div>

		<!-- Scale presets. Clicking the active one clears it back to inherit. -->
		<div v-if="tokens.length" class="kiv-spacing-box__tokens">
			<button
				v-for="token in tokens"
				:key="token"
				type="button"
				class="kiv-spacing-box__token"
				:class="{ 'kiv-spacing-box__token--active': currentToken === token }"
				:title="descriptor?.spacingScale?.[token]"
				@click="applyToken(token)"
			>
				{{ token }}
			</button>
		</div>

		<div v-if="linked" class="kiv-spacing-box__row">
			<input
				type="text"
				class="kiv-input"
				:value="value.top"
				placeholder="inherit"
				@input="setAll(($event.target as HTMLInputElement).value)"
			/>
		</div>

		<div v-else class="kiv-spacing-box__grid">
			<div
				v-for="side in SIDES"
				:key="side.key"
				class="kiv-spacing-box__cell"
				:style="{ gridArea: side.area }"
			>
				<span class="kiv-spacing-box__cell-label">{{ side.label }}</span>
				<input
					type="text"
					class="kiv-input"
					:class="{ 'kiv-spacing-box__input--active': activeSide === side.key }"
					:value="value[side.key]"
					placeholder="inherit"
					@focus="activeSide = side.key"
					@input="setSide(side.key, ($event.target as HTMLInputElement).value)"
				/>
			</div>
			<div class="kiv-spacing-box__center" style="grid-area: center;" />
		</div>
	</div>
</template>

<style scoped>
.kiv-spacing-box {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.kiv-spacing-box__tabs {
	display: flex;
	gap: 0;
	border-radius: 5px;
	overflow: hidden;
	border: 1px solid var(--color-border);
}
.kiv-spacing-box__tab {
	flex: 1;
	padding: 4px 6px;
	font-size: 0.65rem;
	background: var(--color-surface-base);
	border: none;
	cursor: pointer;
	color: var(--color-text-muted);
	transition: background 0.1s, color 0.1s;
}
.kiv-spacing-box__tab--active {
	background: var(--color-accent-muted);
	color: var(--color-accent-light);
	font-weight: 600;
}

.kiv-spacing-box__tokens {
	display: flex;
	flex-wrap: wrap;
	gap: 3px;
}
.kiv-spacing-box__token {
	flex: 1 1 auto;
	min-width: 2rem;
	padding: 3px 4px;
	font-size: 0.6rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.03em;
	background: var(--color-surface-base);
	border: 1px solid var(--color-border);
	border-radius: 4px;
	cursor: pointer;
	color: var(--color-text-muted);
	transition: background 0.1s, color 0.1s, border-color 0.1s;
}
.kiv-spacing-box__token:hover {
	color: var(--color-text-primary);
	border-color: var(--color-accent);
}
.kiv-spacing-box__token--active {
	background: var(--color-accent-muted);
	border-color: var(--color-accent);
	color: var(--color-accent-light);
}

.kiv-spacing-box__row {
	display: flex;
}

.kiv-spacing-box__grid {
	display: grid;
	grid-template-columns: 1fr 1.2fr 1fr;
	grid-template-rows: auto auto auto;
	grid-template-areas:
		".    top    ."
		"left center right"
		".    bottom .";
	gap: 4px;
	align-items: center;
}
.kiv-spacing-box__cell {
	display: flex;
	flex-direction: column;
	gap: 2px;
}
.kiv-spacing-box__cell-label {
	font-size: 0.6rem;
	color: var(--color-text-muted);
	text-align: center;
}
.kiv-spacing-box__input--active {
	border-color: var(--color-accent);
}
.kiv-spacing-box__center {
	grid-area: center;
	border: 1px dashed var(--color-border);
	border-radius: 4px;
	min-height: 28px;
	background: var(--color-surface-sunken);
}
</style>
