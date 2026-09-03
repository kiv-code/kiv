import type {
	Breakpoint,
	FieldDescriptor,
	KivNode,
	Registry,
} from "@kivcode/engine";
import {
	type ComponentType,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useResizablePanel } from "../composables/useResizablePanel";
import { FieldControl } from "../inspector/FieldControl";
import { EditorExtensionsContext, EditorStoreContext } from "../store/context";
import { getNodeLabel } from "../utils/node-labels";
import {
	mergeResponsiveValue,
	readResponsiveValue,
} from "../utils/responsive-value";
import { isHiddenAtBreakpoint } from "../utils/visibility";

export interface KivInspectorProps {
	registry: Registry;
}

// Plugins register with a raw key ("seo", "a11y") — shown to users as a real
// label instead of the internal id.
const PLUGIN_TAB_LABELS: Record<string, string> = {
	seo: "SEO",
	a11y: "Accessibility",
};
function pluginTabLabel(tabName: string): string {
	return PLUGIN_TAB_LABELS[tabName] ?? tabName;
}

// A localized value in JSON looks like { $t: { en: "...", es: "..." } }
function isLocalized(v: unknown): v is { $t: Record<string, unknown> } {
	return (
		typeof v === "object" &&
		v !== null &&
		!Array.isArray(v) &&
		"$t" in (v as Record<string, unknown>)
	);
}

const GROUP_ORDER = [
	"Layout",
	"Spacing",
	"Spacing (advanced)",
	"Typography",
	"Content",
	"Background",
	"Overlay",
	"Effects",
	"Border",
	"Colors",
	"Link",
	"Style",
	"General",
];

// A fixed color per group, consistent across every node type — lets a
// collapsed group stay recognizable by color alone once a document has
// several field groups stacked in a narrow panel.
const GROUP_COLORS: Record<string, string> = {
	Layout: "#94a3b8",
	Spacing: "#34d399",
	"Spacing (advanced)": "#34d399",
	Typography: "#38bdf8",
	Content: "#818cf8",
	Background: "#fb923c",
	Overlay: "#fb923c",
	Effects: "#fbbf24",
	Border: "#a78bfa",
	Colors: "#f472b6",
	Link: "#60a5fa",
	Style: "#2dd4bf",
	General: "#64748b",
};
const DEFAULT_GROUP_COLOR = "#64748b";

function groupColor(name: string): string {
	return GROUP_COLORS[name] ?? DEFAULT_GROUP_COLOR;
}

interface GroupedField {
	key: string;
	descriptor: FieldDescriptor;
}

// Evaluates a field's showIf condition against the node's current props.
// Returns true (visible) when there's no condition or it matches.
function isFieldVisible(node: KivNode, descriptor: FieldDescriptor): boolean {
	const cond = descriptor.showIf;
	if (!cond) return true;
	const current = node.props[cond.field];
	const expected = Array.isArray(cond.equals) ? cond.equals : [cond.equals];
	return expected.includes(String(current ?? ""));
}

// Uses the same breakpoint as the canvas — changing it here also changes the canvas preview
const BP_OPTIONS: { value: Breakpoint; label: string }[] = [
	{ value: "base", label: "MB" },
	{ value: "sm", label: "SM" },
	{ value: "md", label: "MD" },
	{ value: "lg", label: "LG" },
	{ value: "xl", label: "XL" },
];

export function KivInspector({ registry }: KivInspectorProps) {
	const store = useContext(EditorStoreContext);
	const extensions = useContext(EditorExtensionsContext);

	const { width, startResize } = useResizablePanel({
		storageKey: "kiv-editor:inspector-width",
		defaultWidth: 260,
		min: 240,
		max: 480,
		edge: "left",
	});

	// Keep the list of plugin tab names in sync as plugins register (typically
	// from onEditorReady, which fires after this component's first render).
	const [pluginTabNames, setPluginTabNames] = useState<string[]>(() =>
		extensions ? Array.from(extensions.getInspectorTabs().keys()) : [],
	);
	const [activePluginTab, setActivePluginTab] = useState<string | null>(null);
	const pageChecksRef = useRef<HTMLDetailsElement | null>(null);

	useEffect(() => {
		if (!extensions) return;
		return extensions.subscribe(() => {
			setPluginTabNames(Array.from(extensions.getInspectorTabs().keys()));
		});
	}, [extensions]);

	// ── Editable node ID ────────────────────────────────────────────────────
	const selectedId = store?.selected?.id ?? "";
	const [idDraft, setIdDraft] = useState(selectedId);
	// Keep the draft in sync with the selected node — a fresh input per node
	// id (via `key` below) means we only need to reset on an actual id change.
	useEffect(() => {
		setIdDraft(selectedId);
	}, [selectedId]);

	// Validation message for the current draft (null = valid)
	const idError = useMemo<string | null>(() => {
		const current = store?.selected?.id;
		const draft = idDraft.trim();
		if (!current) return null;
		if (draft === current) return null;
		if (!draft) return "ID cannot be empty";
		if (!/^[a-zA-Z][\w-]*$/.test(draft))
			return "Use letters, numbers, - or _ (must start with a letter)";
		if (store && !store.canUseId(draft)) return "This ID is already in use";
		return null;
	}, [store, idDraft]);

	function commitId() {
		const current = store?.selected?.id;
		if (!current || !store) return;
		const draft = idDraft.trim();
		if (draft === current) return;
		if (idError) {
			// Invalid — revert to the real id
			setIdDraft(current);
			return;
		}
		store.renameNode(current, draft);
	}

	function resetIdDraft() {
		setIdDraft(store?.selected?.id ?? "");
	}

	const fieldBreakpoint = store?.breakpoint ?? "base";
	const fieldLocale = store?.locale ?? "en";
	const localesCount = store?.document.i18n?.supported?.length ?? 1;

	// ── Multi-select ──────────────────────────────────────────────────────
	const selectedNodes = useMemo(() => store?.selectedNodes ?? [], [store]);
	const isMulti = selectedNodes.length > 1;

	/** The node whose values/fields drive the panel: the single selection, or —
	 * when every selected node shares a type — the first of the multi-selection. */
	const activeNode = useMemo<KivNode | null>(() => {
		if (selectedNodes.length === 0) return null;
		const first = selectedNodes[0];
		if (!first) return null;
		if (selectedNodes.length === 1) return first;
		return selectedNodes.every((n) => n.type === first.type) ? first : null;
	}, [selectedNodes]);

	const targetIds = useMemo(
		() => selectedNodes.map((n) => n.id),
		[selectedNodes],
	);

	function applyPatch(patch: Record<string, unknown>) {
		if (!store) return;
		const first = targetIds[0];
		if (!first) return;
		if (targetIds.length > 1) store.updatePropsMany(targetIds, patch);
		else store.updateProps(first, patch);
	}

	function toggleLockedAll() {
		if (!store) return;
		const allLocked = selectedNodes.every((n) => n.locked === true);
		store.startBatch();
		for (const n of selectedNodes) store.setLocked(n.id, !allLocked);
		store.endBatch();
	}

	const groupedFields = useMemo(() => {
		const node = activeNode;
		if (!node || !registry.has(node.type)) return [];

		const compiled = registry.get(node.type);
		if (!compiled) return [];
		const groups = new Map<string, GroupedField[]>();

		for (const [key, descriptor] of Object.entries(compiled.fields)) {
			if (!isFieldVisible(node, descriptor)) continue; // respect showIf
			const g = descriptor.group ?? "General";
			if (!groups.has(g)) groups.set(g, []);
			groups.get(g)?.push({ key, descriptor });
		}

		// Known groups render in GROUP_ORDER's curated order; any group name a
		// node uses that isn't in that list (a new/custom category) still renders
		// — appended at the end, in first-seen order — instead of silently
		// vanishing from the Inspector.
		const known = GROUP_ORDER.filter((g) => groups.has(g));
		const unknown = [...groups.keys()].filter((g) => !GROUP_ORDER.includes(g));
		return [...known, ...unknown].map((g) => ({
			name: g,
			fields: groups.get(g) ?? [],
		}));
	}, [activeNode, registry]);

	// Returns the effective prop value for a field at the active breakpoint.
	function getFieldValue(
		fieldKey: string,
		descriptor: FieldDescriptor,
	): unknown {
		const node = activeNode;
		if (!node) return undefined;
		let raw = node.props[fieldKey];
		// Localized field: unwrap the active locale (with fallback to first available)
		if (descriptor.localizable && isLocalized(raw)) {
			const t = raw.$t;
			raw = fieldLocale in t ? t[fieldLocale] : Object.values(t)[0];
		}
		if (!descriptor.responsive) return raw;
		return readResponsiveValue(raw, fieldBreakpoint);
	}

	function updateFieldValue(
		fieldKey: string,
		descriptor: FieldDescriptor,
		value: unknown,
	) {
		const node = activeNode;
		if (!node || !store) return;

		// Localized field: write into the active locale, preserving other locales.
		// Only wrap in $t when the document actually supports multiple locales.
		if (descriptor.localizable) {
			const supported = store.document.i18n?.supported ?? [];
			const existing = node.props[fieldKey];
			if (supported.length > 1) {
				const t: Record<string, unknown> = isLocalized(existing)
					? { ...existing.$t }
					: {};
				t[fieldLocale] = value;
				applyPatch({ [fieldKey]: { $t: t } });
				return;
			}
			// Single-locale doc — store as a plain value
			applyPatch({ [fieldKey]: value });
			return;
		}

		if (!descriptor.responsive) {
			applyPatch({ [fieldKey]: value });
			return;
		}
		// Always merge into responsive object to preserve other breakpoints
		const merged = mergeResponsiveValue(
			node.props[fieldKey],
			fieldBreakpoint,
			value,
		);
		applyPatch({ [fieldKey]: merged });
	}

	const hasResponsiveFields = groupedFields.some((g) =>
		g.fields.some((f) => f.descriptor.responsive),
	);

	// ── Locked / visible toggles ────────────────────────────────────────────
	const isNodeLocked = store?.selected?.locked === true;
	const isNodeHiddenHere = isHiddenAtBreakpoint(
		store?.selected?.visible,
		fieldBreakpoint,
	);

	function toggleLocked() {
		const node = store?.selected;
		if (!node || !store) return;
		store.setLocked(node.id, !isNodeLocked);
	}

	function toggleVisible() {
		const node = store?.selected;
		if (!node || !store) return;
		store.setVisible(node.id, isNodeHiddenHere);
	}

	const renderGroups = () => (
		<div className="kiv-inspector__groups">
			{groupedFields.map((group) => (
				<details key={group.name} className="kiv-inspector__group" open>
					<summary className="kiv-inspector__group-title">
						<svg
							className="kiv-inspector__chevron"
							width="10"
							height="10"
							viewBox="0 0 10 10"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M3 2l4 3-4 3"
								stroke="currentColor"
								strokeWidth={1.5}
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
						<span
							className="kiv-inspector__group-dot"
							style={{ background: groupColor(group.name) }}
						/>
						{group.name}
					</summary>
					<div className="kiv-inspector__group-fields">
						{group.fields.map((field) => (
							<FieldControl
								key={`${field.key}-${fieldBreakpoint}-${fieldLocale}`}
								fieldKey={field.key}
								descriptor={field.descriptor}
								nodeProps={activeNode?.props}
								value={getFieldValue(field.key, field.descriptor)}
								breakpoint={
									field.descriptor.responsive ? fieldBreakpoint : undefined
								}
								locale={
									field.descriptor.localizable && localesCount > 1
										? fieldLocale
										: undefined
								}
								onChange={(v) =>
									updateFieldValue(field.key, field.descriptor, v)
								}
							/>
						))}
					</div>
				</details>
			))}
		</div>
	);

	const renderResponsiveSwitcher = () =>
		hasResponsiveFields && (
			<div className="kiv-inspector__responsive">
				<span className="kiv-inspector__responsive-label">Breakpoint</span>
				<div className="kiv-inspector__responsive-tabs">
					{BP_OPTIONS.map((bp) => (
						<button
							key={bp.value}
							type="button"
							className={`kiv-inspector__responsive-tab${fieldBreakpoint === bp.value ? " active" : ""}`}
							onClick={() => store?.setBreakpoint(bp.value)}
						>
							{bp.label}
						</button>
					))}
				</div>
			</div>
		);

	return (
		<aside
			className="kiv-inspector"
			style={{ width: `${width}px`, minWidth: `${width}px` }}
		>
			<button
				type="button"
				className="kiv-inspector__resize-handle"
				aria-label="Resize inspector panel"
				onMouseDown={startResize}
			/>
			<div className="kiv-inspector__header">Inspector</div>

			{!selectedNodes.length ? (
				<div className="kiv-inspector__empty">
					<div className="kiv-inspector__empty-icon">
						<svg
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth={1.5}
							aria-hidden="true"
						>
							<rect x="3" y="3" width="18" height="18" rx="2" />
							<path d="M3 9h18M9 21V9" />
						</svg>
					</div>
					<p>Select a node to inspect</p>
				</div>
			) : isMulti ? (
				<div className="kiv-inspector__fields">
					<div className="kiv-inspector__node-header">
						<span className="kiv-inspector__node-badge">
							Multiple selected ({selectedNodes.length})
						</span>
						<div className="kiv-inspector__node-actions">
							<button
								type="button"
								className="kiv-inspector__action-btn"
								title="Lock/unlock all selected"
								onClick={toggleLockedAll}
							>
								<svg
									width="13"
									height="13"
									viewBox="0 0 13 13"
									fill="none"
									aria-hidden="true"
								>
									<rect
										x="3"
										y="6"
										width="7"
										height="5.5"
										rx="1.2"
										stroke="currentColor"
										strokeWidth={1.2}
									/>
									<path
										d="M4.5 6V4.2a2 2 0 0 1 4 0V6"
										stroke="currentColor"
										strokeWidth={1.2}
									/>
								</svg>
							</button>
							<button
								type="button"
								className="kiv-inspector__action-btn kiv-inspector__action-btn--danger"
								title="Delete all selected"
								onClick={() => store?.removeMany(targetIds)}
							>
								<svg
									width="13"
									height="13"
									viewBox="0 0 13 13"
									fill="none"
									aria-hidden="true"
								>
									<path
										d="M2 3.5h9M5 3.5V2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M10 3.5l-.7 7a1 1 0 0 1-1 .9H4.7a1 1 0 0 1-1-.9L3 3.5"
										stroke="currentColor"
										strokeWidth={1.3}
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
									<path
										d="M5.5 6v3M7.5 6v3"
										stroke="currentColor"
										strokeWidth={1.3}
										strokeLinecap="round"
									/>
								</svg>
							</button>
						</div>
					</div>

					{!activeNode ? (
						<div className="kiv-inspector__empty">
							<p>
								Select nodes of the same type to edit shared fields together.
							</p>
						</div>
					) : (
						<>
							{renderResponsiveSwitcher()}
							{renderGroups()}
						</>
					)}
				</div>
			) : store?.selected ? (
				<>
					{/* Node header: type badge + actions */}
					<div className="kiv-inspector__node-header">
						<span className="kiv-inspector__node-badge">
							{getNodeLabel(store.selected.type, store.registry)}
						</span>
						<div className="kiv-inspector__node-actions">
							<button
								type="button"
								className={`kiv-inspector__action-btn${isNodeLocked ? " kiv-inspector__action-btn--active" : ""}`}
								title={isNodeLocked ? "Unlock node" : "Lock node"}
								onClick={toggleLocked}
							>
								{isNodeLocked ? (
									<svg
										width="13"
										height="13"
										viewBox="0 0 13 13"
										fill="none"
										aria-hidden="true"
									>
										<rect
											x="3"
											y="6"
											width="7"
											height="5.5"
											rx="1.2"
											stroke="currentColor"
											strokeWidth={1.2}
										/>
										<path
											d="M4.5 6V4.2a2 2 0 0 1 4 0V6"
											stroke="currentColor"
											strokeWidth={1.2}
										/>
									</svg>
								) : (
									<svg
										width="13"
										height="13"
										viewBox="0 0 13 13"
										fill="none"
										aria-hidden="true"
									>
										<rect
											x="3"
											y="6"
											width="7"
											height="5.5"
											rx="1.2"
											stroke="currentColor"
											strokeWidth={1.2}
										/>
										<path
											d="M4.5 6V4.2a2 2 0 0 1 3.8-.9"
											stroke="currentColor"
											strokeWidth={1.2}
											strokeLinecap="round"
										/>
									</svg>
								)}
							</button>
							<button
								type="button"
								className={`kiv-inspector__action-btn${isNodeHiddenHere ? " kiv-inspector__action-btn--active" : ""}`}
								title={
									isNodeHiddenHere
										? "Show at this breakpoint"
										: "Hide at this breakpoint"
								}
								onClick={toggleVisible}
							>
								{isNodeHiddenHere ? (
									<svg
										width="13"
										height="13"
										viewBox="0 0 13 13"
										fill="none"
										aria-hidden="true"
									>
										<path
											d="M1.5 6.5S3.8 2.5 6.5 2.5s5 4 5 4-2.3 4-5 4-5-4-5-4Z"
											stroke="currentColor"
											strokeWidth={1.1}
										/>
										<line
											x1="2"
											y1="11"
											x2="11"
											y2="2"
											stroke="currentColor"
											strokeWidth={1.1}
											strokeLinecap="round"
										/>
									</svg>
								) : (
									<svg
										width="13"
										height="13"
										viewBox="0 0 13 13"
										fill="none"
										aria-hidden="true"
									>
										<path
											d="M1.5 6.5S3.8 2.5 6.5 2.5s5 4 5 4-2.3 4-5 4-5-4-5-4Z"
											stroke="currentColor"
											strokeWidth={1.1}
										/>
										<circle
											cx="6.5"
											cy="6.5"
											r="1.6"
											stroke="currentColor"
											strokeWidth={1.1}
										/>
									</svg>
								)}
							</button>
							<button
								type="button"
								className="kiv-inspector__action-btn"
								title="Duplicate node (⌘D)"
								onClick={() => store.duplicateNode(store.selected?.id ?? "")}
							>
								<svg
									width="13"
									height="13"
									viewBox="0 0 13 13"
									fill="none"
									aria-hidden="true"
								>
									<rect
										x="4"
										y="4"
										width="8"
										height="8"
										rx="1.5"
										stroke="currentColor"
										strokeWidth={1.3}
									/>
									<path
										d="M1 9V2a1 1 0 0 1 1-1h7"
										stroke="currentColor"
										strokeWidth={1.3}
										strokeLinecap="round"
									/>
								</svg>
							</button>
							<button
								type="button"
								className="kiv-inspector__action-btn kiv-inspector__action-btn--danger"
								title="Delete node (⌫)"
								onClick={() => store.removeNode(store.selected?.id ?? "")}
							>
								<svg
									width="13"
									height="13"
									viewBox="0 0 13 13"
									fill="none"
									aria-hidden="true"
								>
									<path
										d="M2 3.5h9M5 3.5V2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M10 3.5l-.7 7a1 1 0 0 1-1 .9H4.7a1 1 0 0 1-1-.9L3 3.5"
										stroke="currentColor"
										strokeWidth={1.3}
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
									<path
										d="M5.5 6v3M7.5 6v3"
										stroke="currentColor"
										strokeWidth={1.3}
										strokeLinecap="round"
									/>
								</svg>
							</button>
						</div>
					</div>

					{/* Plugin inspector tabs: page-level checks (SEO, a11y…), collapsed
					    into one popover trigger instead of a permanently-visible button
					    row — they apply to the whole document, not the selected node. */}
					{pluginTabNames.length > 0 && (
						<details ref={pageChecksRef} className="kiv-inspector__page-checks">
							<summary className="kiv-inspector__page-checks-trigger">
								<svg
									width="13"
									height="13"
									viewBox="0 0 13 13"
									fill="none"
									aria-hidden="true"
								>
									<path
										d="M2 3.5h9M2 6.5h9M2 9.5h5"
										stroke="currentColor"
										strokeWidth={1.2}
										strokeLinecap="round"
									/>
								</svg>
								<span>Page checks</span>
								{activePluginTab && (
									<span className="kiv-inspector__page-checks-badge">
										{pluginTabLabel(activePluginTab)}
									</span>
								)}
								<svg
									className="kiv-inspector__page-checks-chevron"
									width="9"
									height="9"
									viewBox="0 0 9 9"
									fill="none"
									aria-hidden="true"
								>
									<path
										d="M2 3.2 4.5 5.7 7 3.2"
										stroke="currentColor"
										strokeWidth={1.2}
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</summary>
							<div className="kiv-inspector__page-checks-menu">
								{pluginTabNames.map((tabName) => (
									<button
										key={tabName}
										type="button"
										className={`kiv-inspector__page-checks-item${activePluginTab === tabName ? " kiv-inspector__page-checks-item--active" : ""}`}
										onClick={() => {
											setActivePluginTab((prev) =>
												prev === tabName ? null : tabName,
											);
											if (pageChecksRef.current)
												pageChecksRef.current.open = false;
										}}
									>
										{pluginTabLabel(tabName)}
									</button>
								))}
							</div>
						</details>
					)}

					{/* Plugin tab content */}
					{activePluginTab &&
						extensions &&
						(() => {
							const PluginTab = extensions
								.getInspectorTabs()
								.get(activePluginTab)?.component as
								| ComponentType<{ node: KivNode | null; store: unknown }>
								| undefined;
							return PluginTab ? (
								<div className="kiv-inspector__plugin-tab">
									<div className="kiv-inspector__plugin-tab-header">
										<span>{pluginTabLabel(activePluginTab)}</span>
										<button
											type="button"
											className="kiv-inspector__plugin-tab-close"
											title="Back to node fields"
											onClick={() => setActivePluginTab(null)}
										>
											✕
										</button>
									</div>
									<PluginTab node={store?.selected ?? null} store={store} />
								</div>
							) : null;
						})()}

					{!activePluginTab && (
						<div className="kiv-inspector__fields">
							{/* Editable node ID */}
							<div className="kiv-inspector__id-row">
								<label
									className="kiv-inspector__id-label"
									htmlFor="kiv-inspector-id-input"
								>
									ID
								</label>
								<div
									className={`kiv-inspector__id-field${idError ? " kiv-inspector__id-field--error" : ""}`}
								>
									<span className="kiv-inspector__id-hash">#</span>
									<input
										key={store.selected.id}
										id="kiv-inspector-id-input"
										value={idDraft}
										onChange={(e) => setIdDraft(e.target.value)}
										type="text"
										className="kiv-inspector__id-input"
										spellCheck={false}
										autoComplete="off"
										onKeyDown={(e) => {
											if (e.key === "Enter") commitId();
											else if (e.key === "Escape") resetIdDraft();
										}}
										onBlur={commitId}
									/>
								</div>
							</div>
							{idError && (
								<div className="kiv-inspector__id-hint kiv-inspector__id-hint--error">
									{idError}
								</div>
							)}

							{renderResponsiveSwitcher()}
							{renderGroups()}
						</div>
					)}
				</>
			) : null}
		</aside>
	);
}
