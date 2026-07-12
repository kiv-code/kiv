<script setup lang="ts">
import { RADIUS, resolveBackgroundPaint } from "@kiv/nodes";
import { computed } from "vue";

const props = defineProps<{
	time?: string;
	label?: string;
	title?: string;
	description?: string;
	location?: string;
	image?: string;
	tags?: string;
	bodyBackground?: string;
	highlight?: boolean;
	highlightColor?: string;
	stripeColor?: unknown;
	stripeTextColor?: string;
	hasSpeaker?: boolean;
	speakerLabel?: string;
	speakerName?: string;
	speakerRole?: string;
	speakerAvatar?: string;
}>();

const layout = computed(() => {
	if (typeof document !== "undefined") {
		const el = document.querySelector('[data-kiv-type="agenda"]');
		if (el) {
			const parent = el.closest("[data-kiv-type]") || el;
			return (
				getComputedStyle(parent)
					.getPropertyValue("--kiv-agenda-layout")
					.trim() || "stripe"
			);
		}
	}
	return "stripe";
});

const isStripe = computed(
	() => layout.value === "stripe" || layout.value === "timeline",
);
const isCard = computed(() => layout.value === "card");
const isCompact = computed(() => layout.value === "compact");

const wrapStyle = computed(() => {
	const base: Record<string, string | number | undefined> = {
		borderRadius: "var(--kiv-agenda-item-radius, 8px)",
		overflow: "hidden",
	};

	if (props.highlight) {
		base.borderLeft = `4px solid ${props.highlightColor || "#6366f1"}`;
	}

	if (isCard.value) {
		base.display = "flex";
		base.flexDirection = "column";
		base.background = "#fff";
		base.boxShadow = "0 1px 4px rgba(0,0,0,0.08)";
	} else if (isCompact.value) {
		base.display = "flex";
		base.alignItems = "center";
		base.gap = "16px";
		base.padding = "10px 16px";
		base.background = "#fff";
		base.borderBottom = "1px solid #e2e8f0";
	} else {
		base.display = "flex";
	}

	return base;
});

const stripeStyle = computed(() => ({
	flex: isStripe.value
		? "0 0 var(--kiv-agenda-stripe-width, 150px)"
		: undefined,
	display: "flex" as const,
	alignItems: "center" as const,
	justifyContent: "center" as const,
	textAlign: "center" as const,
	fontWeight: "800",
	fontSize: "0.85rem",
	padding: "12px",
	lineHeight: "1.3",
	background: resolveBackgroundPaint(props.stripeColor, "#e2e8f0"),
	color: props.stripeTextColor || "#0f172a",
}));

const compactTimeStyle = computed(() => ({
	flex: "0 0 auto",
	fontWeight: "700",
	fontSize: "0.82rem",
	color: resolveBackgroundPaint(props.stripeColor, "#6366f1"),
	minWidth: "80px",
}));

const bodyStyle = computed(() => ({
	flex: isStripe.value ? "1" : undefined,
	background: props.bodyBackground || "var(--kiv-agenda-body-bg, #eceefb)",
	padding: isCard.value ? "0" : "14px 20px",
	display: "flex" as const,
	alignItems: (props.hasSpeaker ? "flex-start" : "center") as
		| "flex-start"
		| "center",
	justifyContent: "space-between" as const,
	gap: "20px",
	flexWrap: "wrap" as const,
}));

const cardImageStyle = {
	width: "100%",
	height: "160px",
	objectFit: "cover" as const,
};

const avatarStyle = {
	width: "56px",
	height: "56px",
	borderRadius: RADIUS.full,
	objectFit: "cover" as const,
	flexShrink: "0",
	background: "#e2e8f0",
};

const tagsList = computed(() => {
	if (!props.tags) return [];
	return props.tags
		.split(",")
		.map((t: string) => t.trim())
		.filter(Boolean);
});
</script>

<template>
	<article data-kiv-type="agenda-item" :style="wrapStyle">
		<!-- Card layout: image on top -->
		<template v-if="isCard && image">
			<img :src="image" :alt="title" :style="cardImageStyle" />
		</template>

		<!-- Stripe / Timeline layout: left time block -->
		<div v-if="isStripe" :style="stripeStyle">
			<template v-if="label">{{ label }}<br />{{ time }}</template>
			<template v-else>{{ time }}</template>
		</div>

		<!-- Compact layout: inline time -->
		<span v-if="isCompact" :style="compactTimeStyle">
			<template v-if="label">{{ label }}<br />{{ time }}</template>
			<template v-else>{{ time }}</template>
		</span>

		<!-- Body content -->
		<div :style="bodyStyle">
			<div class="kiv-agenda-item__main">
				<p v-if="title" class="kiv-agenda-item__title">{{ title }}</p>
				<p v-if="description" class="kiv-agenda-item__desc">{{ description }}</p>
				<span v-if="location && !isCompact" class="kiv-agenda-item__loc">
					<svg width="12" height="12" viewBox="0 0 24 24" fill="#ff5a3c"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" /></svg>
					{{ location }}
				</span>
				<div v-if="tagsList.length" class="kiv-agenda-item__tags">
					<span v-for="tag in tagsList" :key="tag" class="kiv-agenda-item__tag">{{ tag }}</span>
				</div>
				<slot />
			</div>
			<div v-if="hasSpeaker" class="kiv-agenda-item__speaker">
				<img v-if="speakerAvatar" :src="speakerAvatar" :alt="speakerName" :style="avatarStyle" />
				<div v-else :style="avatarStyle" />
				<div class="kiv-agenda-item__speaker-meta">
					<span class="kiv-agenda-item__speaker-label">{{ speakerLabel || "Speaker" }}</span>
					<span class="kiv-agenda-item__speaker-name">{{ speakerName }}</span>
					<span class="kiv-agenda-item__speaker-role">{{ speakerRole }}</span>
				</div>
			</div>
		</div>
	</article>
</template>

<style scoped>
.kiv-agenda-item__main {
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
	flex: 1;
}
.kiv-agenda-item__title {
	margin: 0;
	font-weight: 700;
	font-size: 0.95rem;
}
.kiv-agenda-item__desc {
	margin: 0;
	font-size: 0.82rem;
	color: #475569;
	line-height: 1.5;
}
.kiv-agenda-item__loc {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	font-size: 0.8rem;
	color: #64748b;
}
.kiv-agenda-item__tags {
	display: flex;
	flex-wrap: wrap;
	gap: 4px;
	margin-top: 4px;
}
.kiv-agenda-item__tag {
	font-size: 0.68rem;
	font-weight: 600;
	padding: 2px 8px;
	border-radius: 9999px;
	background: #e0e7ff;
	color: #4338ca;
}
.kiv-agenda-item__speaker {
	display: flex;
	align-items: center;
	gap: 12px;
	flex-shrink: 0;
}
.kiv-agenda-item__speaker-meta {
	display: flex;
	flex-direction: column;
	gap: 2px;
}
.kiv-agenda-item__speaker-label {
	font-size: 0.68rem;
	font-weight: 700;
	color: #ff1d96;
	text-transform: uppercase;
	letter-spacing: 0.04em;
}
.kiv-agenda-item__speaker-name {
	font-weight: 700;
	font-size: 0.88rem;
}
.kiv-agenda-item__speaker-role {
	font-size: 0.76rem;
	color: #64748b;
	max-width: 24ch;
	line-height: 1.35;
}
</style>
