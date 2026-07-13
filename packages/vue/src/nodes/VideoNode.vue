<script setup lang="ts">
import { RADIUS, SHADOW } from "@kivcode/nodes";
import { computed } from "vue";

const props = defineProps<{
	src?: string;
	provider?: string;
	videoId?: string;
	poster?: string;
	caption?: string;
	noSourceText?: string;
	aspectRatio?: string;
	borderRadius?: string;
	shadow?: string;
	autoplay?: boolean;
	controls?: boolean;
	loop?: boolean;
	muted?: boolean;
}>();

function embedUrl(provider: string, videoId: string): string {
	if (provider === "youtube") {
		return `https://www.youtube-nocookie.com/embed/${videoId}`;
	}
	if (provider === "vimeo") {
		return `https://player.vimeo.com/video/${videoId}`;
	}
	if (provider === "loom") {
		return `https://www.loom.com/embed/${videoId}`;
	}
	return "";
}

const isHtml5 = computed(() => props.provider === "html5");

const rawSrc = computed(() => {
	const provider = props.provider ?? "youtube";
	const videoId = props.videoId ?? "";
	if (provider === "custom" || provider === "html5") return props.src ?? "";
	return embedUrl(provider, videoId);
});

const iframeSrc = computed(() => {
	if (isHtml5.value || !rawSrc.value) return "";
	const params = new URLSearchParams();
	if (props.autoplay) params.set("autoplay", "1");
	if (props.loop) params.set("loop", "1");
	if (props.muted) params.set("mute", "1");
	if (props.controls !== undefined && !props.controls)
		params.set("controls", "0");
	const qs = params.toString();
	return qs ? `${rawSrc.value}?${qs}` : rawSrc.value;
});

const showsControls = computed(() => props.controls !== false);

const containerStyle = computed(() => ({
	position: "relative" as const,
	width: "100%",
	paddingBottom: props.aspectRatio === "4/3" ? "75%" : ("56.25%" as string),
	height: 0,
	overflow: "hidden" as const,
	borderRadius: RADIUS[props.borderRadius ?? "none"] ?? "0",
	boxShadow: SHADOW[props.shadow ?? "none"] ?? "none",
}));
</script>

<template>
	<figure style="margin:0;">
		<div v-if="isHtml5 && rawSrc" :style="containerStyle" data-kiv-type="video">
			<video
				style="position:absolute;inset:0;width:100%;height:100%;border:0;"
				:controls="showsControls"
				:autoplay="autoplay"
				:loop="loop"
				:muted="muted"
				:poster="poster || undefined"
			>
				<source :src="rawSrc" />
			</video>
		</div>
		<div v-else-if="iframeSrc" :style="containerStyle" data-kiv-type="video">
			<iframe
				:src="iframeSrc"
				style="position:absolute;inset:0;width:100%;height:100%;border:0;"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowfullscreen
			/>
		</div>
		<div v-else :style="containerStyle" data-kiv-type="video">
			<p style="padding:1rem;text-align:center;color:#999;">{{ noSourceText ?? 'No video source configured' }}</p>
		</div>
		<figcaption
			v-if="caption"
			style="padding-top:8px;font-size:14px;color:#64748b;text-align:center;"
		>{{ caption }}</figcaption>
	</figure>
</template>
