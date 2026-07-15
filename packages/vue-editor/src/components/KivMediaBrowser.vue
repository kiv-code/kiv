<script setup lang="ts">
import type { MediaAsset, MediaProvider } from "@kivcode/engine";
import { computed, nextTick, ref, watch } from "vue";
import { mediaListCache } from "./media-list-cache";

const props = defineProps<{
	open: boolean;
	media: MediaProvider | null;
}>();

const emit = defineEmits<{
	close: [];
	select: [asset: MediaAsset];
}>();

const TYPE_OPTIONS = [
	{ value: "all", label: "All" },
	{ value: "image", label: "Images" },
	{ value: "video", label: "Videos" },
	{ value: "file", label: "Files" },
] as const;

const assets = ref<MediaAsset[]>([]);
const loading = ref(false);
const uploading = ref(false);
const error = ref<string | null>(null);
const search = ref("");
const typeFilter = ref<(typeof TYPE_OPTIONS)[number]["value"]>("all");
const searchInput = ref<HTMLInputElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

// `list` is optional on MediaProvider — without it the library can't be
// browsed, only uploaded to for the current session (see media/types.ts).
const canList = computed(() => typeof props.media?.list === "function");
const deleting = ref<Set<string>>(new Set());

// Always fetches the FULL, unfiltered list — `visibleAssets` below already
// re-filters client-side by search/type, so there's no need to hit the
// network again on every keystroke, and it means the cached copy is one
// single reusable list rather than one entry per query string.
async function fetchAssets(): Promise<MediaAsset[]> {
	if (!props.media?.list) return [];
	return props.media.list();
}

async function loadAssets() {
	if (!props.media?.list) {
		assets.value = [];
		return;
	}

	const cached = mediaListCache.get(props.media);
	if (cached) {
		// Instant — no spinner, no wait. A background refresh follows to
		// pick up anything uploaded/deleted from elsewhere (another tab,
		// another editor session) without making every single open pay for it.
		assets.value = cached;
		fetchAssets()
			.then((fresh) => {
				assets.value = fresh;
				if (props.media) mediaListCache.set(props.media, fresh);
			})
			.catch(() => {
				// Silent — the cached copy is still shown; loud errors here
				// would fire on every open whenever the network hiccups.
			});
		return;
	}

	loading.value = true;
	error.value = null;
	try {
		const fresh = await fetchAssets();
		assets.value = fresh;
		if (props.media) mediaListCache.set(props.media, fresh);
	} catch (err) {
		error.value = err instanceof Error ? err.message : "Failed to load media";
	} finally {
		loading.value = false;
	}
}

// Defensive client-side re-filter — some providers may not honor the query
// (e.g. a naive mock), so the grid stays correct either way.
const visibleAssets = computed(() => {
	const q = search.value.toLowerCase().trim();
	return assets.value.filter((asset) => {
		if (typeFilter.value !== "all" && asset.type !== typeFilter.value)
			return false;
		if (!q) return true;
		return (
			asset.url.toLowerCase().includes(q) ||
			(asset.alt ?? "").toLowerCase().includes(q)
		);
	});
});

watch(
	() => props.open,
	(val) => {
		if (val) {
			search.value = "";
			typeFilter.value = "all";
			loadAssets();
			nextTick(() => searchInput.value?.focus());
		}
	},
);

// No longer re-fetches on search/type change — visibleAssets (below)
// re-filters the already-loaded list client-side, same as the previous
// defensive fallback did. One network call per open (or none, if cached)
// instead of one per keystroke.

function thumbSrc(asset: MediaAsset): string {
	if (asset.type !== "image") return "";
	return props.media?.resolve(asset.url, { width: 160 }) ?? asset.url;
}

// `asset.url` is frequently a data: URI (mock providers, inline SVG
// placeholders) — slicing after the last "/" on one of those tears into the
// base64 payload instead of finding a filename, since base64 itself can
// contain "/". Prefer `alt`, and only fall back to path-parsing for URLs
// that actually look like paths.
function assetLabel(asset: MediaAsset): string {
	if (asset.alt) return asset.alt;
	if (asset.url.startsWith("data:")) return asset.id;
	const withoutQuery = asset.url.split("?")[0] ?? asset.url;
	return withoutQuery.split("/").pop() || asset.id;
}

// Accepts multiple files (see the `multiple` attribute on the <input> below)
// — uploads them all into the library so they're ready to reuse anywhere,
// without forcing a one-at-a-time round trip through this dialog. `select`
// only auto-fires when exactly one file was chosen (preserves the original
// single-pick convenience for a field's own picker); a bulk batch just
// populates the grid and leaves the choice of which one to use to the user.
async function onFileChange(e: Event) {
	const input = e.target as HTMLInputElement;
	const files = input.files ? Array.from(input.files) : [];
	input.value = "";
	if (!files.length || !props.media) return;

	uploading.value = true;
	error.value = null;
	const uploaded: MediaAsset[] = [];
	try {
		for (const file of files) {
			try {
				uploaded.push(await props.media.upload(file));
			} catch (err) {
				error.value = err instanceof Error ? err.message : "Upload failed";
				// Keep going — one bad file in a batch of 20 shouldn't lose
				// the other 19 that already succeeded.
			}
		}
	} finally {
		uploading.value = false;
	}

	if (uploaded.length) {
		assets.value = [...uploaded, ...assets.value];
		if (props.media) mediaListCache.set(props.media, assets.value);
		if (uploaded.length === 1) emit("select", uploaded[0]!);
	}
}

function triggerUpload() {
	fileInput.value?.click();
}

async function deleteAsset(asset: MediaAsset, e: Event) {
	e.stopPropagation();
	if (!props.media || deleting.value.has(asset.id)) return;
	if (!window.confirm(`Delete "${assetLabel(asset)}"? This can't be undone.`))
		return;

	deleting.value.add(asset.id);
	try {
		await props.media.delete(asset.url);
		assets.value = assets.value.filter((a) => a.id !== asset.id);
		if (props.media) mediaListCache.set(props.media, assets.value);
	} catch (err) {
		error.value = err instanceof Error ? err.message : "Delete failed";
	} finally {
		deleting.value.delete(asset.id);
	}
}

function onBackdrop(e: MouseEvent) {
	if (e.target === e.currentTarget) emit("close");
}

function onKeydown(e: KeyboardEvent) {
	if (e.key === "Escape") emit("close");
}
</script>

<template>
	<Teleport to="body">
		<Transition name="kiv-modal">
			<div
				v-if="open"
				class="kiv-media-backdrop"
				@click="onBackdrop"
				@keydown="onKeydown"
			>
				<div class="kiv-media-modal" role="dialog" aria-modal="true" aria-label="Media library">
					<div class="kiv-media-modal__header">
						<div class="kiv-media-modal__title">Media library</div>
						<button type="button" class="kiv-media-modal__close" @click="$emit('close')">
							<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
								<path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
							</svg>
						</button>
					</div>

					<div class="kiv-media-modal__toolbar">
						<input
							ref="searchInput"
							v-model="search"
							type="text"
							class="kiv-media-modal__search"
							placeholder="Search media…"
							:disabled="!canList"
						/>
						<select v-model="typeFilter" class="kiv-media-modal__filter" :disabled="!canList">
							<option v-for="opt in TYPE_OPTIONS" :key="opt.value" :value="opt.value">
								{{ opt.label }}
							</option>
						</select>
						<button
							type="button"
							class="kiv-media-modal__upload"
							:disabled="uploading || !media"
							@click="triggerUpload"
						>
							{{ uploading ? "Uploading…" : "Upload" }}
						</button>
						<input
							ref="fileInput"
							type="file"
							multiple
							class="kiv-media-modal__file-input"
							accept="image/*,video/*"
							@change="onFileChange"
						/>
					</div>

					<div v-if="!canList" class="kiv-media-modal__notice">
						This media provider doesn't support browsing an existing library — upload a file to use it here.
					</div>
					<div v-if="error" class="kiv-media-modal__error">{{ error }}</div>

					<div class="kiv-media-modal__grid">
						<div v-if="loading" class="kiv-media-modal__empty">Loading…</div>
						<template v-else-if="visibleAssets.length">
							<div v-for="asset in visibleAssets" :key="asset.id" class="kiv-media-modal__card-wrap">
								<button
									type="button"
									class="kiv-media-modal__card"
									:disabled="deleting.has(asset.id)"
									@click="$emit('select', asset)"
								>
									<img
										v-if="asset.type === 'image'"
										:src="thumbSrc(asset)"
										:alt="asset.alt ?? ''"
										class="kiv-media-modal__thumb"
										loading="lazy"
									/>
									<div v-else class="kiv-media-modal__thumb kiv-media-modal__thumb--placeholder">
										{{ asset.type === "video" ? "🎬" : "📄" }}
									</div>
									<span class="kiv-media-modal__card-name">{{ assetLabel(asset) }}</span>
								</button>
								<button
									v-if="media"
									type="button"
									class="kiv-media-modal__delete"
									title="Delete"
									:disabled="deleting.has(asset.id)"
									@click="deleteAsset(asset, $event)"
								>
									<svg width="11" height="11" viewBox="0 0 12 12" fill="none">
										<path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
									</svg>
								</button>
							</div>
						</template>
						<div v-else class="kiv-media-modal__empty">
							{{ canList ? "No media found." : "No files uploaded yet this session." }}
						</div>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.kiv-media-backdrop {
	position: fixed;
	inset: 0;
	z-index: 9999;
	background: rgba(0, 0, 0, 0.55);
	backdrop-filter: blur(2px);
	display: flex;
	align-items: center;
	justify-content: center;
}

.kiv-media-modal {
	width: 560px;
	max-height: 620px;
	background: var(--color-surface-raised);
	border: 1px solid var(--color-border);
	border-radius: 14px;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	box-shadow: 0 24px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.04);
	font-family: var(--font-editor);
}

.kiv-media-modal__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 14px 16px 10px;
	border-bottom: 1px solid var(--color-border);
	flex-shrink: 0;
}
.kiv-media-modal__title {
	font-size: 0.85rem;
	font-weight: 600;
	color: var(--color-text-primary);
}
.kiv-media-modal__close {
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	background: transparent;
	color: var(--color-text-muted);
	cursor: pointer;
	border-radius: 5px;
}
.kiv-media-modal__close:hover {
	background: var(--color-surface-overlay);
	color: var(--color-text-primary);
}

.kiv-media-modal__toolbar {
	display: flex;
	gap: 8px;
	padding: 10px 14px;
	border-bottom: 1px solid var(--color-border);
	flex-shrink: 0;
}
.kiv-media-modal__search {
	flex: 1;
	padding: 6px 10px;
	background: var(--color-surface-base);
	border: 1px solid var(--color-border);
	border-radius: 7px;
	color: var(--color-text-primary);
	font-size: 0.8rem;
	font-family: inherit;
	outline: none;
}
.kiv-media-modal__search:focus {
	border-color: var(--color-accent);
}
.kiv-media-modal__filter {
	padding: 6px 8px;
	background: var(--color-surface-base);
	border: 1px solid var(--color-border);
	border-radius: 7px;
	color: var(--color-text-primary);
	font-size: 0.78rem;
	font-family: inherit;
	outline: none;
}
.kiv-media-modal__upload {
	padding: 6px 14px;
	background: var(--color-accent);
	border: none;
	border-radius: 7px;
	color: #fff;
	font-size: 0.78rem;
	font-weight: 600;
	font-family: inherit;
	cursor: pointer;
	white-space: nowrap;
}
.kiv-media-modal__upload:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}
.kiv-media-modal__file-input {
	display: none;
}

.kiv-media-modal__notice,
.kiv-media-modal__error {
	padding: 8px 14px;
	font-size: 0.72rem;
	color: var(--color-text-muted);
	border-bottom: 1px solid var(--color-border);
	flex-shrink: 0;
}
.kiv-media-modal__error {
	color: var(--color-danger);
}

.kiv-media-modal__grid {
	flex: 1;
	overflow-y: auto;
	overflow-x: hidden;
	padding: 12px 14px;
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 8px;
	align-content: start;
}

.kiv-media-modal__card-wrap {
	position: relative;
}
.kiv-media-modal__card {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 6px;
	min-width: 0;
	width: 100%;
	background: var(--color-surface-overlay);
	border: 1px solid transparent;
	border-radius: 8px;
	cursor: pointer;
	font-family: inherit;
	text-align: left;
}
.kiv-media-modal__card:hover {
	border-color: rgba(99, 102, 241, 0.4);
}
.kiv-media-modal__card:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}
.kiv-media-modal__delete {
	position: absolute;
	top: 4px;
	right: 4px;
	width: 20px;
	height: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(0, 0, 0, 0.6);
	border: none;
	border-radius: 50%;
	color: #fff;
	cursor: pointer;
	opacity: 0;
	transition: opacity 0.12s ease, background 0.12s ease;
}
.kiv-media-modal__card-wrap:hover .kiv-media-modal__delete {
	opacity: 1;
}
.kiv-media-modal__delete:hover {
	background: rgba(220, 38, 38, 0.85);
}
.kiv-media-modal__delete:disabled {
	opacity: 0.3;
	cursor: not-allowed;
}

.kiv-media-modal__thumb {
	width: 100%;
	height: 84px;
	object-fit: cover;
	border-radius: 5px;
	background: var(--color-surface-sunken);
	display: block;
}
.kiv-media-modal__thumb--placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.6rem;
}

.kiv-media-modal__card-name {
	font-size: 0.65rem;
	color: var(--color-text-muted);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.kiv-media-modal__empty {
	grid-column: 1 / -1;
	padding: 40px 14px;
	text-align: center;
	font-size: 0.78rem;
	color: var(--color-text-muted);
}

.kiv-modal-enter-active {
	transition: opacity 0.15s ease, transform 0.15s ease;
}
.kiv-modal-leave-active {
	transition: opacity 0.1s ease, transform 0.1s ease;
}
.kiv-modal-enter-from {
	opacity: 0;
}
.kiv-modal-leave-to {
	opacity: 0;
}
.kiv-modal-enter-from .kiv-media-modal,
.kiv-modal-leave-to .kiv-media-modal {
	transform: scale(0.96) translateY(-8px);
}
</style>
