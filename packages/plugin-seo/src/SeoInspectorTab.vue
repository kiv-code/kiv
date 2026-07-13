<script setup lang="ts">
import type { SeoMeta } from "@kivcode/engine";
import { computed } from "vue";
import { generateStructuredData, resolveCanonicalUrl } from "./meta";

interface SeoStore {
	document: { value: { seo?: SeoMeta } };
	updateSeoMeta(patch: Partial<SeoMeta>): void;
}

const props = defineProps<{ store?: SeoStore }>();

const seo = computed<SeoMeta>(() => props.store?.document.value.seo ?? {});

function patch(field: keyof SeoMeta, value: unknown) {
	props.store?.updateSeoMeta({ [field]: value });
}

function onInput(field: keyof SeoMeta, e: Event) {
	patch(field, (e.target as HTMLInputElement).value);
}

function onCheck(field: keyof SeoMeta, e: Event) {
	patch(field, (e.target as HTMLInputElement).checked);
}

function onNumber(field: keyof SeoMeta, e: Event) {
	const raw = (e.target as HTMLInputElement).value;
	patch(field, raw === "" ? undefined : Number(raw));
}

const canonical = computed(() => resolveCanonicalUrl(seo.value));
const structuredData = computed(() =>
	JSON.stringify(generateStructuredData(seo.value), null, 2),
);
</script>

<template>
	<div class="kiv-seo-tab">
		<section class="kiv-seo-tab__group">
			<h4>Search</h4>
			<label>Title<input type="text" :value="seo.title ?? ''" @input="onInput('title', $event)" /></label>
			<label>Meta description<textarea :value="seo.description ?? ''" @input="onInput('description', $event)" /></label>
			<label>Slug<input type="text" :value="seo.slug ?? ''" placeholder="/pricing" @input="onInput('slug', $event)" /></label>
			<label>Canonical URL<input type="text" :value="seo.canonicalUrl ?? ''" :placeholder="canonical ?? ''" @input="onInput('canonicalUrl', $event)" /></label>
			<div class="kiv-seo-tab__preview" v-if="canonical">{{ canonical }}</div>
		</section>

		<section class="kiv-seo-tab__group">
			<h4>Indexing</h4>
			<label class="kiv-seo-tab__checkbox">
				<input type="checkbox" :checked="seo.noindex === true" @change="onCheck('noindex', $event)" />
				Noindex
			</label>
			<label class="kiv-seo-tab__checkbox">
				<input type="checkbox" :checked="seo.nofollow === true" @change="onCheck('nofollow', $event)" />
				Nofollow
			</label>
			<label>Sitemap priority
				<input type="number" min="0" max="1" step="0.1" :value="seo.sitemapPriority ?? ''" @input="onNumber('sitemapPriority', $event)" />
			</label>
		</section>

		<section class="kiv-seo-tab__group">
			<h4>Social preview</h4>
			<label>OG title<input type="text" :value="seo.ogTitle ?? ''" :placeholder="seo.title ?? ''" @input="onInput('ogTitle', $event)" /></label>
			<label>OG description<textarea :value="seo.ogDescription ?? ''" :placeholder="seo.description ?? ''" @input="onInput('ogDescription', $event)" /></label>
			<label>OG image URL<input type="text" :value="seo.ogImage ?? ''" @input="onInput('ogImage', $event)" /></label>
			<label>Twitter card
				<select :value="seo.twitterCard ?? 'summary'" @change="onInput('twitterCard', $event)">
					<option value="summary">Summary</option>
					<option value="summary_large_image">Summary (large image)</option>
				</select>
			</label>
			<div class="kiv-seo-tab__card">
				<img v-if="seo.ogImage" :src="seo.ogImage" alt="" class="kiv-seo-tab__card-image" />
				<div class="kiv-seo-tab__card-body">
					<strong>{{ seo.ogTitle || seo.title || "Untitled page" }}</strong>
					<p>{{ seo.ogDescription || seo.description || "No description set." }}</p>
				</div>
			</div>
		</section>

		<section class="kiv-seo-tab__group">
			<h4>Structured data (JSON-LD)</h4>
			<pre class="kiv-seo-tab__jsonld">{{ structuredData }}</pre>
		</section>
	</div>
</template>

<style scoped>
.kiv-seo-tab {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 12px;
	font-size: 0.78rem;
	color: var(--color-text-primary, #e2e8f0);
}
.kiv-seo-tab__group {
	display: flex;
	flex-direction: column;
	gap: 8px;
}
.kiv-seo-tab__group h4 {
	margin: 0;
	font-size: 0.68rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--color-text-secondary, #94a3b8);
}
.kiv-seo-tab__group label {
	display: flex;
	flex-direction: column;
	gap: 4px;
	font-size: 0.72rem;
	color: var(--color-text-secondary, #94a3b8);
}
.kiv-seo-tab__checkbox {
	flex-direction: row !important;
	align-items: center;
	gap: 6px !important;
}
.kiv-seo-tab__group input,
.kiv-seo-tab__group textarea,
.kiv-seo-tab__group select {
	padding: 6px 8px;
	background: var(--color-surface-base, #0d0f17);
	border: 1px solid var(--color-border, #1e2130);
	border-radius: 6px;
	color: var(--color-text-primary, #e2e8f0);
	font-size: 0.78rem;
	font-family: inherit;
}
.kiv-seo-tab__preview {
	font-size: 0.68rem;
	color: var(--color-text-muted, #64748b);
	word-break: break-all;
}
.kiv-seo-tab__card {
	display: flex;
	flex-direction: column;
	border: 1px solid var(--color-border, #1e2130);
	border-radius: 8px;
	overflow: hidden;
}
.kiv-seo-tab__card-image {
	width: 100%;
	height: 120px;
	object-fit: cover;
}
.kiv-seo-tab__card-body {
	padding: 8px 10px;
	display: flex;
	flex-direction: column;
	gap: 4px;
}
.kiv-seo-tab__card-body p {
	margin: 0;
	color: var(--color-text-muted, #64748b);
}
.kiv-seo-tab__jsonld {
	margin: 0;
	padding: 8px;
	background: var(--color-surface-base, #0d0f17);
	border: 1px solid var(--color-border, #1e2130);
	border-radius: 6px;
	font-size: 0.68rem;
	overflow-x: auto;
	white-space: pre;
}
</style>
