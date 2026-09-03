const BREAKPOINTS = ["base", "sm", "md", "lg", "xl"] as const;

/**
 * True only for a real breakpoint map. A responsive field's value can itself be
 * an object (a spacing box is `{top,right,bottom,left}`), so "is an object" is
 * not enough to tell a wrapper from a wrapped value — every key has to be a
 * breakpoint name, and there has to be at least one.
 */
export function isResponsiveWrapper(
	value: unknown,
): value is Record<string, unknown> {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const keys = Object.keys(value);
	return (
		keys.length > 0 &&
		keys.every((k) => (BREAKPOINTS as readonly string[]).includes(k))
	);
}

/**
 * Reads the value for `breakpoint`, walking down the mobile-first cascade to
 * `base`. A value that isn't a breakpoint map is returned untouched — it's a
 * flat value that only applies at base.
 */
export function readResponsiveValue(raw: unknown, breakpoint: string): unknown {
	if (!isResponsiveWrapper(raw)) return raw;
	const target = (BREAKPOINTS as readonly string[]).indexOf(breakpoint);
	for (let i = target; i >= 0; i--) {
		const key = BREAKPOINTS[i];
		if (key && key in raw && raw[key] !== undefined) return raw[key];
	}
	return undefined;
}

/**
 * Merges `value` into `existing` at `breakpoint`, preserving every other
 * breakpoint already stored. Seeds "base" with the same value when it's
 * missing, so the field has something to fall back to below the edited
 * breakpoint instead of silently reverting to the node's hardcoded default.
 */
export function mergeResponsiveValue(
	existing: unknown,
	breakpoint: string,
	value: unknown,
): Record<string, unknown> {
	// Only spread a genuine breakpoint map — spreading an object *value* would
	// mix its own keys in alongside the breakpoints and corrupt both.
	const current: Record<string, unknown> = isResponsiveWrapper(existing)
		? { ...existing }
		: {};
	// A pre-existing flat value is the document's base until told otherwise.
	if (!isResponsiveWrapper(existing) && existing !== undefined) {
		current.base = existing;
	}
	current[breakpoint] = value;
	if (current.base === undefined) current.base = value;
	return current;
}
