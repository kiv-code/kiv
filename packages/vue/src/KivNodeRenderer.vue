<script setup lang="ts">
import type { KivNode } from "@kiv/engine";
import { resolveNode } from "@kiv/engine";
import type { ComputedRef } from "vue";
import { computed, inject } from "vue";
import type { KivRenderContext } from "./context";
import { KIV_CONTEXT_KEY } from "./context";

const props = defineProps<{ node: KivNode }>();

const ctx = inject<ComputedRef<KivRenderContext> | KivRenderContext>(
	KIV_CONTEXT_KEY,
);

const resolvedCtx = computed(() =>
	ctx ? ("value" in ctx ? ctx.value : ctx) : null,
);

const resolved = computed(() => {
	const c = resolvedCtx.value;
	if (!c)
		return {
			id: props.node.id,
			type: props.node.type,
			props: props.node.props,
		};
	return resolveNode(props.node, c.resolveCtx);
});

const component = computed(() => {
	const c = resolvedCtx.value;
	if (!c) return null;
	return c.registry.get(props.node.type) ?? null;
});

const slotEntries = computed(() => Object.entries(props.node.slots ?? {}));
</script>

<template>
	<component
		:is="component"
		v-if="component"
		v-bind="resolved.props"
		:id="resolved.id"
		:node-id="resolved.id"
		:data-kiv-node-id="resolved.id"
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
