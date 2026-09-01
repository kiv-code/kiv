import type { KivNode } from "@kivcode/engine";
import type { ContentTemplate } from "@kivcode/nodes-interactive";
import type { KeyboardEvent, MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { DisabledNodeTypes } from "../utils/palette-items";
import { NodeIcon } from "./NodeIcon";

export interface KivBlockLibraryProps {
	open: boolean;
	templates: ContentTemplate[];
	/** Same map as `KivEditor`/`KivNodePalette` — any template whose node
	 * tree contains one of these types is shown locked too (a "Contact form"
	 * block is just as unusable as inserting `form` directly). */
	disabledNodeTypes?: DisabledNodeTypes;
	onClose: () => void;
	onInsert: (template: ContentTemplate) => void;
}

const ANIMATION_DURATION_MS = 100;

function treeContainsDisabledType(
	node: KivNode,
	disabledNodeTypes: DisabledNodeTypes | undefined,
): string | undefined {
	if (!disabledNodeTypes) return undefined;
	const reason = disabledNodeTypes[node.type];
	if (reason !== undefined) return reason;
	for (const children of Object.values(node.slots ?? {})) {
		for (const child of children) {
			const found = treeContainsDisabledType(child, disabledNodeTypes);
			if (found !== undefined) return found;
		}
	}
	return undefined;
}

// NodeIcon only knows how to draw actual node types — blocks use a slightly
// richer icon vocabulary (see templates/index.ts), so unmapped icons fall
// back to a generic "section" glyph instead of rendering nothing.
const ICON_FALLBACK: Record<string, string> = {
	grid: "grid",
	"message-circle": "testimonial",
	"help-circle": "accordion",
	"credit-card": "card",
	users: "stat",
	calendar: "table",
	table: "table",
	card: "card",
	"clipboard-list": "form",
};
function iconType(icon: string): string {
	return ICON_FALLBACK[icon] ?? "section";
}

export function KivBlockLibrary({
	open,
	templates,
	disabledNodeTypes,
	onClose,
	onInsert,
}: KivBlockLibraryProps) {
	const [search, setSearch] = useState("");
	const [activeCategory, setActiveCategory] = useState<string | null>(null);

	const [dialogMounted, setDialogMounted] = useState(open);
	const [entered, setEntered] = useState(false);
	const [canPortal, setCanPortal] = useState(false);

	useEffect(() => setCanPortal(true), []);

	useEffect(() => {
		if (open) {
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
		const raf = requestAnimationFrame(() => setEntered(true));
		return () => cancelAnimationFrame(raf);
	}, [dialogMounted, open]);

	// Templates build their tree lazily via `create()` — calling it here just
	// to inspect node types is cheap and side-effect-free (fresh ids are
	// discarded).
	const disabledTemplateReasons = useMemo<Record<string, string>>(() => {
		if (!disabledNodeTypes) return {};
		const out: Record<string, string> = {};
		for (const t of templates) {
			const reason = treeContainsDisabledType(t.create(), disabledNodeTypes);
			if (reason !== undefined) out[t.id] = reason;
		}
		return out;
	}, [templates, disabledNodeTypes]);

	const categories = useMemo<string[]>(() => {
		const seen = new Set<string>();
		const order: string[] = [];
		for (const t of templates) {
			if (!seen.has(t.category)) {
				seen.add(t.category);
				order.push(t.category);
			}
		}
		return order;
	}, [templates]);

	const filtered = useMemo(() => {
		const q = search.toLowerCase().trim();
		return templates.filter((t) => {
			if (activeCategory && t.category !== activeCategory) return false;
			if (!q) return true;
			return (
				t.label.toLowerCase().includes(q) ||
				t.description.toLowerCase().includes(q) ||
				t.category.toLowerCase().includes(q)
			);
		});
	}, [templates, search, activeCategory]);

	function insert(template: ContentTemplate): void {
		if (disabledTemplateReasons[template.id] !== undefined) return;
		onInsert(template);
		onClose();
	}

	function onBackdropClick(e: MouseEvent<HTMLDivElement>): void {
		if (e.target === e.currentTarget) onClose();
	}

	function onKeydown(e: KeyboardEvent<HTMLDivElement>): void {
		if (e.key === "Escape") onClose();
	}

	if (!canPortal || !dialogMounted) return null;

	return createPortal(
		<div
			className="kiv-block-backdrop"
			role="dialog"
			aria-modal="true"
			aria-label="Insert block"
			style={{ opacity: entered ? 1 : 0, transition: "opacity 0.15s ease" }}
			onClick={onBackdropClick}
			onKeyDown={onKeydown}
		>
			<div
				className="kiv-block-modal"
				style={{
					transform: entered
						? "scale(1) translateY(0)"
						: "scale(0.96) translateY(-8px)",
					transition: "transform 0.15s ease",
				}}
			>
				<div className="kiv-block-modal__header">
					<div className="kiv-block-modal__title">Blocks</div>
					<button
						type="button"
						className="kiv-block-modal__close"
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

				<div className="kiv-block-modal__search">
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						type="text"
						placeholder="Search blocks…"
					/>
				</div>

				<div className="kiv-block-modal__categories">
					<button
						type="button"
						className={`kiv-block-modal__category${activeCategory === null ? " kiv-block-modal__category--active" : ""}`}
						onClick={() => setActiveCategory(null)}
					>
						All
					</button>
					{categories.map((cat) => (
						<button
							key={cat}
							type="button"
							className={`kiv-block-modal__category${activeCategory === cat ? " kiv-block-modal__category--active" : ""}`}
							onClick={() => setActiveCategory(cat)}
						>
							{cat}
						</button>
					))}
				</div>

				<p className="kiv-block-modal__hint">
					Inserted at your current selection — a single undo step (⌘Z).
				</p>

				<div className="kiv-block-modal__grid">
					{filtered.map((template) => {
						const disabledReason = disabledTemplateReasons[template.id];
						const isDisabled = disabledReason !== undefined;
						return (
							<button
								key={template.id}
								type="button"
								className={`kiv-block-modal__card${isDisabled ? " kiv-block-modal__card--disabled" : ""}`}
								aria-disabled={isDisabled || undefined}
								title={disabledReason}
								onClick={() => insert(template)}
							>
								<div className="kiv-block-modal__thumb">
									<NodeIcon type={iconType(template.icon)} size={28} />
								</div>
								{isDisabled ? (
									<span className="kiv-block-modal__lock" aria-hidden="true">
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
								<span className="kiv-block-modal__name">{template.label}</span>
								<span className="kiv-block-modal__desc">
									{disabledReason ?? template.description}
								</span>
							</button>
						);
					})}
					{filtered.length === 0 ? (
						<div className="kiv-block-modal__empty">
							No blocks match "{search}"
						</div>
					) : null}
				</div>
			</div>
		</div>,
		document.body,
	);
}
