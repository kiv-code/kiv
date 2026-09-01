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

/**
 * Plugins register UI (toolbar buttons, inspector tabs, …) from
 * `onEditorReady`, which fires from `KivEditor`'s mount effect — strictly
 * later than any consumer's initial, non-reactive read of these collections.
 *
 * Unlike the Vue port (whose `shallowReactive` arrays/maps trigger Vue's
 * proxy-based reactivity automatically), plain JS collections mutated from
 * outside React's render cycle don't reactively announce themselves — so
 * every mutation here bumps a version counter and notifies subscribers,
 * meant to be read via `useSyncExternalStore(ext.subscribe, ext.getVersion)`
 * (see `useEditorExtensionsVersion` in `./use-editor-extensions`).
 */
export class EditorExtensions implements EditorExtensionPoints {
	private readonly _toolbarButtons: ToolbarButton[] = [];
	private readonly _paletteItems: PaletteItem[] = [];
	private readonly _inspectorTabs = new Map<string, InspectorTab>();
	private readonly _fieldControls = new Map<string, ComponentDef>();
	private readonly _keyboardShortcuts: ShortcutDef[] = [];
	private readonly _nodeSelectCbs = new Set<(node: KivNode) => void>();
	private readonly _nodeCreateCbs = new Set<(node: KivNode) => void>();
	private readonly _documentChangeCbs = new Set<(doc: KivDocument) => void>();
	/** Stored but not rendered yet — available for future panel UI. */
	private readonly _panels = new Map<string, ComponentDef>();

	private readonly _listeners = new Set<() => void>();
	private _version = 0;

	private touch(): void {
		this._version++;
		for (const listener of this._listeners) listener();
	}

	// ── External-store plumbing (for useSyncExternalStore) ─────────────────

	subscribe = (listener: () => void): (() => void) => {
		this._listeners.add(listener);
		return () => {
			this._listeners.delete(listener);
		};
	};

	getVersion = (): number => this._version;

	// ── Registry (write) API ───────────────────────────────────────────────

	addToolbarButton(btn: ToolbarButton): void {
		this._toolbarButtons.push(btn);
		this.touch();
	}

	addPaletteItem(item: PaletteItem): void {
		this._paletteItems.push(item);
		this.touch();
	}

	addInspectorTab(name: string, component: ComponentDef): void {
		this._inspectorTabs.set(name, { name, label: name, component });
		this.touch();
	}

	addFieldControl(type: string, component: ComponentDef): void {
		this._fieldControls.set(type, component);
		this.touch();
	}

	addKeyboardShortcut(sc: ShortcutDef): void {
		this._keyboardShortcuts.push(sc);
		this.touch();
	}

	addPanel(name: string, component: ComponentDef): void {
		this._panels.set(name, component);
		this.touch();
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
