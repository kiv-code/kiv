<script setup lang="ts">
import {
	RADIUS,
	renderStars,
	resolveIcon,
	SHADOW,
	SPACING,
} from "@kivcode/nodes";
import { computed, inject } from "vue";
import { KIV_MEDIA_KEY } from "../media";

const props = defineProps<{
	quote?: string;
	authorName?: string;
	authorRole?: string;
	avatar?: string;
	rating?: number;
	layout?: string;
	quoteMarkStyle?: string;
}>();

const media = inject(KIV_MEDIA_KEY, null);
const resolvedAvatar = computed(
	() => media?.resolve(props.avatar ?? "", {}) ?? props.avatar ?? "",
);

const isCard = computed(() => (props.layout ?? "card") === "card");
const isCentered = computed(() => props.layout === "centered");

const starsHtml = computed(() =>
	props.rating ? renderStars(props.rating) : "",
);
const quoteIconSvg = computed(() =>
	(props.quoteMarkStyle ?? "icon") === "icon"
		? resolveIcon("lucide:quote")
		: null,
);

const wrapperStyle = computed(() => ({
	display: "flex" as const,
	flexDirection: isCentered.value ? ("column" as const) : ("row" as const),
	alignItems: isCentered.value ? ("center" as const) : ("flex-start" as const),
	textAlign: isCentered.value ? ("center" as const) : ("left" as const),
	gap: SPACING.md ?? "16px",
	padding: isCard.value ? (SPACING.lg ?? "32px") : undefined,
	borderRadius: isCard.value ? (RADIUS.lg ?? "16px") : undefined,
	boxShadow: isCard.value ? (SHADOW.md ?? "none") : undefined,
	background: isCard.value ? "#ffffff" : undefined,
}));
</script>

<template>
	<figure :style="wrapperStyle" data-kiv-type="testimonial">
		<span v-if="quoteIconSvg" class="kiv-testimonial__quote-icon" v-html="quoteIconSvg" />
		<span v-else-if="quoteMarkStyle === 'large-glyph'" class="kiv-testimonial__quote-glyph">&ldquo;</span>
		<div class="kiv-testimonial__body">
			<p class="kiv-testimonial__quote">{{ quote }}</p>
			<div v-if="rating" class="kiv-testimonial__stars" v-html="starsHtml" />
			<div class="kiv-testimonial__author-row" :class="{ 'kiv-testimonial__author-row--centered': isCentered }">
				<img
					v-if="avatar"
					:src="resolvedAvatar"
					:alt="authorName ?? ''"
					class="kiv-testimonial__avatar"
				/>
				<div class="kiv-testimonial__author">
					<span class="kiv-testimonial__name">{{ authorName }}</span>
					<span class="kiv-testimonial__role">{{ authorRole }}</span>
				</div>
			</div>
		</div>
	</figure>
</template>

<style scoped>
.kiv-testimonial__quote-icon {
	display: inline-block;
	width: 28px;
	color: #c7d2fe;
	margin-bottom: 8px;
}
.kiv-testimonial__quote-icon :deep(svg) {
	width: 1em;
	height: 1em;
}
.kiv-testimonial__quote-glyph {
	display: block;
	font-size: 48px;
	line-height: 1;
	color: #c7d2fe;
	font-family: Georgia, serif;
}
.kiv-testimonial__quote {
	margin: 0 0 12px 0;
	font-size: 17px;
	line-height: 1.5;
}
.kiv-testimonial__stars {
	margin-bottom: 12px;
}
.kiv-testimonial__author-row {
	display: flex;
	align-items: center;
	gap: 12px;
}
.kiv-testimonial__author-row--centered {
	justify-content: center;
}
.kiv-testimonial__avatar {
	width: 48px;
	height: 48px;
	border-radius: 9999px;
	object-fit: cover;
	flex-shrink: 0;
}
.kiv-testimonial__author {
	display: flex;
	flex-direction: column;
}
.kiv-testimonial__name {
	font-weight: 700;
}
.kiv-testimonial__role {
	font-size: 13px;
	color: #64748b;
}
</style>
