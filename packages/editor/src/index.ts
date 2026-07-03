import "./tailwind.css";

export { default as KivCanvas } from "./components/KivCanvas.vue";
export { default as KivEditor } from "./components/KivEditor.vue";
export { default as KivInspector } from "./components/KivInspector.vue";
export { default as KivTree } from "./components/KivTree.vue";
export { type EditorStore, useEditorStore } from "./store/editor-store";
export {
	addNode,
	cloneDocument,
	findNode,
	moveNode,
	type NodeLocation,
	removeNode,
	updateNodeProps,
} from "./utils/document-ops";
