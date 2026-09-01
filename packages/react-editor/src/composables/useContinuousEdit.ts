import { useEffect, useRef } from "react";
import type { EditorStore } from "../store/editor-store";

/**
 * Collapses a continuous drag/pick gesture (range slider, color picker) into
 * a single history entry instead of one per `input` tick. Call `start()` on
 * the first tick of a gesture and `end()` when it commits (native `change`
 * event, which range/color inputs fire exactly once, on release).
 *
 * Wire any future continuous control the same way: pass the store, call
 * `start()` from the shared mutation function, add one `onChange={end}` on
 * the control's root element.
 */
export function useContinuousEdit(store: EditorStore | null | undefined) {
	const activeRef = useRef(false);
	const storeRef = useRef(store);
	storeRef.current = store;

	function end(): void {
		if (!activeRef.current) return;
		activeRef.current = false;
		window.removeEventListener("blur", end);
		storeRef.current?.endBatch();
	}

	function start(): void {
		if (activeRef.current || !storeRef.current) return;
		activeRef.current = true;
		storeRef.current.startBatch();
		window.addEventListener("blur", end, { once: true });
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: `end` intentionally reads storeRef.current at unmount time, not a snapshot from mount — an empty dep array runs this cleanup exactly once, on unmount, mirroring Vue's onBeforeUnmount(end)
	useEffect(() => {
		return end;
	}, []);

	return { start, end };
}
