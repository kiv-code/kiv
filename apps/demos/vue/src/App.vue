<script setup lang="ts">
import { KivEditor } from "@kiv/editor";
import type { KivDocument } from "@kiv/engine";
import { createEngine } from "@kiv/engine";
import { ALL_NODES } from "@kiv/nodes";
import { createDefaultVueRegistry } from "@kiv/vue";
import { ref } from "vue";
import { demoDocument } from "./demo-document";

const engine = createEngine({ nodes: [...ALL_NODES] });
const vueRegistry = createDefaultVueRegistry();

// Inject CSS variables into <head>
const styleEl = document.createElement("style");
styleEl.textContent = engine.css();
document.head.appendChild(styleEl);

const doc = ref<KivDocument>(demoDocument);

function onDocumentUpdate(updated: KivDocument) {
	doc.value = updated;
}
</script>

<template>
	<div class="demo">
		<KivEditor
			:document="doc"
			:registry="engine.registry"
			:vue-registry="vueRegistry"
			title="Kiv Demo"
			@update:document="onDocumentUpdate"
		/>
	</div>
</template>

<style>
*,
*::before,
*::after {
	box-sizing: border-box;
}
html,
body {
	margin: 0;
	padding: 0;
	height: 100%;
	background: #0f1117;
}
.demo {
	height: 100vh;
	display: flex;
	flex-direction: column;
}
</style>
