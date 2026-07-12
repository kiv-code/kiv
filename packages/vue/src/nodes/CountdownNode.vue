<script setup lang="ts">
import { computeCountdownParts } from "@kiv/nodes";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = withDefaults(
	defineProps<{
		targetDate?: string;
		expiredMessage?: string;
		daysLabel?: string;
		hoursLabel?: string;
		minutesLabel?: string;
		secondsLabel?: string;
		showLabels?: boolean;
		countdownStyle?: string;
		size?: string;
		accentColor?: string;
	}>(),
	{ showLabels: true },
);

const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
	timer = setInterval(() => {
		now.value = Date.now();
	}, 1000);
});
onBeforeUnmount(() => {
	if (timer) clearInterval(timer);
});

const parts = computed(() =>
	computeCountdownParts(props.targetDate, now.value),
);

const SIZE_PX: Record<string, string> = { sm: "18px", md: "28px", lg: "40px" };
const fontSize = computed(() => SIZE_PX[props.size ?? "md"] ?? "28px");
const displayStyle = computed(() => props.countdownStyle ?? "boxes");

const units = computed(() => [
	{ value: parts.value.days, label: props.daysLabel ?? "Days" },
	{ value: parts.value.hours, label: props.hoursLabel ?? "Hours" },
	{ value: parts.value.minutes, label: props.minutesLabel ?? "Min" },
	{ value: parts.value.seconds, label: props.secondsLabel ?? "Sec" },
]);

function pad(value: number): string {
	return String(value).padStart(2, "0");
}
</script>

<template>
	<div data-kiv-type="countdown">
		<time v-if="parts.expired" :datetime="targetDate ?? ''">
			{{ expiredMessage ?? "Time's up!" }}
		</time>
		<time v-else :datetime="targetDate ?? ''" style="display: contents">
			<div
				class="kiv-countdown"
				:style="{ display: 'flex', alignItems: 'center', gap: displayStyle === 'inline' ? '6px' : '12px' }"
			>
				<template v-for="(unit, i) in units" :key="unit.label">
					<div
						class="kiv-countdown__unit"
						:class="{ 'kiv-countdown__unit--boxes': displayStyle === 'boxes' }"
					>
						<span
							class="kiv-countdown__value"
							:style="{ fontSize, color: displayStyle === 'minimal' ? 'inherit' : accentColor ?? '#6366f1' }"
						>{{ pad(unit.value) }}</span>
						<span v-if="showLabels" class="kiv-countdown__label">{{ unit.label }}</span>
					</div>
					<span v-if="displayStyle === 'inline' && i < units.length - 1" class="kiv-countdown__sep">:</span>
				</template>
			</div>
		</time>
	</div>
</template>

<style scoped>
.kiv-countdown__unit {
	display: flex;
	flex-direction: column;
	align-items: center;
}
.kiv-countdown__unit--boxes {
	padding: 12px 16px;
	border-radius: 8px;
	background: rgba(99, 102, 241, 0.08);
	min-width: 64px;
}
.kiv-countdown__value {
	font-weight: 700;
	line-height: 1;
}
.kiv-countdown__label {
	font-size: 11px;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: #64748b;
}
.kiv-countdown__sep {
	opacity: 0.5;
}
</style>
