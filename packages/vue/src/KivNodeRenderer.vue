<script setup lang="ts">
import type { KivNode } from "@kivcode/engine";
import { resolveNode, resolveResponsive } from "@kivcode/engine";
import type { ComputedRef } from "vue";
import { computed, inject } from "vue";
import type { KivRenderContext } from "./context";
import { KIV_CONTEXT_KEY } from "./context";
import { KIV_EDITOR_MODE_KEY } from "./editor-mode";

const props = defineProps<{ node: KivNode }>();

const ctx = inject<ComputedRef<KivRenderContext> | KivRenderContext>(
	KIV_CONTEXT_KEY,
);
const isEditorMode = inject(KIV_EDITOR_MODE_KEY, false);

const resolvedCtx = computed(() =>
	ctx ? ("value" in ctx ? ctx.value : ctx) : null,
);

// Hidden-for-this-breakpoint nodes render nothing in production, but stay
// visible-and-dimmed in the editor so they can still be selected and un-hidden.
const isVisible = computed(() => {
	const breakpoint = resolvedCtx.value?.resolveCtx.breakpoint ?? "base";
	return resolveResponsive<boolean>(props.node.visible, breakpoint) !== false;
});
const shouldRender = computed(() => isVisible.value || isEditorMode);
const editorHiddenStyle = computed(() =>
	isEditorMode && !isVisible.value ? { opacity: "0.35" } : undefined,
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

function onDragStart(e: DragEvent) {
	if (!isEditorMode || !e.dataTransfer) return;
	e.dataTransfer.setData("text/plain", resolved.value.id);
	e.dataTransfer.effectAllowed = "move";
}
</script>

<template>
	<component
		v-if="component && shouldRender"
		:is="component"
		v-bind="resolved.props"
		:id="resolved.id"
		:node-id="resolved.id"
		:data-kiv-node-id="resolved.id"
		:data-kiv-hidden="isVisible ? undefined : 'true'"
		:draggable="isEditorMode || undefined"
		:style="editorHiddenStyle"
		@dragstart="onDragStart"
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
	<div v-else-if="shouldRender" style="display:none" :data-kiv-unknown="node.type" />
</template>
