<script setup lang="ts">
import { RADIUS, resolveBackgroundPaint } from "@kivcode/nodes";
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
	stripeFontSize?: string;
	titleFontSize?: string;
	descriptionFontSize?: string;
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

// Layout (flex-direction, padding, alignment) now lives in the scoped
// <style> below, driven by classes, so the max-width:640px rule there can
// actually take effect — an inline `:style` always outranks an external
// stylesheet rule regardless of specificity or media query, so anything
// that needs to change on mobile (this used to set flex-direction/padding/
// align-items inline) has to be a class, not a bound style. Only genuinely
// per-instance PAINT (colors driven by node props) stays inline.
const wrapStyle = computed(() => {
	const base: Record<string, string | undefined> = {};
	if (props.highlight) {
		base.borderLeft = `4px solid ${props.highlightColor || "#6366f1"}`;
	}
	return base;
});

const stripePaintStyle = computed(() => ({
	background: resolveBackgroundPaint(props.stripeColor, "#e2e8f0"),
	color: props.stripeTextColor || "#0f172a",
	fontSize: props.stripeFontSize || undefined,
}));

const compactTimePaintStyle = computed(() => ({
	color: resolveBackgroundPaint(props.stripeColor, "#6366f1"),
	fontSize: props.stripeFontSize || undefined,
}));

const bodyPaintStyle = computed(() => ({
	background: props.bodyBackground || "var(--kiv-agenda-body-bg, #eceefb)",
}));

const titlePaintStyle = computed(() => ({
	fontSize: props.titleFontSize || undefined,
}));

const descriptionPaintStyle = computed(() => ({
	fontSize: props.descriptionFontSize || undefined,
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
	<!--
		Self-contained container query context — `agenda-item` is DESIGNED to
		live inside an `Agenda` (which names its own container "kiv-agenda"
		for exactly this purpose), but the editor doesn't actually enforce
		that: nothing stops someone from dropping an agenda-item straight
		into a Tab Panel, Container, or Stack instead. When that happens
		there's no ancestor container to respond to, and the item is stuck
		in its desktop row layout forever, at ANY viewport width (reported
		against a real kmjkevents page — a Tab Panel had 3 bare agenda-items
		with no Agenda wrapper). Wrapping every instance in its OWN
		containment context — independent of whatever it's actually nested
		in — makes each agenda-item responsive on its own, with no
		dependency on being correctly parented.
	-->
	<div class="kiv-agenda-item__container">
		<article
			data-kiv-type="agenda-item"
			class="kiv-agenda-item"
			:class="{
				'kiv-agenda-item--stripe': isStripe,
				'kiv-agenda-item--card': isCard,
				'kiv-agenda-item--compact': isCompact,
			}"
			:style="wrapStyle"
		>
		<!-- Card layout: image on top -->
		<template v-if="isCard && image">
			<img :src="image" :alt="title" :style="cardImageStyle" />
		</template>

		<!-- Stripe / Timeline layout: left time block -->
		<div v-if="isStripe" class="kiv-agenda-item__stripe" :style="stripePaintStyle">
			<template v-if="label">{{ label }}<br />{{ time }}</template>
			<template v-else>{{ time }}</template>
		</div>

		<!-- Compact layout: inline time -->
		<span v-if="isCompact" class="kiv-agenda-item__compact-time" :style="compactTimePaintStyle">
			<template v-if="label">{{ label }}<br />{{ time }}</template>
			<template v-else>{{ time }}</template>
		</span>

		<!-- Body content -->
		<div
			class="kiv-agenda-item__body"
			:class="{ 'kiv-agenda-item__body--has-speaker': hasSpeaker }"
			:style="bodyPaintStyle"
		>
			<div class="kiv-agenda-item__main">
				<p v-if="title" class="kiv-agenda-item__title" :style="titlePaintStyle">{{ title }}</p>
				<p v-if="description" class="kiv-agenda-item__desc" :style="descriptionPaintStyle">{{ description }}</p>
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
	</div>
</template>

<style scoped>
.kiv-agenda-item__container {
	container-type: inline-size;
	container-name: kiv-agenda-item;
}
.kiv-agenda-item {
	border-radius: var(--kiv-agenda-item-radius, 8px);
	overflow: hidden;
}
.kiv-agenda-item--stripe {
	display: flex;
	flex-direction: row;
}
.kiv-agenda-item--card {
	display: flex;
	flex-direction: column;
	background: #fff;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.kiv-agenda-item--compact {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 10px 16px;
	background: #fff;
	border-bottom: 1px solid #e2e8f0;
}
.kiv-agenda-item__stripe {
	flex: 0 0 var(--kiv-agenda-stripe-width, 150px);
	display: flex;
	align-items: center;
	justify-content: center;
	text-align: center;
	font-weight: 800;
	font-size: 0.85rem;
	padding: 12px;
	line-height: 1.3;
}
.kiv-agenda-item__compact-time {
	flex: 0 0 auto;
	font-weight: 700;
	font-size: 0.82rem;
	min-width: 80px;
}
.kiv-agenda-item__body {
	flex: 1;
	padding: 14px 20px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20px;
	flex-wrap: wrap;
}
.kiv-agenda-item--card .kiv-agenda-item__body {
	padding: 0;
}
.kiv-agenda-item__body--has-speaker {
	align-items: flex-start;
}

/* Stripe layout is a 2-column row (time | content) at desktop/tablet widths.
   Below 640px it stacks — time becomes a compact header bar above the
   content instead of a tall centered block, which is what actually breaks
   down at phone widths (see kmjkevents integration report).

   @container, not @media — this needs to react to the item's own rendered
   width (see .kiv-agenda-item__container above), not the browser viewport.
   A media query can't see the kiv editor's simulated mobile/tablet canvas
   (a width-constrained <div>, not a real narrower viewport); querying the
   item's OWN wrapper (rather than relying on an Agenda ancestor) also means
   this keeps working even if the item ends up parented somewhere other
   than an Agenda (a Tab Panel, a Container, ...) — nothing in the editor
   currently stops that, and when it happens there'd otherwise be no
   container to respond to at all, leaving the item stuck in desktop
   layout at any width. */
@container kiv-agenda-item (max-width: 640px) {
	.kiv-agenda-item--stripe {
		flex-direction: column;
	}
	.kiv-agenda-item--stripe .kiv-agenda-item__stripe {
		flex: 0 0 auto;
		width: 100%;
		justify-content: flex-start;
		text-align: left;
		padding: 8px 14px;
		font-size: 0.8rem;
	}
	.kiv-agenda-item__body {
		padding: 12px 14px;
		align-items: flex-start;
	}
	/* With a speaker card, `.main` (min-width:0, flex:1) and `.speaker`
	   (flex-shrink:0, fixed avatar + role text) fight for the same row —
	   `.main` has no floor on how far it can shrink, so it gets squeezed
	   down to the width of its single longest word (title/description wrap
	   one word per line) instead of wrapping onto its own line below the
	   speaker. Forcing a column stack here — full width each, speaker below
	   the text — is what "stacks on mobile" actually needs for this variant. */
	.kiv-agenda-item__body--has-speaker {
		flex-direction: column;
	}
	.kiv-agenda-item__body--has-speaker .kiv-agenda-item__main,
	.kiv-agenda-item__body--has-speaker .kiv-agenda-item__speaker {
		width: 100%;
	}
	.kiv-agenda-item--compact {
		flex-wrap: wrap;
	}
}

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
