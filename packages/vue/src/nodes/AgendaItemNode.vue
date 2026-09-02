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
	stripeFontWeight?: string;
	titleFontSize?: string;
	titleFontWeight?: string;
	titleColor?: string;
	descriptionFontSize?: string;
	descriptionFontWeight?: string;
	descriptionColor?: string;
	hasSpeaker?: boolean;
	speakerCount?: string;
	speakersPerRow?: string;
	speakerLabel?: string;
	speakerLabelFontSize?: string;
	speakerLabelColor?: string;
	speakerLabelFontWeight?: string;
	speakerName?: string;
	speakerNameFontSize?: string;
	speakerNameColor?: string;
	speakerNameFontWeight?: string;
	speakerRole?: string;
	speakerTitleFontSize?: string;
	speakerTitleColor?: string;
	speakerTitleFontWeight?: string;
	speakerCompany?: string;
	speakerCompanyFontSize?: string;
	speakerCompanyColor?: string;
	speakerCompanyFontWeight?: string;
	speakerAvatar?: string;
	speaker2Label?: string;
	speaker2Name?: string;
	speaker2Role?: string;
	speaker2Company?: string;
	speaker2Avatar?: string;
	speaker3Label?: string;
	speaker3Name?: string;
	speaker3Role?: string;
	speaker3Company?: string;
	speaker3Avatar?: string;
	speaker4Label?: string;
	speaker4Name?: string;
	speaker4Role?: string;
	speaker4Company?: string;
	speaker4Avatar?: string;
	speaker5Label?: string;
	speaker5Name?: string;
	speaker5Role?: string;
	speaker5Company?: string;
	speaker5Avatar?: string;
	speaker6Label?: string;
	speaker6Name?: string;
	speaker6Role?: string;
	speaker6Company?: string;
	speaker6Avatar?: string;
	speaker7Label?: string;
	speaker7Name?: string;
	speaker7Role?: string;
	speaker7Company?: string;
	speaker7Avatar?: string;
	speaker8Label?: string;
	speaker8Name?: string;
	speaker8Role?: string;
	speaker8Company?: string;
	speaker8Avatar?: string;
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
const hasTime = computed(() => Boolean(props.time || props.label));

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
	fontWeight: props.stripeFontWeight || undefined,
}));

const compactTimePaintStyle = computed(() => ({
	color: resolveBackgroundPaint(props.stripeColor, "#6366f1"),
	fontSize: props.stripeFontSize || undefined,
	fontWeight: props.stripeFontWeight || undefined,
}));

const bodyPaintStyle = computed(() => ({
	background: props.bodyBackground || "var(--kiv-agenda-body-bg, #eceefb)",
}));

const titlePaintStyle = computed(() => ({
	fontSize: props.titleFontSize || undefined,
	fontWeight: props.titleFontWeight || undefined,
	color: props.titleColor || undefined,
}));

const descriptionPaintStyle = computed(() => ({
	fontSize: props.descriptionFontSize || undefined,
	fontWeight: props.descriptionFontWeight || undefined,
	color: props.descriptionColor || undefined,
}));

const speakerLabelPaintStyle = computed(() => ({
	fontSize: props.speakerLabelFontSize || undefined,
	color: props.speakerLabelColor || undefined,
	fontWeight: props.speakerLabelFontWeight || undefined,
}));

const speakerNamePaintStyle = computed(() => ({
	fontSize: props.speakerNameFontSize || undefined,
	color: props.speakerNameColor || undefined,
	fontWeight: props.speakerNameFontWeight || undefined,
}));

const speakerTitlePaintStyle = computed(() => ({
	fontSize: props.speakerTitleFontSize || undefined,
	color: props.speakerTitleColor || undefined,
	fontWeight: props.speakerTitleFontWeight || undefined,
}));

const speakerCompanyPaintStyle = computed(() => ({
	fontSize: props.speakerCompanyFontSize || undefined,
	color: props.speakerCompanyColor || undefined,
	fontWeight: props.speakerCompanyFontWeight || undefined,
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

const speakersList = computed(() => {
	const count = Math.min(
		8,
		Math.max(1, Number(props.speakerCount ?? "1") || 1),
	);
	const all = [
		{
			label: props.speakerLabel,
			name: props.speakerName,
			role: props.speakerRole,
			company: props.speakerCompany,
			avatar: props.speakerAvatar,
		},
		{
			label: props.speaker2Label,
			name: props.speaker2Name,
			role: props.speaker2Role,
			company: props.speaker2Company,
			avatar: props.speaker2Avatar,
		},
		{
			label: props.speaker3Label,
			name: props.speaker3Name,
			role: props.speaker3Role,
			company: props.speaker3Company,
			avatar: props.speaker3Avatar,
		},
		{
			label: props.speaker4Label,
			name: props.speaker4Name,
			role: props.speaker4Role,
			company: props.speaker4Company,
			avatar: props.speaker4Avatar,
		},
		{
			label: props.speaker5Label,
			name: props.speaker5Name,
			role: props.speaker5Role,
			company: props.speaker5Company,
			avatar: props.speaker5Avatar,
		},
		{
			label: props.speaker6Label,
			name: props.speaker6Name,
			role: props.speaker6Role,
			company: props.speaker6Company,
			avatar: props.speaker6Avatar,
		},
		{
			label: props.speaker7Label,
			name: props.speaker7Name,
			role: props.speaker7Role,
			company: props.speaker7Company,
			avatar: props.speaker7Avatar,
		},
		{
			label: props.speaker8Label,
			name: props.speaker8Name,
			role: props.speaker8Role,
			company: props.speaker8Company,
			avatar: props.speaker8Avatar,
		},
	];
	return all.slice(0, count);
});

const speakersGridStyle = computed(() => ({
	gridTemplateColumns: `repeat(${Math.min(5, Math.max(1, Number(props.speakersPerRow ?? "3") || 3))}, 1fr)`,
}));
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

		<!-- Stripe / Timeline layout: left time block — omitted entirely when
			no time/label is set, so the item can be used as a pure content
			(+ speakers) card without an empty time block eating space. -->
		<div v-if="isStripe && hasTime" class="kiv-agenda-item__stripe" :style="stripePaintStyle">
			<template v-if="label">{{ label }}<br />{{ time }}</template>
			<template v-else>{{ time }}</template>
		</div>

		<!-- Compact layout: inline time -->
		<span v-if="isCompact && hasTime" class="kiv-agenda-item__compact-time" :style="compactTimePaintStyle">
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
			<div v-if="hasSpeaker" class="kiv-agenda-item__speakers" :style="speakersGridStyle">
				<div v-for="(speaker, i) in speakersList" :key="i" class="kiv-agenda-item__speaker">
					<img v-if="speaker.avatar" :src="speaker.avatar" :alt="speaker.name" :style="avatarStyle" />
					<div v-else :style="avatarStyle" />
					<div class="kiv-agenda-item__speaker-meta">
						<span v-if="speaker.label" class="kiv-agenda-item__speaker-label" :style="speakerLabelPaintStyle">{{ speaker.label }}</span>
						<span class="kiv-agenda-item__speaker-name" :style="speakerNamePaintStyle">{{ speaker.name }}</span>
						<span v-if="speaker.role" class="kiv-agenda-item__speaker-role" :style="speakerTitlePaintStyle">{{ speaker.role }}</span>
						<span v-if="speaker.company" class="kiv-agenda-item__speaker-company" :style="speakerCompanyPaintStyle">{{ speaker.company }}</span>
					</div>
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
	.kiv-agenda-item__body--has-speaker .kiv-agenda-item__speakers {
		width: 100%;
	}
	.kiv-agenda-item--compact {
		flex-wrap: wrap;
	}
}

/* Forcing every speaker card to 1-per-row belongs to an actual phone-width
   container, not the 640px threshold above (that one's tuned for the time
   stripe stacking). Reusing 640px for this too meant an agenda-item nested
   inside anything narrower than that — e.g. one of several parallel-session
   Tabs inside another agenda-item, a Column, a split layout — would always
   collapse to 1 column, even while the canvas itself is in the Desktop/Wide
   view, silently overriding the "Speakers Per Row" setting. A tighter,
   independent threshold lets that setting actually hold until the container
   is genuinely phone-narrow. */
@container kiv-agenda-item (max-width: 380px) {
	.kiv-agenda-item__speakers {
		grid-template-columns: 1fr !important;
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
.kiv-agenda-item__speakers {
	display: grid;
	gap: 16px;
	flex: 1 1 100%;
}
.kiv-agenda-item__speaker {
	display: flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
}
.kiv-agenda-item__speaker-meta {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
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
	line-height: 1.35;
	overflow-wrap: break-word;
}
.kiv-agenda-item__speaker-company {
	font-size: 0.76rem;
	color: #64748b;
	line-height: 1.35;
	overflow-wrap: break-word;
}
</style>
