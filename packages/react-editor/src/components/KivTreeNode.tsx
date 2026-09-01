import type { KivNode } from "@kivcode/engine";
import type {
	DragEvent as ReactDragEvent,
	KeyboardEvent as ReactKeyboardEvent,
	MouseEvent as ReactMouseEvent,
} from "react";
import { useContext, useMemo, useState } from "react";
import { EditorStoreContext, KivTreeFilterContext } from "../store/context";
import { getNodeCategoryTint, getNodeLabel } from "../utils/node-labels";
import { findParentLocation, isDescendant } from "../utils/tree";
import { isHiddenAtBreakpoint } from "../utils/visibility";
import { NodeIcon } from "./NodeIcon";

export interface KivTreeNodeProps {
	node: KivNode;
	depth?: number;
}

function allChildren(node: KivNode): KivNode[] {
	return Object.values(node.slots ?? {}).flat();
}

function matchesQuery(
	node: KivNode,
	q: string,
	registryLabel: (type: string) => string,
): boolean {
	if (
		node.id.toLowerCase().includes(q) ||
		registryLabel(node.type).toLowerCase().includes(q)
	) {
		return true;
	}
	return allChildren(node).some((c) => matchesQuery(c, q, registryLabel));
}

type DropZone = "before" | "inside" | "after" | null;

export function KivTreeNode({ node, depth }: KivTreeNodeProps) {
	const store = useContext(EditorStoreContext);
	const filterQuery = useContext(KivTreeFilterContext);

	const [collapsed, setCollapsed] = useState(false);
	const [dropZone, setDropZone] = useState<DropZone>(null);

	const children = useMemo(() => allChildren(node), [node]);
	const isLocked = node.locked === true;
	const isHiddenHere = isHiddenAtBreakpoint(
		node.visible,
		store?.breakpoint ?? "base",
	);

	const registryLabel = (type: string) => getNodeLabel(type, store?.registry);

	// ── Filter ───────────────────────────────────────────────────────────────
	const trimmedQuery = filterQuery.trim().toLowerCase();
	const filterActive = trimmedQuery.length > 0;

	// Hides this row entirely when filtering and neither it nor any descendant matches.
	const visible =
		!filterActive || matchesQuery(node, trimmedQuery, registryLabel);
	// True when this row itself (not just a descendant) matches the filter — used
	// to mark the first real hit so the tree can scroll to it.
	const isOwnMatch =
		filterActive &&
		(node.id.toLowerCase().includes(trimmedQuery) ||
			registryLabel(node.type).toLowerCase().includes(trimmedQuery));
	// While filtering, force every visible branch open so matches aren't hidden
	// behind a manually-collapsed ancestor — the user's own collapse state is
	// preserved underneath and restored once the filter is cleared.
	const effectiveCollapsed = filterActive ? false : collapsed;

	function onRowClick(e: ReactMouseEvent) {
		if (e.shiftKey) store?.toggleSelect(node.id);
		else store?.select(node.id);
	}

	function onRowKeyDown(e: ReactKeyboardEvent) {
		if (e.key !== "Enter" && e.key !== " ") return;
		e.preventDefault();
		if (e.shiftKey) store?.toggleSelect(node.id);
		else store?.select(node.id);
	}

	// ── DnD ──────────────────────────────────────────────────────────────────
	function onDragStart(e: ReactDragEvent) {
		e.dataTransfer.setData("text/plain", node.id);
		e.dataTransfer.effectAllowed = "move";
		const target = e.currentTarget as HTMLElement;
		setTimeout(() => {
			target.style.opacity = "0.4";
		}, 0);
	}
	function onDragEnd(e: ReactDragEvent) {
		(e.currentTarget as HTMLElement).style.opacity = "";
		setDropZone(null);
	}
	function zoneForEvent(e: ReactDragEvent): "before" | "inside" | "after" {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const y = e.clientY - rect.top;
		const h = rect.height;
		if (y < h * 0.25) return "before";
		if (y > h * 0.75) return "after";
		return "inside";
	}
	function onDragOver(e: ReactDragEvent) {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
		setDropZone(zoneForEvent(e));
	}
	function onDragLeave() {
		setDropZone(null);
	}

	function onDrop(e: ReactDragEvent) {
		e.preventDefault();
		const draggedId = e.dataTransfer.getData("text/plain");
		setDropZone(null);
		if (!draggedId || draggedId === node.id || !store || isLocked) return;

		if (isDescendant(node, draggedId)) return;

		const zone = zoneForEvent(e);
		const doc = store.document;

		if (zone === "inside") {
			const slots = Object.keys(node.slots ?? {});
			const slotName = slots[0] ?? "default";
			store.moveNode(draggedId, node.id, slotName, children.length);
		} else {
			const loc = findParentLocation(doc.root, node.id);
			if (!loc) return;
			store.moveNode(
				draggedId,
				loc.parent.id,
				loc.slot,
				zone === "before" ? loc.index : loc.index + 1,
			);
		}
	}

	// ── Context actions ───────────────────────────────────────────────────────
	function moveNode(direction: "up" | "down") {
		if (!store || isLocked) return;
		const doc = store.document;
		const loc = findParentLocation(doc.root, node.id);
		if (!loc) return;
		const newIndex = direction === "up" ? loc.index - 1 : loc.index + 1;
		const siblings = loc.parent.slots?.[loc.slot] ?? [];
		if (newIndex < 0 || newIndex >= siblings.length) return;
		store.moveNode(node.id, loc.parent.id, loc.slot, newIndex);
	}

	const isSelected = store?.selectedIds.includes(node.id) ?? false;
	const hasChildren = children.length > 0;

	function duplicate() {
		if (!store || isLocked) return;
		store.duplicateNode(node.id);
	}

	// Indent guide lines — one per ancestor level, aligned to that level's icon column.
	const guideStep = 14;
	const guideBase = 8;
	const guideOffsets = Array.from(
		{ length: depth ?? 0 },
		(_, i) => guideBase + i * guideStep + 7,
	);

	const categoryTint = getNodeCategoryTint(node.type, store?.registry);

	if (!visible) return null;

	return (
		<div className="ktn">
			<div
				className={`ktn__drop-line${dropZone === "before" ? " active" : ""}`}
			/>

			{/* biome-ignore lint/a11y/useSemanticElements: can't be a real <button> — it's `draggable` for reordering and wraps nested <button> action icons (collapse/lock/duplicate/delete), and interactive content isn't allowed inside <button> */}
			<div
				className={`ktn__row${isSelected ? " ktn__row--selected" : ""}${
					dropZone === "inside" ? " ktn__row--drop-inside" : ""
				}`}
				style={{ paddingLeft: `${8 + (depth ?? 0) * 14}px` }}
				draggable={!isLocked}
				data-kiv-tree-match={isOwnMatch ? "true" : undefined}
				role="button"
				tabIndex={0}
				onClick={onRowClick}
				onKeyDown={onRowKeyDown}
				onDragStart={onDragStart}
				onDragEnd={onDragEnd}
				onDragOver={onDragOver}
				onDragLeave={onDragLeave}
				onDrop={onDrop}
			>
				{guideOffsets.map((offset) => (
					<span
						key={offset}
						className="ktn__guide"
						style={{ left: `${offset}px` }}
					/>
				))}

				{/* Collapse toggle */}
				{hasChildren ? (
					<button
						type="button"
						className={`ktn__collapse${
							!effectiveCollapsed ? " ktn__collapse--open" : ""
						}`}
						onClick={(e) => {
							e.stopPropagation();
							setCollapsed((c) => !c);
						}}
					>
						<svg
							width="8"
							height="8"
							viewBox="0 0 8 8"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M2 3l2 2 2-2"
								stroke="currentColor"
								strokeWidth="1.4"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</button>
				) : (
					<span className="ktn__collapse-placeholder" />
				)}

				{/* Drag handle */}
				<span className="ktn__drag" aria-hidden="true">
					<svg
						width="8"
						height="10"
						viewBox="0 0 8 10"
						fill="none"
						aria-hidden="true"
					>
						<circle cx="2" cy="2" r="1" fill="currentColor" />
						<circle cx="6" cy="2" r="1" fill="currentColor" />
						<circle cx="2" cy="5" r="1" fill="currentColor" />
						<circle cx="6" cy="5" r="1" fill="currentColor" />
						<circle cx="2" cy="8" r="1" fill="currentColor" />
						<circle cx="6" cy="8" r="1" fill="currentColor" />
					</svg>
				</span>

				<span className="ktn__icon" style={{ background: categoryTint }}>
					<NodeIcon type={node.type} size={13} />
				</span>
				<span className="ktn__type">
					{getNodeLabel(node.type, store?.registry)}
				</span>
				<span className="ktn__id">#{node.id}</span>
				{isLocked && (
					<span className="ktn__lock" title="Locked">
						<svg
							width="9"
							height="9"
							viewBox="0 0 9 9"
							fill="none"
							aria-hidden="true"
						>
							<rect
								x="1.5"
								y="4"
								width="6"
								height="4"
								rx="1"
								stroke="currentColor"
								strokeWidth="1.1"
							/>
							<path
								d="M2.5 4V2.8a2 2 0 0 1 4 0V4"
								stroke="currentColor"
								strokeWidth="1.1"
							/>
						</svg>
					</span>
				)}
				{isHiddenHere && (
					<span className="ktn__hidden-badge" title="Hidden at this breakpoint">
						<svg
							width="9"
							height="9"
							viewBox="0 0 13 13"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M1.5 6.5S3.8 2.5 6.5 2.5s5 4 5 4-2.3 4-5 4-5-4-5-4Z"
								stroke="currentColor"
								strokeWidth="1.1"
							/>
							<line
								x1="2"
								y1="11"
								x2="11"
								y2="2"
								stroke="currentColor"
								strokeWidth="1.1"
								strokeLinecap="round"
							/>
						</svg>
					</span>
				)}
				{hasChildren && effectiveCollapsed && (
					<span className="ktn__count">{children.length}</span>
				)}

				{/* Context actions (visible on hover / selected) */}
				<div className="ktn__actions">
					<button
						type="button"
						className="ktn__action"
						title="Move up"
						disabled={isLocked}
						onClick={(e) => {
							e.stopPropagation();
							moveNode("up");
						}}
					>
						<svg
							width="9"
							height="9"
							viewBox="0 0 9 9"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M4.5 7V2M2 4.5l2.5-2.5 2.5 2.5"
								stroke="currentColor"
								strokeWidth="1.4"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</button>
					<button
						type="button"
						className="ktn__action"
						title="Move down"
						disabled={isLocked}
						onClick={(e) => {
							e.stopPropagation();
							moveNode("down");
						}}
					>
						<svg
							width="9"
							height="9"
							viewBox="0 0 9 9"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M4.5 2v5M2 4.5l2.5 2.5 2.5-2.5"
								stroke="currentColor"
								strokeWidth="1.4"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</button>
					<button
						type="button"
						className="ktn__action"
						title="Duplicate"
						disabled={isLocked}
						onClick={(e) => {
							e.stopPropagation();
							duplicate();
						}}
					>
						<svg
							width="9"
							height="9"
							viewBox="0 0 9 9"
							fill="none"
							aria-hidden="true"
						>
							<rect
								x="3"
								y="3"
								width="5.5"
								height="5.5"
								rx="1"
								stroke="currentColor"
								strokeWidth="1.1"
							/>
							<path
								d="M1 6V1.8a.8.8 0 0 1 .8-.8H6"
								stroke="currentColor"
								strokeWidth="1.1"
								strokeLinecap="round"
							/>
						</svg>
					</button>
					<button
						type="button"
						className="ktn__action ktn__action--danger"
						title="Delete"
						disabled={isLocked}
						onClick={(e) => {
							e.stopPropagation();
							store?.removeNode(node.id);
						}}
					>
						<svg
							width="9"
							height="9"
							viewBox="0 0 9 9"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M1.5 2.5h6M3.5 2.5V1.5h2v1M7 2.5l-.5 5a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5L2 2.5"
								stroke="currentColor"
								strokeWidth="1.2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</button>
				</div>
			</div>

			<div
				className={`ktn__drop-line${dropZone === "after" ? " active" : ""}`}
			/>

			{!effectiveCollapsed &&
				children.map((child) => (
					<KivTreeNode key={child.id} node={child} depth={(depth ?? 0) + 1} />
				))}
		</div>
	);
}
