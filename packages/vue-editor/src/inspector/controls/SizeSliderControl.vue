<script setup lang="ts">
import type { FieldDescriptor } from "@kivcode/engine";
import { computed, inject, ref, watch } from "vue";
import { useContinuousEdit } from "../../composables/useContinuousEdit";
import { EDITOR_STORE_KEY } from "../../store/context";

const props = defineProps<{
	modelValue?: string;
	descriptor?: FieldDescriptor;
}>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const store = inject(EDITOR_STORE_KEY, null);
const { start, end } = useContinuousEdit(store);

const DEFAULT_UNITS = [
	{ unit: "%", min: 0, max: 100, step: 1 },
	{ unit: "px", min: 0, max: 1200, step: 1 },
];

const units = computed(() => props.descriptor?.sliderUnits ?? DEFAULT_UNITS);
const allowAuto = computed(() => props.descriptor?.allowAuto === true);
const autoLabel = computed(() => props.descriptor?.autoLabel ?? "auto");

const NUMERIC = /^(-?\d*\.?\d+)\s*([a-z%]*)$/i;

function parse(value: string | undefined): { amount: number; unit: string } {
	const raw = (value ?? "").trim();
	const match = raw.match(NUMERIC);
	const fallbackUnit = units.value[0]?.unit ?? "px";
	if (!match) return { amount: 0, unit: fallbackUnit };
	const amount = Number(match[1]);
	const unit = match[2] || fallbackUnit;
	return { amount: Number.isNaN(amount) ? 0 : amount, unit };
}

// A node instance may not have this prop set at all yet (created before the
// field existed, or simply never touched) — falling back to the descriptor's
// own default for DISPLAY purposes only avoids showing a misleading "0" when
// the node is really rendering at its documented default (e.g. width 100%).
const displayValue = computed(
	() => props.modelValue ?? (props.descriptor?.default as string | undefined),
);

const raw = computed(() => (displayValue.value ?? "").trim());

/** Unset — the field contributes no declaration at all. */
const isAuto = computed(() => raw.value === "");

/**
 * A value the slider cannot represent: `calc(...)`, `clamp(...)`, or a unit the
 * field wasn't configured with. Showing it as editable text is the honest
 * option — the old control rendered it as `0`, and the first drag destroyed it.
 */
const isCustom = computed(() => {
	if (isAuto.value) return false;
	if (!NUMERIC.test(raw.value)) return true;
	// A parseable number in a unit this field wasn't configured with would be
	// driven by the wrong slider range — dragging a `3rem` value on a 0–500px
	// range writes `250rem`. Editing it as text keeps it intact.
	return !units.value.some((u) => u.unit === parse(raw.value).unit);
});

const activeUnit = ref(parse(displayValue.value).unit);
watch(displayValue, (v) => {
	const parsed = parse(v);
	if (parsed.unit !== activeUnit.value) activeUnit.value = parsed.unit;
});

const amount = computed(() => parse(displayValue.value).amount);
const unitConfig = computed(
	() => units.value.find((u) => u.unit === activeUnit.value) ?? units.value[0],
);

function commit(nextAmount: number, unit: string) {
	emit("update:modelValue", `${nextAmount}${unit}`);
}

function onSlider(e: Event) {
	start();
	commit(Number((e.target as HTMLInputElement).value), activeUnit.value);
}
function onNumber(e: Event) {
	const v = Number((e.target as HTMLInputElement).value);
	if (!Number.isNaN(v)) commit(v, activeUnit.value);
}
function onCustom(e: Event) {
	emit("update:modelValue", (e.target as HTMLInputElement).value);
}
function switchUnit(unit: string) {
	activeUnit.value = unit;
	// Coming back from auto/custom there is no number yet — seed from the
	// unit's own minimum rather than writing NaN.
	const next =
		isAuto.value || isCustom.value
			? (unitConfig.value?.min ?? 0)
			: amount.value;
	commit(next, unit);
}
function setAuto() {
	emit("update:modelValue", "");
}
</script>

<template>
	<div class="kiv-size-slider" @change="end">
		<div v-if="units.length > 1 || allowAuto" class="kiv-size-slider__units">
			<button
				v-for="u in units"
				:key="u.unit"
				type="button"
				class="kiv-size-slider__unit"
				:class="{ 'kiv-size-slider__unit--active': !isAuto && !isCustom && u.unit === activeUnit }"
				@click="switchUnit(u.unit)"
			>
				{{ u.unit }}
			</button>
			<button
				v-if="allowAuto"
				type="button"
				class="kiv-size-slider__unit"
				:class="{ 'kiv-size-slider__unit--active': isAuto }"
				@click="setAuto"
			>
				{{ autoLabel }}
			</button>
		</div>

		<!-- Unset: nothing to drag, and saying so beats showing a fake 0. -->
		<p v-if="isAuto" class="kiv-size-slider__auto">
			Not set — inherits from the layout.
		</p>

		<!-- calc(), clamp(), or a unit this field wasn't configured with. -->
		<input
			v-else-if="isCustom"
			type="text"
			class="kiv-input"
			:value="raw"
			@input="onCustom"
		/>

		<div v-else class="kiv-size-slider__row">
			<input
				type="range"
				class="kiv-size-slider__range"
				:min="unitConfig?.min ?? 0"
				:max="unitConfig?.max ?? 100"
				:step="unitConfig?.step ?? 1"
				:value="amount"
				@input="onSlider"
			/>
			<div class="kiv-size-slider__value">
				<input
					type="number"
					class="kiv-size-slider__number"
					:value="amount"
					@input="onNumber"
				/>
				<span class="kiv-size-slider__unit-label">{{ activeUnit }}</span>
			</div>
		</div>
	</div>
</template>

<style scoped>
.kiv-size-slider {
	display: flex;
	flex-direction: column;
	gap: 6px;
}
.kiv-size-slider__units {
	display: flex;
	gap: 0;
	border-radius: 5px;
	overflow: hidden;
	border: 1px solid var(--color-border);
	width: fit-content;
}
.kiv-size-slider__unit {
	padding: 3px 10px;
	font-size: 0.65rem;
	background: var(--color-surface-base);
	border: none;
	cursor: pointer;
	color: var(--color-text-muted);
	transition: background 0.1s, color 0.1s;
}
.kiv-size-slider__unit--active {
	background: var(--color-accent-muted);
	color: var(--color-accent-light);
	font-weight: 600;
}
.kiv-size-slider__row {
	display: flex;
	align-items: center;
	gap: 8px;
}
.kiv-size-slider__range {
	flex: 1;
	accent-color: var(--color-accent);
	height: 4px;
	cursor: pointer;
}
.kiv-size-slider__value {
	display: flex;
	align-items: center;
	flex-shrink: 0;
	background: var(--color-surface-sunken);
	border: 1px solid var(--color-border);
	border-radius: 5px;
	padding: 0 6px 0 0;
}
.kiv-size-slider__number {
	width: 44px;
	border: none;
	background: transparent;
	color: var(--color-text-primary);
	font-size: 0.72rem;
	font-variant-numeric: tabular-nums;
	padding: 4px 4px 4px 6px;
	outline: none;
}
.kiv-size-slider__auto {
	margin: 0;
	font-size: 0.65rem;
	color: var(--color-text-muted);
	font-style: italic;
}
.kiv-size-slider__unit-label {
	font-size: 0.65rem;
	color: var(--color-text-muted);
}
</style>
