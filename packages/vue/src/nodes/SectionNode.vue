<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
	background?: string;
	backgroundImage?: string;
	backgroundVideo?: string;
	backgroundSize?: string;
	backgroundPosition?: string;
	overlay?: boolean;
	overlayColor?: string;
	overlayOpacity?: number;
	gradient?: string;
	blur?: string;
	opacity?: number;
	paddingY?: string;
	paddingX?: string;
	marginY?: string;
	borderWidth?: string;
	borderColor?: string;
	borderRadius?: string;
	shadow?: string;
	fullWidth?: boolean;
	minHeight?: string;
}>();

const blurMap: Record<string, string> = {
	none: "0",
	sm: "4px",
	md: "8px",
	lg: "16px",
};

const sectionStyle = computed(() => {
	const s: Record<string, string> = {};
	if (props.background && props.background !== "transparent") {
		s["background-color"] = props.background;
	}
	if (props.backgroundImage) {
		s["background-image"] = `url(${props.backgroundImage})`;
		s["background-size"] = props.backgroundSize ?? "cover";
		s["background-position"] = props.backgroundPosition ?? "center";
	}
	if (props.gradient) {
		s["background-image"] = props.gradient;
	}
	if (props.blur && props.blur !== "none") {
		s["backdrop-filter"] = `blur(${blurMap[props.blur] ?? props.blur})`;
	}
	if (props.opacity !== undefined && props.opacity !== 1) {
		s.opacity = String(props.opacity);
	}
	if (props.borderWidth && props.borderWidth !== "0") {
		s["border-width"] = `${props.borderWidth}px`;
		s["border-style"] = "solid";
		if (props.borderColor) s["border-color"] = props.borderColor;
	}
	if (props.shadow && props.shadow !== "none") {
		s["box-shadow"] = `var(--kiv-shadow-${props.shadow})`;
	}
	if (props.minHeight) {
		s["min-height"] = props.minHeight;
	}
	return s;
});
</script>

<template>
	<section
		:style="sectionStyle"
		:data-padding-y="paddingY"
		:data-padding-x="paddingX"
		:data-margin-y="marginY"
		:data-radius="borderRadius"
		:data-full-width="fullWidth"
		data-kiv-type="section"
		class="kiv-section"
	>
		<div
			v-if="overlay"
			class="kiv-section__overlay"
			:style="{
				background: overlayColor ?? 'rgba(0,0,0,0.4)',
				opacity: String(overlayOpacity ?? 0.4),
			}"
		/>
		<div v-if="backgroundVideo" class="kiv-section__video-bg">
			<video autoplay muted loop playsinline :src="backgroundVideo" />
		</div>
		<div class="kiv-section__content">
			<slot />
		</div>
	</section>
</template>

<style scoped>
.kiv-section {
	position: relative;
	width: 100%;
}
.kiv-section__overlay {
	position: absolute;
	inset: 0;
	pointer-events: none;
}
.kiv-section__video-bg {
	position: absolute;
	inset: 0;
	overflow: hidden;
	pointer-events: none;
}
.kiv-section__video-bg video {
	width: 100%;
	height: 100%;
	object-fit: cover;
}
.kiv-section__content {
	position: relative;
	z-index: 1;
}
</style>
