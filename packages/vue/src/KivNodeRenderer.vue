<script setup lang="ts">
import type { KivNode } from "@kiv/engine";
import { resolveNode } from "@kiv/engine";
import { computed, inject } from "vue";
import { KIV_CONTEXT_KEY } from "./context";

const props = defineProps<{ node: KivNode }>();

const ctx = inject(KIV_CONTEXT_KEY);

const resolved = computed(() => {
	if (!ctx)
		return {
			id: props.node.id,
			type: props.node.type,
			props: props.node.props,
		};
	return resolveNode(props.node, ctx.resolveCtx);
});

const component = computed(() => {
	if (!ctx) return null;
	return ctx.registry.get(props.node.type) ?? null;
});

const slotEntries = computed(() => Object.entries(props.node.slots ?? {}));
</script>

<template>
	<component
		:is="component"
		v-if="component"
		v-bind="resolved.props"
		:node-id="resolved.id"
	>
		<template v-for="[slotName, children] in slotEntries" #[slotName]="slotProps">
			<KivNodeRenderer
				v-for="child in children"
				:key="child.id"
				:node="child"
				v-bind="slotProps"
			/>
		</template>
	</component>
	<div v-else style="display:none" :data-kiv-unknown="node.type" />
</template>
