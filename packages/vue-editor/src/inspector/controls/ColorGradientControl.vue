<script setup lang="ts">
import type { ColorOrGradientValue } from "@kivcode/nodes";
import {
	normalizeColorOrGradient,
	resolveBackgroundPaint,
} from "@kivcode/nodes";
import { computed, inject } from "vue";
import { useContinuousEdit } from "../../composables/useContinuousEdit";
import { EDITOR_STORE_KEY } from "../../store/context";

const props = defineProps<{ modelValue?: unknown }>();
const emit = defineEmits<{
	"update:modelValue": [value: Record<string, unknown>];
}>();

const store = inject(EDITOR_STORE_KEY, null);
const { start, end } = useContinuousEdit(store);

// Handles legacy plain-string values (pre-dating this field type) safely —
// never spread `modelValue` directly, since spreading a STRING iterates its
// characters as array indices and corrupts the object (see
// normalizeColorOrGradient's doc comment in @kivcode/nodes).
const value = computed(() => normalizeColorOrGradient(props.modelValue));

function patch(partial: Partial<ColorOrGradientValue>) {
	start();
	emit("update:modelValue", { ...value.value, ...partial });
}

// Dragging the opacity slider on an "inherit" (empty) solid color has nothing
// to apply alpha to — the swatch shows a black fallback purely so the native
// <input type="color"> has something to render, but the underlying value is
// still empty. Committing that fallback here turns the slider into a real
// color the moment the user touches it, instead of silently doing nothing.
function setSolidAlpha(alpha: number) {
	patch({ alpha, solid: value.value.solid || "#000000" });
}

const GRADIENT_STOPS = [
	{ key: "from", alphaKey: "fromAlpha", label: "From", optional: false },
	{ key: "middle", alphaKey: "middleAlpha", label: "Middle", optional: true },
	{ key: "to", alphaKey: "toAlpha", label: "To", optional: false },
] as const;

function setStopColor(key: "from" | "middle" | "to", color: string) {
	patch({ [key]: color });
}

function setStopAlpha(
	alphaKey: "fromAlpha" | "middleAlpha" | "toAlpha",
	alpha: number,
) {
	patch({ [alphaKey]: alpha });
}

const previewBackground = computed(() =>
	resolveBackgroundPaint(value.value, "transparent"),
);
</script>

<template>
	<div class="kiv-color-gradient" @change="end">
		<div class="kiv-color-gradient__tabs">
			<button
				type="button"
				class="kiv-color-gradient__tab"
				:class="{ 'kiv-color-gradient__tab--active': value.type === 'solid' }"
				@click="patch({ type: 'solid' })"
			>
				Solid
			</button>
			<button
				type="button"
				class="kiv-color-gradient__tab"
				:class="{ 'kiv-color-gradient__tab--active': value.type === 'gradient' }"
				@click="patch({ type: 'gradient' })"
			>
				Gradient
			</button>
		</div>

		<div class="kiv-color-gradient__preview" :style="{ background: previewBackground }" />

		<template v-if="value.type === 'solid'">
			<div class="kiv-color-gradient__row">
				<input
					type="color"
					class="kiv-color-gradient__swatch"
					:value="value.solid || '#000000'"
					@input="patch({ solid: ($event.target as HTMLInputElement).value })"
				/>
				<input
					type="text"
					class="kiv-input kiv-color-gradient__text"
					:value="value.solid"
					placeholder="inherit"
					@input="patch({ solid: ($event.target as HTMLInputElement).value })"
				/>
			</div>
			<div class="kiv-color-gradient__row">
				<span class="kiv-color-gradient__label">Opacity</span>
				<input
					type="range"
					min="0"
					max="1"
					step="0.01"
					class="kiv-color-gradient__angle"
					:value="value.alpha"
					@input="setSolidAlpha(Number(($event.target as HTMLInputElement).value))"
				/>
				<span class="kiv-color-gradient__angle-value">{{ Math.round(value.alpha * 100) }}%</span>
			</div>
		</template>

		<template v-else>
			<div v-for="stop in GRADIENT_STOPS" :key="stop.key" class="kiv-color-gradient__stop">
				<div class="kiv-color-gradient__row">
					<span class="kiv-color-gradient__label">{{ stop.label }}</span>
					<input
						type="color"
						class="kiv-color-gradient__swatch"
						:value="value[stop.key] || (stop.optional ? '#ffffff' : '#000000')"
						@input="setStopColor(stop.key, ($event.target as HTMLInputElement).value)"
					/>
					<input
						type="text"
						class="kiv-input kiv-color-gradient__text"
						:value="value[stop.key]"
						:placeholder="stop.optional ? 'none' : ''"
						@input="setStopColor(stop.key, ($event.target as HTMLInputElement).value)"
					/>
				</div>
				<div v-if="!stop.optional || value[stop.key]" class="kiv-color-gradient__row kiv-color-gradient__row--sub">
					<span class="kiv-color-gradient__label">Opacity</span>
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						class="kiv-color-gradient__angle"
						:value="value[stop.alphaKey]"
						@input="setStopAlpha(stop.alphaKey, Number(($event.target as HTMLInputElement).value))"
					/>
					<span class="kiv-color-gradient__angle-value">{{ Math.round(value[stop.alphaKey] * 100) }}%</span>
				</div>
			</div>
			<div class="kiv-color-gradient__row">
				<span class="kiv-color-gradient__label">Angle</span>
				<input
					type="range"
					min="0"
					max="360"
					step="1"
					class="kiv-color-gradient__angle"
					:value="value.angle"
					@input="patch({ angle: Number(($event.target as HTMLInputElement).value) })"
				/>
				<span class="kiv-color-gradient__angle-value">{{ value.angle }}°</span>
			</div>
		</template>
	</div>
</template>

<style scoped>
.kiv-color-gradient {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.kiv-color-gradient__tabs {
	display: flex;
	gap: 0;
	border-radius: 5px;
	overflow: hidden;
	border: 1px solid var(--color-border);
}
.kiv-color-gradient__tab {
	flex: 1;
	padding: 4px 6px;
	font-size: 0.65rem;
	background: var(--color-surface-base);
	border: none;
	cursor: pointer;
	color: var(--color-text-muted);
	transition: background 0.1s, color 0.1s;
}
.kiv-color-gradient__tab--active {
	background: var(--color-accent-muted);
	color: var(--color-accent-light);
	font-weight: 600;
}

.kiv-color-gradient__preview {
	height: 22px;
	border-radius: 5px;
	border: 1px solid var(--color-border);
	background-image:
		linear-gradient(45deg, var(--color-surface-overlay) 25%, transparent 25%),
		linear-gradient(-45deg, var(--color-surface-overlay) 25%, transparent 25%),
		linear-gradient(45deg, transparent 75%, var(--color-surface-overlay) 75%),
		linear-gradient(-45deg, transparent 75%, var(--color-surface-overlay) 75%);
	background-size: 10px 10px;
	background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
}

.kiv-color-gradient__stop {
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding-bottom: 4px;
	border-bottom: 1px solid var(--color-border);
}
.kiv-color-gradient__stop:last-of-type {
	border-bottom: none;
	padding-bottom: 0;
}

.kiv-color-gradient__row {
	display: flex;
	align-items: center;
	gap: 6px;
}
.kiv-color-gradient__row--sub {
	padding-left: 30px;
}
.kiv-color-gradient__label {
	font-size: 0.6rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: var(--color-text-muted);
	flex-shrink: 0;
	width: 36px;
}
.kiv-color-gradient__swatch {
	width: 24px;
	height: 24px;
	flex-shrink: 0;
	padding: 0;
	border: 1px solid var(--color-border);
	border-radius: 4px;
	cursor: pointer;
	background: none;
}
.kiv-color-gradient__text {
	flex: 1;
	min-width: 0;
	font-family: monospace;
}
.kiv-color-gradient__angle {
	flex: 1;
	accent-color: var(--color-accent);
	height: 4px;
	cursor: pointer;
}
.kiv-color-gradient__angle-value {
	font-size: 0.68rem;
	color: var(--color-text-secondary);
	flex-shrink: 0;
	width: 30px;
	text-align: right;
	font-variant-numeric: tabular-nums;
}
</style>
