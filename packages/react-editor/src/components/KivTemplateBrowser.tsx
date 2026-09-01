import type { PageTemplate } from "@kivcode/engine";
import type { KeyboardEvent, MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { NodeIcon } from "./NodeIcon";

export interface KivTemplateBrowserProps {
	open: boolean;
	templates: PageTemplate[];
	onClose: () => void;
	onApply: (template: PageTemplate) => void;
}

const ANIMATION_DURATION_MS = 100;

export function KivTemplateBrowser({
	open,
	templates,
	onClose,
	onApply,
}: KivTemplateBrowserProps) {
	const [search, setSearch] = useState("");

	// Same mount/entered pattern as ModalNode: keeps the backdrop in the DOM
	// long enough to play its leave transition before actually unmounting.
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

	const filtered = useMemo(() => {
		const q = search.toLowerCase().trim();
		if (!q) return templates;
		return templates.filter(
			(t) =>
				t.name.toLowerCase().includes(q) ||
				(t.description ?? "").toLowerCase().includes(q) ||
				(t.category ?? "").toLowerCase().includes(q),
		);
	}, [templates, search]);

	function apply(template: PageTemplate): void {
		onApply(template);
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
			className="kiv-template-backdrop"
			role="dialog"
			aria-modal="true"
			aria-label="Page templates"
			style={{ opacity: entered ? 1 : 0, transition: "opacity 0.15s ease" }}
			onClick={onBackdropClick}
			onKeyDown={onKeydown}
		>
			<div
				className="kiv-template-modal"
				style={{
					transform: entered
						? "scale(1) translateY(0)"
						: "scale(0.96) translateY(-8px)",
					transition: "transform 0.15s ease",
				}}
			>
				<div className="kiv-template-modal__header">
					<div className="kiv-template-modal__title">Templates</div>
					<button
						type="button"
						className="kiv-template-modal__close"
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

				<div className="kiv-template-modal__search">
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						type="text"
						placeholder="Search templates…"
					/>
				</div>

				<p className="kiv-template-modal__hint">
					Applying a template replaces the current page — it's a single undo
					step (⌘Z).
				</p>

				<div className="kiv-template-modal__grid">
					{filtered.map((template) => (
						<button
							key={template.id}
							type="button"
							className="kiv-template-modal__card"
							onClick={() => apply(template)}
						>
							<div className="kiv-template-modal__thumb">
								{template.thumbnail ? (
									<img src={template.thumbnail} alt="" />
								) : (
									<NodeIcon type="page" size={28} />
								)}
							</div>
							<span className="kiv-template-modal__name">{template.name}</span>
							{template.description ? (
								<span className="kiv-template-modal__desc">
									{template.description}
								</span>
							) : null}
						</button>
					))}
					{filtered.length === 0 ? (
						<div className="kiv-template-modal__empty">
							No templates match "{search}"
						</div>
					) : null}
				</div>
			</div>
		</div>,
		document.body,
	);
}
