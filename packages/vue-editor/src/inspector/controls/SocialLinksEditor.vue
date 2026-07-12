<script setup lang="ts">
import type { SocialLink } from "@kiv/nodes";
import { computed } from "vue";

const props = defineProps<{
	modelValue?: string;
}>();

const emit = defineEmits<{
	"update:modelValue": [value: string];
}>();

// Every platform social-icons.ts knows how to render an icon for — kept in
// sync with PLATFORM_ICON there. Showing only these options (instead of a
// free-text platform field) means every link a user adds actually renders
// with a real icon, never a blank/mystery entry.
const PLATFORMS = [
	{ value: "twitter", label: "X (Twitter)" },
	{ value: "facebook", label: "Facebook" },
	{ value: "instagram", label: "Instagram" },
	{ value: "linkedin", label: "LinkedIn" },
	{ value: "youtube", label: "YouTube" },
	{ value: "github", label: "GitHub" },
	{ value: "tiktok", label: "TikTok" },
	{ value: "whatsapp", label: "WhatsApp" },
	{ value: "email", label: "Email" },
] as const;

function parse(v: string | undefined): SocialLink[] {
	if (!v) return [];
	try {
		const parsed = JSON.parse(v);
		if (!Array.isArray(parsed)) return [];
		return parsed
			.filter((item): item is SocialLink => !!item && typeof item === "object")
			.map((item) => ({
				platform: String(item.platform ?? "twitter"),
				url: String(item.url ?? ""),
			}));
	} catch {
		return [];
	}
}

const links = computed(() => parse(props.modelValue));

function commit(next: SocialLink[]): void {
	emit("update:modelValue", JSON.stringify(next));
}

function addLink(): void {
	commit([...links.value, { platform: "twitter", url: "" }]);
}

function updatePlatform(index: number, platform: string): void {
	commit(links.value.map((l, i) => (i === index ? { ...l, platform } : l)));
}

function updateUrl(index: number, url: string): void {
	commit(links.value.map((l, i) => (i === index ? { ...l, url } : l)));
}

function removeLink(index: number): void {
	commit(links.value.filter((_, i) => i !== index));
}
</script>

<template>
	<div class="kiv-social-links">
		<div v-if="links.length === 0" class="kiv-social-links__empty">
			No links yet.
		</div>
		<div v-for="(link, i) in links" :key="i" class="kiv-social-links__row">
			<select
				class="kiv-select kiv-social-links__platform"
				:value="link.platform"
				@change="updatePlatform(i, ($event.target as HTMLSelectElement).value)"
			>
				<option v-for="p in PLATFORMS" :key="p.value" :value="p.value">
					{{ p.label }}
				</option>
			</select>
			<input
				type="text"
				class="kiv-input kiv-social-links__url"
				:value="link.url"
				placeholder="https://..."
				@input="updateUrl(i, ($event.target as HTMLInputElement).value)"
			/>
			<button
				type="button"
				class="kiv-social-links__remove"
				title="Remove link"
				@click="removeLink(i)"
			>&times;</button>
		</div>
		<button type="button" class="kiv-social-links__add" @click="addLink">
			+ Add link
		</button>
	</div>
</template>

<style scoped>
.kiv-social-links {
	display: flex;
	flex-direction: column;
	gap: 6px;
}
.kiv-social-links__empty {
	font-size: 0.75rem;
	color: var(--color-text-muted);
	padding: 6px 2px;
}
.kiv-social-links__row {
	display: flex;
	gap: 6px;
	align-items: center;
}
.kiv-social-links__platform {
	flex: 0 0 118px;
}
.kiv-social-links__url {
	flex: 1;
	min-width: 0;
}
.kiv-social-links__remove {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 22px;
	height: 22px;
	flex-shrink: 0;
	border: none;
	border-radius: 5px;
	background: transparent;
	color: var(--color-text-muted);
	font-size: 0.95rem;
	cursor: pointer;
}
.kiv-social-links__remove:hover {
	color: #ef4444;
	background: rgba(239, 68, 68, 0.1);
}
.kiv-social-links__add {
	align-self: flex-start;
	margin-top: 2px;
	padding: 5px 10px;
	border: 1px solid var(--color-border);
	border-radius: 6px;
	background: var(--color-surface-sunken);
	color: var(--color-text-secondary);
	font-size: 0.75rem;
	cursor: pointer;
}
.kiv-social-links__add:hover {
	border-color: var(--color-accent);
	color: var(--color-accent-light);
}
</style>
