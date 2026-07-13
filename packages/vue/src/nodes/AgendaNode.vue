<script setup lang="ts">
import { GAP, RADIUS } from "@kivcode/nodes";
import { computed } from "vue";

const props = defineProps<{
	disclaimer?: string;
	layout?: string;
	columns?: string;
	gap?: string;
	stripeWidth?: string;
	itemRadius?: string;
	bodyBackground?: string;
	showTimelineLine?: boolean;
	timelineLineColor?: string;
}>();

const listStyle = computed(() => {
	const layout = props.layout ?? "stripe";
	const base: Record<string, string | number | undefined> = {
		display: "flex",
		flexDirection: "column",
		gap: GAP[props.gap ?? "xs"] ?? "4px",
		"--kiv-agenda-stripe-width": props.stripeWidth || "150px",
		"--kiv-agenda-item-radius": RADIUS[props.itemRadius ?? "md"] ?? "8px",
		"--kiv-agenda-layout": layout,
		"--kiv-agenda-body-bg": props.bodyBackground || "#eceefb",
	};

	if (layout === "card" && Number(props.columns ?? "1") > 1) {
		base.display = "grid";
		base.gridTemplateColumns = `repeat(${props.columns}, 1fr)`;
		base.flexDirection = undefined;
	}

	if (layout === "timeline") {
		base.position = "relative";
		if (props.showTimelineLine !== false) {
			base.paddingLeft = "24px";
		}
	}

	return base;
});
</script>

<template>
	<div data-kiv-type="agenda">
		<p v-if="disclaimer" class="kiv-agenda__disclaimer">{{ disclaimer }}</p>
		<div :style="listStyle">
			<slot />
		</div>
	</div>
</template>

<style scoped>
.kiv-agenda__disclaimer {
	font-size: 13px;
	color: #64748b;
	margin: 0 0 12px;
}
</style>
