import type { KivNode } from "@kivcode/engine";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useResizablePanel } from "../composables/useResizablePanel";
import {
	EditorStoreContext,
	KivTreeFilterContext,
	KivTreeFocusSearchContext,
} from "../store/context";
import { getNodeLabel } from "../utils/node-labels";
import { KivTreeNode } from "./KivTreeNode";

export interface KivTreeProps {
	onOpenPalette?: () => void;
}

function countNodes(node: KivNode): number {
	const children = Object.values(node.slots ?? {}).flat();
	return 1 + children.reduce((sum, c) => sum + countNodes(c), 0);
}

function countMatches(
	node: KivNode,
	q: string,
	registryLabel: (type: string) => string,
): number {
	let count =
		node.id.toLowerCase().includes(q) ||
		registryLabel(node.type).toLowerCase().includes(q)
			? 1
			: 0;
	for (const children of Object.values(node.slots ?? {})) {
		for (const child of children)
			count += countMatches(child, q, registryLabel);
	}
	return count;
}

export function KivTree({ onOpenPalette }: KivTreeProps) {
	const store = useContext(EditorStoreContext);

	const [filterQuery, setFilterQuery] = useState("");

	const filterInputRef = useRef<HTMLInputElement | null>(null);
	const bodyRef = useRef<HTMLDivElement | null>(null);

	const focusSearch = useCallback(() => filterInputRef.current?.focus(), []);

	const nodeCount = store ? countNodes(store.document.root) : 0;

	const registryLabel = (type: string) => getNodeLabel(type, store?.registry);

	const trimmedQuery = filterQuery.trim().toLowerCase();
	const matchCount: number | null =
		!trimmedQuery || !store
			? null
			: countMatches(store.document.root, trimmedQuery, registryLabel);

	function clearFilter() {
		setFilterQuery("");
	}

	function onFilterKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
		if (e.key === "Escape") clearFilter();
	}

	useEffect(() => {
		if (!filterQuery.trim()) return;
		bodyRef.current
			?.querySelector('[data-kiv-tree-match="true"]')
			?.scrollIntoView({ block: "nearest" });
	}, [filterQuery]);

	const { width, startResize } = useResizablePanel({
		storageKey: "kiv-editor:tree-width",
		defaultWidth: 220,
		min: 180,
		max: 420,
		edge: "right",
	});

	return (
		<aside
			className="kiv-tree"
			style={{ width: `${width}px`, minWidth: `${width}px` }}
		>
			<div className="kiv-tree__header">
				<div className="kiv-tree__header-row">
					<span>Structure</span>
					<span className="kiv-tree__count">{nodeCount}</span>
				</div>
				<div className="kiv-tree__filter-row">
					<input
						ref={filterInputRef}
						value={filterQuery}
						onChange={(e) => setFilterQuery(e.target.value)}
						type="text"
						className="kiv-tree__filter"
						placeholder="Filter nodes..."
						spellCheck={false}
						autoComplete="off"
						onKeyDown={onFilterKeyDown}
					/>
					{matchCount !== null && (
						<span className="kiv-tree__match-count">
							{matchCount} match{matchCount === 1 ? "" : "es"}
						</span>
					)}
				</div>
			</div>
			{store && (
				<div ref={bodyRef} className="kiv-tree__body">
					<KivTreeFilterContext.Provider value={filterQuery}>
						<KivTreeFocusSearchContext.Provider value={focusSearch}>
							<KivTreeNode node={store.document.root} depth={0} />
						</KivTreeFocusSearchContext.Provider>
					</KivTreeFilterContext.Provider>
				</div>
			)}
			<div className="kiv-tree__footer">
				<button
					type="button"
					className="kiv-tree__add-btn"
					onClick={() => onOpenPalette?.()}
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
							strokeWidth="1.5"
							strokeLinecap="round"
						/>
					</svg>
					Add node
				</button>
			</div>
			<button
				type="button"
				className="kiv-tree__resize-handle"
				aria-label="Resize structure panel"
				onMouseDown={startResize}
			/>
		</aside>
	);
}
