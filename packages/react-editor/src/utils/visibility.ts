import type { Breakpoint, Responsive } from "@kivcode/engine";

const ORDER: readonly Breakpoint[] = ["base", "sm", "md", "lg", "xl"];

/** Resolves whether a node is hidden at `breakpoint`, cascading mobile-first down to "base". */
export function isHiddenAtBreakpoint(
	visible: Responsive<boolean> | undefined,
	breakpoint: Breakpoint,
): boolean {
	if (visible === undefined) return false;
	if (typeof visible === "boolean") return visible === false;
	const obj = visible as unknown as Record<string, unknown>;
	const target = ORDER.indexOf(breakpoint);
	for (let i = target; i >= 0; i--) {
		const key = ORDER[i];
		if (key && key in obj && obj[key] !== undefined) return obj[key] === false;
	}
	return false;
}
