import { useSyncExternalStore } from "react";
import type { EditorExtensions } from "./editor-extensions";

/**
 * Subscribes the calling component to `ext`'s mutations (a plugin adding a
 * toolbar button, inspector tab, etc. at any time after mount) — call it,
 * discard the returned version number, then read `ext.getToolbarButtons()`/
 * `ext.getInspectorTabs()`/etc. directly. Re-renders the component whenever
 * any extension point changes, same as consuming a Vue `shallowReactive`
 * collection in a template.
 */
export function useEditorExtensionsVersion(ext: EditorExtensions): number {
	return useSyncExternalStore(ext.subscribe, ext.getVersion, ext.getVersion);
}
