<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
	/** The asset's URL — used to infer the file extension when `filename` isn't given. */
	url?: string;
	/** Original filename/alt text, preferred over parsing `url` (see extOf()). */
	filename?: string;
	/** MediaAsset.type — "video" gets its own icon even without a recognized extension. */
	assetType?: "image" | "video" | "file";
}>();

interface FileKind {
	label: string;
	color: string;
	kind: "video" | "audio" | "doc";
}

// url is frequently a data: URI (mock providers, inline SVG placeholders) —
// slicing after the last "/" on one of those tears into the base64 payload
// instead of finding a filename, same pitfall assetLabel() in
// KivMediaBrowser.vue guards against. Prefer `filename`, and only parse
// `url` when it actually looks like a path.
function extOf(input: string): string {
	const clean = input.split(/[?#]/)[0] ?? input;
	const base = clean.split("/").pop() ?? clean;
	const dot = base.lastIndexOf(".");
	return dot > 0 ? base.slice(dot + 1).toLowerCase() : "";
}

const EXTENSION_KIND: Record<string, FileKind> = {
	pdf: { label: "PDF", color: "#dc2626", kind: "doc" },
	doc: { label: "DOC", color: "#2563eb", kind: "doc" },
	docx: { label: "DOC", color: "#2563eb", kind: "doc" },
	xls: { label: "XLS", color: "#16a34a", kind: "doc" },
	xlsx: { label: "XLS", color: "#16a34a", kind: "doc" },
	csv: { label: "CSV", color: "#16a34a", kind: "doc" },
	ppt: { label: "PPT", color: "#ea580c", kind: "doc" },
	pptx: { label: "PPT", color: "#ea580c", kind: "doc" },
	zip: { label: "ZIP", color: "#7c3aed", kind: "doc" },
	rar: { label: "ZIP", color: "#7c3aed", kind: "doc" },
	"7z": { label: "ZIP", color: "#7c3aed", kind: "doc" },
	tar: { label: "ZIP", color: "#7c3aed", kind: "doc" },
	gz: { label: "ZIP", color: "#7c3aed", kind: "doc" },
	txt: { label: "TXT", color: "#64748b", kind: "doc" },
	md: { label: "MD", color: "#64748b", kind: "doc" },
	mp3: { label: "", color: "#db2777", kind: "audio" },
	wav: { label: "", color: "#db2777", kind: "audio" },
	ogg: { label: "", color: "#db2777", kind: "audio" },
	m4a: { label: "", color: "#db2777", kind: "audio" },
	flac: { label: "", color: "#db2777", kind: "audio" },
	mp4: { label: "", color: "#4f46e5", kind: "video" },
	webm: { label: "", color: "#4f46e5", kind: "video" },
	mov: { label: "", color: "#4f46e5", kind: "video" },
	m4v: { label: "", color: "#4f46e5", kind: "video" },
	ogv: { label: "", color: "#4f46e5", kind: "video" },
	avi: { label: "", color: "#4f46e5", kind: "video" },
};

const DEFAULT_KIND: FileKind = { label: "FILE", color: "#64748b", kind: "doc" };
const VIDEO_KIND: FileKind = { label: "", color: "#4f46e5", kind: "video" };

const fileKind = computed<FileKind>(() => {
	const ext = extOf(props.filename || props.url || "");
	if (ext && EXTENSION_KIND[ext]) return EXTENSION_KIND[ext];
	// asset.type from the media provider is the fallback signal when the
	// extension is missing/unrecognized (e.g. a data: URI with no filename).
	if (props.assetType === "video") return VIDEO_KIND;
	return DEFAULT_KIND;
});
</script>

<template>
	<div class="kiv-file-icon" :style="{ '--kiv-file-icon-color': fileKind.color }" :title="fileKind.label || undefined">
		<svg v-if="fileKind.kind === 'video'" width="28" height="28" viewBox="0 0 24 24" fill="none">
			<rect x="1" y="4" width="16" height="16" rx="3" :fill="fileKind.color" opacity="0.18" />
			<rect x="1" y="4" width="16" height="16" rx="3" :stroke="fileKind.color" stroke-width="1.4" />
			<path d="M8 9l6 3-6 3V9z" :fill="fileKind.color" />
			<path d="M19 8l4-2.5v13L19 16" :stroke="fileKind.color" stroke-width="1.4" stroke-linejoin="round" />
		</svg>
		<svg v-else-if="fileKind.kind === 'audio'" width="28" height="28" viewBox="0 0 24 24" fill="none">
			<circle cx="12" cy="12" r="11" :fill="fileKind.color" opacity="0.16" />
			<path d="M7 14V9.5l6-1.5v9M13 8v8" :stroke="fileKind.color" stroke-width="1.4" stroke-linecap="round" />
			<circle cx="6" cy="16" r="2" :fill="fileKind.color" />
			<circle cx="12" cy="17.5" r="2" :fill="fileKind.color" />
		</svg>
		<svg v-else width="30" height="34" viewBox="0 0 30 34">
			<path d="M3 1h17l7 7v25H3V1z" :fill="fileKind.color" opacity="0.14" />
			<path d="M3 1h17l7 7v25H3V1z" :stroke="fileKind.color" stroke-width="1.4" fill="none" stroke-linejoin="round" />
			<path d="M20 1v7h7" :stroke="fileKind.color" stroke-width="1.4" fill="none" stroke-linejoin="round" />
			<text
				v-if="fileKind.label"
				x="15"
				y="25"
				text-anchor="middle"
				:fill="fileKind.color"
				font-size="7"
				font-weight="700"
				font-family="inherit"
			>{{ fileKind.label }}</text>
		</svg>
	</div>
</template>

<style scoped>
.kiv-file-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
}
</style>
