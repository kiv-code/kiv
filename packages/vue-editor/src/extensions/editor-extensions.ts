import type {
	ComponentDef,
	EditorExtensionPoints,
	InspectorTab,
	KivDocument,
	KivNode,
	PaletteItem,
	ShortcutDef,
	ToolbarButton,
} from "@kivcode/engine";
import { shallowReactive } from "vue";

/**
 * Plugins register UI (toolbar buttons, inspector tabs, …) from
 * `onEditorReady`, which fires from `KivEditor`'s `onMounted` — strictly
 * later than any consumer's initial, non-reactive read of these collections.
 * Every collection is a Vue-reactive Map/array so consumers (KivEditor's
 * toolbar `v-for`, KivInspector's tab list, KivNodePalette's merged items)
 * pick up registrations that happen after they've already rendered once.
 * `shallowReactive` (not `reactive`) — the values are Vue component
 * definitions and callback functions, which must NOT be deep-proxied.
 */
export class EditorExtensions implements EditorExtensionPoints {
	private readonly _toolbarButtons: ToolbarButton[] = shallowReactive([]);
	private readonly _paletteItems: PaletteItem[] = shallowReactive([]);
	private readonly _inspectorTabs = shallowReactive(
		new Map<string, InspectorTab>(),
	);
	private readonly _fieldControls = shallowReactive(
		new Map<string, ComponentDef>(),
	);
	private readonly _keyboardShortcuts: ShortcutDef[] = shallowReactive([]);
	private readonly _nodeSelectCbs = new Set<(node: KivNode) => void>();
	private readonly _nodeCreateCbs = new Set<(node: KivNode) => void>();
	private readonly _documentChangeCbs = new Set<(doc: KivDocument) => void>();
	/** Stored but not rendered yet — available for future panel UI. */
	private readonly _panels = shallowReactive(new Map<string, ComponentDef>());

	// ── Registry (write) API ───────────────────────────────────────────────

	addToolbarButton(btn: ToolbarButton): void {
		this._toolbarButtons.push(btn);
	}

	addPaletteItem(item: PaletteItem): void {
		this._paletteItems.push(item);
	}

	addInspectorTab(name: string, component: ComponentDef): void {
		this._inspectorTabs.set(name, { name, label: name, component });
	}

	addFieldControl(type: string, component: ComponentDef): void {
		this._fieldControls.set(type, component);
	}

	addKeyboardShortcut(sc: ShortcutDef): void {
		this._keyboardShortcuts.push(sc);
	}

	addPanel(name: string, component: ComponentDef): void {
		this._panels.set(name, component);
	}

	onNodeSelect(cb: (node: KivNode) => void): void {
		this._nodeSelectCbs.add(cb);
	}

	onNodeCreate(cb: (node: KivNode) => void): void {
		this._nodeCreateCbs.add(cb);
	}

	onDocumentChange(cb: (doc: KivDocument) => void): void {
		this._documentChangeCbs.add(cb);
	}

	// ── Consumer (read) API ────────────────────────────────────────────────

	getToolbarButtons(): readonly ToolbarButton[] {
		return this._toolbarButtons;
	}

	getPaletteItems(): readonly PaletteItem[] {
		return this._paletteItems;
	}

	getInspectorTabs(): Map<string, InspectorTab> {
		return this._inspectorTabs;
	}

	getFieldControl(type: string): ComponentDef | undefined {
		return this._fieldControls.get(type);
	}

	getKeyboardShortcuts(): readonly ShortcutDef[] {
		return this._keyboardShortcuts;
	}

	// ── Trigger methods ────────────────────────────────────────────────────

	notifyNodeSelected(node: KivNode): void {
		for (const cb of this._nodeSelectCbs) cb(node);
	}

	notifyNodeCreated(node: KivNode): void {
		for (const cb of this._nodeCreateCbs) cb(node);
	}

	notifyDocumentChanged(doc: KivDocument): void {
		for (const cb of this._documentChangeCbs) cb(doc);
	}
}
