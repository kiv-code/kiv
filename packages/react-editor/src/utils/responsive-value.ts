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
	const current: Record<string, unknown> =
		existing && typeof existing === "object" && !Array.isArray(existing)
			? { ...(existing as Record<string, unknown>) }
			: {};
	current[breakpoint] = value;
	if (current.base === undefined) current.base = value;
	return current;
}
