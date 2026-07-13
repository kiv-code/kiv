<script setup lang="ts">
import type { KivDocument } from "@kivcode/engine";
import { computed } from "vue";
import { type A11yIssue, checkDocument } from "./rules";

interface A11yStore {
	document: { value: KivDocument };
	select(id: string | null): void;
}

const props = defineProps<{ store?: A11yStore }>();

const issues = computed<A11yIssue[]>(() =>
	props.store ? checkDocument(props.store.document.value) : [],
);

const errorCount = computed(
	() => issues.value.filter((i) => i.severity === "error").length,
);
const warningCount = computed(
	() => issues.value.filter((i) => i.severity === "warning").length,
);

function selectNode(issue: A11yIssue): void {
	props.store?.select(issue.nodeId);
}
</script>

<template>
	<div class="kiv-a11y-panel">
		<div class="kiv-a11y-panel__summary">
			<span v-if="errorCount" class="kiv-a11y-panel__badge kiv-a11y-panel__badge--error">{{ errorCount }} error{{ errorCount === 1 ? "" : "s" }}</span>
			<span v-if="warningCount" class="kiv-a11y-panel__badge kiv-a11y-panel__badge--warning">{{ warningCount }} warning{{ warningCount === 1 ? "" : "s" }}</span>
			<span v-if="!issues.length" class="kiv-a11y-panel__badge kiv-a11y-panel__badge--ok">No issues found</span>
		</div>
		<ul class="kiv-a11y-panel__list">
			<li
				v-for="(issue, i) in issues"
				:key="`${issue.nodeId}-${issue.ruleId}-${i}`"
				class="kiv-a11y-panel__item"
				:class="`kiv-a11y-panel__item--${issue.severity}`"
				@click="selectNode(issue)"
			>
				<span class="kiv-a11y-panel__item-severity">{{ issue.severity === "error" ? "⛔" : "⚠️" }}</span>
				<div class="kiv-a11y-panel__item-body">
					<div class="kiv-a11y-panel__item-message">{{ issue.message }}</div>
					<div class="kiv-a11y-panel__item-meta">{{ issue.nodeType }} · #{{ issue.nodeId }}</div>
				</div>
			</li>
		</ul>
	</div>
</template>

<style scoped>
.kiv-a11y-panel {
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 12px;
	font-size: 0.78rem;
	color: var(--color-text-primary, #e2e8f0);
}
.kiv-a11y-panel__summary {
	display: flex;
	gap: 6px;
}
.kiv-a11y-panel__badge {
	padding: 3px 8px;
	border-radius: 6px;
	font-size: 0.68rem;
	font-weight: 700;
}
.kiv-a11y-panel__badge--error { background: rgba(239, 68, 68, 0.18); color: #fca5a5; }
.kiv-a11y-panel__badge--warning { background: rgba(251, 191, 36, 0.18); color: #fcd34d; }
.kiv-a11y-panel__badge--ok { background: rgba(52, 211, 153, 0.18); color: #6ee7b7; }
.kiv-a11y-panel__list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 6px;
}
.kiv-a11y-panel__item {
	display: flex;
	gap: 8px;
	padding: 8px;
	border-radius: 8px;
	background: var(--color-surface-overlay, #1a1d2a);
	cursor: pointer;
}
.kiv-a11y-panel__item:hover {
	background: var(--color-surface-raised, #16181f);
}
.kiv-a11y-panel__item-severity {
	flex-shrink: 0;
}
.kiv-a11y-panel__item-message {
	color: var(--color-text-primary, #e2e8f0);
}
.kiv-a11y-panel__item-meta {
	font-size: 0.66rem;
	color: var(--color-text-muted, #64748b);
	margin-top: 2px;
}
</style>
