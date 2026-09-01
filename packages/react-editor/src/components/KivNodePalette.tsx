import type { KivNode, Registry } from "@kivcode/engine";
import type { DragEvent, KeyboardEvent, MouseEvent } from "react";
import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import type { EditorExtensions } from "../extensions/editor-extensions";
import { useEditorExtensionsVersion } from "../extensions/use-editor-extensions";
import { EditorExtensionsContext } from "../store/context";
import { getNodeLabel } from "../utils/node-labels";
import {
	buildPalette,
	CATEGORY_META,
	createPaletteNode,
	type DisabledNodeTypes,
	LEAF_TYPES,
	type PaletteItem,
} from "../utils/palette-items";
import { NodeIcon } from "./NodeIcon";

export interface KivNodePaletteProps {
	open: boolean;
	selectedNodeType?: string;
	selectedNodeLabel?: string;
	registry?: Registry;
	theme?: "dark" | "light";
	/** type -> reason it's locked (dimmed, non-insertable) in this app — e.g.
	 * `{ form: "Not wired to a backend yet" }`. See `KivEditor`'s prop of the
	 * same name. */
	disabledNodeTypes?: DisabledNodeTypes;
	onClose: () => void;
	onAdd: (node: KivNode) => void;
}

const ANIMATION_DURATION_MS = 100;

export function KivNodePalette({
	open,
	selectedNodeType,
	selectedNodeLabel,
	registry,
	theme,
	disabledNodeTypes,
	onClose,
	onAdd,
}: KivNodePaletteProps) {
	const extensions = useContext(EditorExtensionsContext);
	// Re-renders this component when a plugin registers a palette item later.
	useEditorExtensionsVersion(extensions ?? NOOP_EXTENSIONS);

	const [search, setSearch] = useState("");
	const [activeIndex, setActiveIndex] = useState(0);
	const searchInputRef = useRef<HTMLInputElement | null>(null);

	const [dialogMounted, setDialogMounted] = useState(open);
	const [entered, setEntered] = useState(false);
	const [canPortal, setCanPortal] = useState(false);

	useEffect(() => setCanPortal(true), []);

	useEffect(() => {
		if (open) {
			setSearch("");
			setActiveIndex(0);
			setDialogMounted(true);
			return;
		}
		setEntered(false);
	}, [open]);

	useEffect(() => {
		if (!dialogMounted) return;
		if (!open) {
			const timer = setTimeout(
				() => setDialogMounted(false),
				ANIMATION_DURATION_MS,
			);
			return () => clearTimeout(timer);
		}
		const raf = requestAnimationFrame(() => {
			setEntered(true);
			searchInputRef.current?.focus();
		});
		return () => cancelAnimationFrame(raf);
	}, [dialogMounted, open]);

	// Reset highlight when the search query changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: `search` is a trigger-only dependency — the effect doesn't read it, it just needs to re-run whenever the query changes
	useEffect(() => {
		setActiveIndex(0);
	}, [search]);

	// Merge hardcoded palette with plugin-registered palette items
	const mergedPalette = useMemo<PaletteItem[]>(() => {
		const items = buildPalette(registry, disabledNodeTypes);
		if (extensions) {
			for (const pluginItem of extensions.getPaletteItems()) {
				if (!items.some((i) => i.type === pluginItem.type)) {
					const disabledReason = disabledNodeTypes?.[pluginItem.type];
					items.push({
						type: pluginItem.type,
						label: pluginItem.label,
						description: pluginItem.description ?? "",
						hasDefaultSlot: true,
						category: pluginItem.category ?? "content",
						disabled: disabledReason !== undefined,
						disabledReason,
					});
				}
			}
		}
		return items;
		// biome-ignore lint/correctness/useExhaustiveDependencies: extensions.getPaletteItems() output changes only when useEditorExtensionsVersion's return value changes above, which already re-renders this component
	}, [registry, disabledNodeTypes, extensions]);

	// Describe where the node will land
	const insertHint = useMemo(() => {
		const type = selectedNodeType;
		const label = selectedNodeLabel ?? (type ? getNodeLabel(type) : null);
		if (!type) return "Will be added to the end of the page";
		if (LEAF_TYPES.has(type)) return `Will be added after "${label}"`;
		return `Will be added inside "${label}"`;
	}, [selectedNodeType, selectedNodeLabel]);

	// Derive categories from merged palette (keeps hardcoded order, adds any new ones from plugins)
	const categories = useMemo<string[]>(() => {
		const seen = new Set<string>();
		const order: string[] = [];
		for (const item of mergedPalette) {
			if (!seen.has(item.category)) {
				seen.add(item.category);
				order.push(item.category);
			}
		}
		return order;
	}, [mergedPalette]);

	const filtered = useMemo(() => {
		const q = search.toLowerCase().trim();
		return mergedPalette.filter(
			(p) =>
				!q ||
				p.label.toLowerCase().includes(q) ||
				p.description.toLowerCase().includes(q) ||
				p.category.includes(q),
		);
	}, [mergedPalette, search]);

	const categoryItems = useCallback(
		(cat: string) => filtered.filter((p) => p.category === cat),
		[filtered],
	);

	// Flat list in display order — used for keyboard navigation
	const flatItems = useMemo(
		() => categories.flatMap((cat) => categoryItems(cat)),
		[categories, categoryItems],
	);

	function isActive(item: PaletteItem) {
		return flatItems[activeIndex]?.type === item.type;
	}

	function addNode(item: PaletteItem) {
		if (item.disabled) return;
		const node = createPaletteNode(item.type, registry, item.hasDefaultSlot);
		onAdd(node);
	}

	// Dragging a card starts a native drag session that keeps running after the
	// DOM it started from goes away, so the modal (which would otherwise cover
	// the canvas underneath) closes immediately — the canvas becomes the drop
	// target for the rest of the gesture, like a picker that dismisses on drag.
	function onCardDragStart(e: DragEvent<HTMLButtonElement>, item: PaletteItem) {
		if (item.disabled) {
			e.preventDefault();
			return;
		}
		if (!e.dataTransfer) return;
		e.dataTransfer.setData("application/x-kiv-node-type", item.type);
		e.dataTransfer.setData("text/plain", item.type);
		e.dataTransfer.effectAllowed = "copy";
		onClose();
	}

	function onBackdropClick(e: MouseEvent<HTMLDivElement>) {
		if (e.target === e.currentTarget) onClose();
	}

	// Grid is 2 columns — arrows move accordingly
	function onKeydown(e: KeyboardEvent<HTMLDivElement>) {
		const items = flatItems;
		const count = items.length;

		if (e.key === "Escape") {
			onClose();
			return;
		}
		if (!count) return;

		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActiveIndex((i) => Math.min(count - 1, i + 2));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveIndex((i) => Math.max(0, i - 2));
		} else if (e.key === "ArrowRight") {
			e.preventDefault();
			setActiveIndex((i) => Math.min(count - 1, i + 1));
		} else if (e.key === "ArrowLeft") {
			e.preventDefault();
			setActiveIndex((i) => Math.max(0, i - 1));
		} else if (e.key === "Enter") {
			e.preventDefault();
			const item = items[activeIndex];
			if (item) addNode(item);
		}
	}

	if (!canPortal || !dialogMounted) return null;

	return createPortal(
		<div
			className={`kiv-palette-backdrop ${theme === "light" ? "kiv-editor--light" : "kiv-editor--dark"}`}
			role="dialog"
			aria-modal="true"
			aria-label="Add node"
			style={{ opacity: entered ? 1 : 0, transition: "opacity 0.15s ease" }}
			onClick={onBackdropClick}
			onKeyDown={onKeydown}
		>
			<div
				className="kiv-palette-modal"
				style={{
					transform: entered
						? "scale(1) translateY(0)"
						: "scale(0.96) translateY(-8px)",
					transition: "transform 0.15s ease",
				}}
			>
				{/* Header */}
				<div className="kiv-palette-modal__header">
					<div className="kiv-palette-modal__title">
						<svg
							width="14"
							height="14"
							viewBox="0 0 14 14"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M7 1v12M1 7h12"
								stroke="currentColor"
								strokeWidth="1.8"
								strokeLinecap="round"
							/>
						</svg>
						Add node
					</div>
					<button
						type="button"
						className="kiv-palette-modal__close"
						onClick={onClose}
					>
						<svg
							width="12"
							height="12"
							viewBox="0 0 12 12"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M1 1l10 10M11 1L1 11"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
							/>
						</svg>
					</button>
				</div>

				{/* Search */}
				<div className="kiv-palette-modal__search">
					<svg
						className="kiv-palette-modal__search-icon"
						width="13"
						height="13"
						viewBox="0 0 13 13"
						fill="none"
						aria-hidden="true"
					>
						<circle
							cx="5.5"
							cy="5.5"
							r="4"
							stroke="currentColor"
							strokeWidth="1.4"
						/>
						<path
							d="M8.5 8.5l3 3"
							stroke="currentColor"
							strokeWidth="1.4"
							strokeLinecap="round"
						/>
					</svg>
					<input
						ref={searchInputRef}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						type="text"
						className="kiv-palette-modal__search-input"
						placeholder="Search nodes…"
					/>
				</div>

				{/* Insert hint */}
				<div className="kiv-palette-modal__hint">
					<svg
						width="11"
						height="11"
						viewBox="0 0 11 11"
						fill="none"
						aria-hidden="true"
					>
						<circle
							cx="5.5"
							cy="5.5"
							r="4.5"
							stroke="currentColor"
							strokeWidth="1.2"
						/>
						<path
							d="M5.5 5v3"
							stroke="currentColor"
							strokeWidth="1.2"
							strokeLinecap="round"
						/>
						<circle cx="5.5" cy="3.5" r="0.6" fill="currentColor" />
					</svg>
					{insertHint}
				</div>

				{/* Node grid */}
				<div className="kiv-palette-modal__list">
					{categories.map((cat) => {
						const items = categoryItems(cat);
						if (!items.length) return null;
						const meta = CATEGORY_META[cat];
						return (
							<div key={cat} className="kiv-palette-modal__group">
								<div className="kiv-palette-modal__group-label">
									<span
										className="kiv-palette-modal__group-dot"
										style={{ background: meta?.color }}
									/>
									{meta?.label ?? cat}
								</div>
								<div className="kiv-palette-modal__grid">
									{items.map((item) => (
										<button
											key={item.type}
											type="button"
											draggable={!item.disabled}
											className={`kiv-palette-modal__card${isActive(item) ? " kiv-palette-modal__card--active" : ""}${item.disabled ? " kiv-palette-modal__card--disabled" : ""}`}
											aria-disabled={item.disabled || undefined}
											title={item.disabled ? item.disabledReason : undefined}
											onClick={() => addNode(item)}
											onDragStart={(e) => onCardDragStart(e, item)}
											onMouseEnter={() =>
												setActiveIndex(
													flatItems.findIndex((f) => f.type === item.type),
												)
											}
										>
											<span
												className="kiv-palette-modal__card-icon"
												style={{
													color: CATEGORY_META[item.category]?.color,
													background: `${CATEGORY_META[item.category]?.color}1a`,
												}}
											>
												<NodeIcon type={item.type} size={18} />
											</span>
											{item.disabled ? (
												<span
													className="kiv-palette-modal__card-lock"
													aria-hidden="true"
												>
													<svg
														width="11"
														height="11"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
														aria-hidden="true"
													>
														<rect x="3" y="11" width="18" height="11" rx="2" />
														<path d="M7 11V7a5 5 0 0 1 10 0v4" />
													</svg>
												</span>
											) : null}
											<span className="kiv-palette-modal__card-name">
												{item.label}
											</span>
											<span className="kiv-palette-modal__card-desc">
												{item.disabled ? item.disabledReason : item.description}
											</span>
										</button>
									))}
								</div>
							</div>
						);
					})}
					{filtered.length === 0 ? (
						<div className="kiv-palette-modal__empty">
							<div className="kiv-palette-modal__empty-icon">🔍</div>
							No nodes match "{search}"
						</div>
					) : null}
				</div>

				{/* Footer with keyboard hints */}
				<div className="kiv-palette-modal__footer">
					<span className="kiv-palette-modal__kbd-group">
						<kbd>↑</kbd>
						<kbd>↓</kbd>
						<kbd>←</kbd>
						<kbd>→</kbd>
						<span className="kiv-palette-modal__kbd-label">navigate</span>
					</span>
					<span className="kiv-palette-modal__kbd-group">
						<kbd>↵</kbd>
						<span className="kiv-palette-modal__kbd-label">add</span>
					</span>
					<span className="kiv-palette-modal__kbd-group">
						<kbd>esc</kbd>
						<span className="kiv-palette-modal__kbd-label">close</span>
					</span>
				</div>
			</div>
		</div>,
		document.body,
	);
}

// Passed to `useEditorExtensionsVersion` when no extensions context is
// available, so the hook always has a stable object to subscribe to.
const NOOP_EXTENSIONS = {
	subscribe: () => () => {},
	getVersion: () => 0,
} as unknown as EditorExtensions;
