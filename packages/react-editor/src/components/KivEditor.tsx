import type {
	Breakpoint,
	EventBus,
	KivDocument,
	KivEngine,
	KivNode,
	PageTemplate,
	Registry,
} from "@kivcode/engine";
import { BUILT_IN_TEMPLATES, cloneNodeTree } from "@kivcode/engine";
import type { ContentTemplate } from "@kivcode/nodes-interactive";
import { CONTENT_TEMPLATES } from "@kivcode/nodes-interactive";
import type { ReactRegistry } from "@kivcode/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EditorExtensions } from "../extensions/editor-extensions";
import { useEditorExtensionsVersion } from "../extensions/use-editor-extensions";
import { ColorGradientControl } from "../inspector/controls/ColorGradientControl";
import { FontPicker } from "../inspector/controls/FontPicker";
import { FontWeightControl } from "../inspector/controls/FontWeightControl";
import { IconPicker } from "../inspector/controls/IconPicker";
import { MediaPicker } from "../inspector/controls/MediaPicker";
import { PricingEditor } from "../inspector/controls/PricingEditor";
import { SizeSliderControl } from "../inspector/controls/SizeSliderControl";
import { SocialLinksEditor } from "../inspector/controls/SocialLinksEditor";
import { SpacingBoxControl } from "../inspector/controls/SpacingBoxControl";
import { TableEditor } from "../inspector/controls/TableEditor";
import { EditorExtensionsContext, EditorStoreContext } from "../store/context";
import { useEditorStore } from "../store/editor-store";
import { insertNodeNearSelection } from "../utils/insert-node";
import { getNodeLabel } from "../utils/node-labels";
import type { DisabledNodeTypes } from "../utils/palette-items";
import { KivBlockLibrary } from "./KivBlockLibrary";
import { KivCanvas } from "./KivCanvas";
import { KivInspector } from "./KivInspector";
import { KivNodePalette } from "./KivNodePalette";
import { KivTemplateBrowser } from "./KivTemplateBrowser";
import { KivTree } from "./KivTree";

export interface KivEditorProps {
	document: KivDocument;
	registry: Registry;
	/** Renderer registry for `KivCanvas`'s preview — the React equivalent of
	 * the Vue port's `vueRegistry` prop. */
	reactRegistry: ReactRegistry;
	title?: string;
	theme?: "dark" | "light";
	/** Shared bus (e.g. `engine.bus`) so plugins can observe editor mutations. */
	bus?: EventBus;
	/** Engine reference — when provided, triggers `setEditorExtensions()` on mount so plugins' `onEditorReady` fires. */
	engine?: KivEngine;
	/** Node types to show locked in the "Add node" palette (dimmed, lock icon,
	 * not insertable) — e.g. `{ form: "Requires a backend endpoint this app
	 * hasn't wired up yet." }`. Use for node types that are valid in kiv but
	 * not yet functional in THIS consuming app, to avoid the "looks usable,
	 * silently does nothing" trap. */
	disabledNodeTypes?: DisabledNodeTypes;
	onDocumentChange?: (doc: KivDocument) => void;
}

interface BpDef {
	value: Breakpoint;
	label: string;
	width: string;
	icon: string;
}

const BREAKPOINTS: BpDef[] = [
	{ value: "base", label: "Mobile", width: "390px", icon: "📱" },
	{ value: "md", label: "Tablet", width: "768px", icon: "📟" },
	{ value: "lg", label: "Desktop", width: "1280px", icon: "🖥" },
	{ value: "xl", label: "Wide", width: "100%", icon: "◼" },
];

export function KivEditor({
	document,
	registry,
	reactRegistry,
	theme,
	bus,
	engine,
	disabledNodeTypes,
	onDocumentChange,
}: KivEditorProps) {
	const store = useEditorStore(document, registry, {
		bus,
		media: engine?.media ?? null,
		fonts: engine?.fonts ?? null,
		services: engine?.services ?? null,
	});

	const [extensions] = useState(() => {
		const ext = new EditorExtensions();
		ext.addFieldControl("icon-picker", IconPicker);
		ext.addFieldControl("font-picker", FontPicker);
		ext.addFieldControl("font-weight", FontWeightControl);
		ext.addFieldControl("color-gradient", ColorGradientControl);
		ext.addFieldControl("size-slider", SizeSliderControl);
		ext.addFieldControl("spacing-box", SpacingBoxControl);
		ext.addFieldControl("media-picker", MediaPicker);
		ext.addFieldControl("table-editor", TableEditor);
		ext.addFieldControl("pricing-editor", PricingEditor);
		ext.addFieldControl("social-links-editor", SocialLinksEditor);
		return ext;
	});
	// Re-renders this component when a plugin registers a toolbar button later.
	useEditorExtensionsVersion(extensions);

	// biome-ignore lint/correctness/useExhaustiveDependencies: `EditorEngine` always produces a NEW document object on mutation (never mutates in place), so reference-equality on `store.document` is the correct "deep watch" equivalent — `onDocumentChange`/`extensions` are stable for the component's lifetime
	useEffect(() => {
		onDocumentChange?.(store.document);
		extensions.notifyDocumentChanged(store.document);
	}, [store.document]);

	// Always-fresh handle on the current document for the bus subscriptions
	// below, which (mirroring the Vue original's onMounted) subscribe once and
	// must not read a stale closure on later events.
	const documentRef = useRef(store.document);
	documentRef.current = store.document;

	// Wire extension notifications to editor store events
	// biome-ignore lint/correctness/useExhaustiveDependencies: mirrors the Vue original's onMounted — subscribes once per `engine`/`bus` identity; `documentRef` gives the callbacks a live read without re-subscribing on every document change
	useEffect(() => {
		if (engine) {
			engine.setEditorExtensions(extensions);
		}
		if (!bus) return;

		function find(n: KivNode, id: string): KivNode | null {
			if (n.id === id) return n;
			for (const children of Object.values(n.slots ?? {})) {
				for (const child of children) {
					const found = find(child, id);
					if (found) return found;
				}
			}
			return null;
		}

		const unsubSelect = bus.on("selection.changed", (state) => {
			const ids = state.ids;
			if (ids.length > 0 && ids[0]) {
				const node = find(documentRef.current.root, ids[0]);
				if (node) extensions.notifyNodeSelected(node);
			}
		});

		const unsubCreate = bus.on("node.created", (payload) => {
			const node = find(documentRef.current.root, payload.id);
			if (node) extensions.notifyNodeCreated(node);
		});

		return () => {
			unsubSelect();
			unsubCreate();
		};
	}, [engine, bus]);

	const [treeOpen, setTreeOpen] = useState(true);
	const [inspectorOpen, setInspectorOpen] = useState(true);
	const [paletteOpen, setPaletteOpen] = useState(false);
	const [templatesOpen, setTemplatesOpen] = useState(false);
	const [blocksOpen, setBlocksOpen] = useState(false);

	function applyTemplate(template: PageTemplate): void {
		// Templates carry boilerplate single-locale i18n; taking it verbatim would
		// collapse a multi-locale document and hide the translation UI. Keep ours.
		store.loadDocument({
			...template.document,
			i18n: store.document.i18n ?? template.document.i18n,
		});
	}

	function insertBlock(template: ContentTemplate): void {
		const node = cloneNodeTree(template.create());
		insertNodeNearSelection(store, node);
		store.select(node.id);
	}

	// Editor chrome theme — initialized from prop, toggleable at runtime
	const [editorTheme, setEditorTheme] = useState<"dark" | "light">(
		theme ?? "dark",
	);
	function toggleTheme() {
		setEditorTheme((t) => (t === "dark" ? "light" : "dark"));
	}

	// Locales available in the document (for the toolbar switcher)
	const locales = useMemo<string[]>(
		() => store.document.i18n?.supported ?? [],
		[store.document],
	);
	const hasMultipleLocales = locales.length > 1;
	function localeLabel(loc: string) {
		return loc.toUpperCase();
	}

	function openPalette() {
		setPaletteOpen(true);
	}
	function closePalette() {
		setPaletteOpen(false);
	}

	// Smart insert: if selected has slots → append inside as last child.
	// If selected is a leaf (no slots) → insert after it in its parent.
	// No selection → append to root's first slot.
	function onPaletteAdd(node: KivNode) {
		insertNodeNearSelection(store, node);
		store.select(node.id);
		setPaletteOpen(false);
	}

	return (
		<EditorStoreContext.Provider value={store}>
			<EditorExtensionsContext.Provider value={extensions}>
				<div
					className={`kiv-editor ${editorTheme === "light" ? "kiv-editor--light" : "kiv-editor--dark"}`}
				>
					{/* Toolbar */}
					<header className="kiv-editor__toolbar">
						<div className="kiv-toolbar__left">
							<button
								type="button"
								className={`kiv-toolbar__panel-toggle${treeOpen ? " active" : ""}`}
								title="Toggle structure panel"
								onClick={() => setTreeOpen((v) => !v)}
							>
								<svg
									width="15"
									height="15"
									viewBox="0 0 15 15"
									fill="none"
									aria-hidden="true"
								>
									<rect
										x="1"
										y="3"
										width="5"
										height="9"
										rx="1"
										fill="currentColor"
										opacity=".6"
									/>
									<rect
										x="8"
										y="1"
										width="6"
										height="4"
										rx="1"
										fill="currentColor"
									/>
									<rect
										x="8"
										y="7"
										width="6"
										height="4"
										rx="1"
										fill="currentColor"
										opacity=".6"
									/>
								</svg>
							</button>
							<div className="kiv-toolbar__sep" />
							<button
								type="button"
								className="kiv-toolbar__action"
								disabled={!store.canUndo}
								title="Undo (⌘Z)"
								onClick={() => store.undo()}
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									aria-hidden="true"
								>
									<path d="M3 7v6h6" />
									<path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
								</svg>
							</button>
							<button
								type="button"
								className="kiv-toolbar__action"
								title="Redo (⌘⇧Z)"
								disabled={!store.canRedo}
								onClick={() => store.redo()}
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									aria-hidden="true"
								>
									<path d="M21 7v6h-6" />
									<path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
								</svg>
							</button>

							{/* Plugin toolbar buttons */}
							{extensions.getToolbarButtons().map((btn) => (
								<div key={btn.id} style={{ display: "contents" }}>
									<div className="kiv-toolbar__sep" />
									<button
										type="button"
										className="kiv-toolbar__action"
										title={btn.label}
										onClick={() => btn.onClick()}
									>
										{btn.icon ? btn.icon : btn.label}
									</button>
								</div>
							))}

							{/* Locale switcher (only when doc supports more than one) */}
							{hasMultipleLocales ? (
								<>
									<div className="kiv-toolbar__sep" />
									<div className="kiv-locale-switcher" title="Preview locale">
										<svg
											width="13"
											height="13"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											aria-hidden="true"
										>
											<circle cx="12" cy="12" r="9" />
											<path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
										</svg>
										{locales.map((loc) => (
											<button
												key={loc}
												type="button"
												className={`kiv-locale-btn${store.locale === loc ? " kiv-locale-btn--active" : ""}`}
												onClick={() => store.setLocale(loc)}
											>
												{localeLabel(loc)}
											</button>
										))}
									</div>
								</>
							) : null}
						</div>

						<div className="kiv-toolbar__center">
							<div className="kiv-bp-switcher">
								{BREAKPOINTS.map((bp) => (
									<button
										key={bp.value}
										type="button"
										className={`kiv-bp-btn${store.breakpoint === bp.value ? " kiv-bp-btn--active" : ""}`}
										title={bp.label}
										onClick={() => store.setBreakpoint(bp.value)}
									>
										<span className="kiv-bp-btn__icon">{bp.icon}</span>
										<span className="kiv-bp-btn__label">{bp.label}</span>
									</button>
								))}
							</div>
						</div>

						<div className="kiv-toolbar__right">
							<button
								type="button"
								className="kiv-toolbar__zoom-btn"
								title="Reset zoom (⌘0)"
								onClick={() => store.resetZoom()}
							>
								{Math.round(store.zoom * 100)}%
							</button>
							<div className="kiv-toolbar__sep" />
							<button
								type="button"
								className="kiv-toolbar__add-btn"
								title="Add node"
								onClick={openPalette}
							>
								<svg
									width="11"
									height="11"
									viewBox="0 0 11 11"
									fill="none"
									aria-hidden="true"
								>
									<path
										d="M5.5 1v9M1 5.5h9"
										stroke="currentColor"
										strokeWidth="1.8"
										strokeLinecap="round"
									/>
								</svg>
								Add
							</button>
							<div className="kiv-toolbar__sep" />
							<button
								type="button"
								className="kiv-toolbar__action"
								title="Page templates"
								onClick={() => setTemplatesOpen(true)}
							>
								<svg
									width="15"
									height="15"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									aria-hidden="true"
								>
									<rect x="3" y="3" width="7" height="7" rx="1" />
									<rect x="14" y="3" width="7" height="7" rx="1" />
									<rect x="3" y="14" width="7" height="7" rx="1" />
									<rect x="14" y="14" width="7" height="7" rx="1" />
								</svg>
							</button>
							<button
								type="button"
								className="kiv-toolbar__action"
								title="Insert block"
								onClick={() => setBlocksOpen(true)}
							>
								<svg
									width="15"
									height="15"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									aria-hidden="true"
								>
									<rect x="3" y="3" width="18" height="7" rx="1" />
									<rect x="3" y="14" width="8" height="7" rx="1" />
									<rect x="14" y="14" width="7" height="7" rx="1" />
								</svg>
							</button>
							<div className="kiv-toolbar__sep" />
							<button
								type="button"
								className="kiv-toolbar__action"
								title={
									editorTheme === "dark"
										? "Switch to light mode"
										: "Switch to dark mode"
								}
								onClick={toggleTheme}
							>
								{editorTheme === "dark" ? (
									<svg
										width="15"
										height="15"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										aria-hidden="true"
									>
										<circle cx="12" cy="12" r="4" />
										<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
									</svg>
								) : (
									<svg
										width="15"
										height="15"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										aria-hidden="true"
									>
										<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
									</svg>
								)}
							</button>
							<div className="kiv-toolbar__sep" />
							<button
								type="button"
								className={`kiv-toolbar__panel-toggle${inspectorOpen ? " active" : ""}`}
								title="Toggle inspector"
								onClick={() => setInspectorOpen((v) => !v)}
							>
								<svg
									width="15"
									height="15"
									viewBox="0 0 15 15"
									fill="none"
									aria-hidden="true"
								>
									<rect
										x="9"
										y="3"
										width="5"
										height="9"
										rx="1"
										fill="currentColor"
										opacity=".6"
									/>
									<rect
										x="1"
										y="1"
										width="6"
										height="4"
										rx="1"
										fill="currentColor"
									/>
									<rect
										x="1"
										y="7"
										width="6"
										height="4"
										rx="1"
										fill="currentColor"
										opacity=".6"
									/>
								</svg>
							</button>
						</div>
					</header>

					{/* Body */}
					<div className="kiv-editor__body">
						{treeOpen ? <KivTree onOpenPalette={openPalette} /> : null}
						<KivCanvas registry={reactRegistry} engineRegistry={registry} />
						{inspectorOpen ? <KivInspector registry={registry} /> : null}
					</div>

					<KivNodePalette
						open={paletteOpen}
						selectedNodeType={store.selected?.type}
						selectedNodeLabel={
							store.selected
								? getNodeLabel(store.selected.type, registry)
								: undefined
						}
						registry={registry}
						theme={editorTheme}
						disabledNodeTypes={disabledNodeTypes}
						onClose={closePalette}
						onAdd={onPaletteAdd}
					/>

					<KivTemplateBrowser
						open={templatesOpen}
						templates={BUILT_IN_TEMPLATES}
						onClose={() => setTemplatesOpen(false)}
						onApply={applyTemplate}
					/>

					<KivBlockLibrary
						open={blocksOpen}
						templates={CONTENT_TEMPLATES}
						disabledNodeTypes={disabledNodeTypes}
						onClose={() => setBlocksOpen(false)}
						onInsert={insertBlock}
					/>
				</div>
			</EditorExtensionsContext.Provider>
		</EditorStoreContext.Provider>
	);
}
