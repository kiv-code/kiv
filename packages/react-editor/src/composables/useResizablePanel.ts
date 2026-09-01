import { useEffect, useRef, useState } from "react";

export interface ResizablePanelOptions {
	storageKey: string;
	defaultWidth: number;
	min: number;
	max: number;
	/** Which edge the drag handle sits on — determines the sign of the drag delta. */
	edge: "left" | "right";
}

/** Drag-to-resize a fixed-width side panel, with the chosen width persisted to localStorage. */
export function useResizablePanel(opts: ResizablePanelOptions) {
	const clamp = (w: number) => Math.min(opts.max, Math.max(opts.min, w));

	const [width, setWidth] = useState(() => {
		const stored =
			typeof localStorage !== "undefined"
				? Number(localStorage.getItem(opts.storageKey))
				: Number.NaN;
		return Number.isFinite(stored) && stored > 0
			? clamp(stored)
			: opts.defaultWidth;
	});

	const startXRef = useRef(0);
	const startWidthRef = useRef(0);
	const widthRef = useRef(width);
	widthRef.current = width;

	function onMouseMove(e: MouseEvent) {
		const delta = e.clientX - startXRef.current;
		setWidth(
			clamp(startWidthRef.current + (opts.edge === "right" ? delta : -delta)),
		);
	}

	function onMouseUp() {
		document.removeEventListener("mousemove", onMouseMove);
		document.removeEventListener("mouseup", onMouseUp);
		document.body.style.userSelect = "";
		if (typeof localStorage !== "undefined") {
			localStorage.setItem(opts.storageKey, String(widthRef.current));
		}
	}

	function startResize(e: { clientX: number }) {
		startXRef.current = e.clientX;
		startWidthRef.current = widthRef.current;
		document.body.style.userSelect = "none";
		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: cleanup only needs to run once, on unmount, mirroring Vue's onBeforeUnmount — onMouseMove/onMouseUp are stable enough in practice (they only close over refs, never state)
	useEffect(() => {
		return () => {
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
		};
	}, []);

	return { width, startResize };
}
